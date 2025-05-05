import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback, type FC } from "react";
import { useAuth } from "@clerk/tanstack-start";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  useFieldArray,
  type FieldPath,
  type Control,
  type UseFormRegister,
  type UseFormSetValue,
  type UseFormWatch,
  type FieldErrors,
} from "react-hook-form";
import { z } from "zod";
import {
  Home,
  Save,
  Plus,
  Trash2,
  Eye,
  Loader2,
  ChevronLeft,
  GripVertical,
  ChevronDown,
  ChevronUp,
  PanelLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  getHomepageConfig,
  updateHomepageConfig,
  type HomepageConfigWithSections,
  type HomepageFeatureSectionUnion,
} from "../server/homepage";
import {
  getPresignedUploadUrl,
  deleteImageFromR2,
} from "../services/r2Service";
import ImageUploadField from "../components/admin/ImageUploadField";
import type { GalleryImage, CarModelSpecificationCategory } from "../db/schema";
import MultiImageUploadField from "../components/admin/MultiImageUploadField";

// --- Section Type Schemas (for Frontend Form) ---

// Base schema common to all section types
const baseSectionSchema = z.object({
  id: z.number().optional(),
  order: z.number().optional(), // Order might not be needed directly in form, managed by useFieldArray
  // Main title/subtitle are part of the section structure itself in the form
  title: z.string().min(1, "Section title/identifier is required"),
  subtitle: z.string().optional(),
});

// Schema for the 'default' section type data (ModelShowcase)
// Allow blob URLs for images during form editing
const defaultSectionDataSchema = z.object({
  description: z.string().min(1, "Description is required"),
  desktopImageUrls: z
    .array(z.string().min(1, "Must be a valid URL or temporary blob URL")) // Allow blob:
    .min(1, "At least one Desktop Image is required"),
  mobileImageUrls: z
    .array(z.string().min(1, "Must be a valid URL or temporary blob URL")) // Allow blob:
    .optional()
    .default([]),
  imageAlt: z.string().optional(),
  // features are stored as a single string in the form textarea
  features: z.string().optional(),
  primaryButtonText: z.string().optional(),
  primaryButtonLink: z.string().optional().or(z.literal("")),
  secondaryButtonText: z.string().optional(),
  secondaryButtonLink: z.string().optional().or(z.literal("")),
});

const defaultSectionSchema = baseSectionSchema.extend({
  sectionType: z.literal("default"),
  typeSpecificData: defaultSectionDataSchema,
});

// Schema for the 'feature_cards_grid' section type data
const featureCardSchema = z.object({
  imageUrl: z.string().min(1, "Card image URL or blob is required"), // Allow blob:
  title: z.string().min(1, "Card title is required"),
  description: z.string().min(1, "Card description is required"),
  link: z.string().optional().or(z.literal("")),
});

const featureCardsGridDataSchema = z.object({
  // Note: Main title/subtitle for the grid come from the baseSectionSchema
  cards: z
    .array(featureCardSchema)
    .min(1, "At least one feature card is required")
    .max(3, "Maximum of 3 feature cards allowed")
    .default([]),
});

const featureCardsGridSchema = baseSectionSchema.extend({
  sectionType: z.literal("feature_cards_grid"),
  typeSpecificData: featureCardsGridDataSchema,
});

// Schema for the new 'banner' section type data
const bannerSectionDataSchema = z.object({
  imageUrl: z.string().min(1, "Banner image URL or blob is required"), // Allow blob:
  altText: z.string().optional(),
  link: z.string().optional().or(z.literal("")), // Optional link for the banner
});

const bannerSectionSchema = baseSectionSchema.extend({
  sectionType: z.literal("banner"),
  typeSpecificData: bannerSectionDataSchema,
});

// --- Discriminated Union for Section Validation (Frontend) ---
const sectionUnionSchema = z.discriminatedUnion("sectionType", [
  defaultSectionSchema,
  featureCardsGridSchema,
  bannerSectionSchema, // Add banner schema
  // Add other section type schemas here in the future
]);

// --- Update Main Homepage Form Schema ---

// Define schema for a single feature section within the form (REMOVED - using union now)
// const featureSectionSchema = z.object({ ... });

// Update form validation schema to use the discriminated union
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
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  // Use the discriminated union for feature sections array
  featureSections: z.array(sectionUnionSchema).optional().default([]),
});

// Update form data type (inferred automatically)
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

// Default value for a single FEATURE CARD (used when adding new cards)
const defaultFeatureCardValue: z.infer<typeof featureCardSchema> = {
  imageUrl: "",
  title: "",
  description: "",
  link: "",
};

// Default value for a NEW feature section (defaults to type 'default')
const defaultFeatureSectionValue: z.infer<typeof sectionUnionSchema> = {
  sectionType: "default",
  title: "",
  subtitle: "",
  typeSpecificData: {
    // Corresponds to defaultSectionDataSchema
    description: "",
    desktopImageUrls: [],
    mobileImageUrls: [],
    imageAlt: "",
    features: "", // Stored as string in form
    primaryButtonText: "Learn More",
    primaryButtonLink: "",
    secondaryButtonText: "",
    secondaryButtonLink: "",
  },
};

// Default value for a NEW banner section
const defaultBannerSectionValue: z.infer<typeof bannerSectionSchema> = {
  sectionType: "banner",
  title: "Banner Section", // Default title for easy identification
  subtitle: "",
  typeSpecificData: {
    imageUrl: "",
    altText: "",
    link: "",
  },
};

