import path from "path";
import knex from "knex";

const knexfile_path = path.resolve(process.cwd(), "../knexfile.js");
const conn = knex(require(`${knexfile_path}`));

export default conn;