/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('todos', function (table) {
        table.boolean("checked").defaultTo(false).alter().notNullable()
        table.text('content').notNullable().alter()
        table.bigInteger('user_id').notNullable().alter()
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
