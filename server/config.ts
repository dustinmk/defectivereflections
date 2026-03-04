import path from "path";
import fs from "fs";

const config_data = fs.readFileSync(path.resolve(process.cwd(), "./config.json"));
const config = JSON.parse(config_data.toString());

export default config;