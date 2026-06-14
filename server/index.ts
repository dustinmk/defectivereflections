import path from "path";
import config from "server/config";
import app from "server/app";
import "server/api/users";
import "server/api/documents";

app.get("/*", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "./web/index.html"));
});

const server = app.listen(config.port, "0.0.0.0", async () => {
    console.log(`Example app listening on ${server.address}${config.port}`);
    console.log(`Static root at ${path.resolve(process.cwd(), "./web")}`);
});



