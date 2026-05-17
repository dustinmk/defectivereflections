
import { Attachment, Document, DocumentRecord, DocumentVersion, DocumentVersionRecord, EMPTY_DOCUMENT_VERSION, Section, Status } from "common/model";
import crypto, { randomUUID } from "crypto";
import { Knex } from "knex";
import moment from "moment";
import path, { dirname } from "path";
import fsPromises, { constants } from "fs/promises";
import db from "server/db";
import fs from "fs";

const PARTIAL_DOC_VERSION_COLS = ["id", "created", "edited", "revision", "version_number", "status_id"];

export async function listStatus(section_id?: number | null, category_id?: number | null) {
    return await db.transaction(async trx => {
        if (!section_id && !category_id) {
            return await trx.select()
                .from<Status>("status")
                .orderBy("status.name")
        } else {
            let query = trx.select("status.*")
                .distinct("status.id")
                .from<Status>("status")
                .leftJoin("document_version", "document_version.status_id", "=", "status.id")
                .leftJoin("document_primary_version", "document_primary_version.document_version_id", "=", "document_version.id")
                .leftJoin("document", "document.id", "=", "document_primary_version.document_id")
                .leftJoin("document_category", "document_category.document_id", "document.id")
            
            if (section_id) {
                query = query.where("document.section_id", section_id)
            }
            
            if (category_id) {
                query = query.where("document_category.category_id", category_id)
            }
            
            return await query.orderBy("status.name");
        }
    });
}

export async function createStatus(name: string, display_name: string) {
    return await db.transaction(async trx => {
        return await trx("status")
            .insert({name, display_name});
    });
}

export async function updateStatus(id: number, name: string, display_name: string) {
    return await db.transaction(async trx => {
        return await trx("status")
            .where("id", id)
            .update({name, display_name});
    });
}

export async function deleteStatus(id: number) {
    return await db.transaction(async trx => {
        return await trx("status")
            .where("id", id)
            .del();
    });
}

export async function listCategory(section?: string | null) {
    return await db.transaction(async trx => {
        return await trx.select()
            .from<Status>("category")
            .orderBy("category.name")
    });
}

export async function createCategory(name: string, parent_id: number | null) {
    return await db.transaction(async trx => {
        return await trx("category")
            .insert({name, parent_id});
    });
}

export async function updateCategory(id: number, name: string, parent_id: number | null) {
    return await db.transaction(async trx => {
        return await trx("category")
            .where("id", id)
            .update({name, parent_id});
    });
}

export async function deleteCategory(id: number) {
    return await db.transaction(async trx => {
        return await trx("category")
            .where("id", id)
            .del();
    });
}

export async function listSections() {
    return await db.transaction(async trx => {
        return await trx.select().from<Section>("section");
    });
}

export type DocumentSortTerm = "name-asc" | "name-desc" | "edited-asc" | "edited-desc" | "created-asc" | "created-desc" | null;

export async function viewDocuments(status_id: number | null, section_id: number | null, category_id: number | null, sort: DocumentSortTerm) {
    return await db.transaction(async trx => {
        let query = doc_select(trx)
            .leftJoin("document_version", "document_version.id", "document_primary_version.document_version_id")
            .leftJoin("status", "status.id", "document_version.status_id")
            .leftJoin("section", "section.id", "document.section_id")
            .leftJoin("category", "category.id", "document.category_id")
            .whereNotNull("document_primary_version.document_version_id")

        if (status_id !== null) {
            query = query.where("status.id", status_id)
                .whereNot("status.name", "hidden")
        }

        if (section_id !== null) {
            query = query.where("section.id", section_id);
        }

        if (category_id !== null) {
            query = query.where("category.id", category_id);
        }
        
        if (sort === "name-asc") {
            query = query.orderBy("name", "asc")
        }  else if (sort === "name-desc") {
            query = query.orderBy("name", "desc")
        } else if (sort === "edited-asc") {
            query = query.orderBy("edited", "asc")
        } else if (sort === "edited-desc") {
            query = query.orderBy("edited", "desc")
        } else if (sort === "created-asc") {
            query = query.orderBy("created", "asc")
        } else if (sort === "created-desc") {
            query = query.orderBy("created", "desc")
        } else {
            query = query.orderBy("edited", "desc")
        }

        const documents = await query;

        return documents;
    })
}

