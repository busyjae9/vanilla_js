import express from 'express';
import bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';

import { go, isEmpty, log, tap } from 'fxjs';
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

router.get('/todo/list/', async (req, res) => {
    const date = req.query?.date ? new Date(req.query.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), 'yyyy-MM-dd');
    const user_id = req.query?.id || req.session.user.id;
    console.time('sql');
    const user = await Query.getById('users', user_id);

    go(
        QUERY`
            SELECT
                todos.*,
                todos.user_id = ${req.session.user.id} AS my_todo,
                COUNT(DISTINCT other_like.user_id) AS like_count,
                COUNT(DISTINCT comments.id) AS comment_count,
                CASE 
                    WHEN my_like.user_id = ${req.session.user.id} THEN TRUE 
                    ELSE FALSE 
                END 
                AS like
            FROM todos
            LEFT JOIN comments 
                ON todos.id = comments.todo_id 
                AND comments.deleted_date IS NULL
            LEFT JOIN likes other_like 
                ON todos.id = other_like.todo_id 
                AND other_like.cancel_date IS NULL
            LEFT JOIN likes my_like 
                ON todos.id = my_like.todo_id 
                AND my_like.user_id = ${req.session.user.id} 
                AND my_like.cancel_date IS NULL
            WHERE todos.user_id = ${user.id}
                AND todos.archived_date IS NULL
                AND ${EQ({ 'todos.date': now })}
            GROUP BY todos.id, my_like.user_id
            ORDER BY todos.id DESC
        `,
        (todos) =>
            res.json({
                code: '0001',
                result: todos,
                message: '리스트가 조회되었습니다.',
            }),
    );
    console.timeEnd('sql');
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

router.post('/todo/:id/like', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              Query.get('likes', { todo_id: req.params.id, user_id: req.session.user.id }),
              (like) =>
                  !like
                      ? Query.insert('likes', {
                            todo_id: req.params.id,
                            user_id: req.session.user.id,
                        })
                      : Query.updateWhere(
                            'likes',
                            {
                                cancel_date: like.cancel_date
                                    ? null
                                    : zonedTimeToUtc(new Date(), 'Asia/Seoul'),
                            },
                            {
                                todo_id: req.params.id,
                                user_id: req.session.user.id,
                            },
                        ),
              async (like) => {
                  const like_count = await QUERY1`
                            SELECT COUNT(user_id) AS like_count FROM likes 
                            WHERE todo_id = ${req.params.id} AND cancel_date IS NULL`;

                  return {
                      ...like,
                      ...like_count,
                  };
              },
              Query.success(res, '업데이트되었습니다.'),
          ).catch(Query.error(res)),
);

