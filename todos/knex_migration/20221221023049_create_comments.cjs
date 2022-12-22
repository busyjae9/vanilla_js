/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('comments', table => {
        table.bigIncrements('id').primary();
        table.datetime('reg_date').defaultTo(knex.fn.now());
        table.datetime('modified_date').defaultTo(knex.fn.now());
        table.datetime('deleted_date');
        table.text('comment').notNullable();
        table.bigInteger('todo_id').unsigned().index();
        table.foreign('todo_id').references('todos.id');
        table.bigInteger('user_id').unsigned().index();
        table.foreign('user_id').references('users.id');
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
