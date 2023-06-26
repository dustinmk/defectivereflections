/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
    return knex.schema
        .createTable("users", (table) => {
            table.increments("id");
            table.string("name", 255).notNullable();
            table.string("username", 255).notNullable();
            table.string("email", 255).notNullable();
            table.string("totp_key", 255);
            table.string("password", 255).notNullable();
            table.string("reset_token", 255);
            table.datetime("reset_token_expiry");
            table.datetime("last_login");
        })
        .createTable("roles", (table) => {
            table.increments("id");
            table.string("role", 255).notNullable();
        })
        .createTable("user_roles", (table) => {
            table.increments("id");
            table.integer("user_id").references("users.id");
            table.integer("role_id").references("roles.id");
        }).then(() => knex("roles").insert([
            {role: "admin"}
        ]));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema
        .dropTable("user_roles")
        .dropTable("roles")
        .dropTable("users");
};
