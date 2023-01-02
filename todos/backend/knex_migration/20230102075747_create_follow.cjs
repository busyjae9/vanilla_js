/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.createTable('followings', table => {
        table.increments('id').primary();
        table.bigInteger('user_id').unsigned().index();
        table.foreign('user_id').references('users.id');
        table.bigInteger('following_id').unsigned().index();
        table.foreign('following_id').references('users.id');
    });
};

/**
 * @param { import('knex').Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
