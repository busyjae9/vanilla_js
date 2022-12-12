import {log, go, entries, values, each, hi, strMap, map} from "fxjs";
import POOL from "../db_connect.js";

const Migration = {
    tables: {
        todos: POOL.SQL`
        create index todos_user_id_index
        on todos (user_id);
        `
    }
}
Migration.init = () => go(
    Migration.tables,
    values,
    each(q => POOL.QUERY`${q}`)
)

export default Migration