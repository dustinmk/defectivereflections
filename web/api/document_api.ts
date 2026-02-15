import { Document, DocumentVersion, Status } from "common/model"
import { get } from "./api"


export const document_api = {
    fetch_document: async (document_path: string) => {
        return await get(`/api/document/${document_path}`).document as Document
    },
    fetch_document_version: async (document_path: string, version_id: number) => {
        return await get(`/api/document/${document_path}/${version_id}`).document_version as DocumentVersion
    }
}