import { Status } from "common/model";
import React, { Ref } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDocuments } from "web/store";
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

    return <div className="admin-content content form">
        <ul>
            {[...doc_store.status_list.values()].map(status => {
                return <li>
                    <StatusElement status={status} />
                </li>
            })}
        </ul>
    </div>
}

function StatusElement({status}: {status: Status}) {
    const doc_store = useDocuments();
    const [name, setName] = React.useState(status.name);
    const [display_name, setDisplayName] = React.useState(status.display_name);

    const [edit, ref] = useFocus(() => doc_store.updateStatus(status.id, name, display_name));

    return <span ref={ref}>
        <input value={name} disabled={!edit}></input>
        <input value={display_name} disabled={!edit}></input>
        <button onClick={() => doc_store.deleteStatus(status.id)}><i className="fa-solid fa-trash"></i></button>
    </span>
}

function useFocus<T extends HTMLElement>(onBlur?: () => void) {
    const ref = React.createRef<T>();
    const [edit, setEdit] = React.useState(false);

    React.useEffect(() => {
        const focusHandler = () => {
            setEdit(true);
        }

        const blurHandler = (evt: PointerEvent) => {
            if (evt.currentTarget === null) {
                return;
            }

            const current_target = evt.currentTarget as HTMLElement;

            if (current_target.contains(ref.current) && current_target !== ref.current) {
                setEdit(false);
                if (onBlur) {
                    onBlur();
                }
            }
        }

        if (ref.current !== null) {
            ref.current.addEventListener("click", focusHandler);
        }

        document.body.addEventListener("click", blurHandler);

        return () => {
            if (ref.current !== null) {
                ref.current.removeEventListener("click", focusHandler)
            }
            
            document.body.removeEventListener("click", blurHandler);
        }
    }, [ref.current]);

    return [edit, ref] as [boolean, React.RefObject<T>]
}