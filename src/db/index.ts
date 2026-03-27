import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'nexus.db');
const schemaPath = path.join(__dirname, 'schema.sql');

export const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Initialize schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

export default db;
