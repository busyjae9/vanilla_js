/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('tokens', table => {
        table.increments('id').primary();
        table.json('token').notNullable();
        table.string('type', 300).notNullable();
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