export async function listDocuments(category_id: number | null, section_id: number | null, status_id: number | null, sort_method: string | null) {
    return await db.transaction(async trx => {
        let document_query = doc_select(trx);

        if (category_id !== null) {
            document_query = document_query.where("document_category.category_id", "=", category_id);
        }

        if (section_id !== null) {
            document_query = document_query.where("document.section_id", "=", section_id);
        }

        if (status_id !== null) {
            document_query = document_query.where("document_version.status_id", "=", status_id);
        }

        if (sort_method !== null && sort_method !== undefined && sort_method.length > 0) {
            const [column, dir] = sort_method.split("-");

            let order_dir = "asc";
            if (dir === "desc") {
                order_dir = "desc";
            }

            if (column === "created") {
                document_query = document_query.orderBy("document.created", order_dir);
            } else if (column === "edited") {
                document_query = document_query.orderBy("document.edited", order_dir);
            } else if (column === "name") {
                document_query = document_query.orderBy("document.name", order_dir);
            }
        }

        const documents = await document_query
            .groupBy("document.id", "document_primary_version.document_version_id")
            .orderBy("edited", "desc");
        
        const versions = await trx
            .select("document_id", ...PARTIAL_DOC_VERSION_COLS)
            .rowNumber("version_rank", function() {this.orderBy("version_number", "desc").partitionBy("document_id")})
            .from<DocumentVersionRecord>("document_version")
            .whereIn("document_id", documents.map(document => document.id))
        
        const categories = await trx
            .select("document_id", "category_id")
            .from("document_category")
            .whereIn("document_id", documents.map(document => document.id))

        const doc_map = new Map<number, Document>(documents.map(document => [document.id, document]));
        for (const doc of doc_map.values()) {
            doc.versions = [];
            doc.categories = [];
        }

        for (const version of versions) {
            const doc = doc_map.get(version.document_id);
            if (doc !== undefined) {
                doc.versions = [version];
            }
        }

        for (const category of categories) {
            const doc = doc_map.get(category.document_id);
            if (doc !== undefined) {
                doc.categories.push(category.category_id)
            }
        }

        return [...doc_map.values()];
    });
}

export async function fetchDocument(document_path: string) {
    return await db.transaction(async trx => {
        const document = await doc_select(trx)
            .where("path", document_path)
            .first();

        const categories = (await trx
            .select("category_id")
            .from("document_category")
            .where("document_id", document.id)
        ).map(row => row.category_id)

        const versions = await trx
            .select(...PARTIAL_DOC_VERSION_COLS)
            .from("document_version")
            .where("document_id", document.id)
            .orderBy("version_number", "desc") as DocumentVersion[];

        return {...document, versions, categories};
    });
}

export async function fetchDocumentById(document_id: number) {
    return await db.transaction(async trx => {
        const document = await doc_select(trx)
            .where("document.id", document_id)
            .first();

        const categories = (await trx
            .select("category_id")
            .from("document_category")
            .where("document_id", document_id)
        ).map(row => row.category_id)

        const versions = await trx
            .select(...PARTIAL_DOC_VERSION_COLS)
            .from("document_version")
            .where("document_id", document.id)
            .orderBy("version_number", "desc") as DocumentVersion[];

        return {...document, versions, categories};
    });
}


export async function fetchDocumentVersion(document_path: string, document_version_number: number | null) {
    if (typeof document_version_number !== "number" || isNaN(document_version_number)) {
        return EMPTY_DOCUMENT_VERSION;
    }

    return await db.transaction(async trx => {
        const document_version = await trx
            .select("document_version.*")
            .from<DocumentVersionRecord>("document_version")
            .join("document", "document.id", "document_version.document_id")
            .where("document_version.version_number", document_version_number)
            .where("document.path", document_path)
            .first();

        const attachments = await trx
            .select()
            .from<Attachment>("attachment")
            .where("document_id", document_version.document_id)
            .where("document_version_id", document_version.id);

        return {...document_version, attachments} as DocumentVersion;
    });
}

export async function fetchDocumentVersionById(document_version_id: number | null) {
    if (document_version_id === null) {
        return EMPTY_DOCUMENT_VERSION;
    }
    
    return await db.transaction(async trx => {
        const document_version = await trx
            .select()
            .from<DocumentVersionRecord>("document_version")
            .where("id", document_version_id)
            .first();

        const attachments = await trx
            .select()
            .from<Attachment>("attachment")
            .where("document_id", document_version.document_id)
            .where("document_version_id", document_version.id);

        return {...document_version, attachments} as DocumentVersion;
    });
}

export async function updateDocument(document: Document) {
    return await db.transaction(async trx => {
        const document_id = await trx("document")
            .where("id", document.id)
            .update({
                name: document.name,
                path: document.path,
                edited: new Date(),
                section_id: document.section_id
            }, ["id"]);

        const document_categories = (
            await trx
            .select("category_id")
            .from("document_category")
            .where("document_id", document.id)
        ).map(row => row.category_id);

        for (const category_id of document_categories) {
            if (document.categories.indexOf(category_id) === -1) {
                await trx("document_category")
                    .where("document_id", document.id)
                    .where("category_id", category_id)
                    .del();
            }
        }

        for (const category_id of document.categories) {
            if (document_categories.indexOf(category_id) === -1) {
                await trx("document_category")
                    .insert({document_id: document.id, category_id: category_id});
            }
        }

        return document_id[0].id;
    });
}

export async function createDocument(document: Document, document_version: DocumentVersion) {
    return await db.transaction(async trx => {
        const document_id = await trx.insert({
            name: document.name,
            path: document.path,
            created: new Date(),
            edited: new Date(),
            section_id: document.section_id
        }, ["id"]).into("document");

        document_version.document_id = document_id[0].id;
        await createDocumentVersionTrx(trx, document_version);

        return document_id[0].id;
    });
}

export async function updateDocumentVersion(document_version: DocumentVersion) {
    return await db.transaction(async trx => {
        const document_version_id = await trx("document_version")
            .where("id", document_version.id)
            .update({
                content: document_version.content,
                comments: document_version.comments,
                revision: document_version.revision,
                references: document_version.references,
                subtitle: document_version.subtitle,
                edited: new Date(),
                status_id: document_version.status_id
            }, ["id"]);

        return document_version_id[0].id;
    });
}

export async function createDocumentVersion(document_version: DocumentVersion) {
    return await db.transaction(async trx => await createDocumentVersionTrx(trx, document_version));
}

const createDocumentVersionTrx = async (trx: Knex.Transaction<any, any[]>, document_version: DocumentVersion) => {
    const existing_top_version = await trx
        .select<DocumentVersion>("version_number")
        .from("document_version")
        .where("document_id", document_version.document_id)
        .orderBy("version_number", "desc")
        .first();

    const version_number = existing_top_version === undefined || existing_top_version.version_number === null
        ? 1
        : existing_top_version.version_number + 1;

    // Don't create a new blank document if there is already a document created
    if (
        document_version.content.length === 0
        && document_version.comments.length === 0
        && document_version.revision.length === 0
    ) {
        return null;
    }

    const document_version_id = await trx.insert({
        content: document_version.content,
        comments: document_version.comments,
        revision: document_version.revision,
        version_number: version_number,
        created: new Date(),
        edited: new Date(),
        document_id: document_version.document_id,
        status_id: document_version.status_id
    }, ["id"]).into("document_version");

    // Copy existing attachments on latest version
    if (existing_top_version !== undefined) {
        const prior_attachments = await trx
            .select("attachment.*")
            .from<Attachment>("attachment")
            .join("document_version", "document_version.id", "attachment.document_version_id")
            .where("document_version.version_number", existing_top_version) as Attachment[];

        const new_attachments = prior_attachments.map(result => ({
            name: result.name,
            path: result.path,
            type: result.type,
            content: result.content,
            created: result.created,
            edited: result.edited,
            document_id: document_version.document_id,
            document_version_id: document_version_id[0].id
        }));

        await trx.batchInsert("attachment", new_attachments);
    }

    return document_version_id[0].id;
}

