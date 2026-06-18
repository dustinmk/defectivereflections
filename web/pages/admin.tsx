import React from "react";
import { Outlet, useNavigate } from "react-router";
import { NavLink } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAuth } from "web/api/auth_api";

export default function() {
    const navigate = useNavigate();
    const auth = useAuth();
    React.useEffect(() => {
        if (auth.roles.length <= 0 || auth.roles.indexOf("admin") < 0) {
            navigate("/login")
        }
    }, [auth.roles]);

    return <div className="admin">
        <ul className="menu-toolbar">
            <li><NavLink to="/admin/documents">Documents</NavLink></li>
            <li><NavLink to="/admin/params">Params</NavLink></li>
        </ul>
        <Outlet />
    </div>
}