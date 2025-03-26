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

// Define types for the car model features and colors
export type CarModelFeature = string;

export type CarModelColor = {
  name: string;
  hex: string;
  backgroundColor: string;
  imageUrl?: string;
};

// Define type for gallery images
export type GalleryImage = {
  imageUrl: string;
  alt: string;
};

// Define car models table
export const carModels = sqliteTable("car_models", {
  id: text("id").primaryKey(), // slugified name as ID
  name: text("name").notNull(),
  featuredImage: text("featured_image").notNull(), // Hero image
  subheader: text("subheader").notNull(), // Subheader text in hero section
  price: text("price").notNull(), // Price as text to allow formatting
  subImage: text("sub_image"), // Optional secondary image
  features: text("features", { mode: "json" })
    .notNull()
    .$type<CarModelFeature[]>(), // JSON array of feature strings
  description: text("description").notNull(), // Long text description
  mainProductImage: text("main_product_image").notNull(), // Image for navbar and listing
  colors: text("colors", { mode: "json" }).notNull().$type<CarModelColor[]>(), // JSON array of color objects
  gallery: text("gallery", { mode: "json" }).$type<GalleryImage[]>(), // JSON array of gallery images
  category: text("category").notNull(), // e.g. SUV, Sedan, etc.
  categoryDisplay: text("category_display").notNull(), // Display name for category
  published: integer("published").notNull().default(0), // Published status
  createdAt: text("created_at")
    .notNull()
    .$default(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$default(() => new Date().toISOString()),
});

// Lead status type for contact submissions
export type LeadStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "qualified"
  | "closed_won"
  | "closed_lost";
