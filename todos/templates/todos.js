import express from 'express';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';

import LoginUI from '../frontend/src/templates/login.js';
import MainUI from '../frontend/src/templates/main.js';
import { flatMap, go, hi } from 'fxjs';
import { ASSOCIATE, ASSOCIATE1, COLUMN, EQ, QUERY, SQL } from '../util/db/db_connect.js';

const router = express.Router();
router.get('/', (req, res) => {
    /*
     * 1. 아이피를 확인한 후 타임존을 가져와서 그에 맞춰 utc로 변환해서 sql을 날리는 방법
     *   - 일단 해당 방법으로 구현을 했는데, 혹시 다른 방법이 있다면 적용해보고 후보군 알아보기
     * 2. 로컬에서 타임존을 보내서 그에 맞춰 utc로 변환하는 방법
     * */

    const date = req.query?.date ? new Date(req.query?.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), 'yyyy-MM-dd');

    !req.query?.id || Number(req.query?.id) === req.session.user.id
        ? go(
              QUERY`SELECT * FROM todos WHERE ${EQ({
                  user_id: req.session.user.id,
              })} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${
                  now + ' 23:59:59'
              } ORDER BY id DESC`,
              (todos) => res.render('index', { body: MainUI.initTmp(todos, now) }),
          )
        : go(
              req.query?.id,
              (id) => ASSOCIATE1`
                users ${{
                    column: COLUMN('name', 'id'),
                    query: SQL`WHERE ${EQ({ id })}`,
                }}
                    < todos ${{
                        query: SQL`WHERE ${EQ({
                            date: now,
                        })} AND archived_date IS NULL`,
                    }}
            `,
              (data) =>
                  data
                      ? res.render('index', {
                            user: data,
                            body: MainUI.initOtherTmp(data._.todos, now),
                        })
                      : res.render('404'),
          );
});

router.get('/archive', (req, res) =>
    // 만들기
    go(
        ASSOCIATE`
            users ${{ query: SQL`WHERE ${EQ({ id: req.session.user.id })}` }}
                < archive ${{ query: SQL`WHERE delete_date IS NULL` }}
                    - todo
        `,
        (users) => users[0]._.archive,
        flatMap((archive) => archive._.todo),
        (archive) => res.render('index', { body: MainUI.archiveTmp(archive) }),
    ),
);

router.get('/login', (req, res) => {
    req.session.user ? res.redirect('/todo') : res.render('index', { body: LoginUI.loginTmp() });
});

router.get('/reg', (req, res) =>
    req.session.user ? res.redirect('/todo') : res.render('index', { body: LoginUI.regTmp() }),
);

export default router;
