/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("section", (table) => {
            table.increments("id");
            table.string("name", 255).notNullable();
            table.string("display_name", 255).notNullable().unique();
            table.integer("parent_id").references("section.id");
        })
        .createTable("status", (table) => {
            table.increments("id");
            table.boolean("visible");
            table.string("name", 255).notNullable();
            table.string("display_name", 255).notNullable().unique();
        })
        .createTable("document", (table) => {
            table.increments("id");
            table.string("name", 255).notNullable().unique();
            table.string("path", 255).notNullable().unique();
            table.dateTime("created").notNullable();
            table.integer("section_id").references("section.id");
        })
        .createTable("document_version", (table) => {
            table.increments("id");
            table.text("content");
            table.string("revision", 255).notNullable();
            table.text("comments");
            table.dateTime("created").notNullable();
            table.dateTime("edited").notNullable();
            table.integer("document_id").references("document.id");
            table.integer("status_id").references("status.id");
        })
        .createTable("attachment", (table) => {
            table.increments("id");
            table.string("name", 255).notNullable().unique();
            table.string("path", 255).notNullable().unique();
            table.string("type", 255).notNullable().unique();
            table.binary("content");
            table.dateTime("created").notNullable();
            table.dateTime("edited").notNullable();
            table.integer("document_id").references("document.id");
        })
        .then(() => knex("section").insert([
            {name: "poetry", display_name: "Poetry"},
            {name: "essay", display_name: "Essay"},
            {name: "review", display_name: "Review"},
            {name: "research", display_name: "Research"},
            {name: "game", display_name: "Game"},
            {name: "programming", display_name: "Programming"},
        ]))
        .then(() => knex("status").insert([
            {name: "hidden", visible: false, display_name: "Hidden"},
            {name: "proposal", display_name: "Proposal"},
            {name: "lit_review", display_name: "Literature Review"},
            {name: "in_research", display_name: "In Research"},
            {name: "draft", display_name: "Draft"},
            {name: "candidate", display_name: "Candidate"},
            {name: "complete", display_name: "Complete"},
        ]));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("attachment")
        .dropTable("document_version")
        .dropTable("document")
        .dropTable("status")
        .dropTable("section");
};
