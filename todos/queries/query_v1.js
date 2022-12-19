import {COLUMN, EQ, QUERY, QUERY1, SET, TB, VALUES} from "../util/db/db_connect.js";
import {curry, curry2, includes, isEmpty, log} from "fxjs";
import bcrypt from "bcrypt";

const Query = {};

Query.serverError = {
    code: "E500",
    message: "일시 오류입니다."
};

Query.error = curry((res, error) => {
    if (!includes("E", error?.code)) {
        log(error);
        res.status(500).json(Query.serverError);
    } else res.status(400).json(error);
});

Query.success = curry2((res, message, data) => res.status(200).json({
    code: "0001",
    result: data,
    message: message
}));

Query.duplicateCheck = curry((err, res) => new Promise((resolve, reject) => {
    res ? reject(err) : resolve();
}));

Query.passwordCheck = curry2((err, password, hash) => new Promise((resolve, reject) =>
    bcrypt.compare(password, hash).then(
        (result) => result ? resolve(result) : reject(err)
    )));

Query.emptyCheck = curry((err, res) => new Promise((resolve, reject) =>
    isEmpty(res) ? reject(err) : resolve(res)));

Query.get = curry((tb, data) => QUERY1`SELECT * FROM ${TB(tb)} WHERE ${EQ(data)}`);
Query.getColumns = curry2((tb, col, data) => QUERY1`SELECT ${COLUMN(...col)} FROM ${TB(tb)} WHERE ${EQ(data)}`);
Query.getById = curry((tb, id) => QUERY1`SELECT * FROM ${TB(tb)} WHERE ${EQ({id})}`);
Query.getByIdColumns = curry2((tb, col, id) => QUERY1`SELECT ${COLUMN(...col)} FROM ${TB(tb)} WHERE ${EQ({id})}`);

Query.insert = curry((tb, data) => QUERY1`INSERT INTO ${TB(tb)} ${VALUES(data)} RETURNING *`);
Query.update = curry2((tb, data, id) => QUERY1`UPDATE ${TB(tb)} ${SET(data)} WHERE ${EQ({id})} RETURNING *`);
Query.updateWhere = curry2((tb, data, condition) => QUERY1`UPDATE ${TB(tb)} ${SET(data)} WHERE ${EQ(condition)} RETURNING *`);

export default Query;