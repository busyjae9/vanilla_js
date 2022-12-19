import express from "express";
import bcrypt from "bcrypt";
import {format} from 'date-fns';
import {zonedTimeToUtc} from "date-fns-tz/esm";

import {go, isEmpty, tap} from "fxjs";
import {ASSOCIATE, ASSOCIATE1, COLUMN, EQ, QUERY, QUERY1, SET, SQL, TB} from "../util/db/db_connect.js";
import {validCheck} from "../util/valid.js";
import Query from "../queries/query_v1.js";

const USER_COLUMNS = ["name", "email", "password"];

const router = express.Router();

router.get('/todo/list/', (req, res) => {
    const date = req.query?.date ? new Date(req.params.date) : new Date();
    const tz = req.headers.timezone;
    const now = format(zonedTimeToUtc(date, tz), "yyyy-MM-dd");

    !req.query?.id && req.query?.id !== req.session.user.id
        ? go(
            QUERY`SELECT * FROM todos WHERE ${EQ({user_id:req.session.user.id})} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${now + ' 23:59:59'} ORDER BY id DESC`,
            (todos) => res.json({
                code: '0001',
                result: todos,
                message: "리스트가 조회되었습니다."
            })
        )
        : go(
            req.query?.id,
            (id) => ASSOCIATE1`
                users ${{
                column: COLUMN("name", "id"),
                query: SQL`WHERE ${EQ({id})}`
            }}
                    < todos ${{query: SQL`WHERE ${EQ({date: now})} AND archived_date IS NULL`}}
            `,
            (data) => res.json({
                code: '0001',
                result: data._.todos,
                message: `${data.name}님의 리스트가 조회되었습니다.`
            })
        );


});

router.get('/user', (req, res) => isEmpty(req.query)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.query,
        validCheck(["id", "date"]),
        (valid_data) => ASSOCIATE`
            users ${{
            column: COLUMN("id", "name"),
            query: SQL`WHERE ${EQ({id: valid_data.id})}`
        }}
                < todos ${{query: SQL`WHERE ${EQ({date: format(zonedTimeToUtc(valid_data.date, req.headers.timezone), "yyyy-MM-dd")})} AND archived_date IS NULL`}}
        `,
        Query.success(res, "조회되었습니다.")
    ).catch(Query.error(res)));

router.post('/todo', (req, res) =>
    go(
        req.body,
        validCheck(["content", "date"]),
        (valid_data) => Query.insert("todos")({...valid_data, user_id: req.session.user.id}),
        Query.success(res, "등록이 완료되었습니다.")
    ).catch(Query.error(res)));

router.get('/todo/:id', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.id,
        Query.getById("todos"),
        Query.success(res, "조회되었습니다.")
    ).catch(Query.error(res)));

router.patch('/todo/:id', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.id,
        Query.update("todos", req.body),
        Query.success(res, "업데이트되었습니다.")
    ).catch(Query.error(res)));


router.post('/archive', (req, res) => isEmpty(req.query)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.query.id,
        Query.update("todos", {archived_date: zonedTimeToUtc(new Date(), "Asia/Seoul")}),
        (data) => ({
            todo_id: data.id,
            user_id: data.user_id,
        }),
        Query.insert("archive"),
        Query.success(res, "보관되었습니다.")
    ).catch(Query.error(res)));

router.post('/archive/return/:pk', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.pk,
        Query.update("todos", {archived_date: null}),
        (todo) => QUERY1`DELETE FROM ${TB("archive")} WHERE ${EQ({todo_id:todo.id})}`,
        Query.success(res, "복구되었습니다.")
    ).catch(Query.error(res)));

router.post('/archive/delete/:pk', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        Query.updateWhere("archive", {delete_date: zonedTimeToUtc(new Date(), "Asia/Seoul")}, {todo_id: req.params.pk}),
        Query.success(res, "삭제되었습니다.")
    ).catch(Query.error(res)));


router.post('/archive/delete_all', (req, res) => go(
    QUERY`UPDATE ${TB("archive")} ${SET({delete_date: zonedTimeToUtc(new Date(), "Asia/Seoul")})} WHERE ${EQ({user_id: req.session.user.id})} AND delete_date IS NULL`,
    Query.success(res, "전부 삭제되었습니다.")
).catch(Query.error(res)));


router.post('/logout', (req, res) => {
    delete req.session.user;
    req.session.destroy();
    res.json({
        code: '0001',
        message: "로그아웃이 완료되었습니다."
    });
});

router.post('/login', async function (req, res) {
    const valid_data = await go(
        req.body,
        validCheck(["email", "password"]),
    ).catch(Query.error(res));

    if (!valid_data) return;

    go(
        valid_data,
        ({email}) => Query.getColumns("users", ['id', 'name', 'email', 'password'], {email}),
        tap(Query.emptyCheck({code: "E002", message: "일치하는 계정이 없습니다."})),
        tap((user) =>
            Query.passwordCheck({
                code: "E002",
                message: "비밀번호가 일치하지 않습니다."
            }, valid_data.password, user.password)),
        (user) => {
            delete user.password;
            req.session.user = user;
            Query.success(res, "로그인 되었습니다.", user);
        }
    ).catch(Query.error(res));
});

router.post('/reg', (req, res) =>
    go(
        req.body,
        validCheck(USER_COLUMNS),
        tap(({name}) => Query.get("users", {name}), Query.duplicateCheck({code: "E002", message: "이름이 중복됩니다."})),
        tap(({email}) => Query.get("users", {email}), Query.duplicateCheck({code: "E002", message: "이메일이 중복됩니다."})),
        (valid_data) => {
            valid_data.password = bcrypt.hashSync(valid_data.password, 10);
            return valid_data;
        },
        Query.insert("users"),
        Query.success(res, "회원가입이 완료되었습니다.")
    ).catch(Query.error(res)));


export default router;