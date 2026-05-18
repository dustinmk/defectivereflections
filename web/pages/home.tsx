import React from "react";
import { Outlet } from "react-router";
import GraphicsBackground from "web/pages/graphics-background";
import MainMenu from "web/pages/main-menu";

export default function() {
    

    return <div className="app">
        <GraphicsBackground />
        <div className="app__content">
            <MainMenu />
            <Outlet />
        </div>
    </div>
}