import { Attachment } from "common/model";
import React from "react";
import RemarkMathPlugin from "remark-math";
import RehypeKatexPlugin from 'rehype-katex'
import RehypeMathJaxPlugin from "rehype-mathjax";
import RehypeHighlightPlugin from "rehype-highlight";
import { useNavigate, useParams } from "react-router-dom";
import { document_api } from "web/api/document_api";
import { formatInputDate } from "web/util";
import { useDocuments } from "web/stores/admin-document-store";
import rehypePrism from "rehype-prism-plus";
import CodeEditor from "@uiw/react-textarea-code-editor";
import Markdown from "react-markdown";
import { confirmModal } from "web/components/modal";
import { MarkdownEditor, transformMarkdown } from "./markdown-view";

export default function() {
    const params = useParams<{document_path: string}>();
    const navigate = useNavigate();
    const doc_store = useDocuments();

    const [new_category, setNewCategory] = React.useState<number | null>(null);

    const {documents, status_list, section_list, document, document_version} = doc_store;

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
        if (init_id === null) {
            navigate(`/admin/documents/edit/${document.path}`);
        }
    }

    return <div className="admin-content content form">
        <div className="button-row">
            <button onClick={save}>Save</button>

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
        <div className="labelled-field">
            <label htmlFor="document-edit--name">Name</label>
            <input 
                type="text"
                id="document-edit--name"
                onChange={evt => doc_store.setDocumentName(evt.target.value)}
                value={document.name}
            ></input>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--created">Created</label>
            <input
                type="datetime-local"
                id="document-edit--created"
                value={formatInputDate(document.created)}
                disabled
            >
            </input>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--created">Edited</label>
            <input
                type="datetime-local"
                id="document-edit--edited"
                value={formatInputDate(document.edited)}
                disabled
            >
            </input>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--path">Path</label>
            <input 
                type="text"
                id="document-edit--path"
                onChange={evt => doc_store.setDocumentPath(evt.target.value)}
                value={document.path}
            ></input>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--status">Section</label>
            <select
                id="document-edit--status"
                onChange={evt => doc_store.setDocumentSection(parseInt(evt.target.value))}
                value={document.section_id || -1}
            >
                {[...section_list.values()].map(section => <option value={section.id}>{section.display_name}</option>)}
            </select>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--category">Category</label>
            <select
                id="document-edit--category"
                onChange={evt => setNewCategory(parseInt(evt.target.value))}
                value={new_category || ""}
            >
                <option value=""></option>
                {[...doc_store.category_list.values()].map(category => <option value={category.id}>{category.name}</option>)}
            </select>
            <button onClick={() => doc_store.addDocumentCategory(new_category)}><i className="fa-solid fa-plus"></i></button>
            <div>
                {document.categories.map(category_id => {
                    const category = doc_store.category_list.get(category_id);
                    if (!category) {
                        return <></>
                    }

                    return <div>
                        <span>{category.name}</span>
                        <button onClick={() => doc_store.removeDocumentCategory(category.id)}><i className="fa-solid fa-trash"></i></button>
                    </div>
                })}
            </div>
        </div>
        
        <div className="labelled-field">
            <label htmlFor="document-edit--status">Status</label>
            <select
                id="document-edit--status"
                onChange={evt => doc_store.setDocumentVersionStatus(parseInt(evt.target.value))}
                value={document_version.status_id || -1}
            >
                {[...status_list.values()].map(status => <option value={status.id}>{status.display_name}</option>)}
            </select>
        </div>
        <div className="labelled-field">
            <label htmlFor="document-edit--revision">Revision</label>
            <input 
                type="text"
                id="document-edit--revision"
                onChange={evt => doc_store.setDocumentVersionRevision(evt.target.value)}
                value={document_version.revision}
            ></input>
        </div>
        <div>
            <label htmlFor="document-edit--subtitle">Subtitle</label>
            <MarkdownEditor
                value={document_version.subtitle}
                onChange={value => doc_store.setDocumentVersionSubtitle(value)}
                transform={value => transformMarkdown(value, document_version.attachments)}
            />
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
            <label htmlFor="document-edit--references">References</label>
            <MarkdownEditor
                value={document_version.references}
                onChange={value => doc_store.setDocumentVersionReferences(value)}
                transform={value => transformMarkdown(value, document_version.attachments)}
            />
        </div>
        <div>
            <ul className="menu-vertical">
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
            doc_store.updateAttachmentContent(props.attachment.id || -1, tmp_path)
        }
    }

    return <span ref={elem_ref}>
        <span style={{display: do_edit ? "inline" : "none"}}>
            {["jpg", "png"].indexOf(props.attachment.type) >= 0 && <img className="thumbnail" src={props.attachment.path}></img>}
            <input
                value={props.attachment.name}
                onChange={evt => doc_store.updateAttachmentName(props.attachment.id || -1, evt.currentTarget.value)}
                onBlur={evt => doc_store.saveAttachmentName(props.attachment.id || -1, evt.currentTarget.value)}
            ></input>
            <button onClick={updateAttachmentContent}>+</button>
        </span>
        <span style={{display: !do_edit ? "inline" : "none"}}>
            {["jpg", "png"].indexOf(props.attachment.type) >= 0 && <img className="thumbnail" src={props.attachment.path}></img>}
            <span onClick={() => setDoEdit(true)}>{props.attachment.name}</span>
            <button onClick={() =>
                confirmModal(`Are you sure you want to remove attachment ${props.attachment.name}?`)
                .then(() => doc_store.removeAttachment(props.attachment.id || -1))
            }>X</button>
        </span>
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
