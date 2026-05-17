import { Document, DocumentVersion, Status } from "common/model";
import { validate } from "jsonschema"
import app from "server/app";
import db from "server/db";
import { copyAttachments, createCategory, createDocument, createDocumentVersion, createStatus, deleteCategory, deleteStatus, DocumentSortTerm, fetchDocument, fetchDocumentById, fetchDocumentVersion, fetchDocumentVersionById, listAttachments, listCategory, listDocuments, listSections, listStatus, removeAttachment, removeDocument, removeDocumentVersion, removePrimaryDocumentVersion, saveAttachment, setPrimaryDocumentVersion, updateCategory, updateDocument, updateDocumentVersion, updateStatus, uploadFile, viewDocuments } from "server/repository/documents";
import { toInt } from "web/util";
// import { createAdminUser, getUserCount, validateUser } from "server/repository/users";

app.get("/api/status", async (req, res) => {
    const {section_id, category_id} = req.query as {section_id: string, category_id: string};
    const status = await listStatus(toInt(section_id), toInt(category_id))
    return res.json({status});
});

app.post("/api/status", async (req, res) => {
    const {name, display_name} = req.body as {name: string, display_name: string};

    await createStatus(name, display_name);

    return res.json({status: await listStatus()});
});

app.put("/api/status/:id", async (req, res) => {
    const {name, display_name} = req.body as {name: string, display_name: string};
    const id = parseInt(req.params.id);

    await updateStatus(id, name, display_name);

    return res.json({status: await listStatus()});
});

app.delete("/api/status/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    await deleteStatus(id);

    return res.json({status: await listStatus()});
});

app.get("/api/category", async (req, res) => {
    const {status_id, section_id} = req.query as {status_id: string, section_id: string};
    return res.json({category: await listCategory(toInt(status_id), toInt(section_id))});
});

app.post("/api/category", async (req, res) => {
    const {name, parent_id} = req.body as {name: string, parent_id: number};

    await createCategory(name, parent_id);

    return res.json({category: await listCategory()});
});

app.put("/api/category/:id", async (req, res) => {
    const {name, parent_id} = req.body as {name: string, parent_id: number};
    const id = parseInt(req.params.id);

    await updateCategory(id, name, parent_id);

    return res.json({category: await listCategory()});
});

app.delete("/api/category/:id", async (req, res) => {
    const id = parseInt(req.params.id);

    await deleteCategory(id);

    return res.json({category: await listCategory()});
});

app.get("/api/section", async (req, res) => {
    const {status_id, category_id} = req.query as {status_id: string, category_id: string};
    return res.json({section: await listSections(toInt(status_id), toInt(category_id))});
});

app.get("/api/public/document", async (req, res) => {
    return res.json({documents: await viewDocuments(
        toInt(req.query.status as string) || null,
        toInt(req.query.section as string) || null, 
        toInt(req.query.category as string) || null,
        req.query.sort_method as DocumentSortTerm
    )});
});

app.get("/api/public/document/:path", async (req, res) => {
    const sections = await listSections();
    const status = await listStatus();
    const categories = await listCategory();
    const document: Document = await fetchDocument(req.params.path);
    const document_version = await fetchDocumentVersionById(document.primary_document_version_id);
    const attachments = document_version.version_number === null
        ? []
        : await listAttachments(document.path, document_version.version_number);

    return res.json({
        sections,
        status,
        categories,
        document,
        document_version,
        attachments
    });
});

app.get("/api/document", async (req, res) => {
    const {category_id, section_id, status_id, sort_method} = req.query as {category_id: string, section_id: string, status_id: string, sort_method: string};

    return res.json({documents: await listDocuments(toInt(category_id), toInt(section_id), toInt(status_id), sort_method)});
});

app.get("/api/document/:path", async (req, res) => {
    return res.json({document: await fetchDocument(req.params.path)});
});

app.get("/api/document/:path/:version", async (req, res) => {
    return res.json({document_version: await fetchDocumentVersion(req.params.path, parseInt(req.params.version))});
});

app.post("/api/document/:path/primary/:version", async (req, res) => {
    const version_number = parseInt(req.params.version);
    if (isNaN(version_number)) {
        return res.status(400).json({error: "Invalid primary document version"});
    }

    await setPrimaryDocumentVersion(req.params.path, version_number);

    return res.json({
        document: await fetchDocument(req.params.path)
    });
});

app.delete("/api/document/:path/primary", async (req, res) => {
    await removePrimaryDocumentVersion(req.params.path);

    return res.json({
        document: await fetchDocument(req.params.path)
    });
});

app.delete("/api/document/:path/:version", async (req, res) => {
    await removeDocumentVersion(req.params.path, parseInt(req.params.version));

    return res.json({
        document: await fetchDocument(req.params.path)
    });
});

app.delete("/api/document/:path", async (req, res) => {
    await removeDocument(req.params.path);

    return res.json({});
});

app.put("/api/document/:path/:version", async (req, res) => {
    const {document, document_version} = req.body as {document: Document, document_version: DocumentVersion};

    if (document.id !== null && document_version.id === null) {
        document_version.document_id = document.id
        document_version.id = await createDocumentVersion(document_version);
        
    } else if (document_version.id !== null) {
        await updateDocumentVersion(document_version);
    }
    
    if (document.id === null) {
        document.id = await createDocument(document, document_version);

    } else {
        await updateDocument(document);
    }


    if (document.id === null) {
        return res.status(500).json({error: "Resulting document is invalid"});
    }

    const response = {
        document: await fetchDocumentById(document.id),
        document_version: await fetchDocumentVersionById(document_version.id)   // id can be null
    }

    return res.json(response);
});

app.get("/api/document/:path/:version/attachment", async (req, res) => {
    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.post("/api/upload", async (req, res) => {
    const data = req.body as {content: string};

    const path = await uploadFile(undefined, data.content);

    return res.json({
        path
    });
});

app.post("/api/upload/:path", async (req, res) => {
    const data = req.body as {content: string};

    const path = await uploadFile(req.params.path, data.content);

    return res.json({
        path
    });
});

app.put("/api/document/:path/:version/attachment/:attachment_id", async (req, res) => {
    const data = req.body as {name: string, content_path: string | undefined};

    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    const attachment_id = parseInt(req.params.attachment_id);
    if (isNaN(attachment_id)) {
        return res.status(400).json({error: "Invalid attachment id"});
    }

    await saveAttachment(req.params.path, version, attachment_id, data.name, data.content_path);

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.post("/api/document/:path/:version/attachment", async (req, res) => {
    const data = req.body as {name: string, content_path: string | undefined};

    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    await saveAttachment(req.params.path, version, null, data.name, data.content_path);

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.post("/api/document/:path/:version/copy_attachments", async (req, res) => {
    const data = req.body as {attachment_ids: number[], prior_version: number};

    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    await copyAttachments(req.params.path, version, data.prior_version, data.attachment_ids);

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.delete("/api/document/:path/:version/attachment/:attachment_id", async (req, res) => {
    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    const attachment_id = parseInt(req.params.attachment_id);
    if (isNaN(attachment_id)) {
        return res.status(400).json({error: "Invalid attachment id"});
    }

    await removeAttachment(req.params.path, version, attachment_id);

    const attachments = await listAttachments(req.params.path, version);

    return res.json({
        attachments
    });
});