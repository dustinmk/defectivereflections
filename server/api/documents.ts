import { validate } from "jsonschema"
import app from "server/app";
import { createAdminUser, getUserCount, validateUser } from "server/repository/users";

app.get("/api/documents", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.get("/api/documents/:path", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.get("/api/documents/:path/:version", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.post("/api/documents", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.put("/api/documents/:path/:version", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.delete("/api/documents/:path/:version", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.get("/api/status", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.put("/api/status/:status", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.delete("/api/status/:status", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.get("/api/section", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.put("/api/section/:section", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.delete("/api/section/:section", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.get("/api/documents/:document/file", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.put("/api/documents/:document/file/:file", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});

app.delete("/api/documents/:document/file/:file", async (req, res) => {
    return res.json({need_init: await getUserCount() === 0});
});