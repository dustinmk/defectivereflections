import React, { ErrorInfo } from "react";
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
import { ArticlesPage } from "./pages/main-pages";
import ArticleView from "./pages/article-view";
import { CategoryPage, DocumentParamsPage, SectionPage, StatusPage } from "./pages/document-params";
import { ApiError } from "./api/api";
import LoginPage from "web/pages/login";

const router = createBrowserRouter([
    {
        path: "/",
        element: <HomePage />,
        errorElement: <Error404Page />,
        children: [
            {path: "login", element: <LoginPage />},
            {path: "articles", element: <ArticlesPage />, children: [
                {path: ":document_path", element: <ArticleView />},
            ]},
            {path: "articles/:section/:category", element: <ArticlesPage />}
        ],
    },
    {path: "admin", element: <Admin />, children: [
        {path: "documents", element: <Documents />, children: [
            {path: "edit", element: <DocumentsEdit />},
            {path: "edit/:document_path", element: <DocumentsEdit />},
        ]},
        {path: "params", element: <DocumentParamsPage />, children: [
            {path: "status", element: <StatusPage />},
            {path: "sections", element: <SectionPage />},
            {path: "categories", element: <CategoryPage />}
        ]}
    ]},
])

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, {hasError: boolean}> {
    constructor(props: {}) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true };
    }

    override componentDidCatch(error: Error, info: ErrorInfo) {
        if (error instanceof ApiError && (error as ApiError).status === "auth") {
            router.navigate("/admin");
        }
    }

    override render() {
        if (this.state.hasError) {
            return <p>Error!</p>
        }

        return this.props.children;
    }
}

export default function() {
    return <MathJaxContext>
        <Modal></Modal>
        <RouterProvider router={router} />
    </MathJaxContext>;
}

