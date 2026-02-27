import { Document, DocumentVersion, Status } from "common/model";
import { validate } from "jsonschema"
import app from "server/app";
import db from "server/db";
import { copyAttachments, createDocument, createDocumentVersion, fetchDocument, fetchDocumentById, fetchDocumentVersion, fetchDocumentVersionById, listAttachments, listDocuments, listStatus, removeAttachment, removeDocument, removeDocumentVersion, removePrimaryDocumentVersion, saveAttachment, setPrimaryDocumentVersion, updateDocument, updateDocumentVersion, uploadFile } from "server/repository/documents";
// import { createAdminUser, getUserCount, validateUser } from "server/repository/users";

app.get("/api/status", async (req, res) => {
    return res.json({status: await listStatus()});
});

app.get("/api/document", async (req, res) => {
    return res.json({documents: await listDocuments()});
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
    const document_path = req.params.path;
    const document_version_number = req.params.version;
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

app.put("/api/document/:path/:version/attachment/:attachment_name", async (req, res) => {
    const data = req.body as {name: string, content_path: string | undefined};

    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    await saveAttachment(req.params.path, version, req.params.attachment_name, data.name, data.content_path);

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.post("/api/document/:path/:version/attachment", async (req, res) => {
    const data = req.body as {attachments: string[], previous_version: number};

    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    await copyAttachments(req.params.path, version, data.previous_version, data.attachments);

    return res.json({
        attachments: await listAttachments(req.params.path, version)
    });
});

app.delete("/api/document/:path/:version/attachment/:attachment_name", async (req, res) => {
    const version = parseInt(req.params.version);
    if (isNaN(version)) {
        return res.status(400).json({error: "Invalid document version"});
    }

    await removeAttachment(req.params.path, version, req.params.attachment_name);

    const attachments = await listAttachments(req.params.path, version);

    return res.json({
        attachments
    });
});