import migrate from "./knex_migration/20221212_seed.js";
import knex from "knex";
import config from './knexfile.js'

const db = knex(config.development)

if (
    typeof migrate.up !== 'function' ||
    typeof migrate.down !== 'function'
) {
    throw new Error(
        `Invalid migration: ${migrate} must have both an up and down function`
    );
}

console.log(typeof migrate.up)