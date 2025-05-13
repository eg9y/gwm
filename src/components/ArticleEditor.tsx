// @ts-ignore - Importing types
import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import type { FormEvent } from "react";
import { useAuth } from "@clerk/tanstack-start";
import {
  Loader2,
  ChevronLeft,
  Save,
  Upload,
  Eye,
  RefreshCw,
} from "lucide-react";
import { createArticle, updateArticle } from "../server/articles";
import {
  getPresignedUploadUrl,
  generateUniqueFileName,
  ensureCorrectImageDomain,
  deleteObjectFromR2,
  extractObjectKeyFromUrl,
} from "../services/r2Service";
import type { UploadResult } from "../services/r2Service";
import type { Article } from "../db";
import TiptapEditor, {
  type LocalImage,
  type RemovedImage,
} from "./TiptapEditor";
import { ImageUploadField } from "./admin/ImageUploadField";

// Simple type for ImageUploadField generic
interface ArticleFormData {
  thumbnailImageUrl?: string;
  // Add other form fields if ImageUploadField were to be used for them with react-hook-form
}

interface ArticleEditorProps {
  isNew: boolean;
  article: Article | null;
  id?: string;
  error?: string | null;
}

// Interface for the server response
interface ArticleResponse {
  success: boolean;
  article?: Article;
  message?: string;
}