router.delete('/todo/comment/reply/:id', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              tap(() => console.time('답 삭제하기')),
              Query.update('replys')({
                  deleted_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
              }),
              tap(() => console.timeEnd('답글 삭제하기')),
              Query.success(res, '답글 삭제 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.patch('/todo/comment/reply/:id', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.body,
              validCheck(['comment']),
              tap(() => console.time('답글 수정하기')),
              (valid_data) =>
                  Query.update('replys')({
                      ...valid_data,
                      modified_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
                  })(req.params.id),
              async (updated_reply) => {
                  const reply_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM replys
                            WHERE
                                replys.comment_id = ${req.params.id}
                                AND replys.deleted_date IS NULL
                    `.catch(Query.error(res));

                  const reply = await QUERY1`
                            SELECT
                                replys.id,
                                replys.reg_date,
                                replys.modified_date,
                                replys.comment,
                                replys.user_id,
                                (replys.user_id = ${req.session.user.id}) AS my_reply,
                                users.name AS user_name
                            FROM replys
                            LEFT JOIN users 
                                ON replys.user_id = users.id
                            WHERE        
                                replys.id = ${updated_reply.id}
                            GROUP BY replys.id, users.id
                    `;

                  return { reply, reply_count: Number(reply_count.count) };
              },
              tap(() => console.timeEnd('답글 수정하기')),
              Query.success(res, '답글 수정이 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/todo/comment/:id/reply', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.body,
              validCheck(['comment']),
              tap(() => console.time('답글 입력하기')),
              (valid_data) =>
                  Query.insert('replys')({
                      ...valid_data,
                      comment_id: req.params.id,
                      user_id: req.session.user.id,
                  }),
              async (inserted_reply) => {
                  const reply_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM replys
                            WHERE
                                replys.comment_id = ${req.params.id}
                                AND replys.deleted_date IS NULL
                    `.catch(Query.error(res));

                  const reply = await QUERY1`
                            SELECT
                                replys.id,
                                replys.reg_date,
                                replys.modified_date,
                                replys.comment,
                                replys.user_id,
                                (replys.user_id = ${req.session.user.id}) AS my_reply,
                                users.name AS user_name
                            FROM replys
                            LEFT JOIN users 
                                ON replys.user_id = users.id
                            WHERE        
                                replys.id = ${inserted_reply.id}
                            GROUP BY replys.id, users.id
                    `;

                  return { reply, reply_count: Number(reply_count.count) };
              },
              tap(() => console.timeEnd('답글 입력하기')),
              Query.success(res, '답글 등록이 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.get('/todo/comment/:id/reply', async (req, res) => {
    if (isEmpty(req.params))
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const page = Number(req.query.page || 1);

    console.time('답글 페이지로 가져오기');
    const reply_count = await QUERY1`
        SELECT
            COUNT(*)
        FROM replys
        WHERE
            replys.comment_id = ${req.params.id}
            AND replys.deleted_date IS NULL
    `.catch(Query.error(res));

    if (!reply_count)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const replys = await QUERY`
                SELECT
                    replys.id,
                    replys.reg_date,
                    replys.modified_date,
                    replys.comment,
                    replys.user_id,
                    (replys.user_id = ${req.session.user.id}) AS my_reply,
                    users.name AS user_name
                FROM replys
                LEFT JOIN users 
                    ON replys.user_id = users.id
                WHERE
                    replys.comment_id = ${req.params.id}
                    AND replys.deleted_date IS NULL
                GROUP BY replys.id, users.id
                ORDER BY replys.id DESC
                LIMIT 10
                OFFSET ${(page - 1) * 10}
            `.catch(Query.error(res));

    console.timeEnd('답글 페이지로 가져오기');

    if (!replys)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const last_page =
        Number(reply_count.count) === 0 ? 1 : Math.ceil(Number(reply_count.count) / 10);

    return Query.success(
        res,
        '조회되었습니다.',
    )({
        replys,
        reply_count: Number(reply_count.count),
        next_page: last_page === page ? null : page + 1,
    });
});

router.post('/todo/:id/comment', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.body,
              validCheck(['comment']),
              tap(() => console.time('코멘트 입력하기')),
              (valid_data) =>
                  Query.insert('comments')({
                      ...valid_data,
                      todo_id: req.params.id,
                      user_id: req.session.user.id,
                  }),
              async (inserted_comment) => {
                  const comment_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM comments
                            WHERE
                                comments.todo_id = ${req.params.id}
                                AND comments.deleted_date IS NULL
                    `.catch(Query.error(res));

                  const comment = await QUERY1`
                            SELECT
                                comments.id,
                                comments.reg_date,
                                comments.modified_date,
                                comments.comment,
                                comments.user_id,
                                (comments.user_id = ${req.session.user.id}) AS my_comment,
                                users.name AS user_name,
                                COUNT(DISTINCT replys.user_id) AS reply_count
                            FROM comments
                            LEFT JOIN users 
                                ON comments.user_id = users.id
                            LEFT JOIN replys
                                ON comments.id = replys.comment_id
                            WHERE        
                                comments.id = ${inserted_comment.id}
                            GROUP BY comments.id, users.id
                    `;

                  return { comment, comment_count: Number(comment_count.count) };
              },
              tap(() => console.timeEnd('코멘트 입력하기')),
              Query.success(res, '댓글 등록이 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.get('/todo/comment/:id', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              tap(() => console.time('코멘트 가져오기')),
              (id) => QUERY1`
                            SELECT
                                comments.id,
                                comments.reg_date,
                                comments.modified_date,
                                comments.comment,
                                comments.user_id,
                                (comments.user_id = ${req.session.user.id}) AS my_comment,
                                users.name AS user_name,
                                COUNT(DISTINCT replys.user_id) AS reply_count
                            FROM comments
                            LEFT JOIN users 
                                ON comments.user_id = users.id
                            LEFT JOIN replys
                                ON comments.id = replys.comment_id
                            WHERE        
                                comments.id = ${id}
                            GROUP BY comments.id, users.id
                    `,
              tap(() => console.timeEnd('코멘트 가져오기')),
              Query.success(res, '댓글이 조회되었습니다.'),
          ).catch(Query.error(res)),
);

router.delete('/todo/comment/:id', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              tap(() => console.time('코멘트 삭제하기')),
              Query.update('comments')({
                  deleted_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
              }),
              async (updated_comment) => {
                  const comment_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM comments
                            WHERE
                                comments.todo_id = ${req.params.id}
                                AND comments.deleted_date IS NULL
                    `;

                  const comment = await QUERY1`
                            SELECT 
                                id,
                                todo_id
                            FROM comments
                            WHERE comments.id = ${updated_comment.id}
                    `;

                  return { comment, comment_count: Number(comment_count.count) };
              },
              tap(() => console.timeEnd('코멘트 삭제하기')),
              Query.success(res, '댓글 삭제 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.patch('/todo/comment/:id', async (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.body,
              validCheck(['comment']),
              tap(() => console.time('코멘트 수정하기')),
              (valid_data) =>
                  Query.update('comments')({
                      ...valid_data,
                      modified_date: zonedTimeToUtc(new Date(), 'Asia/Seoul'),
                  })(req.params.id),
              async (updated_comment) => {
                  const comment_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM comments
                            WHERE
                                comments.todo_id = ${req.params.id}
                                AND comments.deleted_date IS NULL
                    `;

                  const comment = await QUERY1`
                            SELECT
                                comments.id,
                                comments.reg_date,
                                comments.modified_date,
                                comments.comment,
                                comments.user_id,
                                comments.todo_id,
                                (comments.user_id = ${req.session.user.id}) AS my_comment,
                                users.name AS user_name,
                                COUNT(DISTINCT replys.user_id) AS reply_count
                            FROM comments
                            LEFT JOIN users 
                                ON comments.user_id = users.id
                            LEFT JOIN replys
                                ON comments.id = replys.comment_id
                            WHERE        
                                comments.id = ${updated_comment.id}
                            GROUP BY comments.id, users.id
                    `;

                  return { comment, comment_count: Number(comment_count.count) };
              },
              tap(() => console.timeEnd('코멘트 수정하기')),
              Query.success(res, '댓글 수정이 완료되었습니다.'),
          ).catch(Query.error(res)),
);

router.get('/todo/:id/comment', async (req, res) => {
    if (isEmpty(req.params))
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const page = Number(req.query.page || 1);

    console.time('코멘트 페이지로 가져오기');
    const comment_count = await QUERY1`
        SELECT
            COUNT(*)
        FROM comments
        WHERE
            comments.todo_id = ${req.params.id}
            AND comments.deleted_date IS NULL
    `.catch(Query.error(res));

    if (!comment_count)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const comments = await QUERY`
                SELECT
                    comments.id,
                    comments.reg_date,
                    comments.modified_date,
                    comments.comment,
                    comments.user_id,
                    (comments.user_id = ${req.session.user.id}) AS my_comment,
                    users.name AS user_name,
                    COUNT(DISTINCT replys.id) AS reply_count
                FROM comments
                LEFT JOIN users 
                    ON comments.user_id = users.id
                LEFT JOIN replys
                    ON comments.id = replys.comment_id
                    AND replys.deleted_date IS NULL
                WHERE
                    comments.todo_id = ${req.params.id}
                    AND comments.deleted_date IS NULL
                GROUP BY comments.id, users.id
                ORDER BY comments.id DESC
                LIMIT 10
                OFFSET ${(page - 1) * 10}
            `.catch(Query.error(res));

    console.timeEnd('코멘트 페이지로 가져오기');

    if (!comments)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    const last_page =
        Number(comment_count.count) === 0 ? 1 : Math.ceil(Number(comment_count.count) / 10);

    return Query.success(
        res,
        '조회되었습니다.',
    )({
        comments,
        comment_count: Number(comment_count.count),
        next_page: last_page === page ? null : page + 1,
    });
});

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