// Update default values for the entire form
const defaultValues: HomepageFormData = {
  heroDesktopImageUrl: "",
  heroMobileImageUrl: "",
  heroTitle: "GWM Indonesia",
  heroSubtitle: "Explore Premium SUVs and Innovative Technology",
  heroPrimaryButtonText: "Explore Models",
  heroPrimaryButtonLink: "/tipe-mobil",
  heroSecondaryButtonText: "Contact Us",
  heroSecondaryButtonLink: "/kontak",
  metaTitle: "",
  metaDescription: "",
  featureSections: [defaultFeatureSectionValue], // Default to a 'default' type initially
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

// Sortable Feature Section Component

interface SortableFeatureSectionProps {
  field: ReturnType<typeof useFieldArray<HomepageFormData>>["fields"][number];
  index: number;
  register: UseFormRegister<HomepageFormData>;
  errors: FieldErrors<HomepageFormData>;
  control: Control<HomepageFormData>;
  setValue: UseFormSetValue<HomepageFormData>;
  watch: UseFormWatch<HomepageFormData>;
  addRemovedUrl: (url: string) => void;
  addNewFileMapping: (blobUrl: string, file: File) => void;
  removeNewFileMapping: (blobUrl: string) => void;
  remove: (index: number) => void;
}

const SortableFeatureSection: FC<SortableFeatureSectionProps> = ({
  field,
  index,
  register,
  errors,
  control,
  setValue,
  watch,
  addRemovedUrl,
  addNewFileMapping,
  removeNewFileMapping,
  remove,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get the current section type to conditionally render fields
  const sectionType = watch(`featureSections.${index}.sectionType`);

  // Use useFieldArray for the cards within the feature_cards_grid type
  const {
    fields: cardFields,
    append: appendCard,
    remove: removeCard,
  } = useFieldArray({
    control,
    name: `featureSections.${index}.typeSpecificData.cards`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-200 rounded-lg shadow-sm relative transition-shadow hover:shadow-md ${index % 2 === 0 ? "bg-white" : "bg-gray-50/50"} ${isCollapsed ? "pb-4" : "p-6"}`}
    >
      {/* --- Header Area (Always Visible) --- */}
      <div className={`flex items-center ${isCollapsed ? "p-4" : "pb-4 pl-8"}`}>
        {/* --- Drag Handle --- */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-2 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary rounded mr-2"
          aria-label="Drag to reorder section"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* --- Collapse/Expand Button --- */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-400 rounded mr-3"
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronUp className="h-5 w-5" />
          )}
        </button>

        {/* --- Section Title (Always Visible) --- */}
        <h3 className="text-lg font-semibold text-gray-800 flex-grow truncate">
          Section {index + 1}:{" "}
          {watch(`featureSections.${index}.title`) || "(Untitled)"}
        </h3>

        {/* --- Remove Button (moved to header) --- */}
        <button
          type="button"
          onClick={() => {
            // Access nested data based on sectionType
            const currentSectionType = watch(
              `featureSections.${index}.sectionType`
            );
            let urlsToRemove: string[] = [];

            if (currentSectionType === "default") {
              const desktopUrls = watch(
                `featureSections.${index}.typeSpecificData.desktopImageUrls`
              ) as string[] | undefined;
              const mobileUrls = watch(
                `featureSections.${index}.typeSpecificData.mobileImageUrls`
              ) as string[] | undefined;
              urlsToRemove = [...(desktopUrls || []), ...(mobileUrls || [])];
            } else if (currentSectionType === "feature_cards_grid") {
              const cards = watch(
                `featureSections.${index}.typeSpecificData.cards`
              );
              urlsToRemove = (cards || [])
                .map((card) => card?.imageUrl || "")
                .filter(Boolean);
            } else if (currentSectionType === "banner") {
              const imageUrl = watch(
                `featureSections.${index}.typeSpecificData.imageUrl`
              ) as string | undefined;
              if (imageUrl) {
                urlsToRemove.push(imageUrl);
              }
            }

            // Keep the rest of the logic (checking http/blob, removing)
            for (const url of urlsToRemove) {
              if (url.startsWith("http")) addRemovedUrl(url);
              else if (url.startsWith("blob:")) removeNewFileMapping(url);
            }
            remove(index);
          }}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 ml-2"
          aria-label={`Remove Section ${index + 1}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* --- Section Content (Collapsible) --- */}
      {!isCollapsed && (
        <div className="pl-8 pt-4 border-t border-gray-200">
          {/* --- Common Fields --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 mb-6 pb-6 border-b">
            {/* Section Type Selector */}
            <div className="md:col-span-1">
              <label
                htmlFor={`featureSections.${index}.sectionType`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Section Type
              </label>
              <select
                id={`featureSections.${index}.sectionType`}
                {...register(`featureSections.${index}.sectionType`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-white"
                defaultValue="default" // Ensure a default is set
              >
                <option value="default">Default (Image Left/Right)</option>
                <option value="feature_cards_grid">Feature Cards Grid</option>
                <option value="banner">Banner</option>
                {/* Add other types here */}
              </select>
            </div>

            {/* Common Title Field */}
            <div className="md:col-span-1">
              <label
                htmlFor={`featureSections.${index}.title`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Section Title/Identifier
              </label>
              <input
                type="text"
                id={`featureSections.${index}.title`}
                {...register(`featureSections.${index}.title`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="e.g., Our Technology or EV Features"
              />
              {errors.featureSections?.[index]?.title && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.featureSections?.[index]?.title?.message}
                </p>
              )}
            </div>

            {/* Common Subtitle Field */}
            <div className="md:col-span-2">
              <label
                htmlFor={`featureSections.${index}.subtitle`}
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Section Subtitle (Optional)
              </label>
              <input
                type="text"
                id={`featureSections.${index}.subtitle`}
                {...register(`featureSections.${index}.subtitle`)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Optional subheading for the section"
              />
            </div>
          </div>

          {/* --- Type-Specific Fields --- */}
          <div className="mt-4">
            {/* == Fields for 'default' section type == */}
            {sectionType === "default" && (
              <div className="space-y-5">
                <div>
                  <label
                    htmlFor={`featureSections.${index}.typeSpecificData.description`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Description *
                  </label>
                  <textarea
                    id={`featureSections.${index}.typeSpecificData.description`}
                    {...register(
                      `featureSections.${index}.typeSpecificData.description`
                    )}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  {errors.featureSections?.[index]?.typeSpecificData
                    ?.description?.message &&
                    sectionType === "default" && ( // Check type before accessing error
                      <p className="mt-1 text-sm text-red-600">
                        {
                          errors.featureSections?.[index]?.typeSpecificData
                            ?.description?.message // Access is now safe
                        }
                      </p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 border-t pt-5">
                  <div className="md:col-span-1">
                    <MultiImageUploadField<HomepageFormData>
                      fieldName={
                        `featureSections.${index}.typeSpecificData.desktopImageUrls` as const
                      }
                      control={control}
                      setValue={setValue}
                      errors={errors}
                      label="Desktop Images (16:9) *"
                      target="desktop"
                      addRemovedUrl={addRemovedUrl}
                      addNewFileMapping={addNewFileMapping}
                      removeNewFileMapping={removeNewFileMapping}
                      enableCrop={true}
                      cropAspect={16 / 9}
                    />
                    {errors.featureSections?.[index]?.typeSpecificData
                      ?.desktopImageUrls?.message &&
                      sectionType === "default" && ( // Check type
                        <p className="mt-1 text-sm text-red-600">
                          {
                            errors.featureSections?.[index]?.typeSpecificData
                              ?.desktopImageUrls?.message // Safe access
                          }
                        </p>
                      )}
                  </div>
                  <div className="md:col-span-1">
                    <MultiImageUploadField<HomepageFormData>
                      fieldName={
                        `featureSections.${index}.typeSpecificData.mobileImageUrls` as const
                      }
                      control={control}
                      setValue={setValue}
                      errors={errors}
                      label="Mobile Images (e.g., 1:1 or 9:16) (Optional)"
                      target="mobile"
                      addRemovedUrl={addRemovedUrl}
                      addNewFileMapping={addNewFileMapping}
                      removeNewFileMapping={removeNewFileMapping}
                      enableCrop={true}
                      cropAspect={9 / 16}
                    />
                    {errors.featureSections?.[index]?.typeSpecificData
                      ?.mobileImageUrls?.message &&
                      sectionType === "default" && ( // Check type
                        <p className="mt-1 text-sm text-red-600">
                          {
                            errors.featureSections?.[index]?.typeSpecificData
                              ?.mobileImageUrls?.message // Safe access
                          }
                        </p>
                      )}
                  </div>

                  <div className="md:col-span-2 pt-5">
                    <label
                      htmlFor={`featureSections.${index}.typeSpecificData.imageAlt`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Image Alt Text (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.typeSpecificData.imageAlt`}
                      {...register(
                        `featureSections.${index}.typeSpecificData.imageAlt`
                      )}
                      placeholder="Describe the images for accessibility"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Applies to all images in this section. Improves SEO and
                      accessibility.
                    </p>
                  </div>
                </div>

                <div className="border-t pt-5">
                  <label
                    htmlFor={`featureSections.${index}.typeSpecificData.features`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Features (Optional, one per line)
                  </label>
                  <textarea
                    id={`featureSections.${index}.typeSpecificData.features`}
                    {...register(
                      `featureSections.${index}.typeSpecificData.features`
                    )}
                    rows={4}
                    placeholder="Feature 1\nFeature 2\nFeature 3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary font-mono text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 border-t pt-5">
                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.typeSpecificData.primaryButtonText`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Primary Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.typeSpecificData.primaryButtonText`}
                      {...register(
                        `featureSections.${index}.typeSpecificData.primaryButtonText`
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.typeSpecificData.primaryButtonLink`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Primary Button Link (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.typeSpecificData.primaryButtonLink`}
                      {...register(
                        `featureSections.${index}.typeSpecificData.primaryButtonLink`
                      )}
                      placeholder="e.g., /about or https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>

                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.typeSpecificData.secondaryButtonText`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Secondary Button Text (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.typeSpecificData.secondaryButtonText`}
                      {...register(
                        `featureSections.${index}.typeSpecificData.secondaryButtonText`
                      )}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="md:col-span-1">
                    <label
                      htmlFor={`featureSections.${index}.typeSpecificData.secondaryButtonLink`}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Secondary Button Link (Optional)
                    </label>
                    <input
                      type="text"
                      id={`featureSections.${index}.typeSpecificData.secondaryButtonLink`}
                      {...register(
                        `featureSections.${index}.typeSpecificData.secondaryButtonLink`
                      )}
                      placeholder="e.g., /contact or https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* == Fields for 'feature_cards_grid' section type == */}
            {sectionType === "feature_cards_grid" && (
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-600 mb-2">
                  Feature Cards (Max 3)
                </h4>
                {(errors.featureSections?.[index]?.typeSpecificData?.cards
                  ?.message || // Check type
                  errors.featureSections?.[index]?.typeSpecificData?.cards?.root
                    ?.message) &&
                  sectionType === "feature_cards_grid" && (
                    <p className="mb-2 text-sm text-red-600">
                      {errors.featureSections?.[index]?.typeSpecificData?.cards
                        ?.message ||
                        errors.featureSections?.[index]?.typeSpecificData?.cards
                          ?.root?.message}
                    </p>
                  )}
                <div className="space-y-6">
                  {cardFields.map((cardField, cardIndex) => (
                    <div
                      key={cardField.id}
                      className="p-4 border rounded-md bg-gray-50/50 relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeCard(cardIndex)}
                        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                        aria-label={`Remove Card ${cardIndex + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <h5 className="font-medium text-gray-800 mb-3">
                        Card {cardIndex + 1}
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Card Image Upload */}
                        <div className="md:col-span-1">
                          <label
                            htmlFor={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.imageUrl`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Card Image *
                          </label>
                          {/* Use ImageUploadField for card image */}
                          <ImageUploadField<HomepageFormData>
                            fieldName={
                              `featureSections.${index}.typeSpecificData.cards.${cardIndex}.imageUrl` as const
                            }
                            watch={watch}
                            setValue={setValue}
                            // Specific handler for removing card image
                            handleRemove={() => {
                              const currentUrl = watch(
                                `featureSections.${index}.typeSpecificData.cards.${cardIndex}.imageUrl`
                              );
                              if (typeof currentUrl === "string") {
                                addRemovedUrl(currentUrl); // Track server URLs for deletion
                              }
                              setValue(
                                `featureSections.${index}.typeSpecificData.cards.${cardIndex}.imageUrl`,
                                "",
                                {
                                  shouldValidate: true,
                                }
                              );
                            }}
                            // Specific handler for selecting card image file
                            onFileSelected={(fieldName, file) => {
                              const previewUrl = URL.createObjectURL(file);
                              setValue(
                                fieldName as FieldPath<HomepageFormData>, // Cast necessary for dynamic path
                                previewUrl,
                                {
                                  shouldValidate: true,
                                }
                              );
                              addNewFileMapping(previewUrl, file);
                            }}
                            error={
                              errors.featureSections?.[index]?.typeSpecificData
                                ?.cards?.[cardIndex]?.imageUrl?.message // Safe now within type check
                            }
                            altText={`Card ${cardIndex + 1} image`}
                            // --- Add cropping props ---
                            enableCrop={true}
                            cropAspect={21 / 10} // Approx 310/146
                            addNewFileMapping={addNewFileMapping} // Needed for fallback setValue
                          />
                        </div>
                        {/* Card Title */}
                        <div className="md:col-span-1">
                          <label
                            htmlFor={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.title`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Card Title *
                          </label>
                          <input
                            type="text"
                            id={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.title`}
                            {...register(
                              `featureSections.${index}.typeSpecificData.cards.${cardIndex}.title`
                            )}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          />
                          {errors.featureSections?.[index]?.typeSpecificData
                            ?.cards?.[cardIndex]?.title?.message &&
                            sectionType === "feature_cards_grid" && ( // Check type
                              <p className="mt-1 text-sm text-red-600">
                                {
                                  errors.featureSections?.[index]
                                    ?.typeSpecificData?.cards?.[cardIndex]
                                    ?.title?.message
                                }
                              </p>
                            )}
                        </div>
                        {/* Card Description */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.description`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Card Description *
                          </label>
                          <textarea
                            id={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.description`}
                            {...register(
                              `featureSections.${index}.typeSpecificData.cards.${cardIndex}.description`
                            )}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          />
                          {errors.featureSections?.[index]?.typeSpecificData
                            ?.cards?.[cardIndex]?.description?.message &&
                            sectionType === "feature_cards_grid" && ( // Check type
                              <p className="mt-1 text-sm text-red-600">
                                {
                                  errors.featureSections?.[index]
                                    ?.typeSpecificData?.cards?.[cardIndex]
                                    ?.description?.message
                                }
                              </p>
                            )}
                        </div>
                        {/* Card Link */}
                        <div className="md:col-span-2">
                          <label
                            htmlFor={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.link`}
                            className="block text-sm font-medium text-gray-700 mb-1"
                          >
                            Card Link (Optional)
                          </label>
                          <input
                            type="text"
                            id={`featureSections.${index}.typeSpecificData.cards.${cardIndex}.link`}
                            {...register(
                              `featureSections.${index}.typeSpecificData.cards.${cardIndex}.link`
                            )}
                            placeholder="e.g., /learn-more or https://..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {cardFields.length < 3 && (
                  <button
                    type="button"
                    onClick={() =>
                      appendCard({
                        imageUrl: "",
                        title: "",
                        description: "",
                        link: "",
                      })
                    } // Provide default values
                    className="mt-4 inline-flex items-center px-3 py-1.5 border border-dashed border-gray-400 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Card
                  </button>
                )}
              </div>
            )}

            {/* == Fields for 'banner' section type == */}
            {sectionType === "banner" && (
              <div className="space-y-5">
                <div id={`bannerImageContainer-${index}`}>
                  {" "}
                  {/* Add unique ID */}
                  <label
                    htmlFor={`bannerImageContainer-${index}`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Banner Image (e.g., Wide Aspect Ratio) *
                  </label>
                  <ImageUploadField<HomepageFormData>
                    fieldName={
                      `featureSections.${index}.typeSpecificData.imageUrl` as const
                    }
                    watch={watch}
                    setValue={setValue}
                    handleRemove={() => {
                      const currentUrl = watch(
                        `featureSections.${index}.typeSpecificData.imageUrl`
                      );
                      if (typeof currentUrl === "string") {
                        addRemovedUrl(currentUrl); // Track server URLs for deletion
                      }
                      setValue(
                        `featureSections.${index}.typeSpecificData.imageUrl`,
                        "",
                        {
                          shouldValidate: true,
                        }
                      );
                    }}
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
                    error={
                      errors.featureSections?.[index]?.typeSpecificData
                        ?.imageUrl?.message // Safe now within type check
                    }
                    altText={`Banner section ${index + 1} image`}
                    // --- Add cropping props ---
                    enableCrop={true}
                    cropAspect={16 / 4} // 4:1 Aspect ratio for banner
                    addNewFileMapping={addNewFileMapping} // Needed for fallback setValue
                  />
                </div>

                <div>
                  <label
                    htmlFor={`featureSections.${index}.typeSpecificData.altText`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Alt Text (Optional)
                  </label>
                  <input
                    type="text"
                    id={`featureSections.${index}.typeSpecificData.altText`}
                    {...register(
                      `featureSections.${index}.typeSpecificData.altText`
                    )}
                    placeholder="Describe the banner image for accessibility"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Improves SEO and accessibility.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor={`featureSections.${index}.typeSpecificData.link`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Link (Optional)
                  </label>
                  <input
                    type="text"
                    id={`featureSections.${index}.typeSpecificData.link`}
                    {...register(
                      `featureSections.${index}.typeSpecificData.link`
                    )}
                    placeholder="e.g., /promotions or https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Make the banner clickable by adding a URL.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Minimap Sortable Item Component ---

interface MinimapSortableItemProps {
  id: string;
  title: string;
  index: number;
}

const MinimapSortableItem: FC<MinimapSortableItemProps> = ({
  id,
  title,
  index,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center p-2 bg-white border border-gray-200 rounded mb-2 shadow-sm"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-1 focus:ring-primary rounded mr-2"
        aria-label="Drag to reorder section"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm text-gray-700 truncate flex-grow">
        {index + 1}. {title || "(Untitled Section)"}
      </span>
    </div>
  );
};

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

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  // Updated prepareConfigData to handle different section types
  const prepareConfigData = useCallback(
    (
      cfg: HomepageConfigWithSections | null // Input uses backend union type
    ): HomepageFormData => {
      // Output uses frontend form schema type
      if (!cfg) return defaultValues;

      const mapSectionToFormData = (
        section: HomepageFeatureSectionUnion // Input is backend union
      ): z.infer<typeof sectionUnionSchema> => {
        // Output is frontend union
        if (section.sectionType === "feature_cards_grid") {
          return {
            id: section.id,
            order: section.order,
            sectionType: "feature_cards_grid",
            title: section.title,
            subtitle: section.subtitle ?? "",
            typeSpecificData: {
              cards: section.typeSpecificData.cards.map(
                (card: z.infer<typeof featureCardSchema>) => ({
                  imageUrl: card.imageUrl,
                  title: card.title,
                  description: card.description,
                  link: card.link ?? "",
                })
              ),
            },
          };
        }

        if (section.sectionType === "banner") {
          return {
            id: section.id,
            order: section.order,
            sectionType: "banner",
            title: section.title,
            subtitle: section.subtitle ?? "",
            typeSpecificData: {
              imageUrl: section.typeSpecificData.imageUrl || "",
              altText: section.typeSpecificData.altText ?? "",
              link: section.typeSpecificData.link ?? "",
            },
          };
        }

        // Handle 'default' section
        // Note: The backend already maps legacy fields into typeSpecificData for default type
        return {
          id: section.id,
          order: section.order,
          sectionType: "default",
          title: section.title,
          subtitle: section.subtitle ?? "",
          typeSpecificData: {
            description: section.typeSpecificData.description || "",
            desktopImageUrls: section.typeSpecificData.desktopImageUrls || [],
            mobileImageUrls: section.typeSpecificData.mobileImageUrls || [],
            imageAlt: section.typeSpecificData.imageAlt ?? "",
            // Map features array back to string for textarea
            features: formatFeaturesArray(section.typeSpecificData.features),
            primaryButtonText: section.typeSpecificData.primaryButtonText ?? "",
            primaryButtonLink: section.typeSpecificData.primaryButtonLink ?? "",
            secondaryButtonText:
              section.typeSpecificData.secondaryButtonText ?? "",
            secondaryButtonLink:
              section.typeSpecificData.secondaryButtonLink ?? "",
          },
        };
      };

      return {
        heroDesktopImageUrl: cfg.heroDesktopImageUrl || "",
        heroMobileImageUrl: cfg.heroMobileImageUrl || "",
        heroTitle: cfg.heroTitle || "",
        heroSubtitle: cfg.heroSubtitle || "",
        heroPrimaryButtonText: cfg.heroPrimaryButtonText || "",
        heroPrimaryButtonLink: cfg.heroPrimaryButtonLink || "",
        heroSecondaryButtonText: cfg.heroSecondaryButtonText || "",
        heroSecondaryButtonLink: cfg.heroSecondaryButtonLink || "",
        metaTitle: cfg.metaTitle || "",
        metaDescription: cfg.metaDescription || "",
        featureSections: cfg.featureSections?.map(mapSectionToFormData) || [
          defaultFeatureSectionValue,
        ],
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

  // DND Kit Drag End Handler
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (active.id !== over?.id && over?.id !== undefined) {
        const oldIndex = fields.findIndex((field) => field.id === active.id);
        const newIndex = fields.findIndex((field) => field.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
          move(oldIndex, newIndex);
        }
      }
    },
    [fields, move]
  );

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

    // Create a deep copy to avoid modifying the original form state directly
    let finalData = JSON.parse(JSON.stringify(data)) as HomepageFormData;

    const filesToUploadMap = { ...newFileMappings };

    try {
      // Use the Zod schema for final validation before processing/upload
      const validationResult = homepageFormSchema.safeParse(finalData);
      if (!validationResult.success) {
        console.error(
          "Form validation failed onSubmit:",
          validationResult.error.flatten()
        );
        toast.error("Please fix form errors before submitting.");
        setIsSubmitting(false);
        return;
      }
      // Use the validated data from now on
      finalData = validationResult.data;

      toastId = toast.loading("Preparing data...");

      // --- Image Upload Logic (Needs adjustment for different section types) ---
      const uploadTasks: {
        blobUrl: string;
        file: File;
        target: "desktop" | "mobile";
        sectionIndex: number | null; // Null for hero images
        cardIndex?: number; // For card images
        originalPath: string; // Original path in form data (e.g., featureSections.0.typeSpecificData.cards.1.imageUrl)
        publicUrl?: string; // Add publicUrl, populated after upload
      }[] = [];

      // 1. Hero Images
      if (
        finalData.heroDesktopImageUrl?.startsWith("blob:") &&
        filesToUploadMap[finalData.heroDesktopImageUrl]
      ) {
        uploadTasks.push({
          blobUrl: finalData.heroDesktopImageUrl,
          file: filesToUploadMap[finalData.heroDesktopImageUrl],
          target: "desktop",
          sectionIndex: null,
          originalPath: "heroDesktopImageUrl",
        });
      }
      if (
        finalData.heroMobileImageUrl?.startsWith("blob:") &&
        filesToUploadMap[finalData.heroMobileImageUrl]
      ) {
        uploadTasks.push({
          blobUrl: finalData.heroMobileImageUrl,
          file: filesToUploadMap[finalData.heroMobileImageUrl],
          target: "mobile",
          sectionIndex: null,
          originalPath: "heroMobileImageUrl",
        });
      }

      // 2. Feature Section Images (Iterate and check type)
      for (const [
        sectionIndex,
        section,
      ] of finalData.featureSections?.entries() || []) {
        if (section.sectionType === "default") {
          // Handle 'default' type images (desktop/mobile arrays)
          for (const [
            imgIndex,
            url,
          ] of section.typeSpecificData.desktopImageUrls?.entries() || []) {
            if (url.startsWith("blob:") && filesToUploadMap[url]) {
              uploadTasks.push({
                blobUrl: url,
                file: filesToUploadMap[url],
                target: "desktop",
                sectionIndex,
                originalPath: `featureSections.${sectionIndex}.typeSpecificData.desktopImageUrls.${imgIndex}`,
              });
            }
          }
          for (const [
            imgIndex,
            url,
          ] of section.typeSpecificData.mobileImageUrls?.entries() || []) {
            if (url.startsWith("blob:") && filesToUploadMap[url]) {
              uploadTasks.push({
                blobUrl: url,
                file: filesToUploadMap[url],
                target: "mobile",
                sectionIndex,
                originalPath: `featureSections.${sectionIndex}.typeSpecificData.mobileImageUrls.${imgIndex}`,
              });
            }
          }
        } else if (section.sectionType === "feature_cards_grid") {
          // Handle 'feature_cards_grid' type images (within cards array)
          for (const [
            cardIndex,
            card,
          ] of section.typeSpecificData.cards?.entries() || []) {
            if (
              card.imageUrl?.startsWith("blob:") &&
              filesToUploadMap[card.imageUrl]
            ) {
              uploadTasks.push({
                blobUrl: card.imageUrl,
                file: filesToUploadMap[card.imageUrl],
                // Assuming card images are treated as 'desktop' target for optimization?
                // Or add a target field to the card schema?
                target: "desktop", // Revisit this assumption
                sectionIndex,
                cardIndex,
                originalPath: `featureSections.${sectionIndex}.typeSpecificData.cards.${cardIndex}.imageUrl`,
              });
            }
          }
        } else if (section.sectionType === "banner") {
          // Handle 'banner' type image
          const imageUrl = section.typeSpecificData.imageUrl;
          if (imageUrl?.startsWith("blob:") && filesToUploadMap[imageUrl]) {
            uploadTasks.push({
              blobUrl: imageUrl,
              file: filesToUploadMap[imageUrl],
              target: "desktop", // Treat banner as desktop for optimization
              sectionIndex,
              originalPath: `featureSections.${sectionIndex}.typeSpecificData.imageUrl`,
            });
          }
        }
      }

      // --- Perform Uploads --- (No change needed in the upload loop itself)
      const uploadedUrlMap: Record<string, string> = {}; // Map blobUrl -> publicUrl
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

        // --- Update finalData with uploaded URLs ---
        // Populate publicUrl in the original uploadTasks array first
        for (const result of results) {
          if (result.success && result.publicUrl) {
            const task = uploadTasks.find((t) => t.blobUrl === result.blobUrl);
            if (task) {
              task.publicUrl = result.publicUrl;
            }
          }
        }

        // Update Hero Images
        if (uploadedUrlMap[finalData.heroDesktopImageUrl]) {
          finalData.heroDesktopImageUrl =
            uploadedUrlMap[finalData.heroDesktopImageUrl];
        }
        if (uploadedUrlMap[finalData.heroMobileImageUrl]) {
          finalData.heroMobileImageUrl =
            uploadedUrlMap[finalData.heroMobileImageUrl];
        }

        // Update Feature Section Images
        for (const task of uploadTasks) {
          // Ensure sectionIndex is valid and featureSections exists
          if (
            task.publicUrl &&
            task.sectionIndex !== null &&
            finalData.featureSections
          ) {
            // Use the specific union type for safety
            const section = finalData.featureSections[
              task.sectionIndex
            ] as HomepageFeatureSectionUnion;
            // Additional check if section exists (though index should be valid)
            if (!section) continue;

            if (section.sectionType === "default" && section.typeSpecificData) {
              // Add null check for typeSpecificData before accessing its properties
              const desktopIndex =
                section.typeSpecificData.desktopImageUrls?.indexOf(
                  task.blobUrl
                );
              if (desktopIndex !== undefined && desktopIndex > -1) {
                section.typeSpecificData.desktopImageUrls[desktopIndex] =
                  task.publicUrl;
              }
              const mobileIndex =
                section.typeSpecificData.mobileImageUrls?.indexOf(task.blobUrl);
              if (
                mobileIndex !== undefined &&
                mobileIndex > -1 &&
                section.typeSpecificData.mobileImageUrls
              ) {
                section.typeSpecificData.mobileImageUrls[mobileIndex] =
                  task.publicUrl;
              }
            } else if (
              section.sectionType === "feature_cards_grid" &&
              section.typeSpecificData?.cards
            ) {
              // Add null check for typeSpecificData and cards
              if (
                task.cardIndex !== undefined &&
                section.typeSpecificData.cards[task.cardIndex]
              ) {
                section.typeSpecificData.cards[task.cardIndex].imageUrl =
                  task.publicUrl;
              }
            } else if (section.sectionType === "banner") {
              // Handle banner image URL update
              if (section.typeSpecificData.imageUrl === task.blobUrl) {
                section.typeSpecificData.imageUrl = task.publicUrl;
              }
            }
          }
        }

        // Revoke blob URLs
        for (const blobUrl of Object.keys(uploadedUrlMap)) {
          URL.revokeObjectURL(blobUrl);
        }
      } // End of upload handling block

      // --- Prepare Data For Server ---
      // Map frontend form data structure to backend expected structure
      const dataForServer = {
        // Hero fields remain the same
        heroDesktopImageUrl: finalData.heroDesktopImageUrl,
        heroMobileImageUrl: finalData.heroMobileImageUrl,
        heroTitle: finalData.heroTitle,
        heroSubtitle: finalData.heroSubtitle,
        heroPrimaryButtonText: finalData.heroPrimaryButtonText,
        heroPrimaryButtonLink: finalData.heroPrimaryButtonLink,
        heroSecondaryButtonText: finalData.heroSecondaryButtonText,
        heroSecondaryButtonLink: finalData.heroSecondaryButtonLink,
        metaTitle: finalData.metaTitle,
        metaDescription: finalData.metaDescription,
        // Process feature sections based on type
        featureSections: (finalData.featureSections || []).map(
          (sectionInput, index) => {
            // Use the specific union type here
            const section = sectionInput as HomepageFeatureSectionUnion;

            // Define a more specific type for the object being built
            const processedSectionData: {
              id?: number;
              order: number;
              sectionType: string;
              title: string;
              subtitle?: string;
              typeSpecificData: Record<string, any>; // Use Record<string, any> for flexibility
            } = {
              id: section.id,
              order: index,
              sectionType: section.sectionType,
              title: section.title,
              subtitle: section.subtitle,
              // Initialize with an empty object, specific structure added below
              typeSpecificData: {},
            };

            if (section.sectionType === "default") {
              // Parse features string back to array for backend
              // Ensure we access typeSpecificData for features string
              const featuresArray = parseFeaturesString(
                section.typeSpecificData?.features
              );
              // Use the URLs directly from the processed section data (finalData),
              // which should contain public URLs if uploads occurred.
              // No extra filtering needed here as blob URLs should be gone.
              const desktopUrls =
                section.typeSpecificData?.desktopImageUrls || [];
              let mobileUrls = section.typeSpecificData?.mobileImageUrls || [];

              // Fallback logic: if mobile is empty, use desktop
              if (mobileUrls.length === 0) {
                mobileUrls = desktopUrls;
              }

              // Assign typeSpecificData for 'default' type, accessing nested data correctly
              processedSectionData.typeSpecificData = {
                description: section.typeSpecificData?.description || "",
                desktopImageUrls: desktopUrls,
                mobileImageUrls: mobileUrls,
                imageAlt: section.typeSpecificData?.imageAlt || "",
                features: featuresArray,
                primaryButtonText:
                  section.typeSpecificData?.primaryButtonText || "",
                primaryButtonLink:
                  section.typeSpecificData?.primaryButtonLink || "",
                secondaryButtonText:
                  section.typeSpecificData?.secondaryButtonText || "",
                secondaryButtonLink:
                  section.typeSpecificData?.secondaryButtonLink || "",
              };
            } else if (section.sectionType === "feature_cards_grid") {
              // Process cards, ensuring imageUrl is not a blob URL
              const processedCards =
                section.typeSpecificData?.cards?.map(
                  (card: z.infer<typeof featureCardSchema>) => ({
                    ...card,
                    // Ensure we use the already replaced public URL if it existed, or original http, or empty string
                    imageUrl: card.imageUrl?.startsWith("blob:")
                      ? ""
                      : card.imageUrl || "",
                  })
                ) || [];
              // Assign typeSpecificData for 'feature_cards_grid' type
              processedSectionData.typeSpecificData = {
                cards: processedCards,
              };
            } else if (section.sectionType === "banner") {
              // Assign typeSpecificData for 'banner' type
              processedSectionData.typeSpecificData = {
                imageUrl: section.typeSpecificData.imageUrl?.startsWith("blob:")
                  ? "" // Should have been replaced by public URL if upload occurred
                  : section.typeSpecificData.imageUrl || "",
                altText: section.typeSpecificData.altText || "",
                link: section.typeSpecificData.link || "",
              };
            } else {
              // Handle unknown section types if necessary
              console.warn(
                `Unknown section type encountered: ${section.sectionType}`
              );
              processedSectionData.typeSpecificData = {}; // Assign empty object
            }

            // Remove potentially undefined fields before sending
            for (const key of Object.keys(
              processedSectionData
            ) as (keyof typeof processedSectionData)[]) {
              if (processedSectionData[key] === undefined) {
                delete processedSectionData[key];
              }
            }
            // Check if typeSpecificData exists before iterating
            if (processedSectionData.typeSpecificData) {
              for (const key of Object.keys(
                processedSectionData.typeSpecificData
              )) {
                if (processedSectionData.typeSpecificData[key] === undefined) {
                  delete processedSectionData.typeSpecificData[key];
                }
              }
            }

            // Ensure the final object structure aligns with backend expectations
            // The backend validator (sectionUnionSchema) expects typeSpecificData to be nested
            return processedSectionData as HomepageFeatureSectionUnion;
          }
        ),
      };

      // Final validation before calling server function (using backend schema potentially? or trust frontend validation)
      // For now, assume frontend validation via homepageFormSchema is sufficient before this point.

      toastId = toast.loading("Saving configuration...", { id: toastId });

      // *** Make the actual server call ***
      const result = await updateHomepageConfig({ data: dataForServer });

      // --- Handle Server Response --- (Restored from original logic)
      if (result.success && result.config) {
        toast.success("Configuration saved!", { id: toastId });

        // Reset form with the data returned from the server (already mapped to union type)
        reset(prepareConfigData(result.config as HomepageConfigWithSections));
        setNewFileMappings({});
        setRemovedImageUrls([]);

        // Delete old images if necessary
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
      // *** Restore Catch Block ***
      console.error("Error submitting form:", error);
      toast.error(
        error instanceof Error ? error.message : "An unexpected error.",
        { id: toastId }
      );
    } finally {
      // *** Restore Finally Block ***
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }; // End of onSubmit function

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

      {/* --- Main Content Area --- */}
      <div className="flex flex-col">
        {/* --- Main Form --- */}
        <div className="flex-grow">
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
                    handleRemove={addRemovedUrl} // Passes string (URL or fieldName)
                    enableCrop={true}
                    cropAspect={16 / 9} // Keep 16:9 for desktop hero
                    addNewFileMapping={addNewFileMapping} // Needed for fallback setValue
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
                    handleRemove={addRemovedUrl} // Passes string (URL or fieldName)
                    enableCrop={true}
                    cropAspect={9 / 16} // Keep 9:16 for mobile hero
                    addNewFileMapping={addNewFileMapping} // Needed for fallback setValue
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

              {/* SEO Meta Fields */}
              <div className="mt-6 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="metaTitle"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Meta Title (Optional, for SEO)
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    {...register("metaTitle")}
                    placeholder="e.g., GWM Indonesia | Premium SUVs & Hybrid Cars"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended length: 50-60 characters. Used in search
                    results.
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="metaDescription"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Meta Description (Optional, for SEO)
                  </label>
                  <input
                    type="text"
                    id="metaDescription"
                    {...register("metaDescription")}
                    placeholder="e.g., Explore the latest models from Great Wall Motor Indonesia..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Recommended length: 150-160 characters. Used in search
                    results.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Feature Sections
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Add and arrange content sections for the homepage. Drag to
                reorder.
              </p>

              {/* New two-column layout for Feature Sections */}
              <div className="flex gap-6">
                {/* Left Column: Sections Overview (Minimap) */}
                <div className="w-1/4 max-h-[calc(100vh-20rem)] overflow-y-auto p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Sections Overview
                  </h3>
                  {/* --- DND Context for Minimap --- */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {fields.map((field, index) => (
                        <MinimapSortableItem
                          key={field.id}
                          id={field.id}
                          index={index}
                          title={watch(`featureSections.${index}.title`) || ""}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>

                {/* Right Column: Section Editors */}
                <div className="w-3/4 space-y-6">
                  {/* --- DND Context for Main Sections --- */}
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={fields.map((f) => f.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {fields.map((field, index) => (
                        <SortableFeatureSection
                          key={field.id}
                          field={field}
                          index={index}
                          register={register}
                          errors={errors}
                          control={control}
                          setValue={setValue}
                          watch={watch}
                          addRemovedUrl={addRemovedUrl}
                          addNewFileMapping={addNewFileMapping}
                          removeNewFileMapping={removeNewFileMapping}
                          remove={remove}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
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
        </div>
      </div>

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
