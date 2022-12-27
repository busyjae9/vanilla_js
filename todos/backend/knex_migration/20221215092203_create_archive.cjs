/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.createTable('archives', table => {
        table.bigIncrements('id').primary();
        table.text('content').notNullable();
        table.boolean("checked").defaultTo(false).notNullable();
        table.datetime("reg_date").defaultTo(knex.fn.now());
        table.datetime("modified_date").defaultTo(knex.fn.now());
        table.datetime("date").defaultTo(knex.fn.now());
        table.bigInteger('user_id').unsigned().index().notNullable();
        table.foreign('user_id').references('users.id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
