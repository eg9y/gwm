import { readFileSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";

/**
 * This script inserts car models data into the SQLite database
 * using the SQL file in scripts/insert-car-models.sql
 */
async function insertCarModels() {
  try {
    console.log("Initializing car models insertion...");

    // Path to database file
    const dbPath = join(process.cwd(), "storage", "gwm-database.db");
    console.log(`Using database at: ${dbPath}`);

    // Open database connection
    const db = new Database(dbPath);
    console.log("Database connection opened");

    // Read SQL file
    const sqlFilePath = join(process.cwd(), "scripts", "insert-car-models.sql");
    const sqlCommands = readFileSync(sqlFilePath, "utf8");
    console.log("SQL file read successfully");

    // Split into individual commands and execute them
    const commands = sqlCommands
      .split(";")
      .filter((cmd) => cmd.trim().length > 0);
    console.log(`Found ${commands.length} SQL commands to execute`);

    // Start a transaction for better performance and reliability
    db.exec("BEGIN TRANSACTION;");

    for (let i = 0; i < commands.length; i++) {
      const command = commands[i].trim() + ";";
      if (command.startsWith("--")) continue; // Skip comments

      try {
        console.log(`Executing command ${i + 1}/${commands.length}...`);
        db.exec(command);
      } catch (error) {
        console.error(
          `Error executing command: ${command.substring(0, 100)}...`
        );
        throw error;
      }
    }

    // Commit the transaction
    db.exec("COMMIT;");
    console.log("All SQL commands executed successfully!");

    // Close the database connection
    db.close();
    console.log("Database connection closed");

    console.log("Car models have been inserted successfully!");
  } catch (error) {
    console.error("Error inserting car models:", error);
    process.exit(1);
  }
}

// Execute the function
insertCarModels()
  .then(() => console.log("Script completed successfully"))
  .catch((error) => console.error("Script failed:", error))
  .finally(() => process.exit(0));
