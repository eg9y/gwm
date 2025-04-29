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
        "https://wa.me/6287884818135?text=Halo,%20saya%20ingin%20mengetahui%20informasi%20lebih%20lanjut%20mengenai%20product%20GWM.%0ANama%20:%0ADomisili%20:%0AType%20:",
      // Adding defaults for new fields
      metaTitle: "Kontak GWM Indonesia - Hubungi Kami",
      metaDescription:
        "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda.",
      metaKeywords:
        "kontak GWM, dealer GWM, test drive GWM, layanan purna jual, Great Wall Motors Indonesia",
      metaImage: "https://gwm.kopimap.com/kontak_banner.jpg",
      heroDesktopImageUrl: "https://gwm.kopimap.com/kontak.webp",
      heroMobileImageUrl: "https://gwm.kopimap.com/kontak.webp",
      heroTitle: "Hubungi Kami",
      heroTagline: "GWM Jakarta",
      heroSubtitle:
        "Diskusikan kebutuhan mobil Anda dengan tim kami yang siap membantu",
      heroHighlightColor: "#CF0E0E",
      formTitle: "Kontak GWM Jakarta",
      formDescription:
        "Dealer resmi GWM Jakarta siap membantu kebutuhan mobil Anda dengan layanan terbaik",
      gmapsPlaceQuery:
        "AGORA+Mall,+Jalan+M.H.+Thamrin,+Kebon+Melati,+Central+Jakarta+City,+Jakarta,+Indonesia",
      locationOptions: ["Jakarta", "Surabaya", "Bandung", "Bali", "Lainnya"],
    };

    await db.insert(contactInfo).values(defaultContactInfo);
    return true;
  }

  return false;
});

// Get the contact info
export const getContactInfo = createServerFn().handler(async () => {
  try {
    // Select all fields, including the new fields
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
  // New fields validation
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  metaImage: z.string().url().optional(),
  heroDesktopImageUrl: z.string().url().optional(),
  heroMobileImageUrl: z.string().url().optional(),
  heroTitle: z.string().optional(),
  heroTagline: z.string().optional(),
  heroSubtitle: z.string().optional(),
  heroHighlightColor: z.string().optional(),
  formTitle: z.string().optional(),
  formDescription: z.string().optional(),
  gmapsPlaceQuery: z.string().optional(),
  locationOptions: z.array(z.string()).optional(),
  // Existing fields
  logoUrl: z.string().url().optional(),
  logoWhiteUrl: z.string().url().optional(),
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
          // New fields
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          metaKeywords: data.metaKeywords,
          metaImage: data.metaImage,
          heroDesktopImageUrl: data.heroDesktopImageUrl,
          heroMobileImageUrl: data.heroMobileImageUrl,
          heroTitle: data.heroTitle,
          heroTagline: data.heroTagline,
          heroSubtitle: data.heroSubtitle,
          heroHighlightColor: data.heroHighlightColor,
          formTitle: data.formTitle,
          formDescription: data.formDescription,
          gmapsPlaceQuery: data.gmapsPlaceQuery,
          locationOptions: data.locationOptions,
          // Existing fields
          logoUrl: data.logoUrl,
          logoWhiteUrl: data.logoWhiteUrl,
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
