import React from "react";
import { Outlet } from "react-router";

export default function() {
    return <div className="app">
        <Outlet />
    </div>
}