/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('sessions', function (table) {
        table.increments('id').primary();
        table.text('sessionId').unique();
        table.bigInteger('user_id').unsigned().index();
        table.foreign('user_id').references('users.id')
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
