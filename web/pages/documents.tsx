import { Category, Section, SORT_OPTIONS, SortMethod, Status } from "common/model";
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Chooser } from "web/components/chooser";
import { useDocuments } from "web/stores/admin-document-store";
import { formatDateTime } from "web/util";

export default function() {
    const navigate = useNavigate();
    const doc_store = useDocuments();
    const [category, setCategory] = React.useState<Category | null>(null);
    const [section, setSection] = React.useState<Section | null>(null);
    const [status, setStatus] = React.useState<Status | null>(null);
    const [sort_method, setSortMethod] = React.useState<SortMethod | null>(null);
    
    React.useEffect(() => {
        doc_store.fetchMeta();
        doc_store.fetchDocuments({
            category_id: category ? category.id : null,
            section_id: section ? section.id : null,
            status_id: status ? status.id : null,
            sort_method: sort_method ? sort_method.name : null
        });
    }, [category, section, status, sort_method]);

    const {documents, document, status_list, section_list, category_list} = doc_store;

    return <div className="admin-section">
        <div className="admin-sidebar">
            <div>
                <Chooser
                    item_list={SORT_OPTIONS.map(sort => ({name: sort.display, id: sort.id}))}
                    value={sort_method}
                    setItem={v => setSortMethod(v === null ? null : SORT_OPTIONS.find(sort => sort.id === v.id) || null)}
                />
                <Chooser<Category>
                    item_list={[...category_list.values()]}
                    value={category}
                    setItem={setCategory}
                />
                <Chooser
                    item_list={[...section_list.values()].map(value => ({name: value.display_name, id: value.id}))}
                    value={section ? {name: section.name, id: section.id} : null}
                    setItem={v => setSection(v === null ? null : section_list.get(v.id) || null)}
                />
                <Chooser
                    item_list={[...doc_store.status_list.values()].map(value => ({name: value.display_name, id: value.id}))}
                    value={status ? {name: status.name, id: status.id} : null}
                    setItem={v => setStatus(v === null ? null : doc_store.status_list.get(v.id) || null)}
                />
                <label>Documents</label>
                <ul className="menu-vertical">
                    <li>
                        <NavLink to="/admin/documents/edit">[New document]</NavLink>
                    </li>
                    {documents.map(document => {
                        return <li onClick={() => navigate(`/admin/documents/edit/${document.path}`)}>
                            {document.name} {document.versions.length > 0 && status_list.get(document.versions[0].status_id)?.display_name}
                        </li>
                    })}
                </ul>
            </div>
            <div>
                <label htmlFor="document-edit--versions">Version</label>
                <ul id="document-edit--versions" className="menu-vertical">
                    <li>
                        <a onClick={() => doc_store.setVersion(null)}>
                            [New version]
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
        </div>
        <Outlet />
    </div>;
}
