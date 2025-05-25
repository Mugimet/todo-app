import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
// Ensure data directory exists
const dataDirectory = process.env.DATA_DIRECTORY || path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDirectory)) {
    fs.mkdirSync(dataDirectory, { recursive: true });
}
const dbPath = path.join(dataDirectory, 'database.sqlite');
console.log(`Using database at: ${dbPath}`);
const sqliteDb = new Database(dbPath);
export const db = new Kysely({
    dialect: new SqliteDialect({
        database: sqliteDb,
    }),
    log: ['query', 'error']
});
