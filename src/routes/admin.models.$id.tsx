import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/tanstack-start";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, Controller, Control } from "react-hook-form";
import { z } from "zod";
import {
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Eye,
  Upload,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  getCarModelById,
  createCarModel,
  updateCarModel,
  type CarModel,
} from "../server/car-models";
import {
  getPresignedUploadUrl,
  deleteImageFromR2,
} from "../services/r2Service";
import {
  getTransformUrl,
  getOptimizedVersions,
  getTransformationDownloadUrls,
  type CloudflareTransformOptions,
} from "../services/cloudflareImageService";
import type {
  CarModelFeature,
  CarModelColor,
  GalleryImage,
} from "../db/schema";
import slugify from "slugify";

// Define form validation schema
const carModelFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Model name is required"),
  featuredImage: z.string().min(1, "Featured image is required"),
  subheader: z.string().min(1, "Subheader is required"),
  price: z.string().min(1, "Price is required"),
  subImage: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  mainProductImage: z.string().min(1, "Main product image is required"),
  category: z.string().min(1, "Category is required"),
  categoryDisplay: z.string().min(1, "Category display name is required"),
  published: z.boolean().default(false),
  features: z
    .array(z.string().min(1, "Feature text is required"))
    .min(1, "At least one feature is required"),
  colors: z
    .array(
      z.object({
        name: z.string().min(1, "Color name is required"),
        hex: z.string().min(1, "Color hex code is required"),
        backgroundColor: z.string().min(1, "Background color is required"),
        imageUrl: z.string().optional(),
      })
    )
    .min(1, "At least one color option is required"),
  gallery: z
    .array(
      z.object({
        imageUrl: z.string().min(1, "Image URL is required"),
        alt: z.string().min(1, "Alt text is required"),
      })
    )
    .optional()
    .default([]),
});

// Form data type
type CarModelFormData = z.infer<typeof carModelFormSchema>;

// Type for safer field names
type FieldPath =
  | keyof CarModelFormData
  | `colors.${number}.imageUrl`
  | `gallery.${number}.imageUrl`;

// File upload state type
interface FileUpload {
  file: File;
  previewUrl: string;
  fieldName: FieldPath;
  originalFileName: string; // Store the original filename for naming conventions
}

// Prepare default values for new models
const defaultValues: CarModelFormData = {
  name: "",
  featuredImage: "",
  subheader: "Discover the all-new",
  price: "Rp.",
  features: [
    "Powerful Engine",
    "Advanced Safety Features",
    "Premium Interior",
    "Cutting-edge Technology",
  ],
  description:
    "Experience the perfect blend of style, performance, and innovation with our latest model.",
  mainProductImage: "",
  colors: [
    {
      name: "Black",
      hex: "#000000",
      backgroundColor: "#f5f5f5",
      imageUrl: "",
    },
  ],
  gallery: [],
  category: "suv",
  categoryDisplay: "SUV",
  published: false,
};

// Route definition
export const Route = createFileRoute("/admin/models/$id")({
  component: CarModelEditorPage,
  loader: async ({ params }) => {
    const { id } = params;

    // If id is "new", we're creating a new model
    if (id === "new") {
      return { model: null, isNew: true };
    }

    try {
      const model = await getCarModelById({ data: { id } });

      if (!model) {
        throw new Error("Model not found");
      }

      return { model, isNew: false };
    } catch (error) {
      console.error("Error loading model:", error);
      throw new Error("Failed to load model");
    }
  },
});

// Validate hex color format
function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

