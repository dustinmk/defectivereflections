import { Document, DocumentVersion, Attachment, EMPTY_DOCUMENT_VERSION, Status, EMPTY_DOCUMENT } from "common/model";
import React from "react";
import {produce} from "immer";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { document_api } from "web/api/document_api";
import { meta_api } from "web/api/meta_api";
import { formatDateTime, formatInputDate } from "web/util";
import { useStatusStore } from "web/api/data_store";
import { useDocuments } from "web/store";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import rehypePrism from "rehype-prism-plus";
import CodeEditor from "@uiw/react-textarea-code-editor";
import Markdown from "react-markdown";
import { confirmModal } from "web/components/modal";

export default function() {
    const params = useParams<{document_path: string}>();
    const navigate = useNavigate();
    const doc_store = useDocuments();

    const {documents, status_list, document, document_version} = doc_store;

    // React.useEffect(() => {
    //     setInterval(async () => {
    //         await current_document().persistCurrentState();
    //     }, 5000);
    // }, [current_document().document, current_document().document_version])

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
        if (documents.length === 0) {
            doc_store.fetchDocuments()
        }
    }, [documents.length]);

    React.useEffect(() => {
        if (status_list.size === 0) {
            doc_store.fetchMeta()
        }
    }, [status_list.size]);

    React.useEffect(() => {
        doc_store.fetch(params.document_path);
    }, [params.document_path, document.id]);

    React.useEffect(() => {
        if (status_list.size > 0 && (document_version.status_id === null || status_list.get(document_version.status_id || -1) === undefined)) {
            doc_store.setDocumentVersionStatus(status_list.keys().next().value || 0);
        }
    }, [status_list, document_version.status_id]);

    const removeDocument = async () => {
        await doc_store.removeDocument();
        navigate("/admin/documents");
    }

    const save = async () => {
        const init_id = document.id;
        await doc_store.save();
        await doc_store.fetchDocuments();
        if (init_id === null) {
            navigate(`/admin/documents/edit/${document.path}`);
        }
    }

    return <div>
        <div>
            <button onClick={save}>Save</button>
        </div>
        <div>
            <label htmlFor="document-edit--name">Name</label>
            <input 
                type="text"
                id="document-edit--name"
                onChange={evt => doc_store.setDocumentName(evt.target.value)}
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
                onChange={evt => doc_store.setDocumentPath(evt.target.value)}
                value={document.path}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--versions">Version</label>
            <ul id="document-edit--versions">
                <li>
                    <a onClick={() => doc_store.setVersion(null)}>
                        [New document version]
                    </a>
                </li>
                {document.versions.map(version => {
                    return <li>
                        <a onClick={() => doc_store.setVersion(version.version_number)}>
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
                onChange={evt => doc_store.setDocumentVersionStatus(parseInt(evt.target.value))}
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
                onChange={evt => doc_store.setDocumentVersionRevision(evt.target.value)}
                value={document_version.revision}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--comments">Comments</label>
            <MarkdownEditor
                value={document_version.comments}
                onChange={value => doc_store.setDocumentVersionComments(value)}
                transform={value => transformMarkdown(value, document_version.attachments)}
            />
        </div>
        <div>
            <label htmlFor="document-edit--content">Content</label>
            <MarkdownEditor
                value={document_version.content}
                onChange={value => doc_store.setDocumentVersionContent(value)}
                transform={value => transformMarkdown(value, document_version.attachments)}
            />
        </div>
        <div>
            <button
                onClick={() =>
                    confirmModal(`Are you sure you want to publish version ${document_version.version_number}: ${document_version.revision}?`)
                    .then(() => doc_store.setPrimaryVersion())
                }
                disabled={document.id === null || document_version.id === null || document.primary_document_version_id === document_version.id}
            >Publish</button>

            <button
                onClick={() =>
                    confirmModal(`Are you sure you want to revoke ${document_version.version_number}: ${document_version.revision}?`)
                    .then(() => doc_store.removePrimaryVersion())
                }
                disabled={document.id === null || document.primary_document_version_id === null}
            >Revoke</button>

            <button
                onClick={() =>
                    confirmModal(`Are you sure you want to remove version ${document_version.version_number}: ${document_version.revision}?`)
                    .then(() => doc_store.removeVersion())
                }
                disabled={document_version.id === null}
            >Remove Version</button>

            <button
                onClick={() =>
                    confirmModal(`Are you sure you want to remove document ${document.name}?`)
                    .then(() => removeDocument())
                }
                disabled={document.id === null}
            >Remove Document</button>

        </div>
        <div>
            <ul>
                <li><UploadAttachment /></li>
                {document_version.attachments.map(attachment => {
                    return <li>
                        <AttachmentItem attachment={attachment} />
                    </li>
                })}
            </ul>
        </div>
    </div>;
}

const MarkdownEditor = (props: {value: string, onChange: (value: string) => void, transform?: ((value: string) => string)}) => {
    const [show, setShow] = React.useState(false);

    if (show) {
        return <div>
            <button onClick={() => setShow(false)}>Hide</button>
            <Markdown>{props.transform === undefined ? props.value : props.transform(props.value)}</Markdown>
        </div>
    }

    return <div style={{maxWidth: "600px", height: "300px", overflow: "auto"}}>
        <button onClick={() => setShow(true)}>Show</button>
        <CodeEditor
            id="document-edit--content"
            value={props.value}
            language="markdown"
            placeholder="No content entered..."
            onChange={evt => props.onChange(evt.target.value)}
            padding={15}
            rehypePlugins={[
                [rehypePrism, { ignoreMissing: true, showLineNumbers: true }]
            ]}
            style={{
            fontSize: 12,
            backgroundColor: "#f5f5f5",
            fontFamily:
                "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
            }}
        />
    </div>
}

const UploadAttachment = () => {
    const doc_store = useDocuments();
    const [name, setName] = React.useState("");
    const [file, setFile] = React.useState<File | null>(null);

    const updateAttachment = async () => {
        const file = await uploadFile()
        setFile(file);
        if (name.length === 0 && file !== null) {
            setName(file.name);
        }
    }

    const submit = async () => {
        if (name.length > 0 && file !== null) {
            const tmp_path = await document_api.upload_file(file);
            doc_store.addAttachment(name, tmp_path);
            setName("");
            setFile(null);
        }
    }

    return <>
        <input value={name} onChange={evt => setName(evt.target.value)}></input>
        <button onClick={updateAttachment}>+</button>
        <button onClick={submit} disabled={name.length === 0 || file === null}>Submit</button>
    </>
}

const AttachmentItem = (props: {attachment: Attachment}) => {
    const doc_store = useDocuments();
    const [do_edit, setDoEdit] = React.useState(false);
    const elem_ref = React.useRef<HTMLSpanElement>(null);

    React.useEffect(() => {
        const listener = (evt: MouseEvent) => {
            if (
                evt.currentTarget !== null
                && elem_ref.current !== null
                && "contains" in evt.currentTarget
                && (evt.currentTarget as HTMLElement).contains(elem_ref.current)
                && !elem_ref.current.contains((evt.target as HTMLElement))
                && elem_ref.current !== evt.target
                && do_edit
            ) {
                setDoEdit(false)
            }
        };

        document.body.addEventListener("click", listener);

        return () => {
            document.body.removeEventListener("click", listener);
        }

    }, [do_edit]);

    if (props.attachment.id === null) {
        return <></>
    }

    const updateAttachmentContent = async () => {
        const file = await uploadFile();
        if (file !== null) {
            const tmp_path = await document_api.upload_file(file);
            doc_store.updateAttachmentContent(props.attachment.name, tmp_path)
        }
    }

        return <span ref={elem_ref}>
            <span style={{display: do_edit ? "inline" : "none"}}>
                <input
                    value={props.attachment.name}
                    onChange={evt => doc_store.updateAttachmentName(props.attachment.name, evt.currentTarget.value)}
                ></input>
                <button onClick={updateAttachmentContent}>+</button>
            </span>
            <span style={{display: !do_edit ? "inline" : "none"}}>
                {["jpg", "png"].indexOf(props.attachment.type) >= 0 && <img src={props.attachment.path}></img>}
                <span onClick={() => setDoEdit(true)}>{props.attachment.name}</span>
                <button onClick={() =>
                    confirmModal(`Are you sure you want to remove attachment ${props.attachment.name}?`)
                    .then(() => doc_store.removeAttachment(props.attachment.name))
                }>X</button>
            </span>
        </span>
    }

    return <span>
        
    </span>
}

const uploadFile = () => {
    const upload_elem = document.createElement("input");
    const type_attribute = document.createAttribute("type");
    type_attribute.value = "file";
    upload_elem.attributes.setNamedItem(type_attribute);
    const promise = new Promise<File | null>((resolve, reject) => {
        upload_elem.addEventListener("change", _evt => {
            const evt = _evt as unknown as React.ChangeEvent<HTMLInputElement>;
            if (evt.target.files !== null && evt.target.files.length > 0) {
                const file = evt.target.files.item(0);
                resolve(file)
            }
        });
    });
    
    upload_elem.click();
    return promise;
}

const transformMarkdown = (source: string, attachments: Attachment[]) => {
    return source.replace(/\!\[(.*)\]\((.+)\)/, (match, p1, p2) => {
        const matched_attachment = attachments.find(attachment => attachment.name === p2);
        const url = matched_attachment === undefined
            ? p2
            : matched_attachment.path;
        return `![${p1}](${url})`;
    })
}