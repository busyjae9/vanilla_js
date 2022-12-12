import {PostgreSQL} from "fxsql";
import {config} from 'dotenv'

const {CONNECT} = PostgreSQL
config()

const POOL = CONNECT({
    host: process.env.pg_host,
    port: process.env.pg_port,
    user: process.env.pg_user,
    password: process.env.pg_password,
    database: process.env.pg_db_fx,
})

export default POOL


