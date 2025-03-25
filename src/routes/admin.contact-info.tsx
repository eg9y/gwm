import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getContactInfo, updateContactInfo } from "../server/contact-info";

// Form validation schema
const contactInfoSchema = z.object({
  id: z.number(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().min(1, "Address is required"),
  facebook: z.string().min(1, "Facebook URL is required"),
  instagram: z.string().min(1, "Instagram URL is required"),
  x: z.string().min(1, "X/Twitter URL is required"),
  youtube: z.string().min(1, "YouTube URL is required"),
});

// Type based on the schema
type ContactInfoFormData = z.infer<typeof contactInfoSchema>;

// Default contact info for new records
const defaultContactInfo: Omit<ContactInfoFormData, "id"> = {
  phone: "+62 812 3456 7890",
  email: "contact@carsales.example.com",
  address: "Jl. Sudirman No. 123, Jakarta Pusat",
  facebook: "https://facebook.com/carsales",
  instagram: "https://instagram.com/carsales",
  x: "https://twitter.com/carsales",
  youtube: "https://youtube.com/carsales",
};

export const Route = createFileRoute("/admin/contact-info")({
  component: AdminContactInfoPage,
  loader: async () => {
    try {
      const contactInfo = await getContactInfo();
      return { contactInfo };
    } catch (error) {
      console.error("Error fetching contact info:", error);
      return {
        contactInfo: null,
        error: "Failed to load contact information",
      };
    }
  },
});

function AdminContactInfoPage() {
  const { isSignedIn } = useAuth();
  const { contactInfo, error } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const isNewRecord = !contactInfo && !error;

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: contactInfo || {
      id: 0, // New records start with ID 0
      ...defaultContactInfo,
    },
  });

  // Submit handler
  const onSubmit = async (data: ContactInfoFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setServerError(null);

    try {
      const result = await updateContactInfo({ data });
      if (result.success) {
        setSaveSuccess(true);
        // Reset form with the updated values to ensure id is maintained
        reset(data);

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      } else {
        setServerError("Failed to update contact info");
      }
    } catch (error) {
      console.error("Error updating contact info:", error);
      setServerError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // If there was an error
  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-medium text-primary mb-6">
            Contact Information
          </h2>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-medium text-primary mb-6">
          {isNewRecord
            ? "Create Contact Information"
            : "Edit Contact Information"}
        </h2>

        {isNewRecord && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700">
              No contact information has been set up yet. Please fill out the
              form below to create your contact details.
            </p>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">
              {isNewRecord
                ? "Contact information created successfully!"
                : "Contact information updated successfully!"}
            </p>
          </div>
        )}

        {serverError && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{serverError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Hidden ID field */}
          <input type="hidden" {...register("id")} />

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Phone Number
            </label>
            <input
              type="text"
              id="phone"
              {...register("phone")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              {...register("email")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Address
            </label>
            <textarea
              id="address"
              {...register("address")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600">
                {errors.address.message}
              </p>
            )}
          </div>

          {/* Social Media Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Facebook */}
            <div>
              <label
                htmlFor="facebook"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Facebook URL
              </label>
              <input
                type="text"
                id="facebook"
                {...register("facebook")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.facebook && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.facebook.message}
                </p>
              )}
            </div>

            {/* Instagram */}
            <div>
              <label
                htmlFor="instagram"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Instagram URL
              </label>
              <input
                type="text"
                id="instagram"
                {...register("instagram")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.instagram && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.instagram.message}
                </p>
              )}
            </div>

            {/* X/Twitter */}
            <div>
              <label
                htmlFor="x"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                X/Twitter URL
              </label>
              <input
                type="text"
                id="x"
                {...register("x")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.x && (
                <p className="mt-1 text-sm text-red-600">{errors.x.message}</p>
              )}
            </div>

            {/* YouTube */}
            <div>
              <label
                htmlFor="youtube"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                YouTube URL
              </label>
              <input
                type="text"
                id="youtube"
                {...register("youtube")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.youtube && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.youtube.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting
                ? isNewRecord
                  ? "Creating..."
                  : "Saving..."
                : isNewRecord
                  ? "Create Contact Info"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
