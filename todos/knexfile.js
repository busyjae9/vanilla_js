// Update with your config settings.
import dotenv from "dotenv";

dotenv.config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
export default {

    development: {
        client: 'pg',
        debug: true,
        connection: {
            //host
            host: process.env['pg_host'],
            //user
            user: process.env['pg_user'],
            //password
            password: process.env['pg_password'],
            //database or schema
            database: process.env['pg_db'],
            //기간 설정 토큰 (※mysql2 동작 안함.)
            // expirationChecker: () => Date.now() < Number(new Date('2020-12-30'))
        },
        migrations: {
            database: process.env['pg_db'],
            directory: './knex_migration',
            disableTransactions: true,
        },
        log: {
            warn(msg) {
                console.warn(msg);
            },
            error(msg) {
                console.error(msg);
            },
            deprecate(msg) {
                console.log(msg);
            },
            debug(msg) {
                console.log(msg);
            }
        }
    },

    staging: {
        client: 'pg',
        debug: true,
        connection: {
            //host
            host: process.env['pg_host'],
            //user
            user: process.env['pg_user'],
            //password
            password: process.env['pg_password'],
            //database or schema
            database: process.env['pg_db'],
            //기간 설정 토큰 (※mysql2 동작 안함.)
            // expirationChecker: () => Date.now() < Number(new Date('2020-12-30'))
        },
        migrations: {
            database: process.env['pg_db'],
            directory: './knex_migration',
            disableTransactions: true,
        },
        log: {
            warn(msg) {
                console.warn(msg);
            },
            error(msg) {
                console.error(msg);
            },
            deprecate(msg) {
                console.log(msg);
            },
            debug(msg) {
                console.log(msg);
            }
        }
    },

    production: {
        client: 'pg',
        debug: true,
        connection: {
            //host
            host: process.env['pg_host'],
            //user
            user: process.env['pg_user'],
            //password
            password: process.env['pg_password'],
            //database or schema
            database: process.env['pg_db'],
            //기간 설정 토큰 (※mysql2 동작 안함.)
            // expirationChecker: () => Date.now() < Number(new Date('2020-12-30'))
        },
        migrations: {
            database: process.env['pg_db'],
            directory: './knex_migration',
            disableTransactions: true,
        },
        log: {
            warn(msg) {
                console.warn(msg);
            },
            error(msg) {
                console.error(msg);
            },
            deprecate(msg) {
                console.log(msg);
            },
            debug(msg) {
                console.log(msg);
            }
        }
    }

};
