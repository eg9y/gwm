import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getSiteSettings, updateSiteSettings } from "../server/site-settings";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Form validation schema
const siteSettingsSchema = z.object({
  id: z.string().default("main"),
  brandName: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val: string | null | undefined) => !val || val.trim().length > 0,
      "Brand name cannot be empty if provided."
    ),
  googleAnalyticsId: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val: string | null | undefined) => !val || /^G-[A-Z0-9]+$/.test(val),
      "Must be a valid Google Analytics Tracking ID (e.g., G-XXXXXXXXXX) or empty."
    ),
  googleTagManagerId: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val: string | null | undefined) => !val || /^GTM-[A-Z0-9]+$/.test(val),
      "Must be a valid Google Tag Manager ID (e.g., GTM-XXXXXXX) or empty."
    ),
});

// Type based on the schema
type SiteSettingsFormData = z.infer<typeof siteSettingsSchema>;

// Default values (initially empty/null)
const defaultSiteSettings: SiteSettingsFormData = {
  id: "main",
  brandName: null,
  googleAnalyticsId: null,
  googleTagManagerId: null,
};

export const Route = createFileRoute("/admin/site-settings")({
  component: AdminSiteSettingsPage,
  loader: async () => {
    try {
      const settings = await getSiteSettings();
      // Use default settings if none are found (e.g., first time)
      return { settings: settings ?? defaultSiteSettings };
    } catch (error) {
      console.error("Error fetching site settings:", error);
      return {
        settings: defaultSiteSettings, // Provide defaults on error
        error: "Failed to load site settings",
      };
    }
  },
});

function AdminSiteSettingsPage() {
  const { isSignedIn } = useAuth();
  const { settings, error } = Route.useLoaderData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SiteSettingsFormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: settings, // Load fetched or default settings
  });

  // Reset form if loader data changes (e.g., after initial load fails then succeeds)
  useEffect(() => {
    reset(settings);
  }, [settings, reset]);

  // Submit handler
  const onSubmit = async (data: SiteSettingsFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setServerError(null);
    let toastId: string | undefined;

    try {
      toastId = toast.loading("Saving site settings...");

      // Ensure empty strings are sent as null
      const dataToSubmit = {
        ...data,
        brandName: data.brandName || null,
        googleAnalyticsId: data.googleAnalyticsId || null,
        googleTagManagerId: data.googleTagManagerId || null,
      };

      const result = await updateSiteSettings({ data: dataToSubmit });

      if (result.success) {
        setSaveSuccess(true);
        reset(dataToSubmit); // Update form with saved values
        toast.success("Site settings updated successfully!", { id: toastId });
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setServerError("Failed to update site settings");
        toast.error("Failed to update site settings", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating site settings:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.";
      setServerError(message);
      toast.error(message, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Display loading or error state
  if (error && !settings) {
    // Show error only if settings are truly unavailable
    return (
      <div className="p-8">
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-medium text-primary mb-6">
            Site Settings
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
          Site Settings
        </h2>
        <p className="text-gray-600 mb-6">
          Configure site-wide settings such as analytics tracking IDs.
        </p>

        {saveSuccess && (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">Settings updated successfully!</p>
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

          {/* Brand Name */}
          <div>
            <label
              htmlFor="brandName"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Brand Name
            </label>
            <input
              type="text"
              id="brandName"
              {...register("brandName")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Enter your brand name"
            />
            {errors.brandName && (
              <p className="mt-1 text-sm text-red-600">
                {errors.brandName.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter your brand name.
            </p>
          </div>

          {/* Google Analytics ID */}
          <div>
            <label
              htmlFor="googleAnalyticsId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Google Analytics Tracking ID
            </label>
            <input
              type="text"
              id="googleAnalyticsId"
              {...register("googleAnalyticsId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="G-XXXXXXXXXX"
            />
            {errors.googleAnalyticsId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.googleAnalyticsId.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter your Google Analytics 4 Measurement ID (e.g., G-XXXXXXXXXX).
              Leave blank to disable.
            </p>
            {/* Instructions for GA ID */}
            <details className="mt-2 text-xs text-gray-600">
              <summary className="cursor-pointer font-medium hover:underline">
                How to find your Google Analytics Tracking ID?
              </summary>
              <ol className="list-decimal list-inside mt-1 space-y-1 pl-2">
                <li>
                  Sign in to your
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mx-1"
                  >
                    Google Analytics
                  </a>
                  account.
                </li>
                <li>Navigate to the 'Admin' section (cog icon).</li>
                <li>In the 'Property' column, select your desired property.</li>
                <li>Click on 'Data Streams'.</li>
                <li>Select the relevant web data stream.</li>
                <li>
                  Your 'Measurement ID' (starting with 'G-') will be displayed
                  at the top right.
                </li>
              </ol>
            </details>
          </div>

          {/* Google Tag Manager ID */}
          <div>
            <label
              htmlFor="googleTagManagerId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Google Tag Manager ID
            </label>
            <input
              type="text"
              id="googleTagManagerId"
              {...register("googleTagManagerId")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="GTM-XXXXXXX"
            />
            {errors.googleTagManagerId && (
              <p className="mt-1 text-sm text-red-600">
                {errors.googleTagManagerId.message}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Enter your Google Tag Manager Container ID (e.g., GTM-XXXXXXX).
              Leave blank to disable.
              <br />
              <span className="font-semibold">Note:</span> GTM integration is
              now implemented.
            </p>
            {/* Instructions for GTM ID */}
            <details className="mt-2 text-xs text-gray-600">
              <summary className="cursor-pointer font-medium hover:underline">
                How to find your Google Tag Manager ID?
              </summary>
              <ol className="list-decimal list-inside mt-1 space-y-1 pl-2">
                <li>
                  Sign in to your
                  <a
                    href="https://tagmanager.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mx-1"
                  >
                    Google Tag Manager
                  </a>
                  account.
                </li>
                <li>Select the container for your website.</li>
                <li>
                  Your 'Container ID' (starting with 'GTM-') is displayed in the
                  top header of the workspace overview, near the container name.
                </li>
              </ol>
            </details>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full md:w-auto px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
