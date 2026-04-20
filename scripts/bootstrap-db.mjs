import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const schemaPath = path.join(projectRoot, "prisma", "schema.prisma");
const schemaDir = path.dirname(schemaPath);

process.loadEnvFile(path.join(projectRoot, ".env"));

function resolveDbPath() {
  const url = process.env.DATABASE_URL;

  if (!url?.startsWith("file:")) {
    throw new Error("DATABASE_URL must use a local SQLite file: URL.");
  }

  const rawPath = url.slice(5);
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(schemaDir, rawPath);
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const prismaCliEntry = path.join(projectRoot, "node_modules", "prisma", "build", "index.js");

const sql = execFileSync(
  process.execPath,
  [prismaCliEntry, "migrate", "diff", "--from-empty", "--to-schema-datamodel", schemaPath, "--script"],
  {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env
  }
);

const database = new DatabaseSync(dbPath);
const tableCount = database
  .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table'")
  .get().count;

if (tableCount > 0) {
  database.close();
  console.log(`Database already exists at ${dbPath}`);
  process.exit(0);
}

database.exec(sql);
database.close();

console.log(`Bootstrapped SQLite database at ${dbPath}`);
