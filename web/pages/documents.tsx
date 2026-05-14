import { Category, Section } from "common/model";
import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDocuments } from "web/store";
import { formatDateTime } from "web/util";

export default function() {
    const navigate = useNavigate();
    const doc_store = useDocuments();
    const [category, setCategory] = React.useState<Category | null>(null);
    const [section, setSection] = React.useState<Section | null>(null);
    
    React.useEffect(() => {
        doc_store.fetchDocuments({
            category: category ? category.id : null,
            section: section ? section.id : null,
        });
    }, [category, section]);

    const {documents, document, status_list} = doc_store;

    return <div className="admin-section">
        <div className="admin-sidebar">
            <div>
                <CategoryChooser value={category} setCategory={setCategory} />
                <SectionChooser value={section} setSection={setSection} />
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

const CategoryChooser = ({value, setCategory}: {value: Category | null, setCategory: (value: Category | null) => void}) => {
    const doc_store = useDocuments();
    React.useEffect(() => {
        doc_store.fetchMeta();
    }, []);

    return <div
    >
        <button onClick={() => setCategory(null)}>All</button>
        {[...doc_store.category_list.values()].map(category => {
            return <button onClick={() => setCategory(category)}>{category.name}</button>
        })}
    </div>
}

const SectionChooser = ({value, setSection}: {value: Category | null, setSection: (value: Section | null) => void}) => {
    const doc_store = useDocuments();
    React.useEffect(() => {
        doc_store.fetchMeta();
    }, []);

    return <div>
        <button onClick={() => setSection(null)}>All</button>
        {[...doc_store.section_list.values()].map(section => {
            return <button onClick={() => setSection(section)}>{section.display_name}</button>
        })}
    </div>
}