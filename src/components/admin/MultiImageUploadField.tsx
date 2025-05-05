import { useState, useCallback, useEffect, useRef } from "react";
import {
  useWatch,
  type Control,
  type FieldErrors,
  type FieldPath,
  type FieldValues,
  type UseFormSetValue,
} from "react-hook-form";
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
  Trash2,
  GripVertical,
  Upload,
  Loader2,
  ImagePlus,
  Info,
  Maximize,
  X,
  AlertCircle,
  Link,
  Plus,
} from "lucide-react";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

// Interface for a single image item (existing URL or new file)
interface ImageItem {
  id: string; // Unique ID for dnd-kit (can be URL or generated ID)
  url: string; // Existing URL or blob preview URL
  file?: File; // The actual file for new uploads
  isNew?: boolean; // Flag to indicate if it's a new upload
}

interface MultiImageUploadFieldProps<TFieldValues extends FieldValues> {
  fieldName: FieldPath<TFieldValues>;
  control: Control<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  errors: FieldErrors<TFieldValues>;
  label: string;
  target: "desktop" | "mobile";
  // Function passed from parent to track removed *existing* URLs
  addRemovedUrl: (url: string) => void;
  // Function passed from parent to track *new* file uploads
  addNewFileMapping: (blobUrl: string, file: File) => void;
  removeNewFileMapping: (blobUrl: string) => void;
  enableCrop?: boolean;
  cropAspect?: number;
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Max file size constant
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// --- Cropping Helper Function (Copied from ImageUploadField) ---
const createCroppedFile = async (
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  fileName: string
): Promise<File | null> => {
  const image = new Image();
  image.crossOrigin = "anonymous"; // Request CORS access
  image.src = imageSrc;

  return new Promise((resolve) => {
    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        toast.error("Could not get canvas context for cropping.");
        resolve(null);
        return;
      }

      // Set canvas dimensions to the cropped area size
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      // Draw the cropped portion of the image onto the canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      // Convert canvas to blob and create a File
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            toast.error("Failed to create image blob from crop");
            resolve(null);
            return;
          }

          // Create a new filename with timestamp to avoid caching issues
          const newFileName = `${Date.now()}_${fileName}`;
          const file = new File([blob], newFileName, { type: "image/jpeg" });
          resolve(file);
        },
        "image/jpeg",
        0.95
      );
    };

    image.onerror = () => {
      toast.error(
        "Error loading image for crop. The image server might not allow cross-origin access."
      );
      resolve(null);
    };
  });
};

// Sortable Item component Props
interface SortableImageItemProps {
  item: ImageItem;
  onRemove: (id: string) => void;
  isLoading?: boolean;
  enableCrop?: boolean;
  cropAspect?: number;
  onEditCrop: (item: ImageItem) => void;
}

// Sortable Item component
function SortableImageItem({
  item,
  onRemove,
  isLoading,
  enableCrop,
  cropAspect,
  onEditCrop,
}: SortableImageItemProps) {
  const { id, url, isNew, file } = item;
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsPreviewOpen(false);
    }
  }, []);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group border rounded-md overflow-hidden shadow-sm bg-white transition-all duration-200 hover:shadow-md"
    >
      {isDragging && (
        <div className="absolute inset-0 border-2 border-primary rounded-md pointer-events-none" />
      )}
      <div
        className="relative cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        {imageError ? (
          <div className="w-full h-36 flex items-center justify-center bg-red-50 text-red-500">
            <AlertCircle className="h-6 w-6 mr-2" />
            <span className="text-sm">Image failed to load</span>
          </div>
        ) : (
          <img
            src={url}
            alt={isNew ? "New upload preview" : "Existing image"}
            className="w-full h-36 object-cover"
            onError={() => setImageError(true)}
          />
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {file && (
              <div className="text-white text-xs truncate">
                {file.name} ({formatFileSize(file.size)})
                {file.size > MAX_FILE_SIZE * 0.8 && (
                  <span className="ml-1 text-yellow-300 flex items-center text-[10px]">
                    <AlertCircle className="h-3 w-3 inline mr-0.5" />
                    Large file
                  </span>
                )}
              </div>
            )}
            {!file && url && (
              <div className="text-white text-xs truncate">
                {url.substring(0, 30)}...
              </div>
            )}
          </div>
        </div>
        <div className=" absolute top-1.5 right-1.5 flex flex-wrap gap-1.5 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
          {enableCrop && cropAspect && !isLoading && !imageError && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditCrop(item);
              }}
              className="p-1 bg-blue-500/70 text-white rounded-full hover:bg-blue-600/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label="Edit crop"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
                <path d="M14 19.5V14a2 2 0 0 1 2-2h5.5" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="p-1 bg-blue-500/70 text-white rounded-full hover:bg-blue-600/90 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            aria-label="Preview image"
          >
            <Maximize className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(id);
            }}
            className="p-1 bg-red-500/70 text-white rounded-full hover:bg-red-600/90 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            aria-label="Remove image"
            disabled={isLoading}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {isNew && (
        <div className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-br">
          New
        </div>
      )}
      {isPreviewOpen && !imageError && (
        <dialog
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          open
          onClick={() => setIsPreviewOpen(false)}
          onKeyDown={handleKeyDown}
          aria-modal="true"
          aria-label="Image preview"
        >
          <button
            type="button"
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white focus:outline-none focus:ring-2 focus:ring-white cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsPreviewOpen(false);
            }}
            aria-label="Close preview"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={url}
            alt={file?.name || "Image preview"}
            className="max-h-[90vh] max-w-[90vw] object-contain rounded shadow-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key !== "Escape") {
                e.stopPropagation();
              }
            }}
            tabIndex={-1}
            onError={() => setImageError(true)}
          />
        </dialog>
      )}
    </div>
  );
}

