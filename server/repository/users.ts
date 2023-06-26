import crypto from "crypto";
import conn from "server/db";

export function createPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512");
    return `${salt}.${hash.toString("hex")}`;
}

export async function getUserCount() {
    const result = await conn("users").count("users.username");
    const user_count_value = result[0]["count"];
    return typeof user_count_value === "string"
        ? parseInt(user_count_value)
        : user_count_value;
}

export async function createAdminUser(params: {
    name: string,
    username: string,
    email: string,
    password: string
}) {
    return await conn.transaction(async trx => {
        const admin_id = await trx.insert({
            name: params.name,
            username: params.username,
            email: params.email,
            password: createPassword(params.password)
        }, ["id"]).into("users");

        const role_id = await trx
            .select<{
                id: number
            }>("id")
            .from("roles")
            .where("role", "admin").first();

        if (role_id === undefined) {
            throw Error("admin role not found");
        }

        await trx.insert({
            user_id: admin_id[0].id,
            role_id: role_id.id
        }).into("user_roles");

        return admin_id[0].id;
    });
}