import {log, go, entries, values, each, hi, strMap, map} from "fxjs";
import POOL from "../db_connect.js";

const Migration = {
    tables: {
        users: POOL.SQL`
        create table users
        (
            id          serial primary key,
            name        varchar(20),
            email       varchar(100),
            password    text
        )
        `,
        todos: POOL.SQL`
        create table todos
        (
            id          serial primary key,
            content     text,
            user_id     int
                        constraint todos_fx_user_id_foreign
                        references users
        )
        `
    }
}
Migration.init = () => go(
    Migration.tables,
    values,
    each(q => POOL.QUERY`${q}`)
)

export default Migration