export async function setPrimaryDocumentVersion(document_path: string, document_version_number: number) {
    return await db.transaction(async trx => {
        const result = await trx
            .select<{id: number, document_id: number}>("document_version.id", "document_version.document_id")
            .from<DocumentVersionRecord>("document_version")
            .join("document", "document.id", "document_version.document_id")
            .where("document_version.version_number", document_version_number)
            .where("document.path", document_path)
            .first()

        if (result !== undefined && result.id !== null && result?.document_id !== null) {
            const existing_primary = await trx.select("id")
                .from("document_primary_version")
                .where("document_id", result.document_id)
                .first();

            if (existing_primary !== undefined) {
                await trx("document_primary_version")
                    .where("id", existing_primary.id)
                    .update({document_version_id: result.id});

            } else {
                await trx("document_primary_version")
                    .insert({
                        document_id: result.document_id,
                        document_version_id: result.id
                    });
            }

            return result.id;
        }

        return null;
    });
}

export async function removePrimaryDocumentVersion(document_path: string) {
    return await db.transaction(async trx => {
        const document_id = trx
            .select("id")
            .from<DocumentRecord>("document")
            .where("path", document_path)
            .first();

        if (document_id !== undefined) {
            await trx("document_primary_version")
                .where("document_id", document_id)
                .del();
        }
    });
}

export async function removeDocumentVersion(document_path: string, document_version_number: number) {
    return await db.transaction(async trx => {
        const result = await trx
            .select<{id: number, document_id: number}>("document_version.id", "document_version.document_id")
            .from<DocumentVersionRecord>("document_version")
            .join("document", "document.id", "document_version.document_id")
            .where("document_version.version_number", document_version_number)
            .where("document.path", document_path)
            .first()

        if (result !== undefined && result.document_id !== null && result.id !== null) {
            await trx("attachment")
                .where("document_id", result.document_id)
                .where("document_version_id", result.id)
                .del();

            await trx("document_primary_version")
                .where("document_id", result.document_id)
                .where("document_version_id", result.id)
                .del();

            await trx("document_version")
                .where("id", result.id)
                .del();
        }
    });
}

export async function removeDocument(document_path: string) {
    return await db.transaction(async trx => {
        const document_id = trx
            .select("id")
            .from<DocumentRecord>("document")
            .where("path", document_path)
            .first();

        if (document_id !== undefined) {
        
            await trx("document_primary_version")
                .where("document_id", document_id)
                .del();

            await trx("attachment")
                .where("document_id", document_id)
                .del();

            await trx("document_version")
                .where("document_id", document_id)
                .del();

            await trx("document")
                .where("id", document_id)
                .del();
        }
    });
}

export async function uploadFile(filepath: string | undefined, content: string) {
    const abs_save_folder = path.resolve(process.cwd(), "upload");
    await fsPromises.mkdir(abs_save_folder, {recursive: true});

    if (filepath !== undefined) {
        await validateUploadPath(filepath);
    }

    if (filepath === undefined) {
        filepath = randomUUID() + ".tmp";
        while (await checkAccess(`${abs_save_folder}/${filepath}`)) {
            filepath = randomUUID() + ".tmp";
        }
    }

    await fsPromises.appendFile(`${abs_save_folder}/${filepath}`, new Uint8Array(Buffer.from(content, "base64")));

    return filepath;
}

const checkAccess = (fullpath: string) => {
    return new Promise(resolve => fsPromises.access(fullpath, constants.R_OK).then(() => resolve(true)).catch(() => resolve(false)))
}

