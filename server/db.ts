import path from "path";
import knex from "knex";

declare module 'knex/types/result' {
  interface Registry {
    Count: number;
  }
}

const knexfile_path = path.resolve(process.cwd(), "./knexfile.js");
const conn = knex(require(`${knexfile_path}`));

export default conn;