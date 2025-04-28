import { Upload, Link } from "lucide-react";
import { useRef, useState } from "react";
import type { UseFormWatch, Path, FieldValues, UseFormSetValue } from "react-hook-form";

// Define the props for the ImageUploadField
// Using generics to make it adaptable to different form schemas
interface ImageUploadFieldProps<TFormValues extends FieldValues> {
  fieldName: Path<TFormValues>; // Use Path for type safety
  watch: UseFormWatch<TFormValues>;
  setValue: UseFormSetValue<TFormValues>;
  handleRemove: (fieldName: Path<TFormValues>) => void;
  handleUploadClick: (blobUrl: string, file: File) => void;
  error?: string;
  altText?: string;
}

// Reusable Image Upload Field Component using generics
export function ImageUploadField<TFormValues extends FieldValues>({
  fieldName,
  watch,
  setValue,
  handleRemove,
  handleUploadClick,
  error,
  altText = "Image preview", // More descriptive default alt text
}: ImageUploadFieldProps<TFormValues>) {
  const imageUrl = watch(fieldName);
  const isUrl = typeof imageUrl === "string";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

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
  
  const handleUrlSubmit = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && inputUrl.trim().startsWith("http")) {
      const newUrl = inputUrl.trim();
      
      // Test if URL leads to a valid image
      const testImage = new Image();
      testImage.onload = () => {
        // Valid image URL
        setValue(fieldName, newUrl as any);
        setShowUrlInput(false);
        setInputUrl("");
        toast.success("Image URL added successfully");
      };
      
      testImage.onerror = () => {
        toast.error("Could not load image from URL. Please check the URL and try again.");
      };
      
      // Start loading the image
      testImage.src = newUrl;
    } else {
      toast.error("Please enter a valid URL starting with http:// or https://");
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
          <div>
            {showUrlInput ? (
              <div className="mb-3">
                <div className="flex flex-col space-y-2">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="Enter image URL"
                    className="border border-gray-300 rounded-md p-2 text-sm w-full"
                    required
                  />
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleUrlSubmit(e);
                      }}
                      className="bg-primary text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors flex items-center"
                    >
                      <Link className="h-4 w-4 mr-1" />
                      Use URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(false)}
                      className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors w-full h-36 text-center"
                  onClick={handleFileSelect}
                >
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">
                    Click to upload image
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Recommended: 16:9</p>
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInput(true)}
                  className="flex items-center justify-center text-sm text-primary hover:text-primary/80 font-medium"
                >
                  <Link className="h-4 w-4 mr-1" />
                  Or use an image URL instead
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {/* Error Message */}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default ImageUploadField;