const validateUploadPath = async (filepath: string) => {
    const split_path = filepath?.split(".");
    if (split_path[1] !== "tmp") {
        throw new Error("Not a valid tmp file");
    }

    const uuid_regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuid_regex.test(split_path[0])) {
        throw new Error("Not a valid UUID file");
    }

    const fullpath = path.resolve(process.cwd(), "upload", filepath);
    if (!fullpath.startsWith(path.join(process.cwd(), "upload"))) {
        throw new Error("Path escaped root");
    }

    const access = await checkAccess(fullpath);
    if (!access) {
        throw new Error("File does not exist");
    }

    const stat = await fsPromises.stat(fullpath);
    if (!stat.isFile()) {
        throw new Error("File does not exist");
    }

    if (stat.size > 2 * 1024 * 1024 * 1024) {
        throw new Error("File size limit reached");
    }
}

export async function saveAttachment(
    document_path: string,
    version_number: number,
    attachment_id: number | null,
    new_name: string | undefined,
    content_path: string | undefined
) {
    // Create if not exist
    // If existing attachment on this version, just update the attachment - remove old file and replace with new one
    // If existing attachment name on prior version,

    if (content_path !== undefined) {
        await validateUploadPath(content_path);
    }

    return await db.transaction(async trx => {
        const existing_document_result = await trx
            .select("document.id as document_id", "document_version.id as document_version_id")
            .from<{document_id: number, document_version_id: number}>("document")
            .join("document_version", "document.id", "document_version.document_id")
            .where("document.path", document_path)
            .where("document_version.version_number", version_number)
            .first();

        if (existing_document_result === undefined) {
            throw new Error("Invalid document version");
        }

        const existing_attachment_result: Attachment = attachment_id === null ? undefined : await trx
            .select()
            .from<Attachment>("attachment")
            .where("attachment.id", attachment_id)
            .where("attachment.document_id", existing_document_result.document_id)
            .where("attachment.document_version_id", existing_document_result.document_version_id)
            .first();

        if (existing_attachment_result === undefined && new_name === undefined) {
            throw new Error("No name for attachment defined");
        }

        const save_name = new_name === undefined ? existing_attachment_result.name : new_name.toLocaleLowerCase();
        const split_name = save_name.split(".");
        const attachment_type = split_name[split_name.length - 1];

        let save_file: string | null = null;
        if (content_path !== undefined) {
            const rel_save_folder = "/attachments"
            const abs_save_folder = path.resolve(process.cwd(), "web", "attachments");
            const original_file = path.resolve(process.cwd(), "upload", `${content_path}`);

            await fsPromises.mkdir(abs_save_folder, {recursive: true});
            const filename = `${document_path}_${version_number}_${save_name}_${randomUUID()}.${attachment_type}`;
            save_file = `${rel_save_folder}/${filename}`;

            const abs_file = `${abs_save_folder}/${filename}`;
            if (!path.resolve(abs_file).startsWith(path.resolve(abs_save_folder))) {
                throw new Error("Path escape detected");
            }

            const file_exists = await checkAccess(abs_file);
            if (file_exists) {
                throw new Error("File already exists");
            }

            await fsPromises.rename(original_file, `${abs_save_folder}/${filename}`);
        }

        if (existing_attachment_result !== undefined && existing_attachment_result.id !== null) {
            let update_data: {[index: string]: any} = {"edited": new Date()};
            if (new_name !== undefined) {
                update_data = {...update_data, name: new_name}
            }
            if (save_file !== null) {
                update_data = {...update_data, path: save_file, type: attachment_type, content: null}
            }

            await trx("attachment")
                .where("id", existing_attachment_result.id)
                .update(update_data);

            const file_used_count = await trx("attachment")
                .count({count: "path"})
                .where("path", existing_attachment_result.path);

            if ((file_used_count[0].count || 0) <= 0) {
                await fsPromises.rm(existing_attachment_result.path);
            }

        } else {
            await trx("attachment")
                .insert({
                    "name": save_name,
                    "path": save_file,
                    "type": attachment_type,
                    "content": null,
                    "created": new Date(),
                    "edited": new Date(),
                    "document_id": existing_document_result.document_id,
                    "document_version_id": existing_document_result.document_version_id,
                }, ["id"])
        }
    });

    // Creating a new document version: copy attachments from prior version. Don't copy the files, just the attachment rows
    // Also be able add attachments from prior versions
}

