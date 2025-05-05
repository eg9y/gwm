import { Upload, Link, X } from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type FormEvent,
} from "react";
import type {
  UseFormWatch,
  Path,
  FieldValues,
  UseFormSetValue,
} from "react-hook-form";
import toast from "react-hot-toast";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

// Define the props for the ImageUploadField
// Using generics to make it adaptable to different form schemas
interface ImageUploadFieldProps<TFormValues extends FieldValues> {
  fieldName: Path<TFormValues>; // Use Path for type safety
  watch: UseFormWatch<TFormValues>;
  setValue?: UseFormSetValue<TFormValues>; // Make this optional as it might not be used
  handleRemove: (urlOrFieldName: string | Path<TFormValues>) => void; // Modified to accept URL or fieldName
  handleUploadClick?: (fieldName: Path<TFormValues>) => void; // Keep for backward compatibility
  onFileSelected?: (fieldName: Path<TFormValues>, file: File) => void; // New callback for file selection
  error?: string;
  altText?: string;
  cropAspect?: number; // e.g., 16 / 9, 1
  enableCrop?: boolean; // Defaults to false if not provided
  addNewFileMapping?: (blobUrl: string, file: File) => void; // Needed if using setValue with blobs
}

// Helper function to get the cropped image as a File
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

// Reusable Image Upload Field Component using generics
export function ImageUploadField<TFormValues extends FieldValues>({
  fieldName,
  watch,
  setValue,
  handleRemove,
  handleUploadClick,
  onFileSelected,
  error,
  altText = "Image preview", // More descriptive default alt text
  cropAspect,
  enableCrop = false, // Default enableCrop to false
  addNewFileMapping, // Destructure new prop
}: ImageUploadFieldProps<TFormValues>) {
  const imageUrl = watch(fieldName);
  const isUrl = typeof imageUrl === "string";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [inputUrl, setInputUrl] = useState("");

  // --- State for cropping ---
  const [imgSrc, setImgSrc] = useState(""); // Source for the cropper modal
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false); // Control modal visibility
  const [originalFile, setOriginalFile] = useState<File | null>(null); // Store the originally selected file

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // --- Cropping Logic ---
      if (enableCrop && cropAspect) {
        // Reset crop position
        setCrop({ x: 0, y: 0 });
        setZoom(1); // Reset zoom
        setRotation(0); // Reset rotation
        setOriginalFile(file); // Store the original file
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          setImgSrc(reader.result?.toString() || "");
          setIsCropping(true); // Open the cropping modal
        });
        reader.readAsDataURL(file);
      } else {
        // --- Original Logic (No Crop) ---
        if (onFileSelected) {
          onFileSelected(fieldName, file);
        } else if (handleUploadClick) {
          // Legacy behavior
          handleUploadClick(fieldName);
        }
      }

      // Reset the file input for future selections
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleUrlSubmit = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()?.startsWith("http")) {
      const newUrl = inputUrl.trim();

      // Test if URL leads to a valid image
      const testImage = new Image();
      testImage.onload = () => {
        // --- Cropping Logic for URL ---
        if (enableCrop && cropAspect) {
          // Reset crop position
          setCrop({ x: 0, y: 0 });
          setZoom(1); // Reset zoom
          setRotation(0); // Reset rotation
          setOriginalFile(null); // No original file for URL input
          setImgSrc(newUrl); // Use the URL directly as source
          setIsCropping(true); // Open the cropping modal
          setShowUrlInput(false); // Hide URL input field
          setInputUrl("");
        } else {
          // --- Original Logic (No Crop) ---
          if (setValue) {
            // Only use setValue if it's provided
            setValue(fieldName, newUrl as TFormValues[Path<TFormValues>]);
            toast.success("Image URL added successfully");
          }
          setShowUrlInput(false);
          setInputUrl("");
        }
      };

      testImage.onerror = () => {
        toast.error(
          "Could not load image from URL. Please check the URL and try again."
        );
      };

      // Start loading the image
      testImage.src = newUrl;
    } else {
      toast.error("Please enter a valid URL starting with http:// or https://");
    }
  };

  // --- Function to handle completed crop ---
  const onCropComplete = (croppedArea: any, croppedAreaPixelsData: any) => {
    setCroppedAreaPixels(croppedAreaPixelsData);
  };

  // --- Handler for confirming the crop ---
  const onCropConfirm = async () => {
    if (!croppedAreaPixels) {
      toast.error("Please crop the image first");
      return;
    }

    try {
      // Get the filename
      const fileName =
        originalFile?.name ||
        `${fieldName.toString().split(".").pop() || "cropped"}.jpg`;

      // Create a cropped file using the helper function
      const croppedFile = await createCroppedFile(
        imgSrc,
        croppedAreaPixels,
        fileName
      );

      if (croppedFile) {
        if (onFileSelected) {
          onFileSelected(fieldName, croppedFile);
        } else {
          // Fallback or alternative logic if needed, e.g., using setValue with blob URL
          if (setValue && addNewFileMapping) {
            const newBlobUrl = URL.createObjectURL(croppedFile);
            setValue(fieldName, newBlobUrl as any, { shouldValidate: true });
            addNewFileMapping(newBlobUrl, croppedFile); // Important for parent tracking
          } else {
            console.warn(
              "setValue or addNewFileMapping not provided for cropped file handling."
            );
          }
        }
        // If we cropped an *existing* http url, mark the original for removal
        if (imgSrc.startsWith("http")) {
          handleRemove(imgSrc); // Pass the original URL to the remove handler
        }
      }
    } catch (error) {
      console.error("Error creating cropped file:", error);
      toast.error("Failed to crop image");
    }

    // Reset cropping state
    setIsCropping(false);
    setImgSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setOriginalFile(null);
  };

  // --- Handler for canceling the crop ---
  const onCropCancel = () => {
    setIsCropping(false);
    setImgSrc("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setOriginalFile(null);
  };

  // --- Handler to initiate cropping for an existing image ---
  const handleEditCrop = () => {
    if (isUrl && imageUrl && enableCrop && cropAspect) {
      setCrop({ x: 0, y: 0 }); // Reset crop
      setZoom(1); // Reset zoom
      setRotation(0); // Reset rotation
      setOriginalFile(null); // No original file
      setImgSrc(imageUrl); // Set source to existing URL
      setIsCropping(true); // Open modal
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
                target.src =
                  "https://media.istockphoto.com/id/1147544807/vector/thumbnail-image-vector-graphic.jpg?s=612x612&w=0&k=20&c=rnCKVbdxqkjlcs3xH87-9gocETqpspHFXu5dIGB4wuM="; // Consistent path
                target.alt = "Image failed to load";
                target.classList.add("object-contain"); // Adjust display on error
              }}
            />
            {/* Overlay with Remove Button */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 flex items-center justify-center gap-2 transition-opacity rounded-md opacity-0 group-hover:opacity-100">
              {/* --- Add Edit Crop button if enabled --- */}
              {enableCrop && cropAspect && (
                <button
                  type="button"
                  onClick={handleEditCrop}
                  className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
                >
                  Edit Crop
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  // Ensure imageUrl is a string before passing
                  if (typeof imageUrl === "string") {
                    // Use the modified handleRemove
                    handleRemove(
                      imageUrl.startsWith("blob:") ? fieldName : imageUrl
                    );
                  }
                  // Optionally, also clear the field value using setValue if it's provided
                  if (setValue) {
                    setValue(fieldName, "" as TFormValues[Path<TFormValues>], {
                      shouldValidate: true,
                    }); // Clear the value
                  }
                }}
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
                  <p className="text-xs text-gray-400 mt-1">
                    Recommended: {cropAspect ? `${cropAspect}:1` : "16:9"}
                  </p>
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

      {/* --- Cropping Modal --- */}
      {isCropping && imgSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
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
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="zoom"
                className="block text-sm text-gray-700 mb-1"
              >
                Zoom
              </label>
              <input
                type="range"
                id="zoom"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor="rotation"
                className="block text-sm text-gray-700 mb-1"
              >
                Rotation
              </label>
              <input
                type="range"
                id="rotation"
                min={0}
                max={360}
                step={1}
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-5 border-t pt-4">
              <button
                type="button"
                onClick={onCropCancel}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onCropConfirm}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-primary hover:bg-primary/90"
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

export default ImageUploadField;
