import React from "react";
import { Outlet } from "react-router";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";

export default function() {
    return <div>
        <ul>
            <li><NavLink to="/admin/documents">Documents</NavLink></li>
        </ul>
        <Outlet />
    </div>
}