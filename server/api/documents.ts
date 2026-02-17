import { Document, DocumentVersion, Status } from "common/model";
import { validate } from "jsonschema"
import app from "server/app";
import db from "server/db";
import { createDocument, createDocumentVersion, fetchDocument, fetchDocumentById, fetchDocumentVersion, fetchDocumentVersionById, listDocuments, listStatus, removeDocument, removeDocumentVersion, removePrimaryDocumentVersion, setPrimaryDocumentVersion, updateDocument, updateDocumentVersion } from "server/repository/documents";
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

    if (document.id === null) {
        document.id = await createDocument(document, document_version);

    } else {
        await updateDocument(document);
    }

    document_version.document_id = document.id

    if (document_version.id === null) {
        document_version.id = await createDocumentVersion(document_version);
        
    } else {
        await updateDocumentVersion(document_version);
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

app.get("/api/document/:document/file", async (req, res) => {
    return res.json({});
});

app.put("/api/document/:document/file/:file", async (req, res) => {
    return res.json({});
});

app.delete("/api/document/:document/file/:file", async (req, res) => {
    return res.json({});
});