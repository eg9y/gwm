import { eq } from "drizzle-orm";
import { db, type ContactInfo, type NewContactInfo } from "../db";
import { contactInfo } from "../db/schema";
import { z } from "zod";
import { createServerFn } from "@tanstack/react-start";

// Initialize contact info if none exists
export const initContactInfo = createServerFn().handler(async () => {
  const existingInfo = await db.select().from(contactInfo).limit(1);

  if (existingInfo.length === 0) {
    // No contact info exists, create default
    const defaultContactInfo: NewContactInfo = {
      phone: "+62 877 7437 7422",
      email: "info@gwmindonesia.co.id",
      address: "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan",
      facebook: "https://facebook.com/gwmindonesia",
      instagram: "https://instagram.com/indo.tank",
      x: "https://twitter.com/gwmindonesia",
      youtube: "https://youtube.com/gwmindonesia",
    };

    await db.insert(contactInfo).values(defaultContactInfo);
    return true;
  }

  return false;
});

// Get the contact info
export const getContactInfo = createServerFn().handler(async () => {
  try {
    const info = await db.select().from(contactInfo).limit(1);
    return info.length > 0 ? info[0] : null;
  } catch (error) {
    console.error("Error getting contact info:", error);
    throw error;
  }
});

// Update contact info schema
const updateContactInfoSchema = z.object({
  id: z.number(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  facebook: z.string().min(1, "Facebook URL is required"),
  instagram: z.string().min(1, "Instagram URL is required"),
  x: z.string().min(1, "X/Twitter URL is required"),
  youtube: z.string().min(1, "YouTube URL is required"),
});

// Update contact info
export const updateContactInfo = createServerFn()
  .validator((data: unknown) => {
    try {
      return updateContactInfoSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(error.errors.map((e) => e.message).join(", "));
      }
      throw error;
    }
  })
  .handler(async ({ data }) => {
    try {
      // Update record
      await db
        .update(contactInfo)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(contactInfo.id, data.id));

      return { success: true };
    } catch (error) {
      console.error("Error updating contact info:", error);
      throw new Error("Failed to update contact info");
    }
  });
