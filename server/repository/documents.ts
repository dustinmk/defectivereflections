
import crypto from "crypto";
import moment from "moment";
import db from "server/db";


export async function listStatus() {

}

export async function updateStatus() {

}

export async function listSections() {

}

export async function updateSection() {

}

export async function listDocuments() {

}

export async function fetchDocument() {

}

export async function updateDocument() {

}

export async function createDocument() {
    return await db.transaction(async trx => {
        const admin_id = await trx.insert({
        }, ["id"]).into("documents");

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
