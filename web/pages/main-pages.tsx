import React from "react";
import ArticleSelect from "./article-select";
import { useDocuments } from "web/stores/admin-document-store";

export function ArticlesPage() {
    const doc_store = useDocuments();

    React.useEffect(() => {
        doc_store.fetchMeta();
    }, [])

    return <ArticleSelect />
}

