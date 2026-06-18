import crypto from "crypto";
import { NextFunction, Response } from "express";
import moment from "moment";
import db from "server/db";

// qr "otpauth://totp/Example:alice@google.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"

export function createPassword(password: string) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 210 * 1000, 64, "sha512");
    return `${salt}.${hash.toString("hex")}`;
}

export function validatePassword(password: string, hashed_password: string) {
    const [salt, old_hash] = hashed_password.split(".");
    const new_hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
    const a = new Uint8Array(Buffer.from(new_hash, "hex"));
    const b = new Uint8Array(Buffer.from(old_hash, "hex"));
    return crypto.timingSafeEqual(a, b);
}

export async function getUserCount() {
    const result = await db("users").count("users.username");
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
    return await db.transaction(async trx => {
        const existing_users = await trx.select().from("users");
        if (existing_users.length > 0) {
            throw Error("admin already exists"); 
        }
        
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

// Returns roles
export async function validateUser(username: string, password: string) {
    return await db.transaction(async trx => {
        const user = await trx
            .select<{
                password: string,
                totp_key: string
            }>()
            .from("users")
            .where("username", username)
            .first();

        if (user === undefined || ! validatePassword(password, user.password)) {
            return [];
        }

        await trx("users")
            .where("username", username)
            .update("last_login", moment().toDate());

        const roles = await trx
            .select<[{
                role: string
            }]>()
            .from("roles")
            .join("user_roles", "user_roles.role_id", "roles.id")
            .join("users", "users.id", "user_roles.user_id")
            .where("users.username", username);

        return roles.map(row => row.role)
    });
}

export async function startPasswordReset(username: string) {
    const token = crypto.randomBytes(32).toString("hex");
    const expire = moment().add(24, "h");

    await db("users")
        .where("username", username)
        .update({reset_token: token, reset_token_expiry: expire});

    return token;
}

export async function sendPasswordResetEmail(email: string, token: string) {

}

export async function finishPasswordReset(token: string, password: string) {
    return await db.transaction(async trx => {
        const user = await trx
            .select<{
                id: number,
                reset_token_expiry: Date
            }>()
            .where("reset_token", token)
            .first();

        if (user === undefined || user.reset_token_expiry > moment().toDate()) {
            throw Error("Invalid reset token");
        }

        await trx("users")
            .where("id", user.id)
            .update({
                password: createPassword(password),
                reset_token: null,
                reset_token_expiry: null,
            });
    });
}

export async function startConfigure2FA(username: string) {
    const key = crypto.randomBytes(15).toString("hex");
    await db("users")
        .where("username", username)
        .update({
            totp_key: key
        });
    return key;
}

export async function enable2FA(username: string) {
    await db("users")
        .where("username", username)
        .update({
            totp_enabled: true
        });
}

export function validate2FA(username: string, code: string) {

}

export function requireRole(role: string) {
    return (req: Express.Request, res: Response, next: NextFunction) => {
        const index = req.session.roles && req.session.roles.indexOf(role);
        if (index !== undefined && index !== null && index >= 0) {
            return next();
        }

        res.status(401).json({error: "Unauthorized"});
        return;
    }
}