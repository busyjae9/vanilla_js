import { format } from 'date-fns';
import { zonedTimeToUtc } from 'date-fns-tz/esm';
import { each, go, hi, isArray, isNull, log, map, reject, tap } from 'fxjs';
import { ASSOCIATE1, EQ, QUERY, QUERY1, SQL } from '../db/db_connect.js';
import * as C from 'fxjs/Concurrency';
import webPush from 'web-push';

const Push = {};

Push.option = {
    vapidDetails: {
        subject: process.env.url,
        publicKey: process.env.push_public_key,
        privateKey: process.env.push_private_key,
    },
};

Push.tz = process.env.TZ;

Push.token_type = 'push_token';

Push.now = () => format(zonedTimeToUtc(new Date(), Push.tz), 'yyyy-MM-dd');

Push.sendTodoNotification = () =>
    go(
        QUERY`
            select users.id, users.name, tokens.token, 
            (select content from todos 
            where user_id = users.id and ${EQ({
                checked: false,
                date: Push.now(),
            })} order by id desc limit 1),
            (select date from todos 
            where user_id = users.id and ${EQ({
                checked: false,
                date: Push.now(),
            })} order by id desc limit 1)
            from users
            inner join tokens 
            on tokens.user_id = users.id and ${EQ({
                'tokens.type': 'push_token',
            })} and expired_date is null
        `,
        map(async (user) => {
            const todo_count = await QUERY1`
                        select count(*) from todos where ${EQ({
                            user_id: user.id,
                            date: Push.now(),
                            checked: false,
                        })}
                    `;

            if (Number(todo_count.count) === 0) return null;
            else
                return {
                    token: user.token,
                    title: `${user.name}님 TODO 알람입니다.`,
                    body: `"${user.content}" ${
                        todo_count.count - 1 === 0 ? '' : `외 ${todo_count.count - 1}개의`
                    } TODO가 남아있습니다.`,
                    tag: new Date().toLocaleString(),
                    icon: `/todo/static/favicon.png`,
                    badge: `/todo/static/favicon.png`,
                    data: {
                        action: 'toTodo',
                        payload: { user_id: user.id, date: user.date },
                    },
                };
        }),
        reject(isNull),
        C.each((payload) =>
            webPush.sendNotification(payload.token, JSON.stringify(payload), Push.option),
        ),
    ).catch((err) => log(err));

Push.sendNotification = (payload, user_id) =>
    isArray(user_id)
        ? go(
              user_id,
              each((id) =>
                  go(
                      ASSOCIATE1`
                            users ${{ query: SQL`where ${EQ({ id })}` }}
                                < tokens ${{
                                    query: SQL`where ${EQ({
                                        type: Push.token_type,
                                    })} and expired_date is null`,
                                }}
                        `,
                      (selected_user) =>
                          selected_user._.tokens.length &&
                          webPush.sendNotification(
                              selected_user._.tokens[0].token,
                              JSON.stringify(payload),
                              Push.option,
                          ),
                  ),
              ),
          ).catch((err) => log(err))
        : go(
              ASSOCIATE1`
                users ${{ query: SQL`where ${EQ({ id: user_id })}` }}
                    < tokens ${{
                        query: SQL`where ${EQ({ type: Push.token_type })} and expired_date is null`,
                    }}
            `,
              (selected_user) =>
                  selected_user._.tokens.length &&
                  webPush.sendNotification(
                      selected_user._.tokens[0].token,
                      JSON.stringify(payload),
                      Push.option,
                  ),
          ).catch((err) => log(err));

export default Push;
