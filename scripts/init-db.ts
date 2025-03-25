import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { sql } from "drizzle-orm";
import path from "node:path";
import fs from "node:fs";
import { initContactInfo } from "../src/server/contact-info";

async function main() {
  console.log("Initializing database...");

  // Create database directory if it doesn't exist
  const dbDir = path.resolve("storage");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.resolve("storage/gwm-database.db");
  const sqlite = new Database(dbPath);
  const db = drizzle(sqlite, { casing: "snake_case" });

  // Use migrations from the drizzle folder
  console.log("Running migrations...");

  try {
    // Run the migrations
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.log("Database initialized successfully!");
  } catch (error: unknown) {
    const err = error as Error & {
      cause?: { code?: string; message?: string };
    };

    // Check if the error is because tables already exist
    if (
      err.cause?.code === "SQLITE_ERROR" &&
      err.cause.message?.includes("already exists")
    ) {
      console.log(
        "Some tables already exist, attempting to apply migrations manually..."
      );

      // Create migration table if it doesn't exist
      try {
        db.run(sql`
          CREATE TABLE IF NOT EXISTS __drizzle_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hash TEXT NOT NULL,
            created_at NUMERIC
          )
        `);
      } catch (e) {
        console.log("Migration table already exists or can't be created:", e);
      }

      // Get all migration files sorted by name (which should be chronological)
      const migrationsDir = path.resolve("./drizzle");
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));

      if (migrationFiles.length === 0) {
        console.error("No migration files found in ./drizzle directory");
        throw new Error("No migration files found");
      }

      console.log(
        `Found ${migrationFiles.length} migration files. Applying each in sequence...`
      );

      // Apply each migration file in sequence
      for (const migrationFile of migrationFiles) {
        console.log(`Applying migration: ${migrationFile}...`);
        const migrationSQL = fs.readFileSync(
          path.resolve(migrationsDir, migrationFile),
          "utf8"
        );

        // Split the SQL by statement-breakpoint to run each statement separately
        const statements = migrationSQL.split("--> statement-breakpoint");

        for (const statement of statements) {
          const trimmedStatement = statement.trim();
          if (trimmedStatement.length === 0) continue;

          try {
            sqlite.exec(trimmedStatement);
            console.log(
              `Successfully executed statement from ${migrationFile}`
            );
          } catch (statementError: unknown) {
            const stmtErr = statementError as Error & {
              code?: string;
              message?: string;
            };

            if (
              stmtErr.code === "SQLITE_ERROR" &&
              stmtErr.message?.includes("already exists")
            ) {
              console.log("Statement skipped (table/index already exists)");
            } else {
              console.error(
                `Error executing statement from ${migrationFile}:`,
                stmtErr
              );
              // Continue with next statement instead of stopping entirely
            }
          }
        }
      }

      console.log("All migrations applied manually.");
    } else if (
      err.message?.includes("No file") &&
      err.message?.includes("found in ./drizzle folder")
    ) {
      // This handles the case where a specific migration file is referenced but not found
      console.log(
        "Migration file not found. This might be due to a deleted or renamed migration."
      );
      console.log("Attempting to apply all available migrations...");

      // Try to run all available migrations
      const migrationsDir = path.resolve("./drizzle");
      const migrationFiles = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith(".sql"))
        .sort((a, b) => a.localeCompare(b));

      if (migrationFiles.length === 0) {
        console.error("No migration files found in ./drizzle directory");
        throw new Error("No migration files found");
      }

      // Create a fresh schema from the available migrations
      for (const migrationFile of migrationFiles) {
        console.log(`Applying migration: ${migrationFile}...`);
        const migrationSQL = fs.readFileSync(
          path.resolve(migrationsDir, migrationFile),
          "utf8"
        );

        try {
          sqlite.exec(migrationSQL);
          console.log(`Successfully executed migration ${migrationFile}`);
        } catch (migrationError) {
          console.error(
            `Error applying migration ${migrationFile}:`,
            migrationError
          );
        }
      }

      console.log("All available migrations applied.");
    } else {
      // Some other error occurred
      throw error;
    }
  }

  // Initialize contact info with default values if it doesn't exist
  console.log("Initializing contact information...");
  await initContactInfo();
  console.log("Contact information initialized!");
}

main().catch((error) => {
  console.error("Error initializing database:", error);
  process.exit(1);
});
