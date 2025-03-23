import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Define the table for contact form submissions
export const contactSubmissions = sqliteTable("contact_submissions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  location: text("location").notNull(),
  carModelInterest: text("car_model_interest").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: text("created_at")
    .notNull()
    .$default(() => new Date().toISOString()),
});
