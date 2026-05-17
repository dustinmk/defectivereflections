import React from "react";
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
    subtitle: string;
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
    subtitle: "",
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

export interface SortMethod {
    name: string;
    display: string | React.ReactElement;
    id: number;
}

export const SORT_OPTIONS: SortMethod[] = [
    {name: "created-asc", display: (<span>Created&nbsp;<i className="fa-solid fa-arrow-up"></i></span>), id: 1},
    {name: "created-desc", display: (<span>Created&nbsp;<i className="fa-solid fa-arrow-down"></i></span>), id: 2},
    {name: "edited-asc", display: (<span>Edited&nbsp;<i className="fa-solid fa-arrow-up"></i></span>), id: 3},
    {name: "edited-desc", display: (<span>Edited&nbsp;<i className="fa-solid fa-arrow-down"></i></span>), id: 4},
    {name: "name-asc", display: (<span>Title&nbsp;<i className="fa-solid fa-arrow-up"></i></span>), id: 5},
    {name: "name-desc", display: (<span>Title&nbsp;<i className="fa-solid fa-arrow-down"></i></span>), id: 6}
];
