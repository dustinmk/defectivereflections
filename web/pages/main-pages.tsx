import React from "react";
import ArticleSelect from "./article-select";
import { useDocuments } from "web/stores/admin-document-store";

export function ArticlesPage() {
    const doc_store = useDocuments();

    React.useEffect(() => {
        doc_store.fetchMeta();
    }, [])

    const section = [...doc_store.section_list.values()].find(section => section.name === "essay");

    return <ArticleSelect section_id={section ? section.id : null}/>
}

