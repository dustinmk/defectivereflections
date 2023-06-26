import React from "react";
import {
    createHashRouter,
    RouterProvider
} from "react-router-dom";

import HomePage from "web/pages/home";
import Error404Page from "web/pages/error404";
import ContactPage from "web/pages/contact";

const router = createHashRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <Error404Page />,
        children: [
            {path: "contact", element: <ContactPage />},
            {path: "/", element: <HomePage />}
        ]
    }
])

export default function() {
    return (
        <RouterProvider router={router} />
    );
}

