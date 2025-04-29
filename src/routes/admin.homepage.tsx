import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/tanstack-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type FieldPath } from "react-hook-form";
import { z } from "zod";
import {
  Home,
  Save,
  Plus,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getHomepageConfig,
  updateHomepageConfig,
  type HomepageConfigWithSections,
} from "../server/homepage";
import {
  getPresignedUploadUrl,
  deleteImageFromR2,
} from "../services/r2Service";
import ImageUploadField from "../components/admin/ImageUploadField";
import type { GalleryImage, CarModelSpecificationCategory } from "../db/schema";
import MultiImageUploadField from "../components/admin/MultiImageUploadField";

// Define schema for a single feature section within the form
const featureSectionSchema = z.object({
  id: z.number().optional(),
  order: z.number().optional(),
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  desktopImageUrls: z
    .array(z.string().url("Must be a valid URL or temporary blob URL"))
    .min(1, "At least one Desktop Image is required"),
  mobileImageUrls: z
    .array(z.string().url("Must be a valid URL or temporary blob URL"))
    .optional()
    .default([]),
  imageAlt: z.string().optional(),
  features: z.string().optional(),
  primaryButtonText: z.string().optional(),
  primaryButtonLink: z.string().optional().or(z.literal("")),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional().or(z.literal("")),
  // For server-side compatibility
  desktopImageUrl: z.string().optional(),
  mobileImageUrl: z.string().optional(),
});

// Update form validation schema
const homepageFormSchema = z.object({
  heroDesktopImageUrl: z
    .string()
    .url("Must be a valid URL or temporary blob URL")
    .min(1, "Desktop image URL is required"),
  heroMobileImageUrl: z
    .string()
    .url("Must be a valid URL or temporary blob URL")
    .min(1, "Mobile image URL is required"),
  heroTitle: z.string().min(1, "Hero title is required"),
  heroSubtitle: z.string().optional(),
  heroPrimaryButtonText: z.string().optional(),
  heroPrimaryButtonLink: z.string().optional().or(z.literal("")),
  heroSecondaryButtonText: z.string().optional(),
  heroSecondaryButtonLink: z.string().optional().or(z.literal("")),
  featureSections: z.array(featureSectionSchema).optional(),
});

// Update form data type
type HomepageFormData = z.infer<typeof homepageFormSchema>;