export async function copyAttachments(document_path: string, version_number: number, prior_version: number, attachment_ids: number[]) {
    return await db.transaction(async trx => {
        const prior_document_result = await trx
            .select("document.id as document_id", "document_version.id as document_version_id")
            .from<{document_id: number, document_version_id: number}>("document")
            .join("document_version", "document.id", "document_version.document_id")
            .where("document.path", document_path)
            .where("document_version.version_number", prior_version)
            .first();

        const new_document_result = await trx
            .select("document.id as document_id", "document_version.id as document_version_id")
            .from<{document_id: number, document_version_id: number}>("document")
            .join("document_version", "document.id", "document_version.document_id")
            .where("document.path", document_path)
            .where("document_version.version_number", version_number)
            .first();

        const prior_attachment_result = await trx
            .select()
            .from<Attachment>("attachment")
            .whereIn("attachment.id", attachment_ids)
            .where("attachment.document_id", prior_document_result.document_id)
            .where("attachment.document_version_id", prior_document_result.document_version_id);
        
        if (prior_document_result === undefined || new_document_result == undefined || prior_attachment_result === undefined) {
            throw new Error("Invalid document versions");
        }

        const new_attachments = prior_attachment_result.map(result => ({
            name: result.name,
            path: result.path,
            type: result.type,
            content: result.content,
            created: result.created,
            edited: result.edited,
            document_id: new_document_result.document_id,
            document_version_id: new_document_result.document_version_id
        }));

        await trx.batchInsert("attachment", new_attachments);
    });
}

export async function removeAttachment(document_path: string, version_number: number, attachment_id: number) {
    // Scan for attachment path. If no other version holds the attachment, delete it from disk, otherwise just remove the row
    return await db.transaction(async trx => {
        const document_result = await trx
            .select("document.id as document_id", "document_version.id as document_version_id")
            .from<{document_id: number, document_version_id: number}>("document")
            .join("document_version", "document.id", "document_version.document_id")
            .where("document.path", document_path)
            .where("document_version.version_number", version_number)
            .first();

        const existing_attachment = await trx("attachment")
            .select()
            .from<Attachment>("attachment")
            .where("document_id", document_result.document_id)
            .where("document_version_id", document_result.document_version_id)
            .where("id", attachment_id)
            .first();

        if (existing_attachment === undefined) {
            return;
        }

        await trx("attachment")
            .where("id", existing_attachment.id)
            .del();

        const file_used_count = await trx("attachment")
            .count({count: "path"})
            .where("path", existing_attachment.path);

        if ((file_used_count[0].count || 0) <= 0) {
            try {
                await fsPromises.rm(path.join(process.cwd(), "..", "web", existing_attachment.path));
            } catch {
                // Ignore
            }
        }
    });
}

export async function listAttachments(document_path: string, version_number: number) {
    // List attachments available from all versions, only the latest versions of them by name
    return await db.transaction(async trx => {
        const result = await trx
            .select("attachment.*")
            .from<Attachment>("attachment")
            .join("document", "document.id", "attachment.document_id")
            .join("document_version", "document_version.id", "attachment.document_version_id")
            .where("document.path", document_path)
            .where("document_version.version_number", version_number)
            .orderBy("attachment.name", "asc");

        const attachments = result.map(attachment => {
            return {
                name: attachment.name,
                path: attachment.path,
                type: attachment.type,
                content: attachment.content,
                created: attachment.created,
                edited: attachment.edited
            }
        })

        return attachments;
    });
}

const doc_select = (trx: Knex.Transaction<any, any[]>) => {
    return trx
        .select("document.*", "document_primary_version.document_version_id as primary_document_version_id")
        .from<DocumentRecord>("document")
        .leftJoin("document_primary_version", "document_primary_version.document_id", "document.id")
        .leftJoin("document_version", "document_version.id", "document_primary_version.document_version_id")
        .leftJoin("document_category", "document_category.document_id", "document.id")
}