import express from "express"
import {entries, go, head, hi, log, pipe} from "fxjs";
import bcrypt from "bcrypt"

import {COLUMN, EQ, QUERY, VALUES} from "../../util/db/db_connect.js";
import {validCheck} from "../../util/valid.js";

const router = express.Router();

const USER_COLUMNS = ["name", "email", "password"]

router.use(function (req, res, next) {
    res._json = res.json;
    res.json = function json(obj) {
        obj.APIversion = 1;
        res._json(obj);
    };
    next();
});

router.get('/', function (req, res) {
    res.json({hi: 'hi'})
});

router.post('/', function (req, res) {


    res.json({hi: 'hi'})
});

router.get('/login', async function (req, res) {

    const validData = await go(
        req.body,
        validCheck(["email", "password"]),
    ).catch(err => {
        res.status(400).send({
            code: "E001",
            message: err
        })
        res.end()
    })

    QUERY`SELECT ${COLUMN('name', 'email', 'password')} FROM users WHERE ${EQ({email:validData.email})}`
        .then((users) => {
                !users.length && res.status(400).json({
                    code: "E001",
                    message: "일치하는 계정이 없습니다."
                }).end()

                const me = go(users, head)

                const valid = bcrypt.compareSync(validData.password, me.password)

                delete me.password

                valid ? res.status(200).json({
                    code: "001",
                    result: me,
                    message: "로그인되었습니다."
                }) : res.status(400).json({
                    code: "E002",
                    message: "비밀번호가 일치하지 않습니다."
                })


            }
        ).catch((_) => {
        res.status(400).json({
            code: "E002",
            message: "데이터가 잘못되었습니다."
        })
    })
});

router.post('/reg', async function (req, res) {

    const validData = await go(
        req.body,
        validCheck(USER_COLUMNS),
    ).catch(err => {
        res.status(400).send({
            code: "E001",
            message: err
        })
        res.end()
    })

    validData.password = bcrypt.hashSync(validData.password, 10)

    QUERY`INSERT INTO users ${VALUES(validData)}`
        .then((_) => {
                res.json({
                    code: "0001",
                    message: "회원가입이 완료되었습니다."
                })
            }
        ).catch((_) => {
        res.status(400).json({
            code: "E002",
            message: "데이터가 잘못되었습니다."
        })
    })
});

export default router;