import { Document, DocumentVersion, Status } from "common/model";
import React from "react";
import {produce} from "immer";
import { NavLink, useParams } from "react-router-dom";
import { document_api } from "web/api/document_api";
import { meta_api } from "web/api/meta_api";
import { formatInputDate } from "web/util";

export default function() {
    const params = useParams<{document_path: string}>();

    const [document, setDocument] = React.useState<Document>({
        id: -1,
        name: "",
        path: "",
        created: new Date,
        section_id: -1,
        versions: []
    });

    const [document_version, setDocumentVersion] = React.useState<DocumentVersion>({
        id: -1,
        content: "",
        revision: "",
        comments: "",
        created: new Date,
        edited: new Date,
        document_id: -1, 
        status_id: -1
    });

    const [status_list, setStatusList] = React.useState<Status[]>([]);

    React.useEffect(() => {
        meta_api.fetch_status_list().then(result => setStatusList(result))
    }, []);

    const resolveStatusId = (status_name: string) => {
        const result = status_list.find(status => status.name === status_name);
        if (result === undefined) {
            return -1;
        }
        return result.id;
    }

    const resolveStatusName = (status_id: number) => {
        const result = status_list.find(status => status.id === status_id);
        if (result === undefined) {
            return "";
        }
        return result.display_name;
    }

    React.useEffect(() => {
        if (params.document_path !== undefined) {
            document_api.fetch_document(params.document_path)
                .then(result => {
                    setDocument(result);
                    return document_api.fetch_document_version(params.document_path || "", result.versions[0].id);
                })
                .then(result => setDocumentVersion(result));
        }
    }, [params.document_path]);

    const doSave = async () => {

    }

    const changeVersion = async (version_id: number) => {
        await doSave();
        const new_version = await document_api.fetch_document_version(document.path || "", version_id);
        setDocumentVersion(new_version);
    }

    return <div>
        <button onClick={doSave}>Save</button>
        <input 
            type="text"
            onChange={evt => setDocument(produce((document) => document.name = evt.target.value))}
            value={document.name}
        ></input>
        <label>Created</label><input
            type="date"
            value={formatInputDate(document.created)}
            disabled
        >
        </input>
        <input 
            type="text"
            onChange={evt => setDocument(produce((document) => document.path = evt.target.value))}
            value={document.path}
        ></input>
        <ul>
            {document.versions.map(version => {
                return <li>
                    <a onClick={() => changeVersion(version.id)}>{version.id}: {version.revision} ({version.edited.toDateString()})</a>
                </li>
            })}
        </ul>
        <select
            onChange={evt => setDocumentVersion(produce((document_version) => document_version.status_id = resolveStatusId(evt.target.value)))}
            value={resolveStatusName(document_version.status_id)}
        >
            {status_list.map(status => <option value={status.name}></option>)}
        </select>
        <input 
            type="text"
            onChange={evt => setDocumentVersion(produce((document_version) => document_version.revision = evt.target.value))}
            value={document_version.revision}
        ></input>
        <input 
            type="text"
            onChange={evt => setDocumentVersion(produce((document_version) => document_version.comments = evt.target.value))}
            value={document_version.comments}
        ></input>
        <input 
            type="text"
            onChange={evt => setDocumentVersion(produce((document_version) => document_version.content = evt.target.value))}
            value={document_version.content}
        ></input>
    </div>;
}