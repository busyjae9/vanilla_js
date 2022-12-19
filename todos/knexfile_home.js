// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

import { config } from "dotenv";

config();
export default {
  development: {
    client: "postgresql",
    connection: {
      database: process.env.pg_db,
      user: process.env.pg_user,
      password: process.env.pg_password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      directory: process.env.migration_folder
    }
  },

  staging: {
    client: "postgresql",
    connection: {
      database: process.env.pg_db,
      user: process.env.pg_user,
      password: process.env.pg_password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      directory: process.env.migration_folder
    }
  },

  production: {
    client: "postgresql",
    connection: {
      database: process.env.pg_db,
      user: process.env.pg_user,
      password: process.env.pg_password
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations",
      directory: process.env.migration_folder
    }
  }
};
