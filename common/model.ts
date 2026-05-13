
export interface Status {
    id: number;
    name: string;
    display_name: string;
}

export interface Section {
    id: number;
    parent_id: number;
    name: string;
    display_name: string;
}

export interface Category {
    id: number;
    parent_id: number | null;
    name: string;
}

export interface DocumentRecord {
    id: number | null;
    name: string;
    path: string;
    enabled: string;
    created: Date | null;
    edited: Date | null;
    section_id: number | null;
}

export interface Document extends DocumentRecord {
    versions: {
        id: number;
        created: Date;
        edited: Date;
        revision: string;
        status_id: number;
        version_number: number;
    }[];
    primary_document_version_id: number | null;
    categories: number[];
}

export interface DocumentVersionRecord {
    id: number | null;
    content: string;
    comments: string;
    references: string;
    revision: string;
    version_number: number | null;
    created: Date | null;
    edited: Date | null;
    document_id: number | null;
    status_id: number | null;
}

export const EMPTY_DOCUMENT_VERSION = {
    id: null,
    version_number: null,
    content: "",
    revision: "",
    comments: "",
    references: "",
    created: null,
    edited: null,
    document_id: null, 
    status_id: 0,
    attachments: []
} as DocumentVersion;

export const EMPTY_DOCUMENT = {
    id: null,
    name: "",
    path: "",
    enabled: "",
    created: null,
    edited: null,
    section_id: null,
    versions: [],
    primary_document_version_id: null,
    categories: []
} as Document;

export interface DocumentVersion extends DocumentVersionRecord {
    attachments: Attachment[];
};

export interface Attachment {
    id: number | null;
    name: string;
    path: string;
    type: string;
    content: ArrayBuffer;
    created: Date | null;
    edited: Date | null;
    document_id: number | null;
    document_version_id: number | null;
}