function CarModelEditorPage() {
  const { model, isNew } = Route.useLoaderData();
  const { id } = Route.useParams();
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);

  // State to control image optimization
  const [optimizeImages, setOptimizeImages] = useState<boolean>(true);

  // Add state to track removed images for later deletion
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);

  // Prepare form data from model - specify more precise type
  const prepareModelData = (
    model: Record<string, unknown>
  ): CarModelFormData => {
    return {
      id: model.id as string,
      name: model.name as string,
      featuredImage: model.featuredImage as string,
      subheader: model.subheader as string,
      price: model.price as string,
      subImage: (model.subImage as string) || "",
      description: model.description as string,
      mainProductImage: model.mainProductImage as string,
      category: model.category as string,
      categoryDisplay: model.categoryDisplay as string,
      published: (model.published as number) === 1,
      features: model.features as string[],
      colors: model.colors as CarModelColor[],
      gallery: (model.gallery as GalleryImage[]) || [],
    };
  };

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    watch,
    setValue,
    reset,
    trigger,
  } = useForm<CarModelFormData>({
    resolver: zodResolver(carModelFormSchema),
    defaultValues: model ? prepareModelData(model) : defaultValues,
  });

  // Field arrays for features and colors
  type FieldValues = {
    features: string[];
    colors: CarModelColor[];
    gallery: GalleryImage[];
  };

  const {
    fields: featureFields,
    append: appendFeature,
    remove: removeFeature,
  } = useFieldArray<FieldValues>({
    control: control as unknown as Control<FieldValues>,
    name: "features",
  });

  const {
    fields: colorFields,
    append: appendColor,
    remove: removeColor,
  } = useFieldArray<FieldValues>({
    control: control as unknown as Control<FieldValues>,
    name: "colors",
  });

  const {
    fields: galleryFields,
    append: appendGallery,
    remove: removeGallery,
  } = useFieldArray<FieldValues>({
    control: control as unknown as Control<FieldValues>,
    name: "gallery",
  });

  // Custom handlers for trash button clicks that track image URLs for deletion
  const handleRemoveColor = (index: number) => {
    // First, get the image URL from the color object
    const colorImageUrl = watch(`colors.${index}.imageUrl`);

    // If there's a valid URL, add it to removedImageUrls for deletion
    if (
      colorImageUrl &&
      typeof colorImageUrl === "string" &&
      colorImageUrl.startsWith("http")
    ) {
      console.log(`Adding color image to removedImageUrls: ${colorImageUrl}`);
      setRemovedImageUrls((prev) =>
        prev.includes(colorImageUrl) ? prev : [...prev, colorImageUrl]
      );
    }

    // Then remove the color from the array
    removeColor(index);
  };

  const handleRemoveGallery = (index: number) => {
    // First, get the image URL from the gallery object
    const galleryImageUrl = watch(`gallery.${index}.imageUrl`);

    // If there's a valid URL, add it to removedImageUrls for deletion
    if (
      galleryImageUrl &&
      typeof galleryImageUrl === "string" &&
      galleryImageUrl.startsWith("http")
    ) {
      console.log(
        `Adding gallery image to removedImageUrls: ${galleryImageUrl}`
      );
      setRemovedImageUrls((prev) =>
        prev.includes(galleryImageUrl) ? prev : [...prev, galleryImageUrl]
      );
    }

    // Then remove the gallery item from the array
    removeGallery(index);
  };

  // Watch the published status for conditional rendering
  const isPublished = watch("published");
  const modelName = watch("name");
  const modelId = watch("id");

  // Helper function to generate unique prefix for filenames
  function generateUniquePrefix(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${timestamp}-${randomStr}`;
  }

  // Helper to construct filenames with proper naming convention
  function constructFileName(
    originalName: string,
    suffix?: string,
    uniquePrefix?: string
  ): string {
    // Use provided prefix or generate a new one
    const prefix = uniquePrefix || generateUniquePrefix();

    const parts = originalName.split(".");
    const extension = parts.pop() || "";
    // Sanitize the base name part
    const baseName = parts
      .join(".")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 50);

    if (suffix) {
      return `${prefix}-${baseName}_${suffix}.${extension}`;
    }
    return `${prefix}-${baseName}.${extension}`;
  }

  // Handle form submission
  const onSubmit = async (data: CarModelFormData) => {
    setIsSubmitting(true);

    try {
      // Validate hex colors
      const invalidColors = data.colors.filter(
        (color) =>
          !isValidHexColor(color.hex) || !isValidHexColor(color.backgroundColor)
      );

      if (invalidColors.length > 0) {
        toast.error(
          "Some colors have invalid hex values. Please check your color inputs."
        );
        setIsSubmitting(false);
        return;
      }

      // First validate if all required fields are filled
      const isValid = await trigger();
      if (!isValid) {
        // Find the first error and scroll to it
        const firstErrorElement = document.querySelector(".text-red-600");
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }

        toast.error("Please fix form errors before submitting");
        setIsSubmitting(false);
        return;
      }

      // Start with a submission toast that can be updated
      const toastId = toast.loading("Preparing to submit form...");

      console.log("removing images", removedImageUrls);
      // Save a copy of the removed images to delete after submission
      // This prevents the list from being cleared before deletion
      const imagesToDelete = [
        ...removedImageUrls.filter((url) => url.startsWith("http")),
      ];
      console.log(
        `Tracking ${imagesToDelete.length} images for deletion:`,
        imagesToDelete
      );

      // Clear the state now so duplicates aren't added if submit fails and is retried
      setRemovedImageUrls([]);

      // Upload all pending image files first
      let submitData = { ...data };

      if (fileUploads.length > 0) {
        // Calculate total uploads
        const totalUploads = fileUploads.length;
        let completedUploads = 0;

        setUploadProgress({
          current: completedUploads,
          total: totalUploads,
          message: `Preparing to upload ${totalUploads} image${totalUploads !== 1 ? "s" : ""}...`,
        });

        toast.loading(`Uploading ${totalUploads} images...`, { id: toastId });

        // Upload each image
        for (const upload of fileUploads) {
          setUploadProgress({
            current: completedUploads,
            total: totalUploads,
            message: `Uploading image ${completedUploads + 1} of ${totalUploads}: ${upload.originalFileName}`,
          });

          try {
            // Pass original file name for naming convention
            const uploadResult = await uploadImageToR2(
              upload.file,
              upload.originalFileName
            );

            // Update field value with the public URL
            if (upload.fieldName.includes("colors.")) {
              // Handle colors array field
              const fieldPath = upload.fieldName as `colors.${number}.imageUrl`;
              setValue(fieldPath, uploadResult, { shouldValidate: true });
            } else if (upload.fieldName.includes("gallery.")) {
              // Handle gallery array field
              const fieldPath =
                upload.fieldName as `gallery.${number}.imageUrl`;
              setValue(fieldPath, uploadResult, { shouldValidate: true });
            } else {
              // Handle regular fields
              setValue(
                upload.fieldName as keyof CarModelFormData,
                uploadResult,
                { shouldValidate: true }
              );
            }

            // Free memory by revoking URL
            URL.revokeObjectURL(upload.previewUrl);

            completedUploads++;
            setUploadProgress({
              current: completedUploads,
              total: totalUploads,
              message: `Uploaded ${completedUploads} of ${totalUploads} images`,
            });

            toast.loading(
              `Uploaded ${completedUploads} of ${totalUploads} images`,
              { id: toastId }
            );
          } catch (error) {
            console.error(
              `Error uploading image for ${upload.fieldName}:`,
              error
            );
            toast.error("Failed to upload an image. Please try again.", {
              id: toastId,
            });
            setIsSubmitting(false);
            setUploadProgress(null);
            // Re-add the images marked for deletion if upload fails
            setRemovedImageUrls((prev) => [...prev, ...imagesToDelete]);
            return;
          }
        }

        // Get the latest form values after all uploads
        submitData = {
          ...data,
          featuredImage: watch("featuredImage"),
          mainProductImage: watch("mainProductImage"),
          subImage: watch("subImage"),
          colors: watch("colors").map((color) => ({
            ...color,
            hex: color.hex || "#000000", // Ensure hex values are present
            backgroundColor: color.backgroundColor || "#f5f5f5", // Ensure background colors are present
          })),
          gallery: watch("gallery"),
        };

        // Add debug log to check what's being sent
        console.log("Submitting model data with colors:", submitData.colors);

        // Clear the upload progress and file uploads
        setUploadProgress(null);
        setFileUploads([]);
      }

      // Convert the boolean values to numbers for the database
      const finalData = {
        ...submitData,
        id: isNew
          ? submitData.id ||
            slugify(submitData.name, { lower: true, strict: true })
          : id,
        published: submitData.published ? 1 : 0,
      };

      toast.loading("Saving model data...", { id: toastId });

      // Submit form
      const result = isNew
        ? await createCarModel({ data: finalData })
        : await updateCarModel({ data: finalData });

      if (result.success) {
        // Delete removed images AFTER successful form submission
        if (imagesToDelete.length > 0) {
          toast.loading(`Deleting ${imagesToDelete.length} removed images...`, {
            id: toastId,
          });

          console.log(
            `Proceeding to delete ${imagesToDelete.length} images:`,
            imagesToDelete
          );

          let deletedCount = 0;
          let failedCount = 0;

          for (const imageUrl of imagesToDelete) {
            try {
              // Create form data for deletion
              const deleteFormData = new FormData();
              deleteFormData.append("imageUrl", imageUrl);

              console.log(`Deleting image: ${imageUrl}`);

              // Call deleteImageFromR2 server function
              const deleteResult = await deleteImageFromR2({
                data: deleteFormData,
              });
              console.log(
                `Successfully deleted image: ${imageUrl}`,
                deleteResult
              );
              deletedCount++;
            } catch (error) {
              failedCount++;
              console.error(`Failed to delete image ${imageUrl}:`, error);
              // Continue with other deletions even if one fails
            }
          }

          console.log(
            `Image deletion finished. Success: ${deletedCount}, Failed: ${failedCount}`
          );
          if (failedCount === 0 && deletedCount > 0) {
            toast.success(`Deleted ${deletedCount} old image(s).`, {
              id: toastId,
            });
          }
        }

        toast.success(
          isNew ? "Model created successfully!" : "Model updated successfully!",
          { id: toastId }
        );

        // If this is a new model, navigate to the edit page for the new model
        if (isNew) {
          setTimeout(() => {
            navigate({
              to: "/admin/models/$id",
              params: { id: result.modelId },
            });
          }, 800);
        }
      } else {
        throw new Error("Operation failed");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to handle image uploads with proper typing
  const uploadImageToR2 = async (
    file: File,
    originalFileName: string
  ): Promise<string> => {
    try {
      // Get original file size for later comparison
      const originalFileSize = file.size;
      console.log(
        `Uploading image: ${originalFileName}, size: ${originalFileSize / 1024}KB, optimization: ${optimizeImages ? "enabled" : "disabled"}`
      );

      // Generate a single unique prefix for both desktop and mobile versions
      const uniquePrefix = generateUniquePrefix();

      // Determine filenames based on convention using the same unique prefix
      const desktopFileName = constructFileName(
        originalFileName,
        undefined,
        uniquePrefix
      );
      const mobileFileName = constructFileName(
        originalFileName,
        "mobile",
        uniquePrefix
      );

      console.log(`Generated filenames with shared ID:
        Desktop: ${desktopFileName}
        Mobile: ${mobileFileName}`);

      // Get presigned URL from our server for the original file
      const formData = new FormData();
      formData.append("fileName", desktopFileName);
      formData.append("fileType", file.type);

      type ServerFunctionParams = { data: FormData };
      const uploadResult = await getPresignedUploadUrl({
        data: formData,
      } as ServerFunctionParams);

      if (!uploadResult.presignedUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload original file to R2 using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            // Set progress message only if we already have a progress state
            if (uploadProgress) {
              setUploadProgress({
                ...uploadProgress,
                message: `Uploading original file: ${percentComplete}%`,
              });
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("File upload failed"));
        });

        xhr.open("PUT", uploadResult.presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      // Get the original image URL
      const originalUrl = uploadResult.publicUrl;
      console.log(`Original image uploaded to: ${originalUrl}`);

      // Determine optimization rules
      const shouldOptimizeDesktop =
        optimizeImages && originalFileSize >= 500 * 1024;
      const shouldOptimizeMobile = optimizeImages; // Always optimize mobile

      console.log(
        `Optimization flags - Desktop: ${shouldOptimizeDesktop}, Mobile: ${shouldOptimizeMobile}`
      );

      // Track if we'll replace the original URL
      let resultUrl = originalUrl;

      if (optimizeImages) {
        try {
          if (uploadProgress) {
            setUploadProgress({
              ...uploadProgress,
              message: "Generating optimized versions...",
            });
          }

          // Get the URLs for transformed versions
          const transformUrls =
            await getTransformationDownloadUrls(originalUrl);
          console.log("Transformation URLs generated:", transformUrls);

          // Create a helper function for verification and progress tracking
          const downloadAndUploadTransformation = async (
            transformUrl: string,
            targetFileName: string,
            purpose: string
          ): Promise<string | null> => {
            try {
              console.log(
                `Processing ${purpose} version... Downloading from: ${transformUrl}`
              );

              if (uploadProgress) {
                setUploadProgress({
                  ...uploadProgress,
                  message: `Downloading ${purpose} version...`,
                });
              }

              // Use fetch with timeout and additional options
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

              // Log the exact URL we're fetching
              console.log(`Fetching URL for ${purpose}: ${transformUrl}`);

              const response = await fetch(transformUrl, {
                signal: controller.signal,
                headers: {
                  Accept: "image/*",
                },
                cache: "no-cache", // Bypass browser cache
              });

              clearTimeout(timeoutId);

              // Check if the fetch was successful
              if (!response.ok) {
                console.error(
                  `Failed to download ${purpose} version: ${response.status} ${response.statusText}`
                );
                console.log(`Attempted URL: ${transformUrl}`);
                console.log("Response headers:", response.headers);

                // Try with a simpler transformation as fallback
                if (purpose === "mobile") {
                  console.log(
                    "Trying simpler mobile transformation as fallback"
                  );
                  const fallbackUrl = await getTransformUrl(originalUrl, {
                    width: 640,
                    format: "auto" as
                      | "auto"
                      | "webp"
                      | "avif"
                      | "jpeg"
                      | "png"
                      | "gif",
                  });

                  console.log(`Fallback URL: ${fallbackUrl}`);

                  const fallbackResponse = await fetch(fallbackUrl, {
                    signal: controller.signal,
                    headers: {
                      Accept: "image/*",
                    },
                    cache: "no-cache",
                  });

                  if (fallbackResponse.ok) {
                    const blob = await fallbackResponse.blob();
                    console.log(
                      `Fallback successful! Size: ${blob.size / 1024}KB`
                    );
                    return await uploadTransformedImage(
                      blob,
                      targetFileName,
                      purpose
                    );
                  }
                  console.error("Fallback transformation also failed");
                  return null;
                }

                return null;
              }

              const blob = await response.blob();
              console.log(
                `Successfully downloaded ${purpose} version, size: ${blob.size / 1024}KB`
              );

              return await uploadTransformedImage(
                blob,
                targetFileName,
                purpose
              );
            } catch (error) {
              console.error(`Error processing ${purpose} image:`, error);
              return null;
            }
          };

          // Helper to upload a transformed blob
          const uploadTransformedImage = async (
            blob: Blob,
            fileName: string,
            purpose: string
          ): Promise<string | null> => {
            try {
              // Create a new FormData to get a presigned URL
              const transformFormData = new FormData();
              transformFormData.append("fileName", fileName);
              transformFormData.append("fileType", blob.type);

              // Get presigned URL
              if (uploadProgress) {
                setUploadProgress({
                  ...uploadProgress,
                  message: `Getting upload URL for ${purpose} version...`,
                });
              }

              const transformUploadResult = await getPresignedUploadUrl({
                data: transformFormData,
              } as ServerFunctionParams);

              if (uploadProgress) {
                setUploadProgress({
                  ...uploadProgress,
                  message: `Uploading ${purpose} version...`,
                });
              }

              // Upload transformed version to R2
              const uploadResponse = await fetch(
                transformUploadResult.presignedUrl,
                {
                  method: "PUT",
                  body: blob,
                  headers: {
                    "Content-Type": blob.type,
                  },
                }
              );

              if (!uploadResponse.ok) {
                console.error(
                  `Failed to upload ${purpose} version: ${uploadResponse.status}`
                );
                return null;
              }

              console.log(
                `Successfully uploaded ${purpose} version: ${transformUploadResult.publicUrl}`
              );
              return transformUploadResult.publicUrl;
            } catch (error) {
              console.error(`Error uploading ${purpose} image:`, error);
              return null;
            }
          };

          // Always create mobile version
          if (shouldOptimizeMobile) {
            // Process mobile version using the predetermined filename
            const mobileResult = await downloadAndUploadTransformation(
              transformUrls.mobile,
              mobileFileName,
              "mobile"
            );

            // If mobile version fails, try again with different options
            if (!mobileResult) {
              console.log(
                "Mobile transformation failed, attempting retry with different parameters"
              );
              const fallbackMobileUrl = await getTransformUrl(originalUrl, {
                width: 640,
                height: 640,
                fit: "scale-down",
                format: "auto" as
                  | "auto"
                  | "webp"
                  | "avif"
                  | "jpeg"
                  | "png"
                  | "gif",
              });

              await downloadAndUploadTransformation(
                fallbackMobileUrl,
                mobileFileName,
                "mobile (retry)"
              );
            }

            // Verify the mobile URL follows the expected pattern based on original URL
            // (This is a safety check to ensure the naming convention is maintained)
            const expectedMobileUrlPattern = originalUrl.replace(
              /(\.[^.]+)$/,
              "_mobile$1"
            );
            const lastPathSegment = mobileFileName.split("/").pop() || "";
            console.log(`Mobile filename verification: 
              Expected pattern: ${expectedMobileUrlPattern}
              Actual filename: ${mobileFileName}
              Last segment: ${lastPathSegment}`);
          }

          // Optimize desktop version if needed
          if (shouldOptimizeDesktop) {
            // Process desktop version which will replace the original
            const desktopUrl = await downloadAndUploadTransformation(
              transformUrls.desktop,
              desktopFileName,
              "desktop"
            );

            // Update the result URL if desktop optimization succeeded
            if (desktopUrl) {
              resultUrl = desktopUrl;
            }
          }
        } catch (error) {
          console.error("Error in image transformation process:", error);
          // Continue with the original URL if there are errors
        }
      }

      // Return either the original URL or the optimized desktop URL
      return resultUrl;
    } catch (error) {
      console.error("Error in uploadImageToR2:", error);
      throw new Error(error instanceof Error ? error.message : "Upload failed");
    }
  };

  // Handle image selection
  const handleImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    fieldName: FieldPath
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    const originalFileName = file.name; // Store original filename

    // Get the current value to store for potential deletion
    const currentValue = watch(fieldName);
    if (
      currentValue &&
      typeof currentValue === "string" &&
      currentValue.startsWith("http")
    ) {
      // Add to removed images list for later deletion on submit
      setRemovedImageUrls((prev) => {
        // Avoid duplicates
        if (!prev.includes(currentValue)) {
          console.log("Adding to removedImageUrls:", currentValue);
          return [...prev, currentValue];
        }
        return prev;
      });
    }

    // Add to pending uploads - replace any existing upload for this field
    setFileUploads((prev) => [
      ...prev.filter((upload) => upload.fieldName !== fieldName),
      { file, previewUrl, fieldName, originalFileName },
    ]);

    // Set temporary preview URL
    if (fieldName.includes("colors.")) {
      setValue(fieldName as `colors.${number}.imageUrl`, previewUrl, {
        shouldValidate: true,
      });
    } else if (fieldName.includes("gallery.")) {
      setValue(fieldName as `gallery.${number}.imageUrl`, previewUrl, {
        shouldValidate: true,
      });
    } else {
      setValue(fieldName as keyof CarModelFormData, previewUrl, {
        shouldValidate: true,
      });
    }

    // Clear the input value
    if (event.target) {
      event.target.value = "";
    }
  };

  // Helper function to handle image removal
  const handleRemoveImage = (fieldName: FieldPath) => {
    // Get the current value to store for potential deletion
    const currentValue = watch(fieldName);
    console.log(
      `handleRemoveImage called for ${fieldName}. Current URL: ${currentValue}`
    );

    // Track the URL for deletion only if it's a persistent URL
    if (
      currentValue &&
      typeof currentValue === "string" &&
      currentValue.startsWith("http")
    ) {
      setRemovedImageUrls((prev) => {
        // Avoid duplicates
        if (!prev.includes(currentValue)) {
          console.log("Adding to removedImageUrls:", currentValue);
          return [...prev, currentValue];
        }
        return prev;
      });
    } else {
      console.log(
        "URL is not persistent or empty, not adding to removedImageUrls."
      );
    }

    // Remove from file uploads if present
    setFileUploads((prev) =>
      prev.filter((upload) => upload.fieldName !== fieldName)
    );

    // Clear the value
    if (fieldName.includes("colors.")) {
      setValue(fieldName as `colors.${number}.imageUrl`, "", {
        shouldValidate: true,
      });
    } else if (fieldName.includes("gallery.")) {
      setValue(fieldName as `gallery.${number}.imageUrl`, "", {
        shouldValidate: true,
      });
    } else {
      setValue(fieldName as keyof CarModelFormData, "", {
        shouldValidate: true,
      });
    }

    // Revoke preview URL if it was one
    if (typeof currentValue === "string" && currentValue.startsWith("blob:")) {
      URL.revokeObjectURL(currentValue);
    }
  };

  // Update the handleImageSelect event handler to safely handle DOM events
  const handleFileUploadClick = (fieldName: FieldPath) => {
    // Create a unique ID for the input element
    const inputId = `file-input-${fieldName.replace(/[\.\[\]]/g, "-")}`;
    let input = document.getElementById(inputId) as HTMLInputElement | null;

    if (!input) {
      // Create a file input if it doesn't exist
      input = document.createElement("input");
      input.id = inputId;
      input.type = "file";
      input.accept = "image/*";
      input.style.display = "none"; // Hide it
      input.onchange = (e: Event) => {
        handleImageSelect(
          { target: e.target } as React.ChangeEvent<HTMLInputElement>,
          fieldName
        );
      };
      document.body.appendChild(input); // Append to body temporarily
    }

    input.click();
  };

  function ImageUploadField({
    fieldName,
    watch,
    handleRemove,
    handleUploadClick,
    error,
    altText = "Image",
  }: ImageUploadFieldProps) {
    const imageUrl = watch(fieldName);
    const isUrl = typeof imageUrl === "string";

    return (
      <div>
        <div className="mb-2">
          {isUrl && imageUrl ? (
            <div className="relative group">
              <img
                src={imageUrl}
                alt={altText}
                className="w-full h-44 object-cover rounded-md"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "/placeholder-image.svg"; // Path to a generic placeholder
                  target.alt = "Image failed to load";
                }}
              />
              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                <button
                  type="button"
                  onClick={() => {
                    handleRemove(fieldName);
                  }}
                  className="bg-red-500 text-white px-3 py-1 rounded-md text-sm"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full h-44"
              onClick={() => handleFileUploadClick(fieldName)}
            >
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">Click to upload image</p>
            </button>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // If not signed in, don't render (parent layout will redirect)
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="p-8 pb-24">
      {/* Toast container */}
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto bg-white p-6 rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <Link
              to="/admin/models"
              className="text-gray-500 hover:text-gray-700 mr-4"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-medium text-primary">
              {isNew ? "Create New Model" : `Edit Model: ${model?.name}`}
            </h1>
          </div>

          {!isNew && (
            <a
              href={`/tipe-mobil/${id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View on Website
            </a>
          )}
        </div>

        {/* Upload progress indicator */}
        {uploadProgress && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
            <div className="flex items-center mb-1">
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              <p>{uploadProgress.message}</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
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

        {/* Image optimization toggle */}
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">
                Image Optimization
              </h3>
              <p className="text-sm text-gray-500">
                Automatically optimize images for web using Cloudflare Image
                Transformations (resize, compress, convert to WebP)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Large images (&gt;1200px or &gt;500KB) will be automatically
                optimized for faster loading. Optimized versions will be served
                from the Cloudflare global CDN.
              </p>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="optimize-images"
                checked={optimizeImages}
                onChange={(e) => setOptimizeImages(e.target.checked)}
                className="form-checkbox h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label
                htmlFor="optimize-images"
                className="ml-2 text-sm text-gray-700"
              >
                Enable optimization
              </label>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Model Name
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* ID - Only shown for new models */}
              {isNew && (
                <div>
                  <label
                    htmlFor="id"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Model ID (Optional, will be generated from name)
                  </label>
                  <input
                    type="text"
                    id="id"
                    {...register("id")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                </div>
              )}

              {/* Price */}
              <div>
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Price (formatted)
                </label>
                <input
                  type="text"
                  id="price"
                  {...register("price")}
                  placeholder="Rp. 000.000.000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.price.message}
                  </p>
                )}
              </div>

              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category
                </label>
                <select
                  id="category"
                  {...register("category")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="suv">SUV</option>
                  <option value="sedan">Sedan</option>
                  <option value="truck">Truck</option>
                  <option value="crossover">Crossover</option>
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.category.message}
                  </p>
                )}
              </div>

              {/* Category Display */}
              <div>
                <label
                  htmlFor="categoryDisplay"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category Display Name
                </label>
                <input
                  type="text"
                  id="categoryDisplay"
                  {...register("categoryDisplay")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.categoryDisplay && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.categoryDisplay.message}
                  </p>
                )}
              </div>

              {/* Subheader */}
              <div className="md:col-span-2">
                <label
                  htmlFor="subheader"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Subheader (shown in hero section)
                </label>
                <input
                  type="text"
                  id="subheader"
                  {...register("subheader")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
                {errors.subheader && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subheader.message}
                  </p>
                )}
              </div>

              {/* Published status */}
              <div className="flex space-x-6 md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="published"
                    {...register("published")}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label
                    htmlFor="published"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Published
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Images</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Featured Image */}
              <div>
                <label
                  htmlFor="featuredImage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Featured Image (Hero)
                </label>
                <ImageUploadField
                  fieldName="featuredImage"
                  watch={watch}
                  handleRemove={handleRemoveImage}
                  handleUploadClick={handleFileUploadClick}
                  error={errors.featuredImage?.message}
                  altText="Featured hero image"
                />
              </div>

              {/* Main Product Image */}
              <div>
                <label
                  htmlFor="mainProductImage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Main Product Image (Listing & Navbar)
                </label>
                <ImageUploadField
                  fieldName="mainProductImage"
                  watch={watch}
                  handleRemove={handleRemoveImage}
                  handleUploadClick={handleFileUploadClick}
                  error={errors.mainProductImage?.message}
                  altText="Main product image"
                />
              </div>

              {/* Sub Image */}
              <div>
                <label
                  htmlFor="subImage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sub Image (Optional)
                </label>
                <ImageUploadField
                  fieldName="subImage"
                  watch={watch}
                  handleRemove={handleRemoveImage}
                  handleUploadClick={handleFileUploadClick}
                  error={errors.subImage?.message}
                  altText="Sub image"
                />
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Description
            </h2>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Long Description
              </label>
              <textarea
                id="description"
                rows={6}
                {...register("description")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Features</h2>
                <p className="text-sm text-gray-500">
                  Add key features that highlight the strengths of this model
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  // @ts-ignore - Function expects different type but works correctly
                  appendFeature("New Feature");
                }}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </button>
            </div>

            {errors.features && (
              <p className="mb-3 text-sm text-red-600">
                {errors.features.message}
              </p>
            )}

            <div className="space-y-3">
              {featureFields.length === 0 ? (
                <div className="p-8 bg-white rounded-md shadow-sm border border-dashed border-gray-300 text-center">
                  <div className="text-gray-400 mb-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04L2 9.5l.387 1.9a12.001 12.001 0 007.219 8.729 1 1 0 00.788 0 11.95 11.95 0 007.22-8.73L18 9.5l-.382-1.516z"
                      />
                    </svg>
                  </div>
                  <p className="text-gray-600 mb-4">
                    No features added yet. Features help customers understand
                    the key benefits of this model.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // @ts-ignore - Function expects different type but works correctly
                      appendFeature("New Feature");
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Feature
                  </button>
                </div>
              ) : (
                <div className="bg-white rounded-md shadow-sm divide-y divide-gray-100">
                  {featureFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex items-center gap-4 p-2 group hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-500">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <input
                          id={`feature-${index}`}
                          type="text"
                          placeholder="e.g. 360° Camera System"
                          {...register(`features.${index}`)}
                          className="w-full px-3 text-xs py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                        {errors.features?.[index] && (
                          <p className="mt-1 text-sm text-red-600">
                            {`${errors.features[index]?.message}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => removeFeature(index)}
                          disabled={featureFields.length <= 1}
                          className="p-1 text-gray-400 hover:text-red-500 disabled:text-gray-300 disabled:cursor-not-allowed opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                          title="Remove feature"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {featureFields.length > 0 && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => {
                    // @ts-ignore - Function expects different type but works correctly
                    appendFeature("New Feature");
                  }}
                  className="inline-flex items-center px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Another Feature
                </button>
              </div>
            )}

            {featureFields.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
                <p className="text-sm text-blue-700 flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Features will be highlighted in the product page. Add the
                    most important features that would appeal to customers.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Colors Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Color Options
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendColor({
                    name: "",
                    hex: "#000000",
                    backgroundColor: "#f5f5f5",
                    imageUrl: "",
                  })
                }
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Color
              </button>
            </div>

            {errors.colors && (
              <p className="mb-3 text-sm text-red-600">
                {errors.colors.message}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4">
              {colorFields.map((field, index) => (
                <div
                  key={field.id}
                  className="p-3 bg-white rounded-md shadow-sm"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor={`color-name-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Color Name
                      </label>
                      <input
                        id={`color-name-${index}`}
                        type="text"
                        {...register(`colors.${index}.name`)}
                        placeholder="e.g. Crystal Black"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                      {errors.colors?.[index]?.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.colors[index]?.name?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`color-hex-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Hex Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id={`color-picker-${index}`}
                          type="color"
                          value={watch(`colors.${index}.hex`) || "#000000"}
                          onChange={(e) => {
                            setValue(`colors.${index}.hex`, e.target.value, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                          className="h-9 w-9 p-0 rounded border border-gray-300"
                        />
                        <input
                          id={`color-hex-${index}`}
                          type="text"
                          {...register(`colors.${index}.hex`)}
                          placeholder="#000000"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      {errors.colors?.[index]?.hex && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.colors[index]?.hex?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor={`color-bg-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Background Color
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          id={`color-bg-picker-${index}`}
                          type="color"
                          value={
                            watch(`colors.${index}.backgroundColor`) ||
                            "#f5f5f5"
                          }
                          onChange={(e) => {
                            setValue(
                              `colors.${index}.backgroundColor`,
                              e.target.value,
                              {
                                shouldValidate: true,
                                shouldDirty: true,
                              }
                            );
                          }}
                          className="h-9 w-9 p-0 rounded border border-gray-300"
                        />
                        <input
                          id={`color-bg-${index}`}
                          type="text"
                          {...register(`colors.${index}.backgroundColor`)}
                          placeholder="#f5f5f5"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      {errors.colors?.[index]?.backgroundColor && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.colors[index]?.backgroundColor?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor={`color-image-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Color Image
                      </label>
                      <ImageUploadField
                        fieldName={`colors.${index}.imageUrl`}
                        watch={watch}
                        handleRemove={handleRemoveImage}
                        handleUploadClick={handleFileUploadClick}
                        error={errors.colors?.[index]?.imageUrl?.message}
                        altText={`Color ${watch(`colors.${index}.name`) || index + 1}`}
                      />
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(index)}
                        disabled={colorFields.length <= 1}
                        className="text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div
                    className="mt-3 p-3 rounded-md"
                    style={{
                      backgroundColor:
                        watch(`colors.${index}.backgroundColor`) || "#f5f5f5",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full border border-gray-200 shadow-sm"
                        style={{
                          backgroundColor:
                            watch(`colors.${index}.hex`) || "#000000",
                        }}
                      />
                      <div className="text-sm">
                        <p>
                          <strong>Preview:</strong>{" "}
                          {watch(`colors.${index}.name`)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Hex: {watch(`colors.${index}.hex`)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Section */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Gallery Images
              </h2>
              <button
                type="button"
                onClick={() =>
                  appendGallery({
                    imageUrl: "",
                    alt: "",
                  })
                }
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Image
              </button>
            </div>

            {galleryFields.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <div>
                  <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 mb-4">
                    No gallery images added yet. Add images to showcase more
                    views of your model.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      appendGallery({
                        imageUrl: "",
                        alt: "",
                      })
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Gallery Image
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {galleryFields.map((field, index) => (
                  <div
                    key={field.id}
                    className="p-3 bg-white rounded-md shadow-sm"
                  >
                    <div className="mb-3">
                      <label
                        htmlFor={`gallery-image-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Gallery Image
                      </label>
                      <ImageUploadField
                        fieldName={`gallery.${index}.imageUrl`}
                        watch={watch}
                        handleRemove={handleRemoveImage}
                        handleUploadClick={handleFileUploadClick}
                        error={errors.gallery?.[index]?.imageUrl?.message}
                        altText={
                          watch(`gallery.${index}.alt`) ||
                          `Gallery image ${index + 1}`
                        }
                      />
                    </div>

                    <div className="mb-3">
                      <label
                        htmlFor={`gallery-alt-${index}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Alt Text
                      </label>
                      <input
                        id={`gallery-alt-${index}`}
                        type="text"
                        {...register(`gallery.${index}.alt`)}
                        placeholder="Descriptive text for the image"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                      />
                      {errors.gallery?.[index]?.alt && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.gallery[index]?.alt?.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveGallery(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Sticky Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-md z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-end space-x-4">
          <Link
            to="/admin/models"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {isNew ? "Creating..." : "Saving..."}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {isNew ? "Create Model" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable Image Upload Field Component
interface ImageUploadFieldProps {
  fieldName: FieldPath;
  watch: ReturnType<typeof useForm<CarModelFormData>>["watch"];
  handleRemove: (fieldName: FieldPath) => void;
  handleUploadClick: (fieldName: FieldPath) => void;
  error?: string;
  altText?: string;
}
