import { defineConfig } from "drizzle-kit";
import path from "node:path";

console.log("database url", process.env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(process.env.DATABASE_URL || "storage/gwm-database.db"),
  },
});
