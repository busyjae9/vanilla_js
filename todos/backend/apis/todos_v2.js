import express from 'express';
import bcrypt from 'bcrypt';
import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';

import { extend, flatMap, go, hi, isEmpty, log, map, reject, string, tap } from 'fxjs';
import {
    ASSOCIATE,
    ASSOCIATE1,
    COLUMN,
    EQ,
    IN,
    QUERY,
    QUERY1,
    SET,
    SQL,
    TB,
} from '../db/db_connect.js';
import { validCheck } from '../util/valid.js';
import Query from '../queries/query_v1.js';
import Push from '../util/push.js';

const USER_COLUMNS = ['name', 'email', 'password'];

const router = express.Router();

router.get('/todo/list/', async (req, res) => {
    const date = req.query?.date ? new Date(req.query.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), 'yyyy-MM-dd');
    const user_id = req.query?.id || req.session.user.id;
    console.time('sql');

    const [user, my_follwings] = await Promise.all([
        Query.getById('users', user_id),
        QUERY`select * from followings where user_id = ${req.session.user.id}`,
    ]);

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
                                    comment_count: todo._.comments.length,
                                    like_count: todo._.likes.length - todo._.limit_likes.length,
                                    like_3: todo._.limit_likes,
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
                    user_id: user.id,
                    date: now,
                })} and archived_date is null order by id desc`,
            }}
                < comments ${{
                    column: COLUMN('id', 'user_id'),
                    query: SQL`where deleted_date is null`,
                }}
                p < likes ${{
                    column: COLUMN('user_id'),
                    query: SQL`where cancel_date is null`,
                }}
                p < limit_likes ${{
                    hook: (likes) => flatMap((like) => like._.user, likes),
                    key: 'attached_id',
                    poly_type: { attached_type: 'todos' },
                    table: 'likes',
                    query: SQL`where cancel_date is null`,
                    row_number: 3,
                    //     and ${IN(
                    //         'user_id',
                    //         flatMap(
                    //             (following) => following.following_id,
                    //             [...my_follwings, { following_id: req.session.user.id }],
                    //     ),
                    //     )}
                }}
                    - user ${{
                        column: COLUMN('name'),
                    }}
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

router.get('/user/:id/following', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              async (id) => {
                  const cursor = Number(req.query.cursor || 0);
                  const following_count = await QUERY1`select count(*) from followings where ${EQ({
                      user_id: id,
                  })}`;

                  const followings = await ASSOCIATE`
                        followings ${SQL`where ${EQ({ user_id: id })} ${
                            cursor === 0 ? SQL`` : SQL`and id < ${cursor}`
                        } order by id desc limit 10`}
                            - user ${{
                                left_key: 'following_id',
                                column: COLUMN('id', 'name', 'email'),
                            }}
                  `;

                  const following_users = flatMap((following) => following._.user, followings);

                  return {
                      my_page: Number(id) === req.session.user.id,
                      followings: following_users,
                      following_count: following_count.count,
                      last_page: following_users.length !== 10,
                  };
              },
              Query.success(res, '팔로우가 조회되었습니다.'),
          ).catch(Query.error(res)),
);

router.get('/user/:id/follower', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              async (id) => {
                  const cursor = Number(req.query.cursor || 0);
                  const follower_count = await QUERY1`select count(*) from followers where ${EQ({
                      user_id: id,
                  })}`;

                  const followers = await ASSOCIATE`
                        followers ${SQL`where ${EQ({ user_id: id })} ${
                            cursor === 0 ? SQL`` : SQL`and id < ${cursor}`
                        } order by id desc limit 10`}
                            - user ${{
                                left_key: 'follower_id',
                                column: COLUMN('id', 'name', 'email'),
                            }}
                  `;

                  const follower_users = flatMap((follower) => follower._.user, followers);

                  return {
                      my_page: Number(id) === req.session.user.id,
                      followers: follower_users,
                      follower_count: follower_count.count,
                      last_page: follower_users.length !== 10,
                  };
              },
              Query.success(res, '팔로워가 조회되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/user/:id/follow', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              async (id) => {
                  await Query.insert('followings', {
                      user_id: req.session.user.id,
                      following_id: id,
                  });
                  await Query.insert('followers', {
                      user_id: id,
                      follower_id: req.session.user.id,
                  });

                  Push.sendNotification(
                      {
                          title: `${req.session.user.name}님께서 팔로우했습니다.`,
                          body: '',
                          tag: `follow_${req.session.user.id}`,
                          data: {
                              link: `/todo/page?id=${req.session.user.id}`,
                          },
                      },
                      id,
                  );

                  const following_count = await QUERY1`
                        SELECT COUNT(*) FROM followings 
                        WHERE user_id = ${req.query.my_count ? req.session.user.id : id}
                        `;

                  const follower_count = await QUERY1`
                        SELECT COUNT(*) FROM followers 
                        WHERE user_id = ${req.query.my_count ? req.session.user.id : id}
                        `;

                  return {
                      following_count: following_count.count,
                      follower_count: follower_count.count,
                  };
              },
              Query.success(res, '팔로우되었습니다.'),
          ).catch(Query.error(res)),
);

router.delete('/user/:id/follow', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              async (id) => {
                  await Query.delete('followings', {
                      user_id: req.session.user.id,
                      following_id: id,
                  });
                  await Query.delete('followers', {
                      user_id: id,
                      follower_id: req.session.user.id,
                  });

                  const following_count = await QUERY1`
                        SELECT COUNT(*) FROM followings 
                        WHERE user_id = ${req.query.my_count ? req.session.user.id : id}
                        `;

                  const follower_count = await QUERY1`
                        SELECT COUNT(*) FROM followers 
                        WHERE user_id = ${req.query.my_count ? req.session.user.id : id}
                        `;

                  return {
                      following_count: following_count.count,
                      follower_count: follower_count.count,
                  };
              },
              Query.success(res, '팔로우가 취소되었습니다.'),
          ).catch(Query.error(res)),
);

router.delete('/user/:id/follow/cancel', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              req.params.id,
              async (id) => {
                  await Query.delete('followings', {
                      user_id: id,
                      following_id: req.session.user.id,
                  });
                  await Query.delete('followers', {
                      user_id: req.session.user.id,
                      follower_id: id,
                  });

                  const following_count = await QUERY1`
                        SELECT COUNT(*) FROM followings 
                        WHERE user_id = ${req.session.user.id}
                        `;

                  const follower_count = await QUERY1`
                        SELECT COUNT(*) FROM followers 
                        WHERE user_id = ${req.session.user.id}
                        `;

                  return {
                      following_count: following_count.count,
                      follower_count: follower_count.count,
                  };
              },
              Query.success(res, '팔로잉이 삭제되었습니다.'),
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
        tap(async (todo) => {
            const me = await ASSOCIATE1`
                users ${SQL`where ${EQ({ id: todo.user_id })}`} 
                    < followers ${{
                        hook: (followers) => map((follower) => follower.follower_id, followers),
                    }}
            `;

            Push.sendNotification(
                {
                    title: `${me.name}님께서 TODO를 등록했습니다.`,
                    body: `${todo.content} / ${format(
                        new Date(todo.date),
                        'yyyy년 MM월 dd일 까지',
                    )}`,
                    tag: `following_todo_${todo.id}`,
                    data: {
                        action: 'toTodo',
                        payload: todo,
                        link: `/todo?id=${todo.user_id}&date=${format(
                            new Date(todo.date),
                            'yyyy-MM-dd',
                        )}`,
                    },
                },
                me._.followers,
            );
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
              Query.get('likes', {
                  attached_type: 'todos',
                  attached_id: req.params.id,
                  user_id: req.session.user.id,
              }),
              (like) =>
                  !like
                      ? Query.insert('likes', {
                            attached_id: req.params.id,
                            attached_type: 'todos',
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
                                attached_id: req.params.id,
                                attached_type: 'todos',
                                user_id: req.session.user.id,
                            },
                        ),
              async (like) => {
                  if (!like.cancel_date) {
                      const todo = await Query.getById('todos', like.attached_id);
                      Push.sendNotification(
                          {
                              title: `"${todo.content}" TODO 좋아요`,
                              body: `${req.session.user.name}님께서 당신의 TODO에 좋아요를 눌렀습니다.`,
                              tag: `like_to_todo_${like.todo_id}`,
                              data: {
                                  action: 'toTodo',
                                  payload: todo,
                              },
                          },
                          go(
                              [todo.user_id],
                              reject((id) => Number(id) === Number(req.session.user.id)),
                          ),
                      );
                  }

                  const todo = await ASSOCIATE1`
                      todos ${{
                          hook: (todos) =>
                              map(
                                  (_todo) => ({
                                      like_count: _todo._.likes.length - _todo._.limit_likes.length,
                                      like_3: _todo._.limit_likes,
                                      like: !!_todo._.likes.find(
                                          (like) => Number(like.user_id) === req.session.user.id,
                                      ),
                                  }),
                                  todos,
                              ),
                          query: SQL`where ${EQ({
                              id: like.attached_id,
                          })} `,
                      }}
                          p < likes ${{
                              column: COLUMN('user_id'),
                              query: SQL`where cancel_date is null`,
                          }}
                          p < limit_likes ${{
                              hook: (likes) => flatMap((like) => like._.user, likes),
                              key: 'attached_id',
                              poly_type: { attached_type: 'todos' },
                              table: 'likes',
                              query: SQL`where cancel_date is null`,
                              row_number: 3,
                          }}
                              - user ${{
                                  column: COLUMN('name'),
                              }}
                    `;

                  return {
                      ...like,
                      ...todo,
                  };
              },
              Query.success(res, '업데이트되었습니다.'),
          ).catch(Query.error(res)),
);

router.post('/todo/comment/:id/like', (req, res) =>
    isEmpty(req.params)
        ? res.status(400).json({ code: 'E001', message: '데이터 형식이 맞지 않습니다.' })
        : go(
              Query.get('likes', {
                  attached_type: 'comments',
                  attached_id: req.params.id,
                  user_id: req.session.user.id,
              }),
              (like) =>
                  !like
                      ? Query.insert('likes', {
                            attached_id: req.params.id,
                            attached_type: 'comments',
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
                                attached_id: req.params.id,
                                attached_type: 'comments',
                                user_id: req.session.user.id,
                            },
                        ),
              async (like) => {
                  if (!like.cancel_date) {
                      const comment = await Query.getById('comments', like.attached_id);
                      const todo = await Query.getById('todos', comment.todo_id);
                      Push.sendNotification(
                          {
                              title: `${req.session.user.name}님의 좋아요`,
                              body: `"${comment.content}" 댓글에 좋아요를 눌렀습니다.`,
                              tag: `comment_${comment.id}`,
                              data: {
                                  action: 'toComment',
                                  payload: comment,
                                  link: `/todo?id=${todo.user_id}&date=${format(
                                      new Date(todo.date),
                                      'yyyy-MM-dd',
                                  )}`,
                              },
                          },
                          go(
                              [comment.user_id],
                              reject((id) => Number(id) === Number(req.session.user.id)),
                          ),
                      );
                  }

                  const like_count = await QUERY1` 
                            SELECT COUNT(user_id) AS like_count FROM likes 
                            WHERE attached_id = ${req.params.id} 
                            AND attached_type = 'comments' 
                            AND cancel_date IS NULL`;

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
              tap(
                  (reply) =>
                      QUERY`update comments set reply_count = reply_count - 1 where id = ${reply.comment_id}`,
              ),
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
                  const reply_extend_user = await go(
                      Query.getByIdColumns('users', ['name'], updated_reply.user_id),
                      extend(updated_reply),
                  );

                  const reply_count = await QUERY1`
                            SELECT
                                COUNT(*)
                            FROM replys
                            WHERE
                                replys.comment_id = ${req.params.id}
                                AND replys.deleted_date IS NULL
                    `.catch(Query.error(res));

                  return { reply: reply_extend_user, reply_count: Number(reply_count.count) };
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
              tap(
                  (reply) =>
                      QUERY`update comments set reply_count = reply_count + 1 where id = ${reply.comment_id}`,
              ),
              async (inserted_reply) => {
                  const reply_user = await Query.getByIdColumns(
                      'users',
                      ['name as user_name'],
                      inserted_reply.user_id,
                  );
                  const reply_extend_user = extend(reply_user, inserted_reply, {
                      my_reply: Number(inserted_reply.user_id) === req.session.user.id,
                  });
                  const reply_count = await QUERY1`
                            SELECT
                                reply_count
                            FROM comments
                            WHERE
                                id = ${req.params.id}
                    `.catch(Query.error(res));

                  const comment = await Query.getById('comments', inserted_reply.comment_id);
                  const todo = await Query.getById('todos', comment.todo_id);

                  Push.sendNotification(
                      {
                          title: `${req.session.user.name}님께서 답글을 달았습니다.`,
                          body: `${inserted_reply.comment}`,
                          tag: `reply_${inserted_reply.id}`,
                          data: {
                              action: 'toReply',
                              payload: comment,
                              link: `/todo?id=${todo.user_id}&date=${format(
                                  new Date(todo.date),
                                  'yyyy-MM-dd',
                              )}`,
                          },
                      },
                      go(
                          [todo.user_id, comment.user_id],
                          reject((id) => Number(id) === Number(req.session.user.id)),
                      ),
                  );

                  return { reply: reply_extend_user, reply_count: Number(reply_count.reply_count) };
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

    const cursor = Number(req.query.cursor || 0);

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

    const replys = await ASSOCIATE`
        replys ${{
            hook: (_replys) =>
                go(
                    _replys,
                    map((reply) =>
                        extend(
                            {
                                my_reply: Number(reply.user_id) === req.session.user.id,
                                user_name: reply._.user.name,
                            },
                            reply,
                        ),
                    ),
                ),
            query: SQL`where ${EQ({
                comment_id: req.params.id,
            })} and deleted_date is null ${
                cursor === 0 ? SQL`` : SQL`and id > ${cursor}`
            } order by id asc limit 10`,
        }}
            - user
    `;

    if (!replys)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    console.timeEnd('답글 페이지로 가져오기');

    return Query.success(
        res,
        '조회되었습니다.',
    )({
        replys,
        reply_count: Number(reply_count.count),
        last_page: replys.length !== 10,
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

                  const comment = await ASSOCIATE1`
                        comments ${{
                            hook: (comments) =>
                                go(
                                    comments,
                                    map((_comment) =>
                                        extend(
                                            {
                                                my_comment:
                                                    Number(_comment._.user.id) ===
                                                    req.session.user.id,
                                                user_name: _comment._.user.name,
                                                like_count: _comment._.likes.length,
                                                like: !!_comment._.likes.find(
                                                    (like) =>
                                                        Number(like.user_id) ===
                                                        req.session.user.id,
                                                ),
                                            },
                                            _comment,
                                        ),
                                    ),
                                ),
                            column: COLUMN(
                                'id',
                                'reg_date',
                                'modified_date',
                                'comment',
                                'user_id',
                                'reply_count',
                            ),
                            query: SQL`where ${EQ({
                                id: inserted_comment.id,
                            })} and deleted_date is null`,
                        }}
                            p < likes ${{
                                column: COLUMN('user_id'),
                                query: SQL`where cancel_date is null`,
                            }}
                            - user ${{
                                column: COLUMN('id', 'name'),
                            }}
                            < replys ${{
                                hook: (replys) =>
                                    go(
                                        replys,
                                        map((reply) =>
                                            extend(
                                                {
                                                    user_name: reply._.user.name,
                                                    my_reply:
                                                        reply._.user.id === req.session.user.id,
                                                },
                                                reply,
                                            ),
                                        ),
                                    ),
                                column: COLUMN(
                                    'id',
                                    'reg_date',
                                    'modified_date',
                                    'comment',
                                    'user_id',
                                ),
                                query: SQL`where deleted_date is null`,
                                row_number: [3, SQL`id asc`],
                            }}
                                - user ${{
                                    column: COLUMN('id', 'name'),
                                }}
                  `;

                  const todo = await Query.getById('todos', req.params.id);

                  Push.sendNotification(
                      {
                          title: `${req.session.user.name}님께서 "${todo.content}" TODO에 댓글을 달았습니다.`,
                          body: `${inserted_comment.comment}`,
                          tag: `comment_${inserted_comment.id}`,
                          data: {
                              action: 'toComment',
                              payload: inserted_comment,
                              link: `/todo?id=${todo.user_id}&date=${format(
                                  new Date(todo.date),
                                  'yyyy-MM-dd',
                              )}`,
                          },
                      },
                      go(
                          [todo.user_id],
                          reject((id) => Number(id) === Number(req.session.user.id)),
                      ),
                  );

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
              (id) => ASSOCIATE1`
                    comments ${{
                        hook: (comments) =>
                            go(
                                comments,
                                map((_comment) =>
                                    extend(
                                        {
                                            my_comment:
                                                Number(_comment._.user.id) === req.session.user.id,
                                            user_name: _comment._.user.name,
                                            like_count: _comment._.likes.length,
                                            like: !!_comment._.likes.find(
                                                (like) =>
                                                    Number(like.user_id) === req.session.user.id,
                                            ),
                                        },
                                        _comment,
                                    ),
                                ),
                            ),
                        column: COLUMN(
                            'id',
                            'reg_date',
                            'modified_date',
                            'comment',
                            'user_id',
                            'reply_count',
                        ),
                        query: SQL`where ${EQ({ id })} and deleted_date is null`,
                    }}
                        p < likes ${{
                            column: COLUMN('user_id'),
                            query: SQL`where cancel_date is null`,
                        }}
                        - user ${{
                            column: COLUMN('id', 'name'),
                        }}
                        < replys ${{
                            hook: (replys) =>
                                go(
                                    replys,
                                    map((reply) =>
                                        extend(
                                            {
                                                user_name: reply._.user.name,
                                                my_reply: reply._.user.id === req.session.user.id,
                                            },
                                            reply,
                                        ),
                                    ),
                                ),
                            column: COLUMN('id', 'reg_date', 'modified_date', 'comment', 'user_id'),
                            query: SQL`where deleted_date is null`,
                            row_number: [3, SQL`id asc`],
                        }}
                            - user ${{
                                column: COLUMN('id', 'name'),
                            }}
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
                                comments.todo_id = ${updated_comment.todo_id}
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

                  const comment = await ASSOCIATE1`
                            comments ${{
                                hook: (comments) =>
                                    go(
                                        comments,
                                        map((_comment) =>
                                            extend(
                                                {
                                                    my_comment:
                                                        Number(_comment._.user.id) ===
                                                        req.session.user.id,
                                                    user_name: _comment._.user.name,
                                                    like_count: _comment._.likes.length,
                                                    like: !!_comment._.likes.find(
                                                        (like) =>
                                                            Number(like.user_id) ===
                                                            req.session.user.id,
                                                    ),
                                                },
                                                _comment,
                                            ),
                                        ),
                                    ),
                                column: COLUMN(
                                    'id',
                                    'reg_date',
                                    'modified_date',
                                    'comment',
                                    'user_id',
                                    'reply_count',
                                ),
                                query: SQL`where ${EQ({
                                    id: updated_comment.id,
                                })} and deleted_date is null`,
                            }}
                                p < likes ${{
                                    column: COLUMN('user_id'),
                                    query: SQL`where cancel_date is null`,
                                }}
                                - user ${{
                                    column: COLUMN('id', 'name'),
                                }}
                                < replys ${{
                                    hook: (replys) =>
                                        go(
                                            replys,
                                            map((reply) =>
                                                extend(
                                                    {
                                                        user_name: reply._.user.name,
                                                        my_reply:
                                                            reply._.user.id === req.session.user.id,
                                                    },
                                                    reply,
                                                ),
                                            ),
                                        ),
                                    column: COLUMN(
                                        'id',
                                        'reg_date',
                                        'modified_date',
                                        'comment',
                                        'user_id',
                                    ),
                                    query: SQL`where deleted_date is null`,
                                    row_number: [3, SQL`id asc`],
                                }}
                                    - user ${{
                                        column: COLUMN('id', 'name'),
                                    }}
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

    const cursor = Number(req.query.cursor || 0);

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

    const comments = await ASSOCIATE`
        comments ${{
            hook: (comments) =>
                go(
                    comments,
                    map((_comment) =>
                        extend(
                            {
                                my_comment: Number(_comment._.user.id) === req.session.user.id,
                                user_name: _comment._.user.name,
                                like_count: _comment._.likes.length,
                                like: !!_comment._.likes.find(
                                    (like) => Number(like.user_id) === req.session.user.id,
                                ),
                            },
                            _comment,
                        ),
                    ),
                ),
            column: COLUMN('id', 'reg_date', 'modified_date', 'comment', 'user_id', 'reply_count'),
            query: SQL`where ${EQ({
                todo_id: req.params.id,
            })} and deleted_date is null ${
                cursor === 0 ? SQL`` : SQL`and id < ${cursor}`
            } order by id desc limit 10`,
        }}
            p < likes ${{
                column: COLUMN('user_id'),
                query: SQL`where cancel_date is null`,
            }}
            - user ${{
                column: COLUMN('id', 'name'),
            }}
            < replys ${{
                hook: (replys) =>
                    go(
                        replys,
                        map((reply) =>
                            extend(
                                {
                                    user_name: reply._.user.name,
                                    my_reply: reply._.user.id === req.session.user.id,
                                },
                                reply,
                            ),
                        ),
                    ),
                column: COLUMN('id', 'reg_date', 'modified_date', 'comment', 'user_id'),
                query: SQL`where deleted_date is null`,
                row_number: [3, SQL`id asc`],
            }}
                - user ${{
                    column: COLUMN('id', 'name'),
                }}
    `.catch(Query.error(res));

    console.timeEnd('코멘트 페이지로 가져오기');

    if (!comments)
        return res.status(400).json({
            code: 'E001',
            message: '데이터 형식이 맞지 않습니다.',
        });

    return Query.success(
        res,
        '조회되었습니다.',
    )({
        comments,
        comment_count: Number(comment_count.count),
        last_page: comments.length !== 10,
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
    const user = { ...req.session.user };
    delete req.session.user;
    req.session.destroy();

    go(
        Query.updateWhere(
            'tokens',
            { expired_date: zonedTimeToUtc(new Date(), 'Asia/Seoul') },
            { user_id: user.id },
        ),
        Query.success(res, '로그아웃이 완료되었습니다.'),
    ).catch(Query.error(res));
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
