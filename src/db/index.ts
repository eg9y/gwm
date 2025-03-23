import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "node:path";

// Create database directory if it doesn't exist
import fs from "node:fs";
const dbDir = path.resolve("storage");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const sqlite = new Database("storage/gwm-database.db");

// Create a Drizzle ORM instance
export const db = drizzle(sqlite, { schema });

// Type for contact submissions
export type ContactSubmission = typeof schema.contactSubmissions.$inferSelect;
export type NewContactSubmission =
  typeof schema.contactSubmissions.$inferInsert;
