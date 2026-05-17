import React from "react";
import { Outlet } from "react-router";
import { Link } from "react-router-dom";
import { useDocuments } from "web/stores/admin-document-store";

interface MenuItemData {
    name: string;
    children: MenuItemData[];
    path: string | null;
}

const menu_paths: MenuItemData[] = [
    {name: "Essays", children: [], path: "/essays"},
    {name: "Poetry", children: [], path: "/poetry"},
    {name: "Research", children: [], path: "/research"},
    {name: "Review", children: [], path: "/review"},
    {name: "Game Design", children: [], path: "/game"},
    {name: "Programming", children: [], path: "/programming"},
]

export default function() {
    const doc_store = useDocuments();
        
    React.useEffect(() => {
        doc_store.fetchDocuments();
    }, []);
    
    const [expanded_menu, setExpandedMenu] = React.useState(menu_paths[0].name);

    return <ul className="nav-menu">
        {menu_paths.map(menu => {
            return <MenuItem menu={menu} expand={expanded_menu === menu.name}/>
        })}
    </ul>
}

function MenuItem(props: {menu: MenuItemData, expand: boolean}) {
    if (props.menu.path === null) {
        return <></>;
    }

    return <li>
        <Link to={props.menu.path}>{props.menu.name}</Link>
    </li>
}
