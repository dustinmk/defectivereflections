import React, { useContext } from "react";
import { createContext } from "react"
import { Document, EMPTY_DOCUMENT, EMPTY_DOCUMENT_VERSION, Section, Status } from "common/model"
import {create} from "zustand";
import {combine} from "zustand/middleware";
import { document_api } from "./api/document_api";
import { produce } from "immer";
import { meta_api } from "./api/meta_api";
import { removeAttachment } from "server/repository/documents";

const init_state = {
    documents: [] as Document[],
    status_list: new Map<number, Status>(),
    section_list: new Map<number, Section>(),
    document: EMPTY_DOCUMENT,
    document_version: EMPTY_DOCUMENT_VERSION
};

export const useDocuments = create(combine(init_state, (set, get) => ({
    setDocumentName: (name: string) => set(produce(state => {state.document.name = name})),
    setDocumentPath: (path: string) => set(produce(state => {state.document.path = path})),
    setDocumentSection: (section_id: number) => set(produce(state => {state.document.section_id = isNaN(section_id) ? 0 : section_id})),
    setDocumentVersionStatus: (status_id: number) => set(produce(state => {state.document_version.status_id = isNaN(status_id) ? 0 : status_id})),
    setDocumentVersionRevision: (revision: string) => set(produce(state => {state.document_version.revision = revision})),
    setDocumentVersionComments: (comments: string) => set(produce(state => {state.document_version.comments = comments})),
    setDocumentVersionContent: (content: string) => set(produce(state => {state.document_version.content = content})),
    fetchMeta: async () => {
        const status_result = await meta_api.fetch_status_list()
        set({status_list: new Map<number, Status>(status_result.map(status => [status.id, status]))});

        const section_result = await meta_api.fetch_section_list()
        set({section_list: new Map<number, Section>(section_result.map(section => [section.id, section]))});
    },
    fetchDocuments: async () => {
        const result = await document_api.list_documents()
        set({ documents: result })
    },
    fetch: async (path: string | undefined) => {
        if (path === undefined) {
            set({document: EMPTY_DOCUMENT, document_version: EMPTY_DOCUMENT_VERSION});
            return;
        }

        const document_result = await document_api.fetch_document(path)
        set({document: document_result});
        const version_result = await document_api.fetch_document_version(path || "", document_result.versions.length > 0 ? document_result.versions[0].version_number : null);
        set({document_version: version_result})
    },
    save: async () => {
        const {document, document_version} = get();

        if (encodeURI(document.path) === document.path) {
            const result = await document_api.save_document(document, document_version)
            set({document: result.document});
            if (result.document_version.id !== null) {
                set({document_version: result.document_version});
            } else {
                set({document_version: {...EMPTY_DOCUMENT_VERSION}});
            }
        }
    },
    persistCurrentState: async () => {
        const {document, document_version} = get();
        await document_api.save_document(document, document_version);
    },
    setVersion: async (version_number: number | null) => {
        if (version_number === null) {
            set({document_version: {...EMPTY_DOCUMENT_VERSION}});

        } else {
            const new_version = await document_api.fetch_document_version(get().document.path || "", version_number);
            set({document_version: new_version});
        }
    },
    setPrimaryVersion: async () => {
        const {document, document_version} = get();

        if (document.id !== null && document_version.id !== null && document_version.version_number !== null) {
            const result = await document_api.set_primary_version(document.path, document_version.version_number)
            set({document: result});
        }
    },
    removePrimaryVersion: async () => {
        const {document} = get();

        if (document.id !== null) {
            const result = await document_api.remove_primary_version(document.path)
            set({document: result});
        }
    },
    removeVersion: async () => {
        const {document, document_version} = get();

        if (document.id !== null && document_version.id !== null && document_version.version_number !== null) {
            const result = await document_api.remove_version(document.path, document_version.version_number)
            set({document: result});
            if (result.versions.length > 0) {
                const version = await document_api.fetch_document_version(document.path || "", result.versions[0].version_number);
                set({document_version: version});

            } else {
                set({document_version: EMPTY_DOCUMENT_VERSION});
            }
        }
    },
    removeDocument: async () => {
        const {document} = get();

        if (document.id !== null) {
            await document_api.remove_document(document.path);
            const result = await document_api.list_documents();
            set({documents: result});
        }
    },
    addAttachment: async (name: string, tmp_file_path: string) => {
        const {document, document_version} = get();

        if (document.path !== null && document_version.version_number !== null) {
            const result = await document_api.add_attachment(document.path, document_version.version_number, name, tmp_file_path)
            set(produce(state => {
                state.document_version.attachments = result
            }));
        }
    },
    updateAttachmentContent: async (attachment_id: number, tmp_file_path: string) => {
        const {document, document_version} = get();

        if (document.path !== null && document_version.version_number !== null) {
            const result = await document_api.update_attachment_content(document.path, document_version.version_number, attachment_id, tmp_file_path);
            set(produce(state => {
                state.document_version.attachments = result
            }));
        }
    },
    saveAttachmentName: async (attachment_id: number, name: string) => {
        const {document, document_version} = get();

        if (document.path !== null && document_version.version_number !== null) {
            const result = await document_api.update_attachment_name(document.path, document_version.version_number, attachment_id, name)
            set(produce(state => {
                state.document_version.attachments = result
            }));
        }
    },
    updateAttachmentName: async (attachment_id: number, name: string) => {
        set(produce((state: typeof init_state) => {
            const attachment = state.document_version.attachments.find(attachment => attachment.id === attachment_id);
            if (attachment !== undefined) {
                attachment.name = name;
            }
        }));
    },
    removeAttachment: async (attachment_id: number) => {
        const {document, document_version} = get();

        if (document.path !== null && document_version.version_number !== null) {
            const result = await document_api.remove_attachment(document.path, document_version.version_number, attachment_id)
            set(produce(state => {
                state.document_version.attachments = result;
            }));
        }
    }
})));
