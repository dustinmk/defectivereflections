import React from "react";
import {
    createBrowserRouter,
    RouterProvider
} from "react-router-dom";

import HomePage from "web/pages/home";
import Error404Page from "web/pages/error404";
import ContactPage from "web/pages/contact";
import Admin from "web/pages/admin";
import Sections from "web/pages/sections";
import Status from "web/pages/status";
import Documents from "web/pages/documents";
import DocumentsEdit from "./pages/documents-edit";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <Error404Page />,
        children: [
            {path: "contact", element: <ContactPage />},
            {path: "admin", element: <Admin />, children: [
                {path: "sections", element: <Sections />},
                {path: "status", element: <Status />},
                {path: "documents", element: <Documents />},
                {path: "documents/edit", element: <DocumentsEdit />},
                {path: "documents/edit/:document_path", element: <DocumentsEdit />},
            ]},
            {path: "/", element: <HomePage />},
        ]
    }
])

export default function() {
    return (
        <RouterProvider router={router} />
    );
}

