import React from "react";
import { document_api } from "web/api/document_api";
import { public_api } from "web/api/public_api";
import { useDocuments } from "web/store";
import { Document } from "common/model";
import { Outlet } from "react-router";
import { Link } from "react-router-dom";

export default function(props: {status_filter_options: string[], section_filter_options: string[]}) {
    const doc_store = useDocuments();

    const [documents, setDocuments] = React.useState<Document[]>([])
            
    React.useEffect(() => {
        public_api.view_documents().then(documents => {
            setDocuments(documents);
        });
    }, []);

    const sort_options = [
        {name: "created", display: "Created"},
        {name: "edited", display: "Edited"},
        {name: "name", display: "Title"}
    ];

    return <div className="horiz-layout">
        <div className="sidebar">
            <ul className="button-row">
                {sort_options.map(option => {
                    return <li>{option.display}</li>
                })}
            </ul>
            <ul className="button-row">
                {props.status_filter_options.map(option => {
                    return <li></li>
                })}
            </ul>
            <ul className="button-row">
                {props.section_filter_options.map(option => {
                    return <li></li>
                })}
            </ul>
            <ul className="menu">
                {doc_store.documents.filter(document => true).map(document => {
                    return <li>
                        <Link to={document.path}>{document.name}</Link>
                    </li>
                })}
            </ul>
        </div>
        <Outlet />
    </div>
}