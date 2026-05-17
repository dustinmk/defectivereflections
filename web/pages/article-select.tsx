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

    const [filter_section, setFilterSection] = React.useState<Section | null>(null);
    const [filter_category, setFilterCategory] = React.useState<Category | null>(null);
    const [filter_status, setFilterStatus] = React.useState<Status | null>(null);
    const [sort_method, setSortMethod] = React.useState<SortMethod | null>(null);

    React.useEffect(() => {
        doc_store.fetchMeta(filter_section ? filter_section.id : null, filter_status ? filter_status.id : null, filter_category ? filter_category.id : null);
        doc_store.fetchDocuments({
            category_id: filter_category ? filter_category.id : null,
            section_id: filter_section ? filter_section.id : null,
            status_id: filter_status ? filter_status.id : null,
            sort_method: sort_method ? sort_method.name : null
        });
    }, [filter_section, filter_category, filter_status, sort_method]);

    const document_groups = new Map<number, Map<number, Document[]>>();

    for (const document of doc_store.documents) {
        const section_id = document.section_id || -1;
        let section_map = document_groups.get(section_id);
        if (section_map === undefined) {
            section_map = new Map<number, Document[]>();
            document_groups.set(section_id, section_map);
        }

        let category_ids = document.categories;
        if (category_ids.length <= 0) {
            category_ids.push(-1);
        }

        for (const category_id of category_ids) {
            let document_list = section_map.get(category_id);
            if (document_list === undefined) {
                document_list = [];
                section_map.set(category_id, document_list);
            }

            document_list.push(document);
        }
    }

    return <div className="horiz-layout">
        <div className="sidebar">
            <Chooser
                item_list={SORT_OPTIONS.map(sort => ({name: sort.display, id: sort.id}))}
                value={sort_method}
                setItem={v => setSortMethod(v === null ? null : SORT_OPTIONS.find(sort => sort.id === v.id) || null)} />
            <Chooser
                item_list={[...doc_store.section_list.values()].map(value => ({name: value.display_name, id: value.id}))}
                value={filter_section}
                setItem={v => setFilterSection(v === null ? null : doc_store.section_list.get(v.id) || null)} />
            <Chooser
                item_list={[...doc_store.category_list.values()]}
                value={filter_category}
                setItem={setFilterCategory} />
            <Chooser
                item_list={[...doc_store.status_list.values()].map(value => ({name: value.display_name, id: value.id}))}
                value={filter_status ? {name: filter_status.name, id: filter_status.id} : null}
                setItem={v => setFilterStatus(v === null ? null : doc_store.status_list.get(v.id) || null)}
            />
            <div className="document-page">
                {[...document_groups.entries()].sort((a, b) => {
                    if (a[0] === -1) {
                        return 1;
                    }

                    if (b[0] === -1) {
                        return -1;
                    }

                    const a_section = doc_store.section_list.get(a[0]);
                    const b_section = doc_store.section_list.get(b[0]);

                    return (a_section ? a_section.display_name : "").localeCompare(b_section ? b_section.display_name : "");
                    
                }).map(section_entry => {
                    return <SectionGroup section_id={section_entry[0]} category_map={section_entry[1]} />
                })}
            </div>
        </div>
        <Outlet />
    </div>
}

function SectionGroup({section_id, category_map}: {section_id: number, category_map: Map<number, Document[]>}) {
    const doc_store = useDocuments();

    const section = doc_store.section_list.get(section_id);

    return <div className="document-list">
        {section ? <h1>{section.display_name}</h1> : <h1 className="secondary">[Other]</h1>}
        {[...category_map.entries()].sort((a, b) => {
            if (a[0] === -1) {
                return 1;
            }

            if (b[0] === -1) {
                return -1;
            }

            const a_category = doc_store.category_list.get(a[0]);
            const b_category = doc_store.category_list.get(b[0]);

            return (a_category ? a_category.name : "").localeCompare(b_category ? b_category.name : "");
            
        }).map(category_entry => {
            const category = doc_store.category_list.get(category_entry[0]);

            return <div className="document-list">
                {category ? <h2>{category.name}</h2> : <h2 className="secondary">[Uncategorized]</h2>}
                <ul>
                    {category_entry[1].map(document => {
                        return <DocumentItem document={document} />
                    })}
                </ul>
            </div>
        })}
    </div>
}

function DocumentItem({document}: {document: Document}) {
    const doc_store = useDocuments();

    const document_version = document.versions.find(version => version.id === document.primary_document_version_id);
    const status = document_version ? doc_store.status_list.get(document_version.status_id) : null;
    const subtitle = document_version ? document_version.subtitle : null;
    const categories = document.categories.map(category => doc_store.category_list.get(category)).filter(category => category)
    const elem = <div className="document-item">
        <span className="document-item__name">{document.name}</span>
        {subtitle && <span className="document-item__subtitle">{subtitle}</span>}
        {categories.length > 0 && <span className="document-item__categories">{categories.length === 1 ? "Category:" : "Categories:"} {categories.map(category => category?.name)}</span>}
        {status && <span className="document-item__status">Status: {status.display_name}</span>}
    </div>
    return <li>
        <Link to={document.path}>
            {elem}
        </Link>
    </li>
}