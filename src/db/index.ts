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

// Create a Drizzle ORM instance with snake_case to camelCase conversion
export const db = drizzle(sqlite, {
  schema,
  // Automatically convert snake_case in DB to camelCase in code
  casing: "snake_case",
});

// Type for contact submissions
export type ContactSubmission = typeof schema.contactSubmissions.$inferSelect;
export type NewContactSubmission =
  typeof schema.contactSubmissions.$inferInsert;

// Type for articles
export type Article = typeof schema.articles.$inferSelect;
export type NewArticle = typeof schema.articles.$inferInsert;
