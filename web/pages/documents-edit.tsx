import { Document, DocumentVersion, EMPTY_DOCUMENT_VERSION, Status } from "common/model";
import React from "react";
import {produce} from "immer";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { document_api } from "web/api/document_api";
import { meta_api } from "web/api/meta_api";
import { formatDateTime, formatInputDate } from "web/util";
import { useStatusStore } from "web/api/data_store";


export default function() {
    const params = useParams<{document_path: string}>();
    const navigate = useNavigate();

    const [document, setDocument] = React.useState<Document>({
        id: null,
        name: "",
        path: "",
        created: null,
        edited: null,
        section_id: null,
        versions: [],
        primary_document_version_id: null
    });

    const [document_version, setDocumentVersion] = React.useState<DocumentVersion>({...EMPTY_DOCUMENT_VERSION});

    const status_list = useStatusStore();

    const resolveStatusId = (status_name: string) => {
        const result = [...status_list.values()].find(status => status.name === status_name);
        if (result === undefined) {
            return -1;
        }
        return result.id;
    }

    const resolveStatusName = (status_id: number | null) => {
        if (status_id === null) {
            return "";
        }

        const result = status_list.get(status_id);
        if (result === undefined) {
            return "";
        }
        return result.name;
    }

    React.useEffect(() => {
        if (params.document_path !== undefined) {
            document_api.fetch_document(params.document_path)
                .then(result => {
                    setDocument(result);
                    return document_api.fetch_document_version(params.document_path || "", result.versions.length > 0 ? result.versions[0].version_number : null);
                })
                .then(result => {
                    setDocumentVersion(result)
                });
        }
    }, [params.document_path]);

    React.useEffect(() => {
        if (status_list.size > 0 && (document_version.status_id === null || status_list.get(document_version.status_id) === undefined)) {
            document_version.status_id = status_list.keys().next().value || 0;
        }
    }, [status_list, document_version.status_id]);

    const doSave = async () => {
        // TODO: Warnings/errors
        if (encodeURI(document.path) === document.path) {
            await document_api.save_document(document, document_version)
                .then(result => {
                    setDocument(result.document);
                    if (result.document_version.id !== null) {
                        setDocumentVersion(result.document_version);
                    } else {
                        setDocumentVersion({...EMPTY_DOCUMENT_VERSION});
                    }

                    if (document.id === null) {
                        navigate(`/admin/documents/edit/${document.path}`)
                    }
                });
        }
    }

    const changeVersion = async (version_number: number | null) => {
        await doSave();
        if (version_number === null) {
            setDocumentVersion({...EMPTY_DOCUMENT_VERSION});

        } else {
            const new_version = await document_api.fetch_document_version(document.path || "", version_number);
            setDocumentVersion(new_version);
        }
        
    }

    const setPrimaryVersion = async () => {
        if (document.id !== null && document_version.id !== null && document_version.version_number !== null) {
            const result = await document_api.set_primary_version(document.path, document_version.version_number)
            setDocument(result);
        }
    }

    const removePrimaryVersion = async () => {
        if (document.id !== null) {
            const result = await document_api.remove_primary_version(document.path)
            setDocument(result);
        }
    }

    const removeVersion = async () => {
        if (document.id !== null && document_version.id !== null && document_version.version_number !== null) {
            const result = await document_api.remove_version(document.path, document_version.version_number)
            setDocument(result);
            if (result.versions.length > 0) {
                const version = await document_api.fetch_document_version(document.path || "", result.versions[0].version_number);
                setDocumentVersion(version);

            } else {
                setDocumentVersion({...EMPTY_DOCUMENT_VERSION});
            }
        }
    }

    const removeDocument = async () => {
        if (document.id !== null) {
            await document_api.remove_document(document.path);
            navigate("/admin/documents");
        }
    }

    return <div>
        <div>
            <button onClick={doSave}>Save</button>
        </div>
        <div>
            <label htmlFor="document-edit--name">Name</label>
            <input 
                type="text"
                id="document-edit--name"
                onChange={evt => setDocument(produce((document) =>
                    {document.name = evt.target.value}))}
                value={document.name}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--created">Created</label>
            <input
                type="datetime-local"
                id="document-edit--created"
                value={formatInputDate(document.created)}
                disabled
            >
            </input>
        </div>
        <div>
            <label htmlFor="document-edit--created">Edited</label>
            <input
                type="datetime-local"
                id="document-edit--edited"
                value={formatInputDate(document.edited)}
                disabled
            >
            </input>
        </div>
        <div>
            <label htmlFor="document-edit--path">Path</label>
            <input 
                type="text"
                id="document-edit--path"
                onChange={evt => setDocument(produce((document) =>
                    {document.path = evt.target.value}))}
                value={document.path}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--versions">Version</label>
            <ul id="document-edit--versions">
                <li>
                    <a onClick={() => changeVersion(null)}>
                        [New document version]
                    </a>
                </li>
                {document.versions.map(version => {
                    return <li>
                        <a onClick={() => changeVersion(version.version_number)}>
                            {version.id === document.primary_document_version_id && "Published"} {version.id}: {version.revision} ({formatDateTime(version.edited)})
                        </a>
                    </li>
                })}
            </ul>
        </div>
        <div>
            <label htmlFor="document-edit--status">Status</label>
            <select
                id="document-edit--status"
                onChange={evt => setDocumentVersion(produce((document_version) =>
                    {document_version.status_id = resolveStatusId(evt.target.value)}))}
                value={resolveStatusName(document_version.status_id)}
            >
                {[...status_list.values()].map(status => <option value={status.name}>{status.display_name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="document-edit--revision">Revision</label>
            <input 
                type="text"
                id="document-edit--revision"
                onChange={evt => setDocumentVersion(produce((document_version) =>
                    {document_version.revision = evt.target.value}))}
                value={document_version.revision}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--comments">Comments</label>
            <textarea
                id="document-edit--comments"
                onChange={evt => setDocumentVersion(produce((document_version) =>
                    {document_version.comments = evt.target.value}))}
                value={document_version.comments}
            ></textarea>
        </div>
        <div>
            <label htmlFor="document-edit--content">Content</label>
            <textarea
                id="document-edit--content"
                onChange={evt => setDocumentVersion(produce((document_version) =>
                    {document_version.content = evt.target.value}))}
                value={document_version.content}
            ></textarea>
        </div>
        <div>
            <button onClick={setPrimaryVersion} disabled={document.id === null || document_version.id === null || document.primary_document_version_id === document_version.id}>Publish</button>
            <button onClick={removePrimaryVersion} disabled={document.id === null || document.primary_document_version_id === null}>Remove from Public</button>
            <button onClick={removeVersion} disabled={document_version.id === null}>Remove Version</button>
            <button onClick={removeDocument} disabled={document.id === null}>Remove Document</button>
        </div>
    </div>;
}