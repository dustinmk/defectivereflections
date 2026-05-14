import React from "react";
import { Outlet } from "react-router";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

export default function() {
    return <div className="admin">
        <ul className="menu-toolbar">
            <li><NavLink to="/admin/documents">Documents</NavLink></li>
            <li><NavLink to="/admin/params">Params</NavLink></li>
        </ul>
        <Outlet />
    </div>
}