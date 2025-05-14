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

// Get database path from environment variable or use default
const dbPath = path.resolve(
  process.env.DATABASE_URL || "storage/gwm-database.db"
);

// Connect to SQLite database with optimized configuration to prevent locking
const sqlite = new Database(dbPath, {
  // WAL mode helps prevent db locks by allowing reads during writes
  // and improves concurrent access
  fileMustExist: false,
  timeout: 5000, // 5 second timeout on database locks
  verbose: process.env.NODE_ENV === "development" ? console.log : undefined,
});

// Enable WAL mode
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("synchronous = NORMAL");
sqlite.pragma("foreign_keys = ON");
sqlite.pragma("busy_timeout = 5000"); // 5000ms before giving up on a lock

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

// Type for contact info
export type ContactInfo = typeof schema.contactInfo.$inferSelect;
export type NewContactInfo = typeof schema.contactInfo.$inferInsert;
