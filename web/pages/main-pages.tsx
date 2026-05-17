import React from "react";
import ArticleSelect from "./article-select";
import { useDocuments } from "web/stores/admin-document-store";

export function EssaysPage() {
    const doc_store = useDocuments();

    React.useEffect(() => {
        doc_store.fetchMeta();
    }, [])

    const section = [...doc_store.section_list.values()].find(section => section.name === "essay");

    return <ArticleSelect section_id={section ? section.id : null}/>
}

export function PoetryPage() {
    return <div></div>
}

export function ResearchPage() {
    return <div></div>
}

export function ReviewPage() {
    return <div></div>
}

export function GamesPage() {
    return <div></div>
}

export function ProgrammingPage() {
    return <div></div>
}
