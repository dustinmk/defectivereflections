import { Attachment, Document, DocumentVersion, Status } from "common/model"
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
    },
    add_attachment: async (document_path: string, version_number: number, name: string, content_path: string) => {
        return (await put(`document/${document_path}/${version_number}/attachment/${name}`, {content_path})).attachments as Attachment[]
    },
    update_attachment_content: async (document_path: string, version_number: number, attachment_id: number, content_path: string) => {
        return (await put(`document/${document_path}/${version_number}/attachment/${attachment_id}`, {content_path})).attachments as Attachment[]
    },
    update_attachment_name: async (document_path: string, version_number: number, attachment_id: number, name: string) => {
        return (await put(`document/${document_path}/${version_number}/attachment/${attachment_id}`, {name})).attachments as Attachment[]
    },
    remove_attachment: async (document_path: string, version_number: number, attachment_id: number) => {
        return (await del(`document/${document_path}/${version_number}/attachment/${attachment_id}`)).attachments as Attachment[]
    },
    upload_file: async (file: File) => {
        const slice_size = 1024 * 1024;

        const content = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                const content = result.split(",");
                resolve(content[1])
            }
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });

        const first_chunk = content.slice(0, slice_size);
        const path = (await post(`upload`, {content: first_chunk})).path as string;

        let start = slice_size;
        let chunk = content.slice(start, slice_size);
        while (chunk.length > 0) {
            await post(`upload/${path}`, {content: chunk});
            start = Math.max(start + slice_size, content.length);
            chunk = content.slice(start, slice_size);
        }

        return path;
    }
}
