/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('likes', table => {
        table.datetime('reg_date').defaultTo(knex.fn.now());
        table.datetime('cancel_date');
        table.bigInteger('user_id').unsigned().index().notNullable();
        table.foreign('user_id').references('users.id');
        table.bigInteger('todo_id').unsigned().index().notNullable();
        table.foreign('todo_id').references('todos.id');
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
