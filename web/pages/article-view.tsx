import { Attachment, Document, DocumentVersion, Section, Status } from "common/model";
import React from "react";
import { useParams } from "react-router";
import { public_api, PublicDocument } from "web/api/public_api";
import { MarkdownView, transformMarkdown } from "./markdown-view";

export default function() {
    const params = useParams<{document_path: string}>();

    const [content, setContent] = React.useState<PublicDocument | null>(null);

    React.useEffect(() => {
        if (params.document_path !== undefined) {
            public_api.view_document(params.document_path).then(content => setContent(content));
        }

    }, [params.document_path]);

    if (content === null) {
        return <></>
    }

    const word_count = content.document_version.content.split(" ").reduce((prev, elem) => prev + 1, 0);
    const section = content.sections.find(value => value.id === content.document.section_id)
    const status = content.status.find(value => value.id === content.document_version.status_id);
    const categories = content.document.categories.map(category => content.categories.find(c => c.id === category)).filter(category => category !== undefined);

    return <div className="content-container">
        <div className="content-view" id="content">
            <h1>{content.document.name}</h1>
            
            <div className="content-preamble">
                <div>
                    <p>{content.document_version.subtitle}</p>
                </div>
                <div>
                    <p>Edited: {formatDate(content.document.edited)}</p>
                    <p>Created: {formatDate(content.document.created)}</p>
                </div>
                <div>
                    {section && <p>Section: {section.display_name}</p>}
                    {status && <p>Status: {status.display_name}</p>}
                    {categories.length > 0 && <p>{categories.length === 1 ? "Category:" : "Categories:"} {categories.map(category => category.name).join(", ")}</p>}
                    {content.document_version.revision.length > 0 && <p>Revision: {content.document_version.revision}</p>}
                    <p>Version: {content.document_version.version_number}</p>
                </div>
                {content.document_version.comments.length > 0 && <p>{content.document_version.comments}</p>}
                <div>
                    <p>{word_count} Words</p>
                    <p><i className="fa-solid fa-clock"></i> Slow (200wpm): {Math.ceil(word_count / 200)}m</p>
                    <p><i className="fa-solid fa-clock"></i> Fast (600wpm): {Math.ceil(word_count / 600)}m</p>
                </div>
            </div>
            <MarkdownView
                value={content.document_version.content}
                transform={value => transformMarkdown(value, content.document_version.attachments)}
            />
            {content.document_version.references && <>
                <h1>References</h1>
                <MarkdownView
                    value={content.document_version.references}
                    transform={value => transformMarkdown(value, content.document_version.attachments)}
                />
            </>}
        </div>
    </div>;
}

function formatDate(d: Date | null | string) {
    if (d === null) {
        return "";
    }

    if (typeof d === "string") {
        d = new Date(d);
    }

    return `${d.getFullYear()}-${d.getMonth()}-${d.getDay()}`
}
