import path from "path";
import express from "express";

const app = express();

app.use(express.static(path.resolve(process.cwd(), "../web")));
app.use(express.json());

export default app;