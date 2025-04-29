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
      whatsappUrl:
        "https://wa.me/6287884818135?text=Halo,%20saya%20ingin%20mengetahui%20informasi%20lebih%20lanjut%20mengenai%20product%20GWM.%0ANama%20:%0ADomisili%20:%0AType%20:", // Default WhatsApp URL
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
  whatsappUrl: z
    .string()
    .url("Valid WhatsApp URL is required (e.g., https://wa.me/...)")
    .min(1, "WhatsApp URL is required"),
});

// Update or create contact info (upsert)
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
      // Check if this is a new record (id = 0) or an update
      if (data.id === 0) {
        // New record - insert
        const newData: NewContactInfo = {
          phone: data.phone,
          email: data.email,
          address: data.address,
          facebook: data.facebook,
          instagram: data.instagram,
          x: data.x,
          youtube: data.youtube,
          whatsappUrl: data.whatsappUrl,
          updatedAt: new Date().toISOString(),
        };

        const result = await db.insert(contactInfo).values(newData).returning();

        return {
          success: true,
          id: result[0].id,
          message: "Contact information created successfully",
        };
      }

      // Existing record - update
      await db
        .update(contactInfo)
        .set({
          ...data,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(contactInfo.id, data.id));

      return {
        success: true,
        id: data.id,
        message: "Contact information updated successfully",
      };
    } catch (error) {
      console.error("Error updating contact info:", error);
      throw new Error("Failed to update contact information");
    }
  });
