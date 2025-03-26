import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
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
import { getPresignedUploadUrl } from "../services/r2Service";
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

  // References for file inputs
  const featuredImageRef = useRef<HTMLInputElement>(null);
  const mainProductImageRef = useRef<HTMLInputElement>(null);
  const subImageRef = useRef<HTMLInputElement>(null);

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

  // Watch the published status for conditional rendering
  const isPublished = watch("published");
  const modelName = watch("name");
  const modelId = watch("id");

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
            message: `Uploading image ${completedUploads + 1} of ${totalUploads}...`,
          });

          try {
            const uploadResult = await uploadImageToR2(upload.file);

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
        id: isNew ? submitData.id : id,
        published: submitData.published ? 1 : 0,
      };

      toast.loading("Saving model data...", { id: toastId });

      // Submit form
      const result = isNew
        ? await createCarModel({ data: finalData })
        : await updateCarModel({ data: finalData });

      if (result.success) {
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
  const uploadImageToR2 = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append("fileName", file.name);
      formData.append("fileType", file.type);

      // Call the server function with FormData
      type ServerFunctionParams = { data: FormData };
      const uploadResult = await getPresignedUploadUrl({
        data: formData,
      } as ServerFunctionParams);

      if (!uploadResult.presignedUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload file to R2 using XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
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
                message: `Uploading file: ${percentComplete}%`,
              });
            }
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(uploadResult.publicUrl);
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

    // Add to pending uploads
    setFileUploads((prev) => [...prev, { file, previewUrl, fieldName }]);

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
                <div className="mb-2">
                  {watch("featuredImage") ? (
                    <div className="relative group">
                      <img
                        src={watch("featuredImage")}
                        alt="Featured"
                        className="w-full h-44 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            // Remove from file uploads if present
                            setFileUploads((prev) =>
                              prev.filter(
                                (upload) => upload.fieldName !== "featuredImage"
                              )
                            );
                            // Clear the value
                            setValue("featuredImage", "");
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
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full"
                      onClick={() => featuredImageRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload image
                      </p>
                    </button>
                  )}
                  <input
                    type="file"
                    id="featuredImage"
                    ref={featuredImageRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, "featuredImage")}
                  />
                </div>
                {errors.featuredImage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.featuredImage.message}
                  </p>
                )}
              </div>

              {/* Main Product Image */}
              <div>
                <label
                  htmlFor="mainProductImage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Main Product Image (Listing & Navbar)
                </label>
                <div className="mb-2">
                  {watch("mainProductImage") ? (
                    <div className="relative group">
                      <img
                        src={watch("mainProductImage")}
                        alt="Main product"
                        className="w-full h-44 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            // Remove from file uploads if present
                            setFileUploads((prev) =>
                              prev.filter(
                                (upload) =>
                                  upload.fieldName !== "mainProductImage"
                              )
                            );
                            // Clear the value
                            setValue("mainProductImage", "");
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
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full"
                      onClick={() => mainProductImageRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload image
                      </p>
                    </button>
                  )}
                  <input
                    type="file"
                    id="mainProductImage"
                    ref={mainProductImageRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, "mainProductImage")}
                  />
                </div>
                {errors.mainProductImage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.mainProductImage.message}
                  </p>
                )}
              </div>

              {/* Sub Image */}
              <div>
                <label
                  htmlFor="subImage"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Sub Image (Optional)
                </label>
                <div className="mb-2">
                  {watch("subImage") ? (
                    <div className="relative group">
                      <img
                        src={watch("subImage")}
                        alt="Sub"
                        className="w-full h-44 object-cover rounded-md"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                        <button
                          type="button"
                          onClick={() => {
                            // Remove from file uploads if present
                            setFileUploads((prev) =>
                              prev.filter(
                                (upload) => upload.fieldName !== "subImage"
                              )
                            );
                            // Clear the value
                            setValue("subImage", "");
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
                      className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full"
                      onClick={() => subImageRef.current?.click()}
                    >
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500">
                        Click to upload image
                      </p>
                    </button>
                  )}
                  <input
                    type="file"
                    id="subImage"
                    ref={subImageRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e, "subImage")}
                  />
                </div>
                {errors.subImage && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.subImage.message}
                  </p>
                )}
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
              <h2 className="text-lg font-medium text-gray-900">Features</h2>
              <button
                type="button"
                onClick={() => {
                  appendFeature("");
                }}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Feature
              </button>
            </div>

            {errors.features && (
              <p className="mb-3 text-sm text-red-600">
                {errors.features.message}
              </p>
            )}

            <div className="space-y-4">
              {featureFields.map((field, index) => (
                <div
                  key={field.id}
                  className="flex items-center gap-4 p-3 bg-white rounded-md shadow-sm"
                >
                  <div className="flex-1">
                    <label
                      htmlFor={`feature-${index}`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Feature
                    </label>
                    <input
                      id={`feature-${index}`}
                      type="text"
                      {...register(`features.${index}`)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    {errors.features?.[index] && (
                      <p className="mt-1 text-sm text-red-600">
                        {`${errors.features[index]?.message}`}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    disabled={featureFields.length <= 1}
                    className="mt-7 text-red-500 hover:text-red-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
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
                      <div className="mb-2">
                        {watch(`colors.${index}.imageUrl`) ? (
                          <div className="relative group">
                            <img
                              src={watch(`colors.${index}.imageUrl`)}
                              alt={`Color ${watch(`colors.${index}.name`)}`}
                              className="h-44 w-full object-cover rounded-md"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove from file uploads if present
                                  setFileUploads((prev) =>
                                    prev.filter(
                                      (upload) =>
                                        upload.fieldName !==
                                        `colors.${index}.imageUrl`
                                    )
                                  );
                                  // Clear the value
                                  setValue(`colors.${index}.imageUrl`, "");
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
                            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full"
                            onClick={() => {
                              // Create a file input dynamically since we have multiple color images
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (e: Event) =>
                                handleImageSelect(
                                  e as React.ChangeEvent<HTMLInputElement>,
                                  `colors.${index}.imageUrl`
                                );
                              input.click();
                            }}
                          >
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Click to upload image
                            </p>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        onClick={() => removeColor(index)}
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
                      ></div>
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
                      <div className="mb-2">
                        {watch(`gallery.${index}.imageUrl`) ? (
                          <div className="relative group">
                            <img
                              src={watch(`gallery.${index}.imageUrl`)}
                              alt={
                                watch(`gallery.${index}.alt`) ||
                                `Gallery image ${index + 1}`
                              }
                              className="h-44 w-full object-cover rounded-md"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-md">
                              <button
                                type="button"
                                onClick={() => {
                                  // Remove from file uploads if present
                                  setFileUploads((prev) =>
                                    prev.filter(
                                      (upload) =>
                                        upload.fieldName !==
                                        `gallery.${index}.imageUrl`
                                    )
                                  );
                                  // Clear the value
                                  setValue(`gallery.${index}.imageUrl`, "");
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
                            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors w-full"
                            onClick={() => {
                              // Create a file input dynamically
                              const input = document.createElement("input");
                              input.type = "file";
                              input.accept = "image/*";
                              input.onchange = (e: Event) => {
                                const target = e.target as HTMLInputElement;
                                if (target.files && target.files[0]) {
                                  handleImageSelect(
                                    {
                                      target: { files: target.files },
                                    } as unknown as React.ChangeEvent<HTMLInputElement>,
                                    `gallery.${index}.imageUrl`
                                  );
                                }
                              };
                              input.click();
                            }}
                          >
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">
                              Click to upload image
                            </p>
                          </button>
                        )}
                      </div>
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
                        onClick={() => removeGallery(index)}
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
