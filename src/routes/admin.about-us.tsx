import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@clerk/tanstack-start";
import { useState, useCallback } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getAboutUs, updateAboutUs } from "../server/about-us";
import TiptapEditor from "../components/TiptapEditor";
import ImageUploadField from "../components/admin/ImageUploadField";
import {
  getPresignedUploadUrl,
  deleteImageFromR2,
} from "../services/r2Service";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

// Form validation schema
const aboutUsSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  mission: z.string().optional(),
  vision: z.string().optional(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
});

// Type based on the schema
type AboutUsFormData = z.infer<typeof aboutUsSchema>;

// Default about us info for new records
const defaultAboutUs: Omit<AboutUsFormData, "id"> = {
  title: "About GWM Indonesia",
  content:
    "<p>Great Wall Motor (GWM) Indonesia is dedicated to bringing innovative automotive solutions to the Indonesian market.</p>",
  mission:
    "To provide innovative and sustainable mobility solutions for all Indonesians.",
  vision: "To become the leading provider of new energy vehicles in Indonesia.",
};

export const Route = createFileRoute("/admin/about-us")({
  component: AdminAboutUsPage,
  loader: async () => {
    try {
      const aboutUsContent = await getAboutUs();
      return { aboutUsContent };
    } catch (error) {
      console.error("Error fetching about us content:", error);
      return {
        aboutUsContent: null,
        error: "Failed to load about us content",
      };
    }
  },
});

function AdminAboutUsPage() {
  const { isSignedIn } = useAuth();
  const { aboutUsContent, error } = Route.useLoaderData();
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
  const isNewRecord = !aboutUsContent && !error;

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AboutUsFormData>({
    resolver: zodResolver(aboutUsSchema),
    defaultValues: aboutUsContent
      ? {
          id: aboutUsContent.id,
          title: aboutUsContent.title,
          content: aboutUsContent.content,
          mission: aboutUsContent.mission || undefined,
          vision: aboutUsContent.vision || undefined,
          imageUrl: aboutUsContent.imageUrl || undefined,
          imageAlt: aboutUsContent.imageAlt || undefined,
        }
      : {
          id: 0, // New records start with ID 0
          ...defaultAboutUs,
        },
  });

  // Watch the current values for imageUrl
  const watchImageUrl = watch("imageUrl");

  // Handler for updating rich text content
  const handleContentChange = (value: string) => {
    setValue("content", value, { shouldValidate: true });
  };

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

      // Always clear the imageUrl field - REMOVED
      // setValue("imageUrl", "");
    },
    [setValue] // Keep setValue dependency for now, although it's not used directly here
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
      // Generate a more unique filename
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
      const uploadResult = await getPresignedUploadUrl({
        data: formData,
      } as ServerFunctionParams);

      if (!uploadResult?.presignedUrl || !uploadResult?.publicUrl) {
        throw new Error("Failed to get upload URL");
      }

      setUploadProgress({
        current: 0,
        total: 1,
        message: "Uploading image...",
      });

      // Upload the file directly to R2 using the presigned URL
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const uploadResponse = await fetch(uploadResult.presignedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
  const onSubmit = async (data: AboutUsFormData) => {
    setIsSubmitting(true);
    setSaveSuccess(false);
    setServerError(null);
    let toastId: string | undefined;

    try {
      // Check if we need to upload a new image
      if (
        data.imageUrl?.startsWith("blob:") &&
        newFileMappings[data.imageUrl]
      ) {
        toastId = toast.loading("Uploading image...");
        const file = newFileMappings[data.imageUrl];
        const publicUrl = await uploadImage(file, file.name);

        // Update the form data with the new image URL
        data.imageUrl = publicUrl;

        // Revoke the blob URL to free memory
        URL.revokeObjectURL(data.imageUrl);
        toast.success("Image uploaded successfully", { id: toastId });
      }

      toastId = toast.loading("Saving about us content...", { id: toastId });
      const result = await updateAboutUs({ data });

      if (result.success) {
        setSaveSuccess(true);

        // If this was a new record, update the ID with the one from the server
        if (isNewRecord && result.id) {
          data.id = result.id;
        }

        // Reset form with the updated values to ensure id is maintained
        reset(data);

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

        toast.success("About us content updated successfully", { id: toastId });
        setNewFileMappings({});
      } else {
        setServerError("Failed to update about us content");
        toast.error("Failed to update about us content", { id: toastId });
      }
    } catch (error) {
      console.error("Error updating about us content:", error);
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
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-2xl font-medium text-primary mb-6">
            About Us Content
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
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-2xl font-medium text-primary mb-6">
          {isNewRecord ? "Create About Us Content" : "Edit About Us Content"}
        </h2>

        {isNewRecord && (
          <div className="bg-blue-50 p-4 rounded-md mb-6">
            <p className="text-blue-700">
              No about us content has been set up yet. Please fill out the form
              below to create your about us page content.
            </p>
          </div>
        )}

        {saveSuccess && (
          <div className="bg-green-50 p-4 rounded-md mb-6">
            <p className="text-green-700">
              {isNewRecord
                ? "About us content created successfully!"
                : "About us content updated successfully!"}
            </p>
          </div>
        )}

        {serverError && (
          <div className="bg-red-50 p-4 rounded-md mb-6">
            <p className="text-red-700">{serverError}</p>
          </div>
        )}

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

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Page Title
            </label>
            <input
              type="text"
              id="title"
              {...register("title")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Featured Image */}
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Featured Image
            </label>
            <ImageUploadField<AboutUsFormData>
              fieldName="imageUrl"
              watch={watch}
              setValue={setValue}
              handleRemove={addRemovedUrl}
              enableCrop={true}
              cropAspect={16 / 6}
              addNewFileMapping={addNewFileMapping}
              onFileSelected={(fieldName, file) => {
                const previewUrl = URL.createObjectURL(file);
                setValue(fieldName, previewUrl, {
                  shouldValidate: true,
                });
              }}
              error={errors.imageUrl?.message}
              altText={watch("imageAlt") || "About us featured image"}
            />
            <div className="mt-2">
              <label
                htmlFor="imageAlt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Image Alt Text
              </label>
              <input
                type="text"
                id="imageAlt"
                {...register("imageAlt")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Descriptive text for the image"
              />
            </div>
          </div>

          {/* Content - Rich Text Editor */}
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Main Content
            </label>
            <TiptapEditor
              content={watch("content") || ""}
              onChange={handleContentChange}
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600">
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Mission and Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mission */}
            <div>
              <label
                htmlFor="mission"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Our Mission
              </label>
              <textarea
                id="mission"
                {...register("mission")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Company mission statement"
              />
            </div>

            {/* Vision */}
            <div>
              <label
                htmlFor="vision"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Our Vision
              </label>
              <textarea
                id="vision"
                {...register("vision")}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Company vision statement"
              />
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
                  ? "Create About Us Content"
                  : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
