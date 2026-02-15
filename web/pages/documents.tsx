import React from "react";
import { NavLink } from "react-router-dom";

export default function() {
    return <div>
        <p>Documents</p>
        <NavLink to="/admin/documents/edit">Add New</NavLink>
    </div>;
}