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
  metaDescription: text("meta_description"),
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
  whatsappUrl: text("whatsapp_url").default(""),
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

// Define type for individual specification item
export type CarModelSpecificationItem = {
  key: string;
  value: string;
};

// Define type for specification category
export type CarModelSpecificationCategory = {
  categoryTitle: string;
  specs: CarModelSpecificationItem[];
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
  specifications: text("specifications", { mode: "json" }).$type<
    CarModelSpecificationCategory[]
  >(), // JSON array of specification categories
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

// Define the table for homepage configuration
export const homepageConfig = sqliteTable("homepage_config", {
  id: text("id").primaryKey().default("main"), // Use a fixed ID for the single config row
  heroDesktopImageUrl: text("hero_desktop_image_url").notNull(),
  heroMobileImageUrl: text("hero_mobile_image_url").notNull(),
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle"),
  heroPrimaryButtonText: text("hero_primary_button_text"),
  heroPrimaryButtonLink: text("hero_primary_button_link"),
  heroSecondaryButtonText: text("hero_secondary_button_text"),
  heroSecondaryButtonLink: text("hero_secondary_button_link"),
  metaTitle: text("meta_title"), // Optional Meta Title for SEO
  metaDescription: text("meta_description"), // Optional Meta Description for SEO
  updatedAt: text("updated_at")
    .notNull()
    .$default(() => new Date().toISOString()),
});

// Define the table for homepage feature sections
export const homepageFeatureSections = sqliteTable(
  "homepage_feature_sections",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    homepageConfigId: text("homepage_config_id")
      .notNull()
      .references(() => homepageConfig.id, { onDelete: "cascade" }), // Link to homepageConfig
    order: integer("order").notNull(), // For ordering sections
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description").notNull(),
    desktopImageUrls: text("desktop_image_urls", { mode: "json" })
      .notNull()
      .$type<string[]>(), // Array of desktop image URLs
    mobileImageUrls: text("mobile_image_urls", { mode: "json" }).$type<
      string[]
    >(), // Array of mobile image URLs - Now optional (nullable)
    imageAlt: text("image_alt").notNull().default("Feature section image"),
    features: text("features", { mode: "json" }).$type<string[]>(), // JSON array of feature strings
    primaryButtonText: text("primary_button_text"),
    primaryButtonLink: text("primary_button_link"),
    secondaryButtonText: text("secondary_button_text"),
    secondaryButtonLink: text("secondary_button_link"),
    createdAt: text("created_at")
      .notNull()
      .$default(() => new Date().toISOString()),
    updatedAt: text("updated_at")
      .notNull()
      .$default(() => new Date().toISOString()),
  }
);

// Define type for homepage feature section data based on the updated schema
export type HomepageFeatureSectionDb =
  typeof homepageFeatureSections.$inferSelect;

// Keep the old type name for potential compatibility during refactoring,
// but it refers to the new structure now.
export type HomepageFeatureSection = HomepageFeatureSectionDb;

// Define about us page content that can be edited in admin
export const aboutUs = sqliteTable("about_us", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  mission: text("mission"),
  vision: text("vision"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  updatedAt: text("updated_at")
    .notNull()
    .$default(() => new Date().toISOString()),
});