function generateUniquePrefix(): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${randomStr}`;
}

function constructFileName(
  originalName: string,
  suffix?: string,
  uniquePrefix?: string
): string {
  const prefix = uniquePrefix || generateUniquePrefix();
  const parts = originalName.split(".");
  const extension = parts.pop() || "";
  const baseName = parts
    .join(".")
    .replace(/[^a-zA-Z0-9-_]/g, "_")
    .substring(0, 50);
  return suffix
    ? `${prefix}-${baseName}_${suffix}.${extension}`
    : `${prefix}-${baseName}.${extension}`;
}

const defaultFeatureSectionValue: z.infer<typeof featureSectionSchema> = {
  title: "",
  subtitle: "",
  description: "",
  desktopImageUrls: [],
  mobileImageUrls: [],
  imageAlt: "",
  features: "",
  primaryButtonText: "Learn More",
  primaryButtonLink: "",
  secondaryButtonText: "",
  secondaryButtonLink: "",
};

// Update default values
const defaultValues: HomepageFormData = {
  heroDesktopImageUrl: "",
  heroMobileImageUrl: "",
  heroTitle: "GWM Indonesia",
  heroSubtitle: "Explore Premium SUVs and Innovative Technology",
  heroPrimaryButtonText: "Explore Models",
  heroPrimaryButtonLink: "/tipe-mobil",
  heroSecondaryButtonText: "Contact Us",
  heroSecondaryButtonLink: "/kontak",
  featureSections: [defaultFeatureSectionValue],
};

// Define utility functions outside the component
const parseFeaturesString = (featuresStr: string | undefined): string[] => {
  if (!featuresStr) return [];
  return featuresStr
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0);
};

const formatFeaturesArray = (featuresArr: string[] | undefined): string => {
  if (!featuresArr) return "";
  return featuresArr.join("\n");
};

// Function adapted from admin.models.$id.tsx
// Now optimized to upload/optimize for a specific target (desktop/mobile)
// and return a single URL.
async function uploadAndOptimizeHomepageImage(
  file: File,
  originalFileName: string,
  optimize: boolean, // Pass optimization flag
  target: "desktop" | "mobile", // Specify the target type
  setProgress: (
    progress: { current: number; total: number; message: string } | null
  ) => void
): Promise<string> {
  // Returns a single URL
  console.log(
    `Uploading homepage image: ${originalFileName}, Size: ${file.size / 1024}KB, Target: ${target}, Optimize: ${optimize}`
  );
  const uniquePrefix = generateUniquePrefix();
  // Base filename includes the unique prefix but no suffix yet
  const baseFileName = constructFileName(
    originalFileName,
    undefined,
    uniquePrefix
  );
  // Determine the final filename based on target
  const finalFileName =
    target === "mobile"
      ? constructFileName(originalFileName, "mobile", uniquePrefix)
      : baseFileName; // Desktop uses the base name

  // --- 1. Upload Original Image (Only if target is desktop and not optimizing heavily, or if optimization is off) ---
  // Simplification: Let's always upload the *intended* final version directly.
  // If optimizing, we'll upload the *optimized* version to finalFileName.
  // If not optimizing, we upload the *original* file to finalFileName.

  let fileToUpload = file;
  let fileType = file.type;
  let finalUrl = ""; // Initialize finalUrl

  // --- 2. Optimize (if enabled) ---
  if (optimize) {
    console.log(
      `Starting optimization process for ${originalFileName} (Target: ${target})`
    );
    try {
      setProgress({
        current: 0,
        total: 1,
        message: `Optimizing for ${target}...`,
      });

      const { getTransformationDownloadUrls } = await import(
        "../services/cloudflareImageService"
      );

      // First, upload the original to a temporary location to get a URL for transformation
      const tempFormData = new FormData();
      const tempFileName = `${baseFileName}_temp`;
      tempFormData.append("fileName", tempFileName);
      tempFormData.append("fileType", file.type);
      type ServerFunctionParams = { data: FormData };
      const tempUploadResult = await getPresignedUploadUrl({
        data: tempFormData,
      } as ServerFunctionParams);
      if (!tempUploadResult.presignedUrl || !tempUploadResult.publicUrl) {
        throw new Error("Failed to get temp upload URL for transformation");
      }
      const tempOriginalUploadResponse = await fetch(
        tempUploadResult.presignedUrl,
        {
          method: "PUT",
          body: file,
          headers: { "Content-Type": file.type },
        }
      );
      if (!tempOriginalUploadResponse.ok) {
        throw new Error(
          `Temp original image upload failed: ${tempOriginalUploadResponse.statusText}`
        );
      }
      const originalUrlForTransform = tempUploadResult.publicUrl;
      console.log(
        `Temp image uploaded for transform: ${originalUrlForTransform}`
      );

      // Get transformation URLs based on the temp uploaded image
      const transformUrls = await getTransformationDownloadUrls(
        originalUrlForTransform
      );
      const targetTransformUrl =
        target === "mobile" ? transformUrls.mobile : transformUrls.desktop;
      console.log(`Transformation URL for ${target}: ${targetTransformUrl}`);

      // Download the specifically transformed version
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(targetTransformUrl, {
        signal: controller.signal,
        headers: { Accept: "image/*" },
        cache: "no-cache",
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `Failed to download transformed ${target} version: ${response.statusText}`
        );
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.startsWith("image/")) {
        throw new Error(
          `Invalid content type ${contentType} for transformed ${target} version`
        );
      }
      const blob = await response.blob();
      console.log(
        `Downloaded optimized ${target} version, size: ${blob.size / 1024}KB`
      );
      // The optimized blob is now what we want to upload with the *final* filename
      // Convert Blob back to File to maintain type consistency if needed elsewhere
      // and provide a filename for potential backend use
      fileToUpload = new File([blob], finalFileName, { type: blob.type });
      fileType = blob.type;

      // TODO: Optionally delete the temporary image from R2 using originalUrlForTransform
      // (Requires delete permission/functionality based on URL)
    } catch (error) {
      console.error(
        `[Optimization Error ${target}] Failed:`,
        error,
        "Uploading original file as fallback."
      );
      // Fallback: Upload the original file if optimization fails
      fileToUpload = file;
      fileType = file.type;
      setProgress({
        current: 0,
        total: 1,
        message: `Optimization failed, uploading original for ${target}...`,
      });
    }
  } else {
    console.log(
      `Skipping optimization for ${originalFileName} (Target: ${target})`
    );
    fileToUpload = file;
    fileType = file.type;
  }

  // --- 3. Upload Final Version ---
  console.log(`Uploading final version for ${target} to ${finalFileName}`);
  const finalFormData = new FormData();
  finalFormData.append("fileName", finalFileName);
  finalFormData.append("fileType", fileType);
  type ServerFunctionParams = { data: FormData }; // Re-declare type alias if needed
  const finalUploadResult = await getPresignedUploadUrl({
    data: finalFormData,
  } as ServerFunctionParams);
  if (!finalUploadResult.presignedUrl || !finalUploadResult.publicUrl) {
    throw new Error(`Failed to get final upload URL for ${target}`);
  }

  setProgress({
    current: 0,
    total: 1,
    message: `Uploading final ${target} version...`,
  });

  const finalUploadResponse = await fetch(finalUploadResult.presignedUrl, {
    method: "PUT",
    body: fileToUpload,
    headers: { "Content-Type": fileType },
  });

  if (!finalUploadResponse.ok) {
    throw new Error(
      `Final ${target} image upload failed: ${finalUploadResponse.statusText}`
    );
  }
  finalUrl = finalUploadResult.publicUrl;
  console.log(`Successfully uploaded final ${target} version: ${finalUrl}`);
  setProgress({
    current: 1, // Mark upload complete
    total: 1,
    message: `Upload complete for ${target}.`,
  });

  // --- 4. Return the Single Final URL ---
  return finalUrl;
}

export const Route = createFileRoute("/admin/homepage")({
  component: HomepageEditorPage,
  loader: async () => {
    try {
      const configResult = await getHomepageConfig();
      return { config: configResult };
    } catch (error) {
      console.error("Error loading homepage data:", error);
      toast.error("Failed to load homepage data.");
      return { config: null };
    }
  },
});

function HomepageEditorPage() {
  const { config } = Route.useLoaderData();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [newFileMappings, setNewFileMappings] = useState<Record<string, File>>(
    {}
  );

  const addNewFileMapping = useCallback((blobUrl: string, file: File) => {
    setNewFileMappings((prev) => ({ ...prev, [blobUrl]: file }));
  }, []);

  const removeNewFileMapping = useCallback((blobUrl: string) => {
    setNewFileMappings((prev) => {
      const newState = { ...prev };
      delete newState[blobUrl];
      return newState;
    });
  }, []);

  const addRemovedUrl = useCallback(
    (url: string) => {
      if (!url) return; // Guard against null/undefined URLs

      if (url.startsWith("http")) {
        // Add persisted URLs (http/https) to the list for potential server-side deletion
        setRemovedImageUrls((prev) =>
          prev.includes(url) ? prev : [...prev, url]
        );
      } else if (url.startsWith("blob:")) {
        // If it's a newly added image (blob URL), remove it from the mapping
        // and revoke the object URL.
        // We can reuse the removeNewFileMapping logic here.
        removeNewFileMapping(url);
      }
      // Note: Clearing the specific field value (e.g., setValue('heroDesktopImageUrl', ''))
      // should happen within the ImageUploadField/MultiImageUploadField components
      // when their internal remove handler calls this callback.
    },
    [removeNewFileMapping] // Dependency: Include removeNewFileMapping
  );

  const prepareConfigData = useCallback(
    (cfg: HomepageConfigWithSections | null): HomepageFormData => {
      if (!cfg) return defaultValues;
      return {
        heroDesktopImageUrl: cfg.heroDesktopImageUrl || "",
        heroMobileImageUrl: cfg.heroMobileImageUrl || "",
        heroTitle: cfg.heroTitle || "",
        heroSubtitle: cfg.heroSubtitle || "",
        heroPrimaryButtonText: cfg.heroPrimaryButtonText || "",
        heroPrimaryButtonLink: cfg.heroPrimaryButtonLink || "",
        heroSecondaryButtonText: cfg.heroSecondaryButtonText || "",
        heroSecondaryButtonLink: cfg.heroSecondaryButtonLink || "",
        featureSections: cfg.featureSections?.map((section) => ({
          id: section.id,
          order: section.order,
          title: section.title || "",
          subtitle: section.subtitle || "",
          description: section.description || "",
          desktopImageUrls: section.desktopImageUrls || [],
          mobileImageUrls: section.mobileImageUrls || [],
          imageAlt: section.imageAlt || "",
          features: formatFeaturesArray(section.features || []),
          primaryButtonText: section.primaryButtonText || "",
          primaryButtonLink: section.primaryButtonLink || "",
          secondaryButtonText: section.secondaryButtonText || "",
          secondaryButtonLink: section.secondaryButtonLink || "",
        })) || [defaultFeatureSectionValue],
      };
    },
    []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<HomepageFormData>({
    resolver: zodResolver(homepageFormSchema),
    defaultValues: prepareConfigData(config),
  });

  useEffect(() => {
    reset(prepareConfigData(config));
  }, [config, reset, prepareConfigData]);

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: "featureSections",
  });

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isSubmitting || uploadProgress) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting, uploadProgress]);

  const onSubmit = async (data: HomepageFormData) => {
    setIsSubmitting(true);
    let toastId: string | undefined = undefined;
    const imagesToDeleteOnSuccess = [...removedImageUrls];

    const filesToUploadMap = { ...newFileMappings };

    try {
      const isValid = await trigger();
      if (!isValid) {
        toast.error("Please fix form errors.");
        setIsSubmitting(false);
        return;
      }

      toastId = toast.loading("Preparing data...");

      const uploadTasks: {
        blobUrl: string;
        file: File;
        target: "desktop" | "mobile";
        fieldName: string;
        sectionIndex: number;
      }[] = [];

      for (const [sectionIndex, section] of data.featureSections?.entries() ||
        []) {
        for (const url of section.desktopImageUrls || []) {
          if (url.startsWith("blob:") && filesToUploadMap[url]) {
            uploadTasks.push({
              blobUrl: url,
              file: filesToUploadMap[url],
              target: "desktop",
              fieldName: `featureSections.${sectionIndex}.desktopImageUrls`,
              sectionIndex,
            });
          }
        }
        for (const url of section.mobileImageUrls || []) {
          if (url.startsWith("blob:") && filesToUploadMap[url]) {
            uploadTasks.push({
              blobUrl: url,
              file: filesToUploadMap[url],
              target: "mobile",
              fieldName: `featureSections.${sectionIndex}.mobileImageUrls`,
              sectionIndex,
            });
          }
        }
      }

      const finalData = JSON.parse(JSON.stringify(data)) as HomepageFormData;
      const uploadedUrlMap: Record<string, string> = {};

      if (uploadTasks.length > 0) {
        const totalUploads = uploadTasks.length;
        setUploadProgress({
          current: 0,
          total: totalUploads,
          message: "Starting uploads...",
        });
        toastId = toast.loading(`Uploading ${totalUploads} image(s)...`, {
          id: toastId,
        });

        type UploadResult = {
          success: boolean;
          blobUrl: string;
          publicUrl?: string;
          error?: unknown;
          originalFileName: string;
        };

        const uploadPromises = uploadTasks.map(
          async (task): Promise<UploadResult> => {
            try {
              setUploadProgress((prev) => ({
                current: prev?.current ?? 0,
                total: prev?.total ?? totalUploads,
                message: `Uploading: ${task.file.name}...`,
              }));
              const publicUrl = await uploadAndOptimizeHomepageImage(
                task.file,
                task.file.name,
                true,
                task.target,
                (progress) => {
                  /* Maybe update detailed progress later */
                }
              );
              return {
                success: true,
                blobUrl: task.blobUrl,
                publicUrl,
                originalFileName: task.file.name,
              };
            } catch (error) {
              console.error(`Failed to upload ${task.file.name}:`, error);
              return {
                success: false,
                blobUrl: task.blobUrl,
                error,
                originalFileName: task.file.name,
              };
            }
          }
        );

        const results = await Promise.all(uploadPromises);

        let successfulUploads = 0;
        const failedUploads: { name: string; error: unknown }[] = [];

        for (const result of results) {
          if (result.success && result.publicUrl) {
            successfulUploads++;
            uploadedUrlMap[result.blobUrl] = result.publicUrl;
          } else {
            failedUploads.push({
              name: result.originalFileName,
              error: result.error,
            });
          }
        }

        setUploadProgress({
          current: successfulUploads,
          total: totalUploads,
          message: `Upload complete. ${successfulUploads}/${totalUploads} successful.`,
        });

        if (failedUploads.length > 0) {
          const failedNames = failedUploads.map((f) => f.name).join(", ");
          toast.error(`Failed to upload: ${failedNames}. Submit cancelled.`, {
            id: toastId,
            duration: 6000,
          });
          setIsSubmitting(false);
          setUploadProgress(null);
          return;
        }

        toast.success(`${successfulUploads} image(s) uploaded.`, {
          id: toastId,
        });

        finalData.featureSections = finalData.featureSections?.map(
          (section) => ({
            ...section,
            desktopImageUrls: section.desktopImageUrls?.map(
              (url) => uploadedUrlMap[url] || url
            ),
            mobileImageUrls: section.mobileImageUrls?.map(
              (url) => uploadedUrlMap[url] || url
            ),
          })
        );

        for (const blobUrl of Object.keys(uploadedUrlMap)) {
          URL.revokeObjectURL(blobUrl);
        }
      }

      const dataForServer = {
        heroDesktopImageUrl: finalData.heroDesktopImageUrl,
        heroMobileImageUrl: finalData.heroMobileImageUrl,
        heroTitle: finalData.heroTitle,
        heroSubtitle: finalData.heroSubtitle,
        heroPrimaryButtonText: finalData.heroPrimaryButtonText,
        heroPrimaryButtonLink: finalData.heroPrimaryButtonLink,
        heroSecondaryButtonText: finalData.heroSecondaryButtonText,
        heroSecondaryButtonLink: finalData.heroSecondaryButtonLink,
        featureSections: (finalData.featureSections || []).map(
          (section, index) => {
            const filteredDesktopUrls = (section.desktopImageUrls || []).filter(
              (url) =>
                !imagesToDeleteOnSuccess.includes(url) && url.startsWith("http")
            );
            const filteredMobileUrls = (section.mobileImageUrls || []).filter(
              (url) =>
                !imagesToDeleteOnSuccess.includes(url) && url.startsWith("http")
            );

            // If no mobile images, use desktop images as fallback
            const finalMobileUrls =
              filteredMobileUrls.length > 0
                ? filteredMobileUrls
                : filteredDesktopUrls;

            return {
              ...section,
              id: section.id,
              order: index,
              features: parseFeaturesString(section.features),
              desktopImageUrls: filteredDesktopUrls,
              mobileImageUrls: finalMobileUrls,
              // For server compatibility - use first URL if available
              desktopImageUrl: filteredDesktopUrls[0] || "",
              mobileImageUrl: finalMobileUrls[0] || "",
            };
          }
        ),
      };

      let validationError = false;
      for (const [index, section] of dataForServer.featureSections.entries()) {
        if (section.desktopImageUrls.length === 0) {
          toast.error(
            `Section ${index + 1} requires at least one desktop image after processing.`
          );
          validationError = true;
        }
        // Mobile images are optional - no validation needed for them
      }
      if (validationError) {
        setIsSubmitting(false);
        setUploadProgress(null);
        return;
      }

      toastId = toast.loading("Saving configuration...", { id: toastId });
      const result = await updateHomepageConfig({ data: dataForServer });

      if (result.success && result.config) {
        toast.success("Configuration saved!", { id: toastId });

        reset(prepareConfigData(result.config as HomepageConfigWithSections));
        setNewFileMappings({});
        setRemovedImageUrls([]);

        if (imagesToDeleteOnSuccess.length > 0) {
          await new Promise((res) => setTimeout(res, 500));
          const deletionToastId = toast.loading(
            `Deleting ${imagesToDeleteOnSuccess.length} old image(s)...`
          );
          let deletedCount = 0;
          let failedCount = 0;
          for (const imageUrl of imagesToDeleteOnSuccess) {
            try {
              const deleteFormData = new FormData();
              deleteFormData.append("imageUrl", imageUrl);
              await deleteImageFromR2({ data: deleteFormData });
              deletedCount++;
            } catch (error) {
              failedCount++;
              console.error(`Failed to delete image ${imageUrl}:`, error);
            }
          }

          if (failedCount > 0) {
            toast.error(
              `Failed to delete ${failedCount} old image(s). Config was saved.`,
              {
                id: deletionToastId,
                duration: 5000,
              }
            );
          } else if (deletedCount > 0) {
            toast.success(
              `Deleted ${deletedCount} old image(s). Config saved.`,
              {
                id: deletionToastId,
              }
            );
          } else {
            toast.dismiss(deletionToastId);
          }
        }
      } else {
        toast.error(result.message || "Failed to save.", { id: toastId });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error.",
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!isSignedIn) return null;

  return (
    <div className="p-4 md:p-8 pb-24 max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <Link
          to="/admin"
          className="text-gray-500 hover:text-gray-700 mr-3 p-1 rounded-md hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <Home className="h-6 w-6 mr-2 text-primary" />
        <h1 className="text-2xl font-semibold text-gray-800">
          Manage Homepage
        </h1>
      </div>

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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-5">
            Hero Section
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div id="heroDesktopImageContainer">
              <label
                htmlFor="heroDesktopImageContainer"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Desktop Background Image (16:9)
              </label>
              <ImageUploadField<HomepageFormData>
                fieldName="heroDesktopImageUrl"
                watch={watch}
                setValue={setValue}
                handleRemove={addRemovedUrl}
                onFileSelected={(fieldName, file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setValue(
                    fieldName as FieldPath<HomepageFormData>,
                    previewUrl,
                    {
                      shouldValidate: true,
                    }
                  );
                  addNewFileMapping(previewUrl, file);
                }}
                error={errors.heroDesktopImageUrl?.message}
                altText="Hero desktop background"
              />
            </div>
            <div id="heroMobileImageContainer">
              <label
                htmlFor="heroMobileImageContainer"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mobile Background Image (e.g., 9:16)
              </label>
              <ImageUploadField<HomepageFormData>
                fieldName="heroMobileImageUrl"
                watch={watch}
                setValue={setValue}
                handleRemove={addRemovedUrl}
                onFileSelected={(fieldName, file) => {
                  const previewUrl = URL.createObjectURL(file);
                  setValue(
                    fieldName as FieldPath<HomepageFormData>,
                    previewUrl,
                    {
                      shouldValidate: true,
                    }
                  );
                  addNewFileMapping(previewUrl, file);
                }}
                error={errors.heroMobileImageUrl?.message}
                altText="Hero mobile background"
              />
            </div>
            <div className="md:col-span-2">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.heroTitle && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.heroTitle.message}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label
                htmlFor="heroSubtitle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Hero Subtitle (Optional)
              </label>
              <input
                type="text"
                id="heroSubtitle"
                {...register("heroSubtitle")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="heroPrimaryButtonText"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Primary Button Text (Optional)
              </label>
              <input
                type="text"
                id="heroPrimaryButtonText"
                {...register("heroPrimaryButtonText")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="heroPrimaryButtonLink"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Primary Button Link (Optional)
              </label>
              <input
                type="text"
                id="heroPrimaryButtonLink"
                {...register("heroPrimaryButtonLink")}
                placeholder="e.g., /tipe-mobil or https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="heroSecondaryButtonText"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Secondary Button Text (Optional)
              </label>
              <input
                type="text"
                id="heroSecondaryButtonText"
                {...register("heroSecondaryButtonText")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label
                htmlFor="heroSecondaryButtonLink"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Secondary Button Link (Optional)
              </label>
              <input
                type="text"
                id="heroSecondaryButtonLink"
                {...register("heroSecondaryButtonLink")}
                placeholder="e.g., /kontak or https://wa.me/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Feature Sections
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Add and arrange content sections for the homepage. Drag to reorder.
          </p>
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className={`p-6 border border-gray-200 rounded-lg shadow-sm relative ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const desktopUrlsToRemove =
                      (watch(`featureSections.${index}.desktopImageUrls`) as
                        | string[]
                        | undefined) || [];
                    const mobileUrlsToRemove =
                      (watch(`featureSections.${index}.mobileImageUrls`) as
                        | string[]
                        | undefined) || [];
                    for (const url of desktopUrlsToRemove) {
                      if (url.startsWith("http")) addRemovedUrl(url);
                    }
                    for (const url of mobileUrlsToRemove) {
                      if (url.startsWith("http")) addRemovedUrl(url);
                    }
                    for (const url of desktopUrlsToRemove) {
                      if (url.startsWith("blob:")) removeNewFileMapping(url);
                    }
                    for (const url of mobileUrlsToRemove) {
                      if (url.startsWith("blob:")) removeNewFileMapping(url);
                    }
                    remove(index);
                  }}
                  className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150"
                  aria-label={`Remove Section ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-2">
                  Section {index + 1}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.title`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.title`}
                      {...register(`featureSections.${index}.title`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    {errors.featureSections?.[index]?.title && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.featureSections?.[index]?.title?.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.subtitle`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Subtitle (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.subtitle`}
                      {...register(`featureSections.${index}.subtitle`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label
                      htmlFor={`featureSections.${index}.description`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description *
                    </label>
                    <textarea
                      id={`featureSections.${index}.description`}
                      {...register(`featureSections.${index}.description`)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    {errors.featureSections?.[index]?.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.featureSections?.[index]?.description?.message}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 border-t pt-5 mt-2">
                    <div className="md:col-span-1">
                      <MultiImageUploadField<HomepageFormData>
                        fieldName={
                          `featureSections.${index}.desktopImageUrls` as const
                        }
                        control={control}
                        setValue={setValue}
                        errors={errors}
                        label="Desktop Images (16:9) *"
                        target="desktop"
                        addRemovedUrl={addRemovedUrl}
                        addNewFileMapping={addNewFileMapping}
                        removeNewFileMapping={removeNewFileMapping}
                      />
                    </div>
                    <div className="md:col-span-1">
                      <MultiImageUploadField<HomepageFormData>
                        fieldName={
                          `featureSections.${index}.mobileImageUrls` as const
                        }
                        control={control}
                        setValue={setValue}
                        errors={errors}
                        label="Mobile Images (e.g., 1:1 or 9:16) (Optional)"
                        target="mobile"
                        addRemovedUrl={addRemovedUrl}
                        addNewFileMapping={addNewFileMapping}
                        removeNewFileMapping={removeNewFileMapping}
                      />
                    </div>

                    <div className="md:col-span-2 pt-5">
                      <label
                        htmlFor={`featureSections.${index}.imageAlt`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Image Alt Text (Optional)
                      </label>
                      <input
                        type="text"
                        id={`featureSections.${index}.imageAlt`}
                        {...register(`featureSections.${index}.imageAlt`)}
                        placeholder="Describe the images for accessibility"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Applies to all images in this section. Improves SEO and
                        accessibility.
                      </p>
                    </div>
                  </div>

                  <div className="md:col-span-2 border-t pt-5">
                    <label
                      htmlFor={`featureSections.${index}.features`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Features (Optional, one per line)
                    </label>
                    <textarea
                      id={`featureSections.${index}.features`}
                      {...register(`featureSections.${index}.features`)}
                      rows={4}
                      placeholder="Feature 1 (e.g., Engine Specs)\nFeature 2 (e.g., Key Technology)\nFeature 3 (e.g., Safety Rating)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary font-mono text-sm"
                    />
                  </div>

                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 border-t pt-5 mt-2">
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`featureSections.${index}.primaryButtonText`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Primary Button Text (Optional)
                      </label>
                      <input
                        type="text"
                        id={`featureSections.${index}.primaryButtonText`}
                        {...register(
                          `featureSections.${index}.primaryButtonText`
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`featureSections.${index}.primaryButtonLink`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Primary Button Link (Optional)
                      </label>
                      <input
                        type="text"
                        id={`featureSections.${index}.primaryButtonLink`}
                        {...register(
                          `featureSections.${index}.primaryButtonLink`
                        )}
                        placeholder="e.g., /about or https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label
                        htmlFor={`featureSections.${index}.secondaryButtonText`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Secondary Button Text (Optional)
                      </label>
                      <input
                        type="text"
                        id={`featureSections.${index}.secondaryButtonText`}
                        {...register(
                          `featureSections.${index}.secondaryButtonText`
                        )}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label
                        htmlFor={`featureSections.${index}.secondaryButtonLink`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Secondary Button Link (Optional)
                      </label>
                      <input
                        type="text"
                        id={`featureSections.${index}.secondaryButtonLink`}
                        {...register(
                          `featureSections.${index}.secondaryButtonLink`
                        )}
                        placeholder="e.g., /contact or https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => append(defaultFeatureSectionValue)}
              className="inline-flex items-center px-4 py-2 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Feature Section
            </button>
          </div>
        </div>
      </form>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-end space-x-4">
          <Link
            to="/"
            target="_blank"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Eye className="h-4 w-4 mr-2" /> View Homepage
          </Link>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" /> Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function isGalleryImage(obj: unknown): obj is GalleryImage {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as GalleryImage).imageUrl === "string" &&
    typeof (obj as GalleryImage).alt === "string"
  );
}

function isCarModelSpecificationCategory(
  obj: unknown
): obj is CarModelSpecificationCategory {
  return (
    typeof obj === "object" &&
    obj !== null &&
    typeof (obj as CarModelSpecificationCategory).categoryTitle === "string" &&
    Array.isArray((obj as CarModelSpecificationCategory).specs)
  );
}
