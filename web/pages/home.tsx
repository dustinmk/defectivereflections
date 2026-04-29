import React from "react";
import { Outlet } from "react-router";
import ParticleFieldBackground from "web/pages/particle-field-background";
import MainMenu from "web/pages/main-menu";

export default function() {
    

    return <div className="app">
        <ParticleFieldBackground />
        <div className="app__content">
            <MainMenu />
            <Outlet />
        </div>
    </div>
}