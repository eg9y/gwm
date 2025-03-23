import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import fs from "node:fs";

async function main() {
  console.log("Initializing database...");

  // Create database directory if it doesn't exist
  const dbDir = path.resolve("storage");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.resolve("storage/gwm-database.db");
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite);

  // Use migrations from the drizzle folder
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle" });

  console.log("Database initialized successfully!");
}

main().catch((error) => {
  console.error("Error initializing database:", error);
  process.exit(1);
});