function MultiImageUploadField<TFieldValues extends FieldValues>({
  fieldName,
  control,
  setValue,
  errors,
  label,
  target,
  addRemovedUrl,
  addNewFileMapping,
  removeNewFileMapping,
  enableCrop = false,
  cropAspect,
}: MultiImageUploadFieldProps<TFieldValues>) {
  // Use useWatch to get the current array of URLs from react-hook-form state
  const currentUrls =
    (useWatch({ control, name: fieldName }) as string[] | undefined) || [];

  // Local state to manage both existing URLs and newly added files/previews
  const [imageItems, setImageItems] = useState<ImageItem[]>(() =>
    currentUrls.map((url) => ({ id: url, url, isNew: false }))
  );

  const [isDragging, setIsDragging] = useState(false);
  const [isDragAccept, setIsDragAccept] = useState(false);
  const [isDragReject, setIsDragReject] = useState(false);
  const [dragRejectionReason, setDragRejectionReason] = useState<string>("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- State for cropping ---
  const [isCropping, setIsCropping] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppingItem, setCroppingItem] = useState<
    ImageItem | { file: File } | { url: string } | null
  >(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const validateFile = useCallback(
    (file: File): { valid: boolean; reason?: string } => {
      if (!file.type.startsWith("image/")) {
        return { valid: false, reason: `"${file.name}" is not a valid image.` };
      }
      if (file.size > MAX_FILE_SIZE) {
        return {
          valid: false,
          reason: `"${file.name}" exceeds the 5MB size limit.`,
        };
      }
      return { valid: true };
    },
    []
  );

  const handleFileSelect = useCallback(
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.DragEvent<HTMLDivElement>
    ) => {
      let files: FileList | null = null;

      if ("dataTransfer" in event) {
        files = event.dataTransfer.files;
      } else if ("target" in event && event.target) {
        files = (event.target as HTMLInputElement).files;
      }

      if (!files || files.length === 0) return;

      // Collect valid files and rejected files separately
      const validFiles: File[] = [];
      const rejectedFiles: { name: string; reason: string }[] = [];

      for (const file of files) {
        const validation = validateFile(file);
        if (validation.valid) {
          validFiles.push(file);
        } else {
          rejectedFiles.push({
            name: file.name,
            reason: validation.reason || "Unknown error",
          });
        }
      }

      // --- If cropping is enabled, process the first valid file ---
      if (enableCrop && cropAspect && validFiles.length > 0) {
        const fileToCrop = validFiles[0]; // Get the first valid file
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppingItem({ file: fileToCrop });

        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImgSrc(reader.result?.toString() || "");
          setIsCropping(true);
        });
        reader.readAsDataURL(fileToCrop);

        if (validFiles.length > 1) {
          toast("Cropping applied to the first selected image only.", {
            icon: "ℹ️",
          });
        }
        if (rejectedFiles.length > 0) {
          if (rejectedFiles.length === 1) {
            toast.error(`${rejectedFiles[0].name}: ${rejectedFiles[0].reason}`);
          } else {
            toast.error(
              `${rejectedFiles.length} other files were rejected. Check file types and sizes.`
            );
          }
        }
      } else {
        // --- Logic for adding a single file (cropping disabled) ---
        if (validFiles.length > 0) {
          const fileToAdd = validFiles[0]; // Take only the first valid file
          const previewUrl = URL.createObjectURL(fileToAdd); // Create URL from file
          addNewFileMapping(previewUrl, fileToAdd); // Map the correct file
          const newItem: ImageItem = {
            id: previewUrl,
            url: previewUrl,
            file: fileToAdd,
            isNew: true,
          };
          const updatedItems = [...imageItems, newItem]; // Add the single new item
          setImageItems(updatedItems);
          setValue(
            fieldName,
            updatedItems.map(
              (item) => item.url
            ) as TFieldValues[FieldPath<TFieldValues>],
            { shouldValidate: true, shouldDirty: true }
          );
          toast.success(`Image "${fileToAdd.name}" added!`);
        }

        // Inform user if multiple files were selected/dropped but only one was used
        if (files.length > 1) {
          toast("Multiple files selected, only the first one was added.");
        }

        // Handle rejected files (show errors even if one was added successfully)
        if (rejectedFiles.length > 0) {
          if (rejectedFiles.length === 1) {
            toast.error(`${rejectedFiles[0].name}: ${rejectedFiles[0].reason}`);
          } else {
            toast.error(
              `${rejectedFiles.length} files were rejected. Check file types and sizes.`
            );
          }
        }
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [
      imageItems,
      setValue,
      fieldName,
      addNewFileMapping,
      validateFile,
      enableCrop,
      cropAspect,
    ]
  );

  const handleRemoveItem = (idToRemove: string) => {
    const itemToRemove = imageItems.find((item) => item.id === idToRemove);
    if (!itemToRemove) return;

    const updatedItems = imageItems.filter((item) => item.id !== idToRemove);
    setImageItems(updatedItems);

    setValue(
      fieldName,
      updatedItems.map(
        (item) => item.url
      ) as TFieldValues[FieldPath<TFieldValues>],
      { shouldValidate: true, shouldDirty: true }
    );

    if (itemToRemove.isNew && itemToRemove.url.startsWith("blob:")) {
      URL.revokeObjectURL(itemToRemove.url);
      removeNewFileMapping(itemToRemove.url);
    } else if (!itemToRemove.isNew && itemToRemove.url.startsWith("http")) {
      addRemovedUrl(itemToRemove.url);
    }

    toast.success("Image removed");
  };

  const handleUrlSubmit = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();

    // Trim the input URL
    const urlToAdd = inputUrl.trim();

    // --- Unified Logic: Always handle a single URL ---
    if (!urlToAdd) {
      toast.error("Please enter an image URL.");
      return;
    }

    // Basic URL validation
    if (!urlToAdd.startsWith("http")) {
      toast.error("Please enter a valid URL starting with http:// or https://");
      return;
    }

    // Check if URL already exists
    if (imageItems.some((item) => item.url === urlToAdd)) {
      toast.error("This image URL has already been added.");
      return;
    }

    // Test if URL leads to a valid image
    const testImage = new Image();
    testImage.onload = () => {
      // --- Cropping Logic ---
      if (enableCrop && cropAspect) {
        // Reset crop state and open modal
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setRotation(0);
        setCroppingItem({ url: urlToAdd }); // Mark as new URL for cropping
        setImgSrc(urlToAdd); // Use the URL directly as source
        setIsCropping(true); // Open the cropping modal
      } else {
        // --- No Crop: Add directly ---
        const newItem: ImageItem = {
          id: urlToAdd,
          url: urlToAdd,
          isNew: false, // Not a blob URL
        };
        const updatedItems = [...imageItems, newItem];
        setImageItems(updatedItems);
        setValue(
          fieldName,
          updatedItems.map(
            (item) => item.url
          ) as TFieldValues[FieldPath<TFieldValues>],
          { shouldValidate: true, shouldDirty: true }
        );
        toast.success(`Image URL added successfully.`);
      }
      // Reset UI whether cropping or not
      setShowUrlInput(false);
      setInputUrl("");
    };

    testImage.onerror = () => {
      toast.error("Could not load image from URL. Please check the URL.");
    };

    // Start loading the image
    testImage.src = urlToAdd;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        setValue(
          fieldName,
          reorderedItems.map(
            (item) => item.url
          ) as TFieldValues[FieldPath<TFieldValues>],
          { shouldValidate: true, shouldDirty: true }
        );

        return reorderedItems;
      });

      toast.success("Images reordered", { id: "reorder-toast" });
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const dt = e.dataTransfer;

    if (dt.items && dt.items.length > 0) {
      const nonImageItems = Array.from(dt.items).filter(
        (item) => item.kind === "file" && !item.type.startsWith("image/")
      );

      const hasInvalidItem = nonImageItems.length > 0;

      setIsDragAccept(!hasInvalidItem);
      setIsDragReject(hasInvalidItem);

      if (hasInvalidItem) {
        setDragRejectionReason("Only image files are allowed");
      }
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setIsDragAccept(false);
    setIsDragReject(false);
    setDragRejectionReason("");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setIsDragAccept(false);
      setIsDragReject(false);
      setDragRejectionReason("");

      handleFileSelect(e);
    },
    [handleFileSelect]
  );

  const fieldError = errors[fieldName as string] as
    | FieldErrors<string[]>
    | undefined;
  const rootError = fieldError?.root?.message;

  const inputId = `file-input-${fieldName.replace(/\W/g, "-")}`;

  const aspectRatioHint =
    target === "desktop"
      ? "Recommended ratio: 16:9"
      : "Recommended ratio: 9:16 or 1:1";

  // --- Cropping Handlers ---
  const onCropComplete = (croppedArea: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  };

  const resetCropState = () => {
    setIsCropping(false);
    setImgSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setCroppingItem(null);
  };

  const onCropCancel = () => {
    resetCropState();
  };

  const onCropConfirm = async () => {
    if (!croppedAreaPixels || !croppingItem) {
      toast.error("Cropping data is missing.");
      return;
    }

    let originalFileName = "cropped.jpg";
    if ("file" in croppingItem && croppingItem.file) {
      originalFileName = croppingItem.file.name;
    } else if ("url" in croppingItem && croppingItem.url) {
      originalFileName = croppingItem.url.split("/").pop() || originalFileName;
      originalFileName = originalFileName.split("?")[0].split("#")[0];
    }

    try {
      const croppedFile = await createCroppedFile(
        imgSrc,
        croppedAreaPixels,
        originalFileName
      );

      if (!croppedFile) {
        throw new Error("Failed to create cropped file.");
      }

      const newBlobUrl = URL.createObjectURL(croppedFile);
      const newItem: ImageItem = {
        id: newBlobUrl,
        url: newBlobUrl,
        file: croppedFile,
        isNew: true,
      };

      addNewFileMapping(newBlobUrl, croppedFile);

      let updatedItems: ImageItem[];

      if ("id" in croppingItem) {
        const indexToReplace = imageItems.findIndex(
          (item) => item.id === croppingItem.id
        );
        if (indexToReplace !== -1) {
          updatedItems = [...imageItems];
          updatedItems[indexToReplace] = newItem;

          const replacedItem = imageItems[indexToReplace];
          if (replacedItem.isNew && replacedItem.url.startsWith("blob:")) {
            URL.revokeObjectURL(replacedItem.url);
            removeNewFileMapping(replacedItem.url);
          } else if (
            !replacedItem.isNew &&
            replacedItem.url.startsWith("http")
          ) {
            addRemovedUrl(replacedItem.url);
          }
        } else {
          updatedItems = [...imageItems, newItem];
        }
      } else {
        updatedItems = [...imageItems, newItem];
      }

      setImageItems(updatedItems);
      setValue(
        fieldName,
        updatedItems.map(
          (item) => item.url
        ) as TFieldValues[FieldPath<TFieldValues>],
        { shouldValidate: true, shouldDirty: true }
      );

      toast.success("Image cropped successfully!");
    } catch (error) {
      console.error("Error during crop confirmation:", error);
      toast.error("Failed to crop image.");
    } finally {
      resetCropState();
    }
  };

  const handleEditCrop = (itemToCrop: ImageItem) => {
    if (enableCrop && cropAspect) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppingItem(itemToCrop);
      setImgSrc(itemToCrop.url);
      setIsCropping(true);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700"
          id={`${inputId}-label`}
        >
          {label}
        </label>
        <div className="text-xs text-gray-500 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          {aspectRatioHint}
        </div>
      </div>

      <div
        className={`
          border-2 rounded-lg p-4 transition-all duration-200 
          ${isDragging ? "bg-blue-50" : "bg-gray-50/50"}
          ${
            isDragAccept
              ? "border-primary border-dashed"
              : isDragReject
                ? "border-red-500 border-dashed"
                : "border-dashed border-gray-300"
          }
          ${isDragging ? "shadow-md" : ""}
          focus-within:border-primary focus-within:ring-1 focus-within:ring-primary
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-labelledby={`${inputId}-label`}
        aria-describedby={rootError ? `${inputId}-error` : undefined}
      >
        {imageItems.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4">
            <ImagePlus className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1 font-medium">
              No image added yet
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Drag & drop an image here or use the buttons below
            </p>
            <p className="text-xs text-gray-400 flex items-center">
              <Info className="h-3 w-3 mr-1" />
              Maximum file size: 5MB
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={imageItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {imageItems.map((item) => (
                  <SortableImageItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemoveItem}
                    enableCrop={enableCrop}
                    cropAspect={cropAspect}
                    onEditCrop={handleEditCrop}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}

        <div className="mt-4 flex flex-col items-center space-y-3">
          <div className="flex space-x-3">
            <label
              htmlFor={inputId}
              className="cursor-pointer inline-flex items-center px-4 py-2.5 bg-primary/90 text-white rounded-md hover:bg-primary transition-colors duration-200 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
            >
              <Upload className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">
                {imageItems.length > 0 ? "Add Another Image" : "Select Image"}
              </span>
              <input
                id={inputId}
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="sr-only"
                aria-describedby={rootError ? `${inputId}-error` : undefined}
              />
            </label>

            <button
              type="button"
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="inline-flex items-center px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Link className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Add Image URL</span>
            </button>
          </div>

          {showUrlInput && (
            <div className="w-full max-w-md mt-2 p-3 border border-gray-200 rounded-md bg-white">
              <div className="flex flex-col space-y-2">
                <textarea
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="Enter a single image URL (jpg, png, webp, etc.)"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[80px]"
                  required
                  rows={1}
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Paste a single image URL here.
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleUrlSubmit(e);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors duration-200 shadow-sm focus:outline-none text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add URL
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {isDragging && (
          <div className="mt-3 text-center text-sm p-2 rounded bg-white/80 shadow-sm">
            {isDragAccept ? (
              <p className="text-primary font-medium flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Drop image here to upload
              </p>
            ) : (
              <p className="text-red-500 font-medium flex items-center justify-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {dragRejectionReason || "Some files are not valid images"}
              </p>
            )}
          </div>
        )}
      </div>

      {rootError && (
        <p
          id={`${inputId}-error`}
          className="mt-1 text-sm text-red-600 font-medium flex items-center"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          {rootError}
        </p>
      )}

      {imageItems.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500 flex items-center">
            <GripVertical className="h-3 w-3 mr-1" />
            Drag images to reorder
          </div>
          <div className="text-xs font-medium text-primary">
            {imageItems.length} image{imageItems.length !== 1 ? "s" : ""} total
          </div>
        </div>
      )}

      {/* --- Cropping Modal --- */}
      {isCropping && imgSrc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-75 p-4"
          aria-labelledby="crop-modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <h2
              id="crop-modal-title"
              className="text-xl font-semibold text-gray-800 mb-4"
            >
              Crop Image
            </h2>
            <button
              onClick={onCropCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              aria-label="Close cropping modal"
            >
              <X className="h-6 w-6" />
            </button>

            <div
              className="relative"
              style={{ height: "400px", maxHeight: "60vh" }}
            >
              <Cropper
                image={imgSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                rotation={rotation}
                onRotationChange={setRotation}
                objectFit="contain"
                showGrid={true}
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="zoom"
                className="block text-sm text-gray-700 mb-1"
              >
                Zoom ({zoom.toFixed(1)}x)
              </label>
              <input
                type="range"
                id="zoom"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="rotation"
                className="block text-sm text-gray-700 mb-1"
              >
                Rotation ({rotation}°)
              </label>
              <input
                type="range"
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-5 border-t pt-4">
              <button
                type="button"
                onClick={onCropCancel}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCropConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              >
                Confirm Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MultiImageUploadField;
