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

// Define the table for articles
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  category: text("category").notNull(),
  featuredImageUrl: text("featured_image_url"),
  featuredImageAlt: text("featured_image_alt"),
  publishedAt: text("published_at"),
  createdAt: text("created_at")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$default(() => new Date().toISOString()),
  published: integer("published").notNull().default(0),
});

// Define contact information table that can be edited in admin
export const contactInfo = sqliteTable("contact_info", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  address: text("address").notNull(),
  facebook: text("facebook").notNull(),
  instagram: text("instagram").notNull(),
  x: text("x").notNull(), // Twitter/X
  youtube: text("youtube").notNull(),
  updatedAt: text("updated_at")
    .notNull()
    .$default(() => new Date().toISOString()),
});
