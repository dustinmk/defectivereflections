import { Attachment, Document, DocumentVersion, Section, Status } from "common/model"
import { del, get, post, put } from "./api"

export interface PublicDocument {
    sections: Section[];
    status: Status[];
    document: Document;
    document_version: DocumentVersion;
    attachments: Attachment[];
}

export const public_api = {
    view_documents: async () => {
        const result = await get(`public/document`)
        return result.documents as Document[]
    },
    view_document: async(path: string) => {
        const result = await get(`public/document/${path}`);
        return result as PublicDocument;
    }
}