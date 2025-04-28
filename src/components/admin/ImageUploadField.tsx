import { Upload } from "lucide-react";
import { useRef } from "react";
import type { UseFormWatch, Path, FieldValues } from "react-hook-form";

// Define the props for the ImageUploadField
// Using generics to make it adaptable to different form schemas
interface ImageUploadFieldProps<TFormValues extends FieldValues> {
  fieldName: Path<TFormValues>; // Use Path for type safety
  watch: UseFormWatch<TFormValues>;
  handleRemove: (fieldName: Path<TFormValues>) => void;
  handleUploadClick: (blobUrl: string, file: File) => void;
  error?: string;
  altText?: string;
}

// Reusable Image Upload Field Component using generics
export function ImageUploadField<TFormValues extends FieldValues>({
  fieldName,
  watch,
  handleRemove,
  handleUploadClick,
  error,
  altText = "Image preview", // More descriptive default alt text
}: ImageUploadFieldProps<TFormValues>) {
  const imageUrl = watch(fieldName);
  const isUrl = typeof imageUrl === "string";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const blobUrl = URL.createObjectURL(file);
      handleUploadClick(blobUrl, file);

      // Reset the file input for future selections
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="mb-2">
        {isUrl && imageUrl ? (
          <div className="relative group">
            <img
              src={imageUrl}
              alt={altText}
              className="w-full h-44 object-cover rounded-md border border-gray-200"
              // Add loading state and better error handling
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.svg"; // Consistent path
                target.alt = "Image failed to load";
                target.classList.add("object-contain"); // Adjust display on error
              }}
            />
            {/* Overlay with Remove Button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center transition-opacity rounded-md opacity-0 group-hover:opacity-100">
              <button
                type="button"
                onClick={() => handleRemove(fieldName)} // No need for extra closure
                className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-red-700 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          /* Upload Placeholder */
          <button
            type="button"
            className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors w-full h-44 text-center"
            onClick={handleFileSelect}
          >
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 font-medium">
              Click to upload image
            </p>
            <p className="text-xs text-gray-400 mt-1">Recommended: 16:9</p>
          </button>
        )}
      </div>
      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default ImageUploadField;
