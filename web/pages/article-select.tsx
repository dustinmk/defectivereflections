import React from "react";
import { document_api } from "web/api/document_api";
import { public_api } from "web/api/public_api";
import { useDocuments } from "web/stores/admin-document-store";
import { Category, Document, Section, SORT_OPTIONS as SORT_OPTIONS, SortMethod, Status } from "common/model";
import { Outlet } from "react-router";
import { Link } from "react-router-dom";
import { meta_api } from "web/api/meta_api";
import { Chooser } from "web/components/chooser";

export default function({section_id}: {section_id: number | null}) {

    const doc_store = useDocuments();

    const [filter_category, setFilterCategory] = React.useState<Category | null>(null);
    const [filter_status, setFilterStatus] = React.useState<Status | null>(null);
    const [sort_method, setSortMethod] = React.useState<SortMethod | null>(null);

    React.useEffect(() => {
        doc_store.fetchMeta(section_id, filter_status ? filter_status.id : null, filter_category ? filter_category.id : null);
        doc_store.fetchDocuments({
            category_id: filter_category ? filter_category.id : null,
            section_id: null,
            status_id: filter_status ? filter_status.id : null,
            sort_method: sort_method ? sort_method.name : null
        });
    }, [section_id, filter_category, filter_status, sort_method]);

    return <div className="horiz-layout">
        <div className="sidebar">
            <Chooser
                item_list={SORT_OPTIONS.map(sort => ({name: sort.display, id: sort.id}))}
                value={sort_method}
                setItem={v => setSortMethod(v === null ? null : SORT_OPTIONS.find(sort => sort.id === v.id) || null)} />
            <Chooser
                item_list={[...doc_store.category_list.values()]}
                value={filter_category}
                setItem={setFilterCategory} />
            <Chooser
                item_list={[...doc_store.status_list.values()].map(value => ({name: value.display_name, id: value.id}))}
                value={filter_status ? {name: filter_status.name, id: filter_status.id} : null}
                setItem={v => setFilterStatus(v === null ? null : doc_store.status_list.get(v.id) || null)}
            />
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