/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable("todos", table => {
    table.increments("id").primary();
    table.boolean("checked").defaultTo(false);
    table.text("content").notNullable();
    table.datetime("reg_date").notNullable().defaultTo(knex.fn.now());
    table.datetime("modified_date").notNullable().defaultTo(knex.fn.now());
    table.datetime("date").notNullable().defaultTo(knex.fn.now());
    table.datetime("archived_date");

    table.bigInteger("user_id").unsigned();
    table.foreign("user_id").references("users.id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {

};
