/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema.table("document_version", table => {
        table.string("references");

    }).createTable("category", table => {
        table.increments("id");
        table.integer("parent_id").references("category.id");
        table.string("name").notNullable();
        
    }).createTable("document_category", table => {
        table.increments("id");
        table.integer("category_id").notNullable().references("category.id");
        table.integer("document_id").notNullable().references("document.id");
    })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("document_category")
        .dropTable("category")
        .table("document_version", table =>
            table.dropColumn("references")
        );
};
