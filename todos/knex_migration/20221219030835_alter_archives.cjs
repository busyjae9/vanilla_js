/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.alterTable('archive', function (t) {
        t.dropColumn('id');
        t.dropColumn('content');
        t.dropColumn('checked');
        t.dropColumn('reg_date');
        t.dropColumn('modified_date');
        t.dropColumn('date');
        t.dropColumn('user_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {

};
