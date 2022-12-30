import express from 'express';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';

import LoginUI from '../../frontend/src/templates/login.js';
import MainUI from '../../frontend/src/templates/main.js';
import { extend, flatMap, go, hi, log, map } from 'fxjs';
import { ASSOCIATE, ASSOCIATE1, COLUMN, EQ, QUERY, SQL } from '../db/db_connect.js';
import Query from '../queries/query_v1.js';

const router = express.Router();
router.get('/', async (req, res) => {
    /*
     * 1. 아이피를 확인한 후 타임존을 가져와서 그에 맞춰 utc로 변환해서 sql을 날리는 방법
     *   - 일단 해당 방법으로 구현을 했는데, 혹시 다른 방법이 있다면 적용해보고 후보군 알아보기
     * 2. 로컬에서 타임존을 보내서 그에 맞춰 utc로 변환하는 방법
     * */

    log(typeof process.env.INSTANCE_ID);

    const date = req.query?.date ? new Date(req.query?.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), 'yyyy-MM-dd');
    const user_id = req.query?.id || req.session.user.id;

    try {
        const number_id = Number(user_id);
        console.time('좋아요 포함한 TODO 가져오기');
        const user = await Query.getById('users', user_id);
        go(
            ASSOCIATE`
                todos ${{
                    hook: (todos) =>
                        go(
                            todos,
                            map((todo) =>
                                extend(
                                    {
                                        my_todo: Number(todo.user_id) === req.session.user.id,
                                        like_count: todo._.likes.length,
                                        comment_count: todo._.comments.length,
                                        like: !!todo._.likes.find(
                                            (like) => Number(like.user_id) === req.session.user.id,
                                        ),
                                    },
                                    todo,
                                ),
                            ),
                        ),
                    column: COLUMN(
                        'checked',
                        'content',
                        'date',
                        'id',
                        'modified_date',
                        'reg_date',
                        'user_id',
                    ),
                    query: SQL`where ${EQ({
                        user_id: number_id,
                        date: now,
                    })} and archived_date is null order by id desc`,
                }}
                    < comments ${{
                        column: COLUMN('id', 'user_id'),
                        query: SQL`where deleted_date is null`,
                    }}
                    < likes ${{
                        column: COLUMN('user_id'),
                        query: SQL`where cancel_date is null`,
                    }}
            `,
            (todos) =>
                res.render('index', {
                    user: user,
                    body:
                        user.id !== req.session.user.id
                            ? MainUI.initOtherTmp(todos, now)
                            : MainUI.initTmp(todos, now),
                }),
        );
        console.timeEnd('좋아요 포함한 TODO 가져오기');
    } catch (err) {
        log(err);
        return res.render('404', { message: `${req.url} 페이지가 존재하지 않습니다.` });
    }
});

router.get('/archive', (req, res) =>
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
