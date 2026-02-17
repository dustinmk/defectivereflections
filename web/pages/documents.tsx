import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Document } from "common/model"
import { document_api } from "web/api/document_api";
import { useStatusStore } from "web/api/data_store";
import { useDocuments } from "web/store";

export default function() {
    const navigate = useNavigate();
    const status = useStatusStore();
    const document_store = useDocuments();
    const documents = document_store.documents;
    
    React.useEffect(() => {
        document_store.fetch();
    }, []);

    return <div>
        <p>Documents</p>
        <NavLink to="/admin/documents/edit">Add New</NavLink>
        <ul>
            {documents.map(document => {
                return <li onClick={() => navigate(`/admin/documents/edit/${document.path}`)}>
                    {document.name} {document.versions.length > 0 && status.get(document.versions[0].status_id)?.display_name}
                </li>
            })}
        </ul>
        <Outlet />
    </div>;
}