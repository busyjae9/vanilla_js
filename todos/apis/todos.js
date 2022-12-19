import express from "express";
import bcrypt from "bcrypt";
import {format} from 'date-fns';
import {zonedTimeToUtc} from "date-fns-tz/esm";

import LoginUI from "../frontend/src/templates/login.js";
import MainUI from "../frontend/src/templates/main.js";
import {go, isEmpty, log, tap} from "fxjs";
import {EQ, QUERY, QUERY1} from "../util/db/db_connect.js";
import {validCheck} from "../util/valid.js";
import Query from "../queries/query_v1.js";

const USER_COLUMNS = ["name", "email", "password"];

const router = express.Router();

/*
* 1. 아이피를 확인한 후 타임존을 가져와서 그에 맞춰 utc로 변환해서 sql을 날리는 방법
*   - 일단 해당 방법으로 구현을 했는데, 혹시 다른 방법이 있다면 적용해보고 후보군 알아보기
* 2. 로컬에서 타임존을 보내서 그에 맞춰 utc로 변환하는 방법
* */

router.get('/', (req, res) => {

    const date = req.query?.date ? new Date(req.query?.date) : new Date();
    const tz = req.headers["timezone"];
    const now = format(zonedTimeToUtc(date, tz), "yyyy-MM-dd");

    go(
        QUERY`SELECT * FROM todos WHERE ${EQ({user_id:req.session.user.id})} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${now + ' 23:59:59'} ORDER BY id DESC`,
        (todos) => res.render("index", {body: MainUI.initTmp(todos, now)})
    );
});

router.get('/list/:date', (req, res) => {
    const date = req.params.date ? new Date(req.params.date) : new Date();
    const tz = req.headers["timezone"];
    const now = format(zonedTimeToUtc(date, tz), "yyyy-MM-dd");

    go(
        QUERY`SELECT * FROM todos WHERE ${EQ({user_id:req.session.user.id})} AND archived_date IS NULL AND date BETWEEN ${now + ' 00:00:00'} AND ${now + ' 23:59:59'} ORDER BY id DESC`,
        (todos) => res.json({
            code: '0001',
            result: todos,
            message: "리스트가 조회되었습니다."
        })
    );
});

router.get('/data/:id', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.id,
        Query.getById("todos"),
        Query.success(res, "조회되었습니다.")
    ).catch(Query.error(res)));

router.patch('/data/:id', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.id,
        Query.update("todos", req.body),
        Query.success(res, "업데이트되었습니다.")
    ).catch(Query.error(res)));
router.post('/data/archive/:pk', (req, res) => isEmpty(req.params)
    ? res.status(400).json({code: 'E001', message: "데이터 형식이 맞지 않습니다."})
    : go(
        req.params.pk,
        Query.update("todos", {archived_date: zonedTimeToUtc(new Date(), "Asia/Seoul")}),
        (data) => {
            data.todo_id = data.id;
            delete data.id;
            delete data.archived_date;
            return data;
        },
        Query.insert("archives"),
        Query.success(res, "보관되었습니다.")
    ).catch(Query.error(res)));

router.get('/archive', (req, res) =>
    // 만들기
    go(
        QUERY`SELECT * FROM todos WHERE ${EQ({user_id:req.session.user.id})} AND delete_date IS NULL ORDER BY id DESC`,
        (todos) => res.json({
            code: '0001',
            result: todos,
            message: "리스트가 조회되었습니다."
        })
    ));


router.post('/logout', (req, res) => {
    delete req.session.user;
    req.session.destroy();
    res.json({
        code: '0001',
        message: "로그아웃이 완료되었습니다."
    });
});

router.get('/login', (req, res) => {
    req.session.user
        ? res.redirect('/todo')
        : res.render(
            "index",
            {body: LoginUI.loginTmp()}
        );
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
        Query.emptyCheck({code: "E002", message: "일치하는 계정이 없습니다."}),
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

router.get('/login/reg', (req, res) => {
    // const user = await QUERY1`
    //     SELECT * FROM users where id = ${req.params.user_id}
    // `;

    req.session.user
        ? res.redirect('/todo')
        : res.render(
            "index",
            {body: LoginUI.regTmp()}
        );
});

router.post('/login/reg', (req, res) =>
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


router.post('/add', (req, res) =>
    go(
        req.body,
        validCheck(["content", "date"]),
        (valid_data) => Query.insert("todos")({...valid_data, user_id: req.session.user.id}),
        Query.success(res, "등록이 완료되었습니다.")
    ).catch(Query.error(res)));


export default router;