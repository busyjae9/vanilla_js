import express from 'express';
import bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';

import { go, isEmpty, tap } from 'fxjs';
import {
    ASSOCIATE,
    ASSOCIATE1,
    COLUMN,
    EQ,
    QUERY,
    QUERY1,
    SET,
    SQL,
    TB,
} from '../util/db/db_connect.js';
import { validCheck } from '../util/valid.js';
import Query from '../queries/query_v1.js';

const USER_COLUMNS = ['name', 'email', 'password'];

const router = express.Router();

router.get('/todo/list/', (req, res) => {
    const date = req.query?.date ? new Date(req.query.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), 'yyyy-MM-dd');

    !req.query?.id || Number(req.query?.id) === req.session.user.id
        ? go(
              QUERY`SELECT (TRUE) AS my_todo, * FROM todos WHERE ${EQ({
                  user_id: req.session.user.id,
              })} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${
                  now + ' 23:59:59'
              } ORDER BY id DESC`,
              (todos) =>
                  res.json({
                      code: '0001',
                      result: todos,
                      message: '리스트가 조회되었습니다.',
                  }),
          )
        : go(
              QUERY`
                SELECT (user_id = ${req.session.user.id}) AS my_todo, * FROM todos WHERE ${EQ({
                  user_id: req.query?.id,
              })} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${
                  now + ' 23:59:59'
              } ORDER BY id DESC
                `,
              (todos) =>
                  res.json({
                      code: '0001',
                      result: todos,
                      message: `리스트가 조회되었습니다.`,
                  }),
          );
});

router.get('/user/list', (req, res) =>
    isEmpty(req.query)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.query,
              validCheck(['people']),
              (valid_data) => ASSOCIATE`
                    users ${{
                        column: COLUMN('id', 'name', 'email'),
                        query: SQL`WHERE name LIKE ${'%' + valid_data.people + '%'} OR email LIKE ${
                            '%' + valid_data.people + '%'
                        }`,
                    }}
                `,
              Query.success(res, '조회되었습니다.'),
          ).catch(Query.error(res)),
);

router.get('/user', (req, res) =>
    isEmpty(req.query)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.query,
              validCheck(['id', 'date']),
              (valid_data) => ASSOCIATE`
            users ${{
                column: COLUMN('id', 'name'),
                query: SQL`WHERE ${EQ({ id: valid_data.id })}`,
            }}
                < todos ${{
                    query: SQL`WHERE ${EQ({
                        date: format(
                            zonedTimeToUtc(valid_data.date, req.headers.timezone),
                            'yyyy-MM-dd',
                        ),
                    })} AND archived_date IS NULL`,
                }}
        `,
              Query.success(res, '조회되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/todo', (req, res) =>
    go(
        req.body,
        validCheck(['content', 'date']),
        (valid_data) =>
            Query.insert('todos')({
                ...valid_data,
                user_id: req.session.user.id,
            }),
        Query.success(res, '등록이 완료되었습니다.'),
    ).catch(Query.error(res)),
);

router.get('/todo/:id', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(req.params.id, Query.getById('todos'), Query.success(res, '조회되었습니다.')).catch(
              Query.error(res),
          ),
);

router.patch('/todo/:id', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              Query.update('todos', req.body),
              Query.success(res, '업데이트되었습니다.'),
          ).catch(Query.error(res)),
);

// 좋아요와 댓글 추가 및 수정 기능 만들기
// likes와 comments 테이블 추가
// likes는 reg_date, user_id, todo_id, comment_id 혹은 comment_likes를 따로 만들어야하는지 확인
// comments는 comment, reg_date, modified_date, user_id, todo_id, reply_id(self)
// todos나 comments를 불러올 때는 불러오는 유저의 id를 가지고 눌렀는지 안눌렀는지를 확인하는 heart 데이터를 생성하고,
// likes, comments의 갯수를 확인하여 like_count, comment_count를 만들어서 보내준다

// 댓글같은 경우 팝업보다는 기존의 todo가 아래로 확장되면서 comments에 관련된 내용이 확인되게 만들고 pagination을 구현해야한다.
// 내가 보는 todo의 경우 밑에 작은 길이로 좋아요 갯수와 댓글 갯수 그리고 댓글 창을 볼 수 있는 공간 만들기
router.post('/archive', (req, res) =>
    isEmpty(req.query)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.query.id,
              Query.update('todos', {
                  archived_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
              }),
              (data) => ({
                  todo_id: data.id,
                  user_id: data.user_id,
              }),
              Query.insert('archive'),
              Query.success(res, '보관되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/archive/return/:pk', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.pk,
              Query.update('todos', { archived_date: null }),
              (todo) =>
                  QUERY1`DELETE FROM ${TB('archive')} WHERE ${EQ({
                      todo_id: todo.id,
                  })}`,
              Query.success(res, '복구되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/archive/delete/:pk', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              Query.updateWhere(
                  'archive',
                  { delete_date: zonedTimeToUtc(new Date(), 'Asia/Seoul') },
                  { todo_id: req.params.pk },
              ),
              Query.success(res, '삭제되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/archive/delete_all', (req, res) =>
    go(
        QUERY`UPDATE ${TB('archive')} ${SET({
            delete_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
        })} WHERE ${EQ({
            user_id: req.session.user.id,
        })} AND delete_date IS NULL`,
        Query.success(res, '전부 삭제되었습니다.'),
    ).catch(Query.error(res)),
);

router.post('/logout', (req, res) => {
    delete req.session.user;
    req.session.destroy();
    res.json({
        code: '0001',
        message: '로그아웃이 완료되었습니다.',
    });
});

router.post('/login', async function (req, res) {
    const valid_data = await go(req.body, validCheck(['email', 'password'])).catch(
        Query.error(res),
    );

    if (!valid_data) return;

    go(
        valid_data,
        ({ email }) =>
            Query.getColumns('users', ['id', 'name', 'email', 'password'], {
                email,
            }),
        tap(
            Query.emptyCheck({
                code: 'E002',
                message: '일치하는 계정이 없습니다.',
            }),
        ),
        tap((user) =>
            Query.passwordCheck(
                {
                    code: 'E002',
                    message: '비밀번호가 일치하지 않습니다.',
                },
                valid_data.password,
                user.password,
            ),
        ),
        (user) => {
            delete user.password;
            req.session.user = user;
            Query.success(res, '로그인 되었습니다.', user);
        },
    ).catch(Query.error(res));
});

router.post('/reg', (req, res) =>
    go(
        req.body,
        validCheck(USER_COLUMNS),
        tap(
            ({ name }) => Query.get('users', { name }),
            Query.duplicateCheck({
                code: 'E002',
                message: '이름이 중복됩니다.',
            }),
        ),
        tap(
            ({ email }) => Query.get('users', { email }),
            Query.duplicateCheck({
                code: 'E002',
                message: '이메일이 중복됩니다.',
            }),
        ),
        (valid_data) => {
            valid_data.password = bcrypt.hashSync(valid_data.password, 10);
            return valid_data;
        },
        Query.insert('users'),
        Query.success(res, '회원가입이 완료되었습니다.'),
    ).catch(Query.error(res)),
);

export default router;
