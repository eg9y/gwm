import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getTransformUrl } from "../services/cloudflareImageService";

export const Route = createFileRoute("/test-transform")({
  component: TestTransformPage,
});

function TestTransformPage() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [width, setWidth] = useState<string>("640");
  const [format, setFormat] = useState<string>("webp");
  const [quality, setQuality] = useState<string>("85");
  const [transformedUrl, setTransformedUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const handleGenerateUrl = async () => {
    if (!imageUrl) {
      setErrorMessage("Please enter an image URL");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setImageLoaded(false);

    try {
      const transformOptions = {
        width: Number.parseInt(width, 10),
        format: format as "webp" | "auto" | "avif" | "jpeg" | "png" | "gif",
        quality: Number.parseInt(quality, 10),
      };

      const url = await getTransformUrl(imageUrl, transformOptions);
      setTransformedUrl(url);
    } catch (error) {
      console.error("Error generating transformation URL:", error);
      setErrorMessage(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setErrorMessage(
      "Failed to load the transformed image. The URL might be invalid or the image is not accessible."
    );
    setImageLoaded(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        Test Cloudflare Image Transformations
      </h1>

      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">
          Generate Transformation URL
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="imageUrl"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Original Image URL
            </label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://gwm.kopimap.com/images/example.jpg"
              className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="width"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Width
              </label>
              <input
                type="number"
                id="width"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="format"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Format
              </label>
              <select
                id="format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="webp">WebP</option>
                <option value="auto">Auto</option>
                <option value="avif">AVIF</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="gif">GIF</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="quality"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quality (1-100)
              </label>
              <input
                type="number"
                id="quality"
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                min="1"
                max="100"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGenerateUrl}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isLoading ? "Generating..." : "Generate Transformation URL"}
            </button>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
              {errorMessage}
            </div>
          )}
        </div>
      </div>

      {transformedUrl && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Transformation Result</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transformed URL
            </label>
            <div className="flex">
              <input
                type="text"
                id="transformedUrl"
                value={transformedUrl}
                readOnly
                className="flex-1 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(transformedUrl);
                }}
                className="px-4 py-2 bg-gray-200 rounded-r hover:bg-gray-300 focus:outline-none"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            {!imageLoaded && !errorMessage && (
              <div className="flex justify-center items-center h-64 bg-gray-100 rounded">
                <p className="text-gray-500">Loading image...</p>
              </div>
            )}
            <img
              src={transformedUrl}
              alt="Transformed version"
              onLoad={handleImageLoad}
              onError={handleImageError}
              className={`max-w-full h-auto rounded border border-gray-200 ${!imageLoaded ? "hidden" : ""}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}