export default function ArticleEditor({
  isNew,
  article,
  id,
  error: loadError = null,
}: ArticleEditorProps) {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();

  // Helper function to normalize image URLs in HTML content
  const normalizeImageUrls = useCallback((htmlContent: string): string => {
    // Use regex to find image tags with src attributes
    const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
    return htmlContent.replace(imgRegex, (match, src) => {
      // Replace the src with the corrected domain version
      const correctedSrc = ensureCorrectImageDomain(src);
      return match.replace(src, correctedSrc);
    });
  }, []);

  // Form state
  const [title, setTitle] = useState(article?.title || "");
  const [slug, setSlug] = useState(article?.slug || "");
  const [content, setContent] = useState(
    article?.content ? normalizeImageUrls(article.content) : ""
  );
  const [excerpt, setExcerpt] = useState(article?.excerpt || "");
  const [category, setCategory] = useState(article?.category || "News");
  const [published, setPublished] = useState(article?.published === 1);
  const [metaDescription, setMetaDescription] = useState(
    article?.metaDescription || ""
  );

  // Image upload state
  const [featuredImageFile, setFeaturedImageFile] = useState<File | null>(null);
  const [featuredImagePreview, setFeaturedImagePreview] = useState<string>(
    article?.featuredImageUrl
      ? ensureCorrectImageDomain(article.featuredImageUrl)
      : ""
  );
  const [featuredImageUrl, setFeaturedImageUrl] = useState(
    article?.featuredImageUrl
      ? ensureCorrectImageDomain(article.featuredImageUrl)
      : ""
  );
  const [featuredImageAlt, setFeaturedImageAlt] = useState(
    article?.featuredImageAlt || ""
  );
  const [thumbnailImageFile, setThumbnailImageFile] = useState<File | null>(
    null
  );
  const [thumbnailImageUrl, setThumbnailImageUrl] = useState<string>(
    article?.thumbnail_image
      ? ensureCorrectImageDomain(article.thumbnail_image)
      : ""
  );
  const [inlineImages, setInlineImages] = useState<LocalImage[]>([]);
  const [uploadingStatus, setUploadingStatus] = useState<{
    current: number;
    total: number;
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form submission state
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Add state for tracking removed inline images
  const [removedInlineImages, setRemovedInlineImages] = useState<
    RemovedImage[]
  >([]);

  // Reset form when article changes
  useEffect(() => {
    if (article) {
      setTitle(article.title || "");
      setSlug(article.slug || "");
      const normalizedContent = article.content
        ? normalizeImageUrls(article.content)
        : "";
      setContent(normalizedContent);
      setExcerpt(article.excerpt || "");
      setCategory(article.category || "News");
      setPublished(article.published === 1);
      const normalizedFeaturedImageUrl = article.featuredImageUrl
        ? ensureCorrectImageDomain(article.featuredImageUrl)
        : "";
      setFeaturedImageUrl(normalizedFeaturedImageUrl);
      setFeaturedImagePreview(normalizedFeaturedImageUrl);
      setFeaturedImageAlt(article.featuredImageAlt || "");
      setMetaDescription(article.metaDescription || "");
      const normalizedThumbnailImageUrl = article.thumbnail_image
        ? ensureCorrectImageDomain(article.thumbnail_image)
        : "";
      setThumbnailImageUrl(normalizedThumbnailImageUrl);
      setThumbnailImageFile(null);
    }
  }, [article, normalizeImageUrls]);

  // Helper function to generate a slug from title
  const generateSlugFromTitle = useCallback(() => {
    if (!title) return "";
    // Simple slug generation - convert to lowercase, replace spaces with hyphens, remove special chars
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  }, [title]);

  // Handle featured image selection
  const handleFeatureImageSelect = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    setFeaturedImageFile(file);
    setFeaturedImagePreview(previewUrl);

    // Clear the input so the same file can be selected again if needed
    if (event.target) {
      event.target.value = "";
    }
  };

  // Handle thumbnail image selection and upload
  const handleThumbnailImageSelect = (
    fieldName: "thumbnailImageUrl",
    file: File
  ) => {
    setThumbnailImageFile(file);
  };

  const handleRemoveThumbnailImage = () => {
    setThumbnailImageFile(null);
    setThumbnailImageUrl("");
  };

  // Upload a single file to R2
  const uploadFileToR2 = async (file: File): Promise<UploadResult> => {
    try {
      // Get presigned URL
      const formData = new FormData();
      formData.append("fileName", file.name);
      formData.append("fileType", file.type);

      const presignedData = await getPresignedUploadUrl({ data: formData });

      if (!presignedData.presignedUrl) {
        throw new Error("Failed to get upload URL");
      }

      // Upload using XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round(
              (event.loaded / event.total) * 100
            );
            setUploadingStatus((prev) => ({
              current: prev?.current || 0,
              total: prev?.total || 0,
              message: `Uploading file: ${percentComplete}%`,
            }));
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              objectKey: presignedData.objectKey,
              publicUrl: presignedData.publicUrl,
            });
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("File upload failed"));
        });

        xhr.open("PUT", presignedData.presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new Error(
        error instanceof Error ? error.message : "Failed to upload file"
      );
    }
  };

  // Upload all images and return updated content
  const uploadAllImages = async (): Promise<{
    updatedContent: string;
    featuredImageResult: UploadResult | null;
    thumbnailImageResult: UploadResult | null;
  }> => {
    let currentContent = content;
    let featuredResult: UploadResult | null = null;
    let thumbnailResult: UploadResult | null = null;

    try {
      // Calculate total uploads
      const totalUploads =
        inlineImages.length +
        (featuredImageFile ? 1 : 0) +
        (thumbnailImageFile ? 1 : 0);
      let completedUploads = 0;

      setUploadingStatus({
        current: completedUploads,
        total: totalUploads,
        message: `Preparing to upload ${totalUploads} image${totalUploads !== 1 ? "s" : ""}...`,
      });

      // Upload featured image if available
      if (featuredImageFile) {
        setUploadingStatus({
          current: completedUploads,
          total: totalUploads,
          message: "Uploading featured image...",
        });

        featuredResult = await uploadFileToR2(featuredImageFile);

        completedUploads++;
        setUploadingStatus({
          current: completedUploads,
          total: totalUploads,
          message: `Featured image uploaded. (${completedUploads}/${totalUploads})`,
        });
      }

      // Upload thumbnail image if available
      if (thumbnailImageFile) {
        setUploadingStatus({
          current: completedUploads,
          total: totalUploads,
          message: "Uploading thumbnail image...",
        });

        thumbnailResult = await uploadFileToR2(thumbnailImageFile);

        completedUploads++;
        setUploadingStatus({
          current: completedUploads,
          total: totalUploads,
          message: `Thumbnail image uploaded. (${completedUploads}/${totalUploads})`,
        });
      }

      // Upload all inline content images
      if (inlineImages.length > 0) {
        // Upload each image and replace temporary URLs in content
        for (const img of inlineImages) {
          setUploadingStatus({
            current: completedUploads,
            total: totalUploads,
            message: `Uploading content image ${completedUploads + 1} of ${totalUploads}...`,
          });

          const uploadResult = await uploadFileToR2(img.file);

          // Replace local URL with uploaded URL in content
          currentContent = currentContent.replace(
            new RegExp(
              img.localUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "g"
            ),
            uploadResult.publicUrl
          );

          completedUploads++;
          setUploadingStatus({
            current: completedUploads,
            total: totalUploads,
            message: `Uploaded ${completedUploads} of ${totalUploads} images`,
          });
        }
      }

      return {
        updatedContent: currentContent,
        featuredImageResult: featuredResult,
        thumbnailImageResult: thumbnailResult,
      };
    } catch (error) {
      console.error("Error uploading images:", error);
      throw new Error(
        error instanceof Error
          ? `Failed to upload images: ${error.message}`
          : "Failed to upload images"
      );
    }
  };

  // Handler for images removed from the TiptapEditor
  const handleRemovedImages = useCallback((images: RemovedImage[]) => {
    setRemovedInlineImages((prev) => [...prev, ...images]);
  }, []);

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setFormError(null);
      setSaveSuccess(false);

      // Validate form
      if (!title.trim() || !content.trim() || !excerpt.trim() || !category) {
        throw new Error("Title, content, excerpt, and category are required");
      }

      // Process removed inline images first
      for (const image of removedInlineImages) {
        try {
          const formData = new FormData();
          formData.append("imageUrl", image.url);
          await deleteObjectFromR2({ data: formData });
          console.log("Deleted removed inline image from R2:", image.url);
        } catch (error) {
          console.error("Error deleting inline image from R2:", error);
          // Continue with the form submission even if image deletion fails
        }
      }
      // Clear the removed images list after processing
      setRemovedInlineImages([]);

      let finalContent = content;
      let finalFeaturedImageUrl = featuredImageUrl;
      let finalThumbnailImageUrl = thumbnailImageUrl;

      // Check if featured image was removed and delete it from R2 if needed
      if (article?.featuredImageUrl && !featuredImageUrl) {
        try {
          // Delete the original featured image from R2
          const formData = new FormData();
          formData.append("imageUrl", article.featuredImageUrl);
          await deleteObjectFromR2({ data: formData });
          console.log("Deleted removed featured image from R2");
        } catch (error) {
          console.error("Error deleting image from R2:", error);
          // Continue with the form submission even if image deletion fails
        }
      }

      // Check if thumbnail image was removed and delete it from R2 if needed
      if (article?.thumbnail_image && !thumbnailImageUrl) {
        try {
          // Delete the original thumbnail image from R2
          const formData = new FormData();
          formData.append("imageUrl", article.thumbnail_image);
          await deleteObjectFromR2({ data: formData });
          console.log("Deleted removed thumbnail image from R2");
        } catch (error) {
          console.error("Error deleting image from R2:", error);
          // Continue with the form submission even if image deletion fails
        }
      }

      // Upload images if needed
      const hasImagesToUpload =
        featuredImageFile || inlineImages.length > 0 || thumbnailImageFile;

      if (hasImagesToUpload) {
        const { updatedContent, featuredImageResult, thumbnailImageResult } =
          await uploadAllImages();
        finalContent = updatedContent;

        if (featuredImageResult) {
          // If we replaced an existing image, delete the old one from R2
          if (
            article?.featuredImageUrl &&
            article.featuredImageUrl !== finalFeaturedImageUrl
          ) {
            try {
              const formData = new FormData();
              formData.append("imageUrl", article.featuredImageUrl);
              await deleteObjectFromR2({ data: formData });
              console.log("Deleted replaced featured image from R2");
            } catch (error) {
              console.error("Error deleting replaced image from R2:", error);
              // Continue with the form submission
            }
          }

          finalFeaturedImageUrl = featuredImageResult.publicUrl;
        }

        if (thumbnailImageResult) {
          // If we replaced an existing image, delete the old one from R2
          if (
            article?.thumbnail_image &&
            article.thumbnail_image !== finalThumbnailImageUrl
          ) {
            try {
              const formData = new FormData();
              formData.append("imageUrl", article.thumbnail_image);
              await deleteObjectFromR2({ data: formData });
              console.log("Deleted replaced thumbnail image from R2");
            } catch (error) {
              console.error("Error deleting replaced image from R2:", error);
              // Continue with the form submission
            }
          }

          finalThumbnailImageUrl = thumbnailImageResult.publicUrl;
        }

        // Clear the uploading status
        setUploadingStatus(null);
      }

      // Prepare form data
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("slug", slug.trim() || generateSlugFromTitle());
      formData.append("content", finalContent);
      formData.append("excerpt", excerpt.trim());
      formData.append("category", category);
      formData.append("published", published.toString());

      // Always include featuredImageUrl in form data, even when empty
      // This ensures it will be explicitly removed on the server if cleared by the user
      formData.append("featuredImageUrl", finalFeaturedImageUrl);

      // Always include featuredImageAlt, using empty string if no image is selected
      // This ensures alt text is also cleared if the image is removed
      formData.append(
        "featuredImageAlt",
        finalFeaturedImageUrl ? featuredImageAlt : ""
      );

      // Always include thumbnailImageUrl in form data, even when empty
      // This ensures it will be explicitly removed on the server if cleared by the user
      formData.append("thumbnail_image", finalThumbnailImageUrl);

      // Add meta description to form data (optional)
      if (metaDescription.trim()) {
        formData.append("metaDescription", metaDescription.trim());
      }

      let result: ArticleResponse;

      if (isNew) {
        // Create new article
        result = await createArticle({ data: formData });
      } else {
        // Update existing article
        if (id) {
          formData.append("id", id);
        } else {
          throw new Error("Article ID is required for updates");
        }
        result = await updateArticle({ data: formData });
      }

      if (result.success) {
        setSaveSuccess(true);

        // Clean up any object URLs to prevent memory leaks
        for (const img of inlineImages) {
          URL.revokeObjectURL(img.localUrl);
        }

        if (featuredImagePreview && featuredImagePreview !== featuredImageUrl) {
          URL.revokeObjectURL(featuredImagePreview);
        }

        // Reset image states
        setFeaturedImageFile(null);
        setInlineImages([]);
        setThumbnailImageFile(null);

        // Redirect to article list after a brief delay
        setTimeout(() => {
          navigate({ to: "/admin/articles" });
        }, 1500);
      } else {
        throw new Error(result.message || "Failed to save article");
      }
    } catch (error: unknown) {
      console.error("Error saving article:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to save article"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // If not signed in, redirect to sign in page
  if (!isSignedIn) {
    return null; // The root layout will handle the redirect
  }

  return (
    <div className="min-h-screen bg-white pb-16 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link
            to="/admin/articles"
            className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Articles
          </Link>
          <h1 className="text-3xl font-medium text-primary">
            {isNew ? "Create New Article" : "Edit Article"}
          </h1>
        </div>

        {!isNew && article?.published === 1 && (
          <Link
            to="/info-promo/$slug"
            params={{ slug: article.slug }}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            target="_blank"
          >
            <Eye className="h-5 w-5 mr-2" />
            View Published
          </Link>
        )}
      </div>

      {loadError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {loadError}
        </div>
      )}

      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {formError}
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Article {isNew ? "created" : "updated"} successfully!
        </div>
      )}

      {uploadingStatus && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center mb-1">
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            <p>{uploadingStatus.message}</p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full"
              style={{
                width: `${uploadingStatus.total === 0 ? 0 : Math.round((uploadingStatus.current / uploadingStatus.total) * 100)}%`,
              }}
            />
          </div>
          <p className="text-xs mt-1">
            {uploadingStatus.current} of {uploadingStatus.total} completed
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main content area - 2/3 width */}
          <div className="md:col-span-2 space-y-6">
            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title*
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                placeholder="Enter article title"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <div className="flex justify-between mb-1">
                <label
                  htmlFor="slug"
                  className="block text-sm font-medium text-gray-700"
                >
                  Permalink
                </label>
                <button
                  type="button"
                  onClick={() => setSlug(generateSlugFromTitle())}
                  className="text-xs text-primary flex items-center hover:text-primary/80"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Generate from title
                </button>
              </div>
              <div className="flex items-center">
                <span className="text-gray-500 bg-gray-100 px-3 py-2 border border-r-0 border-gray-300 rounded-l-md">
                  /info-promo/
                </span>
                <input
                  type="text"
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  placeholder={generateSlugFromTitle() || "article-slug"}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                The permalink is the URL-friendly version of the title that
                appears in the address bar. Leave empty to generate
                automatically.
              </p>
            </div>

            {/* Content (Using Tiptap editor) */}
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Content*
              </label>
              <TiptapEditor
                content={content}
                onChange={setContent}
                onImagesChange={setInlineImages}
                onRemovedImagesChange={handleRemovedImages}
                placeholder="Write your article content here..."
              />
            </div>

            {/* Excerpt */}
            <div>
              <label
                htmlFor="excerpt"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Excerpt*
              </label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                placeholder="Enter article excerpt or summary"
                required
              />
            </div>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Publishing options */}
            <div className="bg-gray-50 p-4 rounded-md">
              <h3 className="text-lg font-medium text-gray-800 mb-3">
                Publishing
              </h3>

              <div className="flex items-center mb-4">
                <input
                  id="published"
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label
                  htmlFor="published"
                  className="ml-2 block text-sm text-gray-700"
                >
                  Publish immediately
                </label>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full flex justify-center items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Article
                  </>
                )}
              </button>
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category*
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                required
              >
                <option value="News">News</option>
                <option value="Promo">Promo</option>
              </select>
            </div>

            {/* Featured Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="featuredImage"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Featured Image (Recommended: 1200x630px)
              </label>
              <div className="mt-1 flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {featuredImagePreview ? (
                    <img
                      src={featuredImagePreview}
                      alt="Featured preview"
                      className="h-20 w-auto object-cover rounded-md border border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-32 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-grow">
                  <input
                    type="file"
                    id="featuredImage"
                    accept="image/*"
                    onChange={handleFeatureImageSelect}
                    ref={fileInputRef}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                  />
                  {featuredImageUrl && !featuredImageFile && (
                    <p className="text-xs text-gray-500 mt-1">
                      Current:{" "}
                      <a
                        href={featuredImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {featuredImageUrl.split("/").pop()}
                      </a>
                    </p>
                  )}
                </div>
                {featuredImagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      // Clean up any object URLs to prevent memory leaks
                      if (featuredImagePreview !== featuredImageUrl) {
                        URL.revokeObjectURL(featuredImagePreview);
                      }
                      // Clear all image-related states
                      setFeaturedImageFile(null);
                      setFeaturedImageUrl("");
                      setFeaturedImagePreview("");
                      setFeaturedImageAlt("");
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              {featuredImageUrl && (
                <div className="mt-2">
                  <label
                    htmlFor="featuredImageAlt"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Featured Image Alt Text
                  </label>
                  <input
                    type="text"
                    id="featuredImageAlt"
                    value={featuredImageAlt}
                    onChange={(e) => setFeaturedImageAlt(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    placeholder="Descriptive alt text for the featured image"
                  />
                </div>
              )}
            </div>

            {/* Thumbnail Image Upload */}
            <div className="mb-6">
              <label
                htmlFor="thumbnailImageUrlField"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Thumbnail Image (Optional, Recommended Aspect Ratio: 16:9)
              </label>
              <ImageUploadField<ArticleFormData>
                fieldName="thumbnailImageUrl"
                watch={
                  ((
                    name?: keyof ArticleFormData | (keyof ArticleFormData)[],
                    _options?: unknown
                  ) => {
                    if (
                      typeof name === "string" &&
                      name === "thumbnailImageUrl"
                    ) {
                      return thumbnailImageUrl;
                    }
                    return undefined;
                  }) as any
                }
                onFileSelected={(selectedFieldName, file) => {
                  if (selectedFieldName === "thumbnailImageUrl") {
                    // If thumbnailImageUrl currently holds a blob URL, revoke it first
                    if (thumbnailImageUrl?.startsWith("blob:")) {
                      URL.revokeObjectURL(thumbnailImageUrl);
                    }
                    const newBlobUrl = URL.createObjectURL(file);
                    setThumbnailImageUrl(newBlobUrl);
                    setThumbnailImageFile(file);
                  }
                }}
                handleRemove={(urlOrFieldName) => {
                  if (thumbnailImageUrl?.startsWith("blob:")) {
                    URL.revokeObjectURL(thumbnailImageUrl);
                  }
                  setThumbnailImageFile(null);
                  setThumbnailImageUrl("");
                }}
                altText="Thumbnail preview"
                cropAspect={16 / 9}
                enableCrop={true}
              />
              {thumbnailImageUrl && !thumbnailImageFile && (
                <p className="text-xs text-gray-500 mt-1">
                  Current:{" "}
                  <a
                    href={thumbnailImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {thumbnailImageUrl.split("/").pop()}
                  </a>
                </p>
              )}
            </div>

            {/* Meta Description (Optional) */}
            <div>
              <label
                htmlFor="metaDescription"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Meta Description (Optional)
              </label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                maxLength={160} // Common max length for meta descriptions
                placeholder="Enter a brief summary for search engines (optional, max 160 characters)"
              />
              <p className="mt-1 text-xs text-gray-500">
                A good meta description can improve click-through rates from
                search results.
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
