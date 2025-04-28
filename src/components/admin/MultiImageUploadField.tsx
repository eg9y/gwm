import { useState, useCallback, useEffect } from "react";
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
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Max file size constant
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Sortable Item component
function SortableImageItem({
  id,
  url,
  isNew,
  file,
  onRemove,
  isLoading,
}: {
  id: string;
  url: string;
  isNew?: boolean;
  file?: File;
  onRemove: () => void;
  isLoading?: boolean;
}) {
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

        <div className="absolute top-1.5 right-1.5 flex gap-1.5 opacity-75 group-hover:opacity-100 transition-opacity duration-200">
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
            onClick={onRemove}
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Small distance threshold to differentiate between click and drag
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

      const newItems: ImageItem[] = [];
      const rejectedFiles: { name: string; reason: string }[] = [];

      for (const file of files) {
        // Validation
        const validation = validateFile(file);
        if (!validation.valid) {
          rejectedFiles.push({
            name: file.name,
            reason: validation.reason || "Unknown error",
          });
          continue;
        }

        const previewUrl = URL.createObjectURL(file);
        const newItem: ImageItem = {
          id: previewUrl,
          url: previewUrl,
          file: file,
          isNew: true,
        };
        newItems.push(newItem);
        addNewFileMapping(previewUrl, file);
      }

      if (newItems.length > 0) {
        const updatedItems = [...imageItems, ...newItems];
        setImageItems(updatedItems);
        // Update RHF state with all current URLs
        setValue(
          fieldName,
          updatedItems.map(
            (item) => item.url
          ) as TFieldValues[FieldPath<TFieldValues>],
          { shouldValidate: true, shouldDirty: true }
        );

        toast.success(
          `${newItems.length} image${newItems.length > 1 ? "s" : ""} added!`
        );
      }

      if (rejectedFiles.length > 0) {
        if (rejectedFiles.length === 1) {
          toast.error(`${rejectedFiles[0].name}: ${rejectedFiles[0].reason}`);
        } else {
          toast.error(
            `${rejectedFiles.length} files were rejected. Check file types and sizes.`
          );
        }
      }

      // Clear the input value to allow selecting the same file again
      if ("target" in event && event.target) {
        (event.target as HTMLInputElement).value = "";
      }
    },
    [imageItems, setValue, fieldName, addNewFileMapping, validateFile]
  );

  const handleRemoveItem = (idToRemove: string) => {
    const itemToRemove = imageItems.find((item) => item.id === idToRemove);
    if (!itemToRemove) return;

    const updatedItems = imageItems.filter((item) => item.id !== idToRemove);
    setImageItems(updatedItems);

    // Update RHF state
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

    // Parse URLs - allow multiple URLs separated by newlines or spaces
    const inputUrls = inputUrl
      .split(/[\n\s]+/)
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (inputUrls.length === 0) {
      toast.error("Please enter at least one valid URL");
      return;
    }

    // Process each URL
    let validCount = 0;
    const validationPromises = inputUrls.map((url) => {
      return new Promise<{ url: string; valid: boolean }>((resolve) => {
        // Check if it's a valid URL starting with http/https
        if (!url || !url.startsWith("http")) {
          resolve({ url, valid: false });
          return;
        }

        // Check if the URL already exists in the array
        if (imageItems.some((item) => item.url === url)) {
          resolve({ url, valid: false });
          return;
        }

        // Test if URL leads to a valid image
        const testImage = new Image();
        testImage.onload = () => {
          resolve({ url, valid: true });
        };

        testImage.onerror = () => {
          resolve({ url, valid: false });
        };

        // Start loading the image to validate it
        testImage.src = url;
      });
    });

    // Handle all URL validations
    Promise.all(validationPromises).then((results) => {
      const validUrls = results.filter((r) => r.valid).map((r) => r.url);
      const invalidCount = results.length - validUrls.length;

      if (validUrls.length === 0) {
        toast.error("None of the provided URLs were valid image URLs");
        return;
      }

      // Add all valid URLs
      const newItems = validUrls.map((url) => ({
        id: url,
        url: url,
        isNew: false, // Not a blob URL that needs uploading
      }));

      // Update state with the new items
      const updatedItems = [...imageItems, ...newItems];
      setImageItems(updatedItems);

      // Update the form field value
      setValue(
        fieldName,
        updatedItems.map(
          (item) => item.url
        ) as TFieldValues[FieldPath<TFieldValues>],
        { shouldValidate: true, shouldDirty: true }
      );

      // Reset the input and UI state
      setInputUrl("");
      setShowUrlInput(false);

      if (invalidCount > 0) {
        toast.success(
          `Added ${validUrls.length} image URL(s). ${invalidCount} invalid URL(s) were skipped.`
        );
      } else {
        toast.success(`Added ${validUrls.length} image URL(s)`);
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setImageItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reorderedItems = arrayMove(items, oldIndex, newIndex);

        // Update RHF state after reorder
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

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const dt = e.dataTransfer;

    if (dt.items && dt.items.length > 0) {
      // Check for non-image files
      const nonImageItems = Array.from(dt.items).filter(
        (item) => item.kind === "file" && !item.type.startsWith("image/")
      );

      // Check for files exceeding size limit (need to get file details)
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

  // Get errors specific to this field array
  const fieldError = errors[fieldName as string] as
    | FieldErrors<string[]>
    | undefined;
  const rootError = fieldError?.root?.message;

  // Generate a stable ID for the file input
  const inputId = `file-input-${fieldName.replace(/\W/g, "-")}`;

  // Get aspect ratio hint based on target
  const aspectRatioHint =
    target === "desktop"
      ? "Recommended ratio: 16:9"
      : "Recommended ratio: 9:16 or 1:1";

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
              No images added yet
            </p>
            <p className="text-xs text-gray-400 mb-2">
              Drag & drop images here or click the button below to browse
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
                    id={item.id}
                    url={item.url}
                    isNew={item.isNew}
                    file={item.file}
                    onRemove={() => handleRemoveItem(item.id)}
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
                {imageItems.length > 0 ? "Add More Images" : "Select Images"}
              </span>
              <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple
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
                  placeholder="Enter image URLs (one per line or separated by spaces)"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[80px]"
                  required
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Enter image URLs (jpg, png, webp, etc.)
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
                    Add URLs
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  You can add multiple URLs at once by separating them with
                  spaces or line breaks
                </p>
              </div>
            </div>
          )}
        </div>

        {isDragging && (
          <div className="mt-3 text-center text-sm p-2 rounded bg-white/80 shadow-sm">
            {isDragAccept ? (
              <p className="text-primary font-medium flex items-center justify-center">
                <Upload className="h-4 w-4 mr-2" />
                Drop to upload images
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
    </div>
  );
}

export default MultiImageUploadField;
