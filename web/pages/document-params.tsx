import { Category, Status } from "common/model";
import React, { Ref } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDocuments } from "web/stores/admin-document-store";
import { formatDateTime } from "web/util";

export function DocumentParamsPage() {
     return <div className="admin-section">
        <div className="admin-sidebar">
            <ul className="menu-vertical">
                <li>
                    <NavLink to="/admin/params/status">Status</NavLink>
                </li>
                <li>
                    <NavLink to="/admin/params/sections">Sections</NavLink>
                </li>
                <li>
                    <NavLink to="/admin/params/categories">Categories</NavLink>
                </li>
            </ul>
        </div>
        <Outlet />
    </div>;
}

export function StatusPage() {
    const doc_store = useDocuments();

    React.useEffect(() => {
        doc_store.fetchMeta();
    }, [])

    return <div className="admin-content content form">
        <ul className="param-rows">
            <li><AddStatusElement /></li>
            {[...doc_store.status_list.values()].map(status => {
                return <li>
                    <StatusElement status={status} />
                </li>
            })}
        </ul>
    </div>
}

function AddStatusElement() {
    const doc_store = useDocuments();
    const [name, setName] = React.useState("");
    const [display_name, setDisplayName] = React.useState("");

    return <div>
        <input type="text" value={name} onChange={evt => setName(evt.target.value)}></input>
        <input type="text" value={display_name} onChange={evt => setDisplayName(evt.target.value)}></input>
        <button><i className="fa-solid fa-plus" onClick={() => doc_store.addStatus(name, display_name)}></i></button>
    </div>
}

function StatusElement({status}: {status: Status}) {
    const doc_store = useDocuments();
    const [name, setName] = React.useState(status.name);
    const [display_name, setDisplayName] = React.useState(status.display_name);

    const [edit, ref] = useFocus<HTMLDivElement>(() => doc_store.updateStatus(status.id, name, display_name), [name, display_name]);

    return <div ref={ref} >
        <input type="text" value={name} disabled={!edit} onChange={evt => setName(evt.target.value)}></input>
        <input type="text" value={display_name} disabled={!edit} onChange={evt => setDisplayName(evt.target.value)}></input>
        <button onClick={() => doc_store.deleteStatus(status.id)}><i className="fa-solid fa-trash"></i></button>
        <button><i className="fa-solid fa-pencil"></i></button>
    </div>
}

export function CategoryPage() {
    const doc_store = useDocuments();

    React.useEffect(() => {
        doc_store.fetchMeta();
    }, [])

    return <div className="admin-content content form">
        <ul className="param-rows">
            <li key="add-category"><AddCategoryElement /></li>
            {[...doc_store.category_list.values()].map(category => {
                return <li key={category.name}>
                    <CategoryElement category={category} />
                </li>
            })}
        </ul>
    </div>
}

function AddCategoryElement() {
    const doc_store = useDocuments();
    const [name, setName] = React.useState("");

    return <div>
        <input type="text" value={name} onChange={evt => setName(evt.target.value)}></input>
        <button><i className="fa-solid fa-plus" onClick={() => doc_store.addCategory(name, null)}></i></button>
    </div>
}

function CategoryElement({category}: {category: Category}) {
    const doc_store = useDocuments();
    const [name, setName] = React.useState(category.name);

    const [edit, ref] = useFocus<HTMLDivElement>(() => doc_store.updateCategory(category.id, name, null), [name]);

    return <div ref={ref} >
        <input type="text" value={name} disabled={!edit} onChange={evt => setName(evt.target.value)}></input>
        <button onClick={() => doc_store.deleteCategory(category.id)}><i className="fa-solid fa-trash"></i></button>
        <button><i className="fa-solid fa-pencil"></i></button>
    </div>
}

function useFocus<T extends HTMLElement>(onBlur?: () => void, deps?: React.DependencyList) {
    const ref = React.createRef<T>();
    const [edit, setEdit] = React.useState(false);

    React.useEffect(() => {

        const elem = ref.current;

        const focusHandler = (evt: MouseEvent) => {
            setEdit(true);
        }

        const blurHandler = (evt: MouseEvent) => {
            evt.stopPropagation();
            evt.preventDefault();

            if (evt.currentTarget === null) {
                return;
            }

            const target = evt.target as HTMLElement;

            if (edit && target.contains(elem) && target !== elem) {
                console.log(elem)
                setEdit(false);
                if (onBlur) {
                    onBlur();
                }
            }
        }

        if (ref.current !== null) {
            ref.current.addEventListener("click", focusHandler, false);
        }

        document.body.addEventListener("click", blurHandler);

        return () => {
            if (elem !== null) {
                elem.removeEventListener("click", focusHandler, false)
            }
            
            document.body.removeEventListener("click", blurHandler);
        }
    }, ([ref.current, edit] as React.DependencyList).concat(deps || []));

    return [edit, ref] as [boolean, React.RefObject<T>]
}