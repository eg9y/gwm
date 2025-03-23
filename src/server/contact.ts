import { createServerFn } from "@tanstack/react-start";
import { db } from "../db";
import type { NewContactSubmission } from "../db";
import { contactSubmissions } from "../db/schema";
import { eq } from "drizzle-orm";

// Get reCAPTCHA secret key from environment
// In production, use process.env.RECAPTCHA_SECRET_KEY
// For development, you can hardcode it temporarily
const RECAPTCHA_SECRET_KEY =
  process.env.RECAPTCHA_SECRET_KEY || "YOUR_RECAPTCHA_SECRET_KEY";

// Log the key for debugging (remove in production)
console.log("reCAPTCHA key available:", !!process.env.RECAPTCHA_SECRET_KEY);

// Define lead status types
export type LeadStatus =
  | "new"
  | "contacted"
  | "follow_up"
  | "qualified"
  | "closed_won"
  | "closed_lost";

// Define the contact form submission data type
interface ContactFormInput {
  fullName: string;
  email: string;
  phoneNumber: string;
  location: string;
  carModelInterest: string;
  recaptchaToken: string; // Add the token field
}

// Function to verify reCAPTCHA token
async function verifyRecaptcha(token: string) {
  try {
    // Make a request to the reCAPTCHA verify API
    const response = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: RECAPTCHA_SECRET_KEY,
          response: token,
        }).toString(),
      }
    );

    // Parse the response
    const data = await response.json();

    // Log response for debugging (remove in production)
    console.log("reCAPTCHA verification response:", data);

    // Check if the verification was successful
    return data.success === true;
  } catch (error) {
    console.error("reCAPTCHA verification error:", error);
    return false;
  }
}

// Server function to submit contact form
export const submitContactForm = createServerFn({ method: "POST" })
  .validator((formData: unknown): ContactFormInput => {
    if (!(formData instanceof FormData)) {
      throw new Error("Invalid form data");
    }

    const fullName = formData.get("fullName")?.toString();
    const email = formData.get("email")?.toString();
    const phoneNumber = formData.get("phoneNumber")?.toString();
    const location = formData.get("location")?.toString();
    const carModelInterest = formData.get("carModelInterest")?.toString();
    const recaptchaToken = formData.get("recaptchaToken")?.toString();

    if (!fullName || !email || !phoneNumber || !location || !carModelInterest) {
      throw new Error("All fields are required");
    }

    if (!recaptchaToken) {
      throw new Error("reCAPTCHA verification is required");
    }

    return {
      fullName,
      email,
      phoneNumber,
      location,
      carModelInterest,
      recaptchaToken, // Pass the token to the handler
    };
  })
  .handler(async ({ data }) => {
    try {
      // Verify reCAPTCHA token in the handler
      const isRecaptchaValid = await verifyRecaptcha(data.recaptchaToken);
      if (!isRecaptchaValid) {
        throw new Error("reCAPTCHA verification failed. Please try again.");
      }

      const newSubmission: NewContactSubmission = {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        location: data.location,
        carModelInterest: data.carModelInterest,
      };

      // Insert the submission into the database
      await db.insert(contactSubmissions).values(newSubmission);

      return { success: true, message: "Form submitted successfully" };
    } catch (error) {
      console.error("Error submitting form:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to submit form"
      );
    }
  });

// Server function to retrieve all submissions
export const getAllContactSubmissions = createServerFn({
  method: "GET",
}).handler(async () => {
  try {
    const submissions = await db
      .select()
      .from(contactSubmissions)
      .orderBy(contactSubmissions.createdAt);
    return submissions;
  } catch (error) {
    console.error("Error retrieving submissions:", error);
    throw new Error("Failed to retrieve submissions");
  }
});

// Server function to delete a contact submission
export const deleteContactSubmission = createServerFn()
  .validator((input: unknown) => {
    // Handle both formats: { id } and { data: { id } }
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    let id: number | undefined;

    // Format 1: { id: number }
    if ("id" in input && typeof input.id === "number") {
      id = input.id;
    }
    // Format 2: { data: { id: number } }
    else if (
      "data" in input &&
      input.data &&
      typeof input.data === "object" &&
      "id" in input.data &&
      typeof input.data.id === "number"
    ) {
      id = input.data.id;
    }

    if (id === undefined) {
      throw new Error("Valid submission ID is required");
    }

    return { id };
  })
  .handler(async (ctx) => {
    try {
      const { id } = ctx.data;
      await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id));
      return { success: true, message: "Submission deleted successfully" };
    } catch (error) {
      console.error("Error deleting submission:", error);
      throw new Error("Failed to delete submission");
    }
  });

// Server function to update a contact submission status
export const updateContactStatus = createServerFn()
  .validator((input: unknown) => {
    // Handle both formats: { id, status } and { data: { id, status } }
    if (!input || typeof input !== "object") {
      throw new Error("Invalid input format");
    }

    let id: number | undefined;
    let status: string | undefined;

    // Format 1: { id: number, status: string }
    if (
      "id" in input &&
      typeof input.id === "number" &&
      "status" in input &&
      typeof input.status === "string"
    ) {
      id = input.id;
      status = input.status;
    }
    // Format 2: { data: { id: number, status: string } }
    else if (
      "data" in input &&
      input.data &&
      typeof input.data === "object" &&
      "id" in input.data &&
      typeof input.data.id === "number" &&
      "status" in input.data &&
      typeof input.data.status === "string"
    ) {
      id = input.data.id;
      status = input.data.status;
    }

    if (id === undefined || status === undefined) {
      throw new Error("Valid submission ID and status are required");
    }

    // Validate status value
    const validStatuses: LeadStatus[] = [
      "new",
      "contacted",
      "follow_up",
      "qualified",
      "closed_won",
      "closed_lost",
    ];
    if (!validStatuses.includes(status as LeadStatus)) {
      throw new Error("Invalid status value");
    }

    return {
      id,
      status: status as LeadStatus,
    };
  })
  .handler(async (ctx) => {
    try {
      const { id, status } = ctx.data;

      // Get a direct reference to the underlying database for raw queries
      const sqlite = db.$client;

      // Prepare and run the statement with parameters
      sqlite
        .prepare("UPDATE contact_submissions SET status = ? WHERE id = ?")
        .run(status, id);

      return {
        success: true,
        message: "Status updated successfully",
      };
    } catch (error) {
      console.error("Error updating submission status:", error);
      throw new Error("Failed to update submission status");
    }
  });
