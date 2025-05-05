import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getContactInfo, updateContactInfo } from "../server/contact-info";
import ImageUploadField from "../components/admin/ImageUploadField";
import {
  getPresignedUploadUrl,
  deleteImageFromR2,
} from "../services/r2Service";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

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
  whatsappUrl: z
    .string()
    .url("Valid WhatsApp URL is required (e.g., https://wa.me/...)")
    .min(1, "WhatsApp URL is required"),
  // New fields for contact page configuration
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
  // Existing logo fields
  logoUrl: z.string().optional(),
  logoWhiteUrl: z.string().optional(),
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
  whatsappUrl:
    "https://wa.me/6287884818135?text=Halo,%20saya%20ingin%20mengetahui%20informasi%20lebih%20lanjut%20mengenai%20product%20GWM.%0ANama%20:%0ADomisili%20:%0AType%20:",
  // New fields defaults
  metaTitle: "Kontak GWM Indonesia - Hubungi Kami",
  metaDescription:
    "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual.",
  metaKeywords: "kontak GWM, dealer GWM, test drive GWM, layanan purna jual",
  metaImage: "",
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
  // Existing logo fields
  logoUrl: "",
  logoWhiteUrl: "",
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
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [newFileMappings, setNewFileMappings] = useState<Record<string, File>>(
    {}
  );
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const isNewRecord = !contactInfo && !error;

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ContactInfoFormData>({
    resolver: zodResolver(contactInfoSchema),
    defaultValues: contactInfo
      ? {
          ...contactInfo,
          // Coerce null values from DB to undefined for the form
          phone: contactInfo.phone ?? "",
          email: contactInfo.email ?? "",
          address: contactInfo.address ?? "",
          facebook: contactInfo.facebook ?? "",
          instagram: contactInfo.instagram ?? "",
          x: contactInfo.x ?? "",
          youtube: contactInfo.youtube ?? "",
          whatsappUrl: contactInfo.whatsappUrl ?? "",
          metaTitle: contactInfo.metaTitle ?? undefined,
          metaDescription: contactInfo.metaDescription ?? undefined,
          metaKeywords: contactInfo.metaKeywords ?? undefined,
          metaImage: contactInfo.metaImage ?? undefined,
          heroDesktopImageUrl: contactInfo.heroDesktopImageUrl ?? undefined,
          heroMobileImageUrl: contactInfo.heroMobileImageUrl ?? undefined,
          heroTitle: contactInfo.heroTitle ?? undefined,
          heroTagline: contactInfo.heroTagline ?? undefined,
          heroSubtitle: contactInfo.heroSubtitle ?? undefined,
          heroHighlightColor: contactInfo.heroHighlightColor ?? undefined,
          formTitle: contactInfo.formTitle ?? undefined,
          formDescription: contactInfo.formDescription ?? undefined,
          gmapsPlaceQuery: contactInfo.gmapsPlaceQuery ?? undefined,
          locationOptions: contactInfo.locationOptions ?? [],
          logoUrl: contactInfo.logoUrl ?? undefined,
          logoWhiteUrl: contactInfo.logoWhiteUrl ?? undefined,
        }
      : {
          id: 0,
          ...defaultContactInfo,
        },
  });

  // Watch the current values for logos
  const watchLogoUrl = watch("logoUrl");
  const watchLogoWhiteUrl = watch("logoWhiteUrl");

  // File mapping management
  const addNewFileMapping = useCallback((blobUrl: string, file: File) => {
    setNewFileMappings((prev) => ({ ...prev, [blobUrl]: file }));
  }, []);

  // Image removal management
  const addRemovedUrl = useCallback(
    (url: string) => {
      // For HTTP URLs, add to the removal list for server cleanup
      if (url?.startsWith("http")) {
        setRemovedImageUrls((prev) =>
          prev.includes(url) ? prev : [...prev, url]
        );
      }

      // For blob URLs, remove from the newFileMappings to clean up memory
      if (url?.startsWith("blob:")) {
        setNewFileMappings((prev) => {
          const newState = { ...prev };
          delete newState[url];
          return newState;
        });

        // Revoke the blob URL to free memory
        URL.revokeObjectURL(url);
      }

      // Determine which field to clear based on the URL - REMOVED
      /*
      if (watchLogoUrl === url) {
        setValue("logoUrl", "");
      } else if (watchLogoWhiteUrl === url) {
        setValue("logoWhiteUrl", "");
      } else if (watch("metaImage") === url) {
        setValue("metaImage", "");
      } else if (watch("heroDesktopImageUrl") === url) {
        setValue("heroDesktopImageUrl", "");
      } else if (watch("heroMobileImageUrl") === url) {
        setValue("heroMobileImageUrl", "");
      }
      */
    },
    [setValue, watchLogoUrl, watchLogoWhiteUrl, watch]
  );

  // Upload image to R2
  const uploadImage = async (
    file: File,
    originalFileName: string
  ): Promise<string> => {
    try {
      setUploadProgress({
        current: 0,
        total: 1,
        message: "Preparing to upload image...",
      });

      // Prepare form data for getting presigned URL
      const formData = new FormData();
      // Generate a unique filename
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const fileExtension = originalFileName.split(".").pop() || "jpg";
      const sanitizedName = originalFileName
        .split(".")[0]
        .replace(/[^a-zA-Z0-9-_]/g, "_");
      const uniqueFileName = `${timestamp}-${randomStr}-${sanitizedName}.${fileExtension}`;

      formData.append("fileName", uniqueFileName);
      formData.append("fileType", file.type);

      setUploadProgress({
        current: 0,
        total: 1,
        message: "Getting upload URL...",
      });

      type ServerFunctionParams = { data: FormData };
      const uploadResult = await getPresignedUploadUrl({ data: formData });

      if (!uploadResult?.presignedUrl || !uploadResult?.publicUrl) {
        throw new Error("Failed to get upload URL");
      }

      setUploadProgress({
        current: 0,
        total: 1,
        message: "Uploading image...",
      });

      // Upload the file directly to R2 using the presigned URL
      const uploadResponse = await fetch(uploadResult.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Image upload failed: ${uploadResponse.statusText}`);
      }

      setUploadProgress({
        current: 1,
        total: 1,
        message: "Upload complete!",
      });

      return uploadResult.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    }
  };

  // Submit handler
  const onSubmit = async (data: ContactInfoFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setServerError(null);
    let toastId: string | undefined;
    const dataToSubmit = { ...data };

    try {
      // Upload Main Logo if necessary
      if (
        dataToSubmit.logoUrl?.startsWith("blob:") &&
        newFileMappings[dataToSubmit.logoUrl]
      ) {
        toastId = toast.loading("Uploading Main Logo...", { id: toastId });
        const file = newFileMappings[dataToSubmit.logoUrl];
        const publicUrl = await uploadImage(file, file.name);
        dataToSubmit.logoUrl = publicUrl;
        URL.revokeObjectURL(dataToSubmit.logoUrl);
        toast.success("Main Logo uploaded", { id: toastId });
      }

      // Upload White Logo if necessary
      if (
        dataToSubmit.logoWhiteUrl?.startsWith("blob:") &&
        newFileMappings[dataToSubmit.logoWhiteUrl]
      ) {
        toastId = toast.loading("Uploading White Logo...", { id: toastId });
        const file = newFileMappings[dataToSubmit.logoWhiteUrl];
        const publicUrl = await uploadImage(file, file.name);
        dataToSubmit.logoWhiteUrl = publicUrl;
        URL.revokeObjectURL(dataToSubmit.logoWhiteUrl);
        toast.success("White Logo uploaded", { id: toastId });
      }

      toastId = toast.loading("Saving contact info...", { id: toastId });
      const result = await updateContactInfo({ data: dataToSubmit });

      if (result.success) {
        setSaveSuccess(true);

        // If this was a new record, update the ID with the one from the server
        if (isNewRecord && result.id) {
          dataToSubmit.id = result.id;
        }

        // Reset form with the updated values to ensure id and URLs are maintained
        reset(dataToSubmit);

        // Delete any removed images from R2
        if (removedImageUrls.length > 0) {
          const deletionToastId = toast.loading("Cleaning up old images...");
          for (const imageUrl of removedImageUrls) {
            try {
              const deleteFormData = new FormData();
              deleteFormData.append("imageUrl", imageUrl);
              await deleteImageFromR2({ data: deleteFormData });
            } catch (deleteError) {
              console.error(`Failed to delete image ${imageUrl}:`, deleteError);
            }
          }
          toast.success("Cleanup complete", { id: deletionToastId });
          setRemovedImageUrls([]);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
        toast.success("Contact info updated successfully", { id: toastId });
        setNewFileMappings({});
      } else {
        setServerError("Failed to update contact info");
        toast.error("Failed to update contact info", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating contact info:", error);
      setServerError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
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

        {/* Upload Progress Indicator - Copied from About Us */}
        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center mb-1">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              <p>{uploadProgress.message}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-width duration-300"
                style={{
                  width: `${uploadProgress.total === 0 ? 0 : Math.round((uploadProgress.current / uploadProgress.total) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs mt-1">
              {uploadProgress.current} of {uploadProgress.total} completed
            </p>
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

          {/* WhatsApp URL */}
          <div>
            <label
              htmlFor="whatsappUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              WhatsApp URL
            </label>
            <input
              type="text"
              id="whatsappUrl"
              {...register("whatsappUrl")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
              placeholder="https://wa.me/..."
            />
            {errors.whatsappUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.whatsappUrl.message}
              </p>
            )}
          </div>

          {/* Meta Information Section */}
          <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-200 mt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Meta Information for Contact Page
            </h3>

            {/* Meta Title */}
            <div>
              <label
                htmlFor="metaTitle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta Title
              </label>
              <input
                type="text"
                id="metaTitle"
                {...register("metaTitle")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                placeholder="Kontak GWM Indonesia - Hubungi Kami"
              />
              <p className="mt-1 text-xs text-gray-500">
                Title that appears in search engine results and browser tabs.
              </p>
            </div>

            {/* Meta Description */}
            <div>
              <label
                htmlFor="metaDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                {...register("metaDescription")}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                placeholder="Brief description of the contact page for search engines"
              />
              <p className="mt-1 text-xs text-gray-500">
                Description that appears in search engine results (recommended:
                150-160 characters).
              </p>
            </div>

            {/* Meta Keywords */}
            <div>
              <label
                htmlFor="metaKeywords"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta Keywords
              </label>
              <input
                type="text"
                id="metaKeywords"
                {...register("metaKeywords")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                placeholder="kontak GWM, dealer GWM, test drive GWM, layanan purna jual"
              />
              <p className="mt-1 text-xs text-gray-500">
                Keywords related to the contact page, separated by commas.
              </p>
            </div>

            {/* Meta Image */}
            <div>
              <label
                htmlFor="metaImage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta Image
              </label>
              <ImageUploadField<ContactInfoFormData>
                fieldName="metaImage"
                watch={watch}
                setValue={setValue}
                handleRemove={addRemovedUrl}
                enableCrop={true}
                cropAspect={1.91 / 1}
                addNewFileMapping={addNewFileMapping}
                onFileSelected={(fieldName, file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setValue(fieldName, previewUrl, {
                    shouldValidate: true,
                  });
                }}
                error={errors.metaImage?.message}
                altText="Meta image for contact page"
              />
              <p className="mt-1 text-xs text-gray-500">
                Image that appears when the contact page is shared on social
                media (recommended size: 1200x630 pixels).
              </p>
            </div>
          </div>

          {/* Contact Page Hero Section */}
          <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-200 mt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Contact Page Hero Section
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Hero Desktop Image */}
              <div>
                <label
                  htmlFor="heroDesktopImageUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Desktop Image
                </label>
                <ImageUploadField<ContactInfoFormData>
                  fieldName="heroDesktopImageUrl"
                  watch={watch}
                  setValue={setValue}
                  handleRemove={addRemovedUrl}
                  enableCrop={true}
                  cropAspect={16 / 9}
                  addNewFileMapping={addNewFileMapping}
                  onFileSelected={(fieldName, file) => {
                    const previewUrl = URL.createObjectURL(file);
                    setValue(fieldName, previewUrl, {
                      shouldValidate: true,
                    });
                  }}
                  error={errors.heroDesktopImageUrl?.message}
                  altText="Hero desktop image"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Desktop hero image (recommended size: 1920x600 pixels).
                </p>
              </div>

              {/* Hero Mobile Image */}
              <div>
                <label
                  htmlFor="heroMobileImageUrl"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Mobile Image
                </label>
                <ImageUploadField<ContactInfoFormData>
                  fieldName="heroMobileImageUrl"
                  watch={watch}
                  setValue={setValue}
                  handleRemove={addRemovedUrl}
                  enableCrop={true}
                  cropAspect={9 / 16}
                  addNewFileMapping={addNewFileMapping}
                  onFileSelected={(fieldName, file) => {
                    const previewUrl = URL.createObjectURL(file);
                    setValue(fieldName, previewUrl, {
                      shouldValidate: true,
                    });
                  }}
                  error={errors.heroMobileImageUrl?.message}
                  altText="Hero mobile image"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Mobile hero image (recommended size: 800x600 pixels).
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Hero Title */}
              <div>
                <label
                  htmlFor="heroTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Title
                </label>
                <input
                  type="text"
                  id="heroTitle"
                  {...register("heroTitle")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Hubungi Kami"
                />
              </div>

              {/* Hero Tagline */}
              <div>
                <label
                  htmlFor="heroTagline"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Tagline
                </label>
                <input
                  type="text"
                  id="heroTagline"
                  {...register("heroTagline")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="GWM Jakarta"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Hero Subtitle */}
              <div>
                <label
                  htmlFor="heroSubtitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Subtitle
                </label>
                <input
                  type="text"
                  id="heroSubtitle"
                  {...register("heroSubtitle")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Diskusikan kebutuhan mobil Anda dengan tim kami yang siap membantu"
                />
              </div>

              {/* Hero Highlight Color */}
              <div>
                <label
                  htmlFor="heroHighlightColor"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Hero Highlight Color
                </label>
                <div className="flex">
                  <input
                    type="color"
                    id="heroHighlightColor"
                    {...register("heroHighlightColor")}
                    className="h-10 w-10 border border-gray-300 rounded-md cursor-pointer"
                  />
                  <input
                    type="text"
                    value={watch("heroHighlightColor")}
                    onChange={(e) =>
                      setValue("heroHighlightColor", e.target.value)
                    }
                    className="w-full ml-2 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                    placeholder="#CF0E0E"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Color for highlighted text in the hero section (hex code).
                </p>
              </div>
            </div>
          </div>

          {/* Form Configuration Section */}
          <div className="grid grid-cols-1 gap-6 pt-4 border-t border-gray-200 mt-6">
            <h3 className="text-lg font-medium text-gray-900">
              Contact Form Configuration
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Form Title */}
              <div>
                <label
                  htmlFor="formTitle"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Form Title
                </label>
                <input
                  type="text"
                  id="formTitle"
                  {...register("formTitle")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Kontak GWM Jakarta"
                />
              </div>

              {/* Form Description */}
              <div>
                <label
                  htmlFor="formDescription"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Form Description
                </label>
                <input
                  type="text"
                  id="formDescription"
                  {...register("formDescription")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Dealer resmi GWM Jakarta siap membantu kebutuhan mobil Anda dengan layanan terbaik"
                />
              </div>
            </div>

            {/* Google Maps Place Query */}
            <div>
              <label
                htmlFor="gmapsPlaceQuery"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Google Maps Place Query
              </label>
              <input
                type="text"
                id="gmapsPlaceQuery"
                {...register("gmapsPlaceQuery")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                placeholder="AGORA+Mall,+Jalan+M.H.+Thamrin,+Kebon+Melati,+Central+Jakarta+City,+Jakarta,+Indonesia"
              />
              <p className="mt-1 text-xs text-gray-500">
                Query for the Google Maps embed (use + for spaces).
              </p>

              {/* Google Maps Preview */}
              {watch("gmapsPlaceQuery") && (
                <div className="mt-2 h-48 rounded-lg overflow-hidden border border-gray-300">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/place?q=${watch("gmapsPlaceQuery")}&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location Preview"
                    className="w-full h-full"
                  />
                </div>
              )}
            </div>

            {/* Location Options */}
            <div>
              <label
                htmlFor="locationOptions"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location Options
              </label>
              <div className="flex flex-wrap gap-2">
                {watch("locationOptions")?.map((location, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-gray-100 px-2 py-1 rounded"
                  >
                    <span className="text-sm">{location}</span>
                    <button
                      type="button"
                      className="ml-1 text-gray-500 hover:text-red-500"
                      onClick={() => {
                        const currentLocations = watch("locationOptions") || [];
                        setValue(
                          "locationOptions",
                          currentLocations.filter((_, i) => i !== index)
                        );
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <title>Remove Location</title>
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  id="newLocation"
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                  placeholder="Add new location"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const currentLocations = watch("locationOptions") || [];
                      setValue("locationOptions", [
                        ...currentLocations,
                        e.currentTarget.value.trim(),
                      ]);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
                  onClick={() => {
                    const input = document.getElementById(
                      "newLocation"
                    ) as HTMLInputElement;
                    if (input && input.value.trim()) {
                      const currentLocations = watch("locationOptions") || [];
                      setValue("locationOptions", [
                        ...currentLocations,
                        input.value.trim(),
                      ]);
                      input.value = "";
                    }
                  }}
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Location options for the contact form dropdown.
              </p>
            </div>
          </div>

          {/* Logos Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200 mt-6">
            {/* Main Logo */}
            <div>
              <label
                htmlFor="logoUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Main Logo
              </label>
              <ImageUploadField<ContactInfoFormData>
                fieldName="logoUrl"
                watch={watch}
                setValue={setValue}
                handleRemove={addRemovedUrl}
                enableCrop={false}
                onFileSelected={(fieldName, file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setValue(fieldName, previewUrl, {
                    shouldValidate: true,
                  });
                }}
                error={errors.logoUrl?.message}
                altText="Main company logo"
              />
              {errors.logoUrl && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.logoUrl.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Ideal dimensions: 300px width x 68px height. Used in Navbar
                (light background) and Footer.
              </p>
            </div>

            {/* White Logo */}
            <div>
              <label
                htmlFor="logoWhiteUrl"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                White Logo
              </label>
              <ImageUploadField<ContactInfoFormData>
                fieldName="logoWhiteUrl"
                watch={watch}
                setValue={setValue}
                handleRemove={addRemovedUrl}
                enableCrop={false}
                onFileSelected={(fieldName, file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setValue(fieldName, previewUrl, {
                    shouldValidate: true,
                  });
                }}
                error={errors.logoWhiteUrl?.message}
                altText="White company logo"
              />
              {errors.logoWhiteUrl && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.logoWhiteUrl.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Ideal dimensions: 300px width x 68px height. Used in Navbar when
                scrolled (dark background).
              </p>
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
