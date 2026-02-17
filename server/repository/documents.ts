
import { Document, DocumentRecord, DocumentVersion, DocumentVersionRecord, EMPTY_DOCUMENT_VERSION, Section, Status } from "common/model";
import crypto from "crypto";
import { Knex } from "knex";
import moment from "moment";
import db from "server/db";


export async function listStatus() {
    return await db.transaction(async trx => {
        return await trx.select().from<Status>("status");
    });
}

export async function listSections() {
    return await db.transaction(async trx => {
        return await trx.select().from<Section>("section");
    });
}

export async function listDocuments() {
    return await db.transaction(async trx => {
        const documents = await trx
            .select("document.*", "document_primary_version.document_version_id as primary_document_version_id")
            .from<DocumentRecord>("document")
            .leftJoin("document_primary_version", "document_primary_version.document_id", "document.id")
            .orderBy("edited", "desc");
        
        const versions = await trx
            .select("id", "created", "edited", "revision", "version_number", "document_id", "status_id")
            .rowNumber("version_rank", function() {this.orderBy("version_number", "desc").partitionBy("document_id")})
            .from<DocumentVersionRecord>("document_version")

        const doc_map = new Map<number, Document>(documents.map(document => [document.id, document]));
        for (const doc of doc_map.values()) {
            doc.versions = [];
        }

        for (const version of versions) {
            const doc = doc_map.get(version.document_id);
            if (doc !== undefined) {
                doc.versions = [version];
            }
        }

        return [...doc_map.values()];
    });
}

export async function fetchDocument(document_path: string) {
    return await db.transaction(async trx => {
        const document = await trx
            .select("document.*", "document_primary_version.document_version_id as primary_document_version_id")
            .from<DocumentRecord>("document")
            .leftJoin("document_primary_version", "document_primary_version.document_id", "document.id")
            .where("path", document_path)
            .first();

        const versions = await trx
            .select("id", "created", "edited", "revision", "version_number", "status_id")
            .from("document_version")
            .where("document_id", document.id)
            .orderBy("version_number", "desc") as DocumentVersion[];

        return {...document, versions};
    });
}

export async function fetchDocumentById(document_id: number) {
    return await db.transaction(async trx => {
        const document = await trx
            .select("document.*", "document_primary_version.document_version_id as primary_document_version_id")
            .from<DocumentRecord>("document")
            .leftJoin("document_primary_version", "document_primary_version.document_id", "document.id")
            .where("document.id", document_id)
            .first();

        const versions = await trx
            .select("id", "created", "edited", "revision", "version_number", "status_id")
            .from("document_version")
            .where("document_id", document.id)
            .orderBy("version_number", "desc") as DocumentVersion[];

        return {...document, versions};
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

        return document_version;
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

        return document_version;
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
            await trx("document_version")
                .where("id", result.id)
                .del();

            await trx("document_primary_version")
                .where("document_id", result.document_id)
                .where("document_version_id", result.id)
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
            await trx("document")
                .where("id", document_id)
                .del();

            await trx("document_version")
                .where("document_id", document_id)
                .del();

            await trx("document_primary_version")
                .where("document_id", document_id)
                .del();
        }
    });
}