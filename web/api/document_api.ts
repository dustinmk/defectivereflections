import { Document, DocumentVersion, Status } from "common/model"
import { del, get, post, put } from "./api"


export const document_api = {
    list_documents: async () => {
        const result = await get(`document`)
        return result.documents as Document[]
    },
    fetch_document: async (document_path: string) => {
        const result = await get(`document/${document_path}`);
        return result.document as Document;
    },
    fetch_document_version: async (document_path: string, version_number: number | null) => {
        const version = await get(`document/${document_path}/${version_number}`);
        return version.document_version as DocumentVersion
    },
    save_document: async (document: Document, document_version: DocumentVersion) => {
        return await put(`document/${document.path}/${document_version.version_number}`, {document, document_version}) as {document: Document, document_version: DocumentVersion}
    },
    set_primary_version: async (document_path: string, version_number: number) => {
        return (await post(`document/${document_path}/primary/${version_number}`, {})).document as Document
    },
    remove_primary_version: async (document_path: string) => {
        return (await del(`document/${document_path}/primary`, {})).document as Document
    },
    remove_version: async (document_path: string, version_number: number) => {
        return (await del(`document/${document_path}/${version_number}`, {})).document as Document
    },
    remove_document: async (document_path: string) => {
        await del(`document/${document_path}`);
    }
}