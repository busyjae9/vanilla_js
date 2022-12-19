/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('sessions', function (table) {
        table.dropColumn('sessionId')
        table.timestamp('created_at')
        table.datetime('expired_at').defaultTo(knex.fn.now(7))
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
