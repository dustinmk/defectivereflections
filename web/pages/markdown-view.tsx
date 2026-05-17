import React from "react";

import rehypePrism from "rehype-prism-plus";
import CodeEditor from "@uiw/react-textarea-code-editor";
import Markdown from "react-markdown";
import RemarkMathPlugin from "remark-math";
import RehypeKatexPlugin from 'rehype-katex'
import RehypeMathJaxPlugin from "rehype-mathjax";
import RehypeHighlightPlugin from "rehype-highlight";
import RehypeRawPlugin from "rehype-raw"

import { Attachment } from "common/model";

export const MarkdownView = (props: {value: string, transform?: ((value: string) => string)}) => {
    const toc: ToC[] = [];
    const split = transformMarkdown(props.value, []).split("\n");
    generateTOC(split, toc, 0, 1);

    return <div className="markdown-editor">
        <div>
            {toc.toString()}
            <Markdown
                remarkPlugins={[RemarkMathPlugin]}
                rehypePlugins={[RehypeMathJaxPlugin, RehypeHighlightPlugin, RehypeRawPlugin]}
                remarkRehypeOptions={{allowDangerousHtml: true}}
                skipHtml={false}
            >{props.transform === undefined ? props.value : props.transform(props.value)}
            </Markdown>
        </div>
    </div>
}

export const MarkdownEditor = (props: {value: string, onChange: (value: string) => void, transform?: ((value: string) => string)}) => {
    const [show, setShow] = React.useState(false);

    if (show) {
        return <div className="markdown-editor">
            <button onClick={() => setShow(false)}>Hide</button>
            <div>
                <Markdown
                    remarkPlugins={[RemarkMathPlugin]}
                    rehypePlugins={[RehypeMathJaxPlugin, RehypeHighlightPlugin]}
                >{props.transform === undefined ? props.value : props.transform(props.value)}
                </Markdown>
            </div>
        </div>
    }

    return <div className="markdown-editor">
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
                fontSize: "1.0rem",
                backgroundColor: "#f5f5f5",
                fontFamily:
                    "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
            }}
        />
    </div>
}

export const transformMarkdown = (source: string, attachments: Attachment[]) => {
    source = source.replace(/\!\[(.*)\]\((.+)\)/g, (match, p1, p2) => {
        const matched_attachment = attachments.find(attachment => attachment.name === p2);
        const url = matched_attachment === undefined
            ? p2
            : matched_attachment.path;
        return `![${p1}](${url})`;
    }).replace(/(\[TODO(.*?)\])/g, (match, p1) => {
        return `<span class="markdown--todo">${p1}</span>`;
    }).replace("\r", "");

    source = source.replace(/(\([^)]+?\s[0-9]{4}\))/g, (match, p1) => {
        return `<span class="markdown--citation">${p1}</span>`;
    });

    source = source.replace(/(\([0-9]{4}\))/g, (match, p1) => {
        return `<span class="markdown--citation">${p1}</span>`;
    });

    source = source.replace(/^(#+[^#]+)#+$/gm, (match, p1) => {
        return p1;
    })

    const lines = source.split("\n");
    processHeadingLevel(lines, "", 0, 1);
    const toc: ToC[] = [];
    generateTOC(lines, toc, 0, 1);

    if (toc.length > 2) {
        const toc_elem = renderToC(toc);
        return '<p class="markdown__toc__title">Table of Contents</p>' + toc_elem + lines.join("\n");
    }

    return lines.join("\n");
}

function renderToC(toc: ToC[]): string {
    return '<ul class="markdown__toc">' + toc.map(level =>
        '<li class="markdown__toc__level">'
        + `<a href="#${level.id}">${level.name}</a>`
        + (level.children.length > 0 ? renderToC(level.children) : '')
        + '</li>').join("")
    + '</ul>\n';
}

function processHeadingLevel(content: string[], section_number: string, start: number, level: number) {
    let line_index = start;
    let subsection_number = 1;

    let header_start = "";
    for (let i = 0; i < level; ++i) {
        header_start += "#";
    }

    while (line_index < content.length) {
        if (content[line_index].startsWith(header_start) && content[line_index][header_start.length] !== "#")  {
            content[line_index] = header_start + " " + section_number + subsection_number + ". " + content[line_index].slice(header_start.length);
            subsection_number += 1;
            line_index++;
        }
        else if (content[line_index].startsWith(header_start) && content[line_index][header_start.length] === "#") {
            line_index = processHeadingLevel(content, section_number + subsection_number + ".", line_index, level + 1);

        } else if (content[line_index][0] === "#") {
            return line_index;
        
        } else {
            line_index++;
        }
    }

    return line_index;
}

interface ToC {
    name: string;
    id: string;
    children: ToC[];
}

function generateTOC(content: string[], toc: ToC[], start: number, level: number) {
    let line_index = start;

    let header_start = "";
    for (let i = 0; i < level; ++i) {
        header_start += "#";
    }

    let current_children: ToC[] = [];

    while (line_index < content.length) {
        if (content[line_index].startsWith(header_start) && content[line_index][header_start.length] !== "#")  {
            const header = content[line_index].slice(header_start.length);
            const id = `markdown__toc-${makePath(header)}`
            const new_toc: ToC = {
                name: header,
                id: id,
                children: []
            };
            toc.push(new_toc);
            current_children = new_toc.children;
            content[line_index] = `<h${Math.min(level, 5)} id=${id}>` + header + `</h${Math.min(level, 5)}>`;
            line_index++;
        }
        else if (content[line_index].startsWith(header_start) && content[line_index][header_start.length] === "#") {
            line_index = generateTOC(content, current_children, line_index, level + 1);

        } else if (content[line_index][0] === "#") {
            return line_index;
        
        } else {
            line_index++;
        }
    }

    return line_index;
}

function makePath(s: string) {
    return s.trim().replace(/([^a-zA-Z0-9_-]+)/g, "-");
}