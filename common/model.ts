
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

export interface Document {
    id: number;
    name: string;
    path: string;
    created: Date;
    section_id: number;
    versions: {
        id: number;
        created: Date;
        edited: Date;
        revision: string;
    }[]
}

export interface DocumentVersion {
    id: number;
    content: string;
    revision: string;
    comments: string;
    created: Date;
    edited: Date;
    document_id: number;
    status_id: number;
}

export interface Attachment {
    id: number;
    name: string;
    path: string;
    type: string;
    content: ArrayBuffer;
    created: Date;
    edited: Date;
    document_id: number;
}