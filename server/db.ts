import path from "path";
import knex from "knex";

const conn = knex(require(path.resolve(process.cwd(), "../knexfile.js")));

export default conn;