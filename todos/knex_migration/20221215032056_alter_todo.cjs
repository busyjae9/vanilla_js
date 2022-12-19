/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('todos', function (table) {
        table.boolean("checked").defaultTo(false)
        table.datetime("reg_date").defaultTo(knex.fn.now())
        table.datetime("modified_date").defaultTo(knex.fn.now())
        table.datetime("date").defaultTo(knex.fn.now())
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
