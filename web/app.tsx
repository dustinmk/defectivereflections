import React from "react";
import { MathJaxContext } from "better-react-mathjax";
import {
    createBrowserRouter,
    RouterProvider
} from "react-router-dom";

import HomePage from "web/pages/home";
import Error404Page from "web/pages/error404";
import ContactPage from "web/pages/contact";
import Admin from "web/pages/admin";
import Documents from "web/pages/documents";
import DocumentsEdit from "./pages/documents-edit";
import { Modal } from "./components/modal";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <Error404Page />,
        children: [
            {path: "contact", element: <ContactPage />},
            {path: "admin", element: <Admin />, children: [
                {path: "documents", element: <Documents />, children: [
                    {path: "edit", element: <DocumentsEdit />},
                    {path: "edit/:document_path", element: <DocumentsEdit />},
                ]}
            ]}
        ]
    }
])

export default function() {
    return <MathJaxContext>
        <Modal></Modal>
        <RouterProvider router={router} />
    </MathJaxContext>;
}

