import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Minus,
  Redo,
  Undo,
  Code,
  Quote,
  Youtube as YoutubeIcon,
} from "lucide-react";
// Import the resizable image extension
// @ts-ignore - tiptap-extension-resize-image doesn't have TypeScript definitions
import ResizableImage from "tiptap-extension-resize-image";
// Import YouTube extension
import Youtube from "@tiptap/extension-youtube";

// Define the additional types for the resizable image extension
declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      /**
       * Add a resizable image
       */
      setResizableImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: number;
        alignment?: "left" | "center" | "right";
        resizable?: boolean;
      }) => ReturnType;
      /**
       * Update a resizable image
       */
      updateResizableImage: (options: {
        alignment?: "left" | "center" | "right";
        width?: number;
      }) => ReturnType;
    };
  }
}

// Interface for locally stored images before upload
export interface LocalImage {
  id: string; // Unique ID for the image
  file: File; // The actual file object
  localUrl: string; // Temporary URL for display
  position: number; // Position in the content
}

// Interface for images that were removed from the content
export interface RemovedImage {
  url: string; // The URL of the removed image
}

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  onImagesChange?: (images: LocalImage[]) => void;
  onRemovedImagesChange?: (images: RemovedImage[]) => void;
  placeholder?: string;
}

const TiptapEditor = ({
  content,
  onChange,
  onImagesChange,
  onRemovedImagesChange,
  placeholder = "Start writing your content...",
}: TiptapEditorProps) => {
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  // Add YouTube state
  const [showYoutubeInput, setShowYoutubeInput] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // Store local images here
  const [localImages, setLocalImages] = useState<LocalImage[]>([]);
  // Store URLs of removed images here
  const [removedImages, setRemovedImages] = useState<RemovedImage[]>([]);
  // Use a file input ref for image selection
  const imageInputRef = useRef<HTMLInputElement>(null);
  // Store the previous content to detect removed images
  const prevContentRef = useRef<string>(content);
  // Store current image alignment
  const [imageAlignment, setImageAlignment] = useState<
    "left" | "center" | "right"
  >("center");

  // Use 'any' type for editor to bypass TypeScript checking for the ResizableImage extension
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline",
        },
      }),
      // Replace the standard Image extension with ResizableImage
      // @ts-ignore - ResizableImage has different configuration options than the standard Image extension
      ResizableImage.configure({
        // Add inline style for resizing and allow setting alignment
        HTMLAttributes: {
          class: "max-w-full rounded-md my-4 max-h-[600px]",
          loading: "lazy",
        },
        // @ts-ignore - defaultAlignment is not in the type definitions
        // Default alignment
        defaultAlignment: "center",
      }),
      // Add YouTube extension
      Youtube.configure({
        controls: true,
        modestBranding: true,
        nocookie: true, // Use privacy-enhanced mode
        HTMLAttributes: {
          class: "youtube-video my-6 rounded-lg overflow-hidden mx-auto",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content,
    onBlur: ({ editor }) => {
      handleContentChange(editor.getHTML());
    },
    onUpdate: ({ editor }) => {
      handleContentChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none w-full min-h-[350px] p-4",
      },
    },
    autofocus: true,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  useEffect(() => {
    // When local images change, notify parent component
    if (onImagesChange) {
      onImagesChange(localImages);
    }
  }, [localImages, onImagesChange]);

  useEffect(() => {
    // When removed images change, notify parent component
    if (onRemovedImagesChange && removedImages.length > 0) {
      onRemovedImagesChange(removedImages);
      // Clear the list after notifying
      setRemovedImages([]);
    }
  }, [removedImages, onRemovedImagesChange]);

  // Modified to use resizable image
  const insertImage = useCallback(
    (url: string, alt = "") => {
      if (!editor) return;

      // Insert the image with standard attributes and current alignment
      // @ts-ignore - setResizableImage is not in the type definitions
      editor
        .chain()
        .focus()
        .setResizableImage({
          src: url,
          alt,
          // Apply the currently selected alignment
          alignment: imageAlignment,
          // Set a default width that allows text to wrap around
          width: imageAlignment !== "center" ? 300 : undefined,
        })
        .run();
    },
    [editor, imageAlignment]
  );

  const handleImageSelection = useCallback(() => {
    // Trigger file input click
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
  }, []);

  const handleImageFileSelected = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!editor || !e.target.files || e.target.files.length === 0) return;

      const file = e.target.files[0];
      const localUrl = URL.createObjectURL(file);
      const id = `img-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      // Get current cursor position
      const position = editor.state.selection.anchor;

      // Insert image with attributes
      insertImage(localUrl, file.name);

      // Store local image data
      setLocalImages((prev) => [...prev, { id, file, localUrl, position }]);

      // Reset file input
      if (e.target) {
        e.target.value = "";
      }

      setShowImageInput(false);
    },
    [editor, insertImage]
  );

  // Set current image alignment
  const setImageAlignOption = useCallback(
    (alignment: "left" | "center" | "right") => {
      setImageAlignment(alignment);

      // If an image is selected, apply the alignment to it
      if (editor?.isActive("resizableImage")) {
        // @ts-ignore - updateResizableImage is not in the type definitions
        editor.chain().focus().updateResizableImage({ alignment }).run();
      }
    },
    [editor]
  );

  const setLink = useCallback(() => {
    if (!editor || !linkUrl) return;

    if (editor.state.selection.empty) {
      alert("Please select some text first");
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl("");
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  // Add function to insert YouTube video
  const insertYoutubeVideo = useCallback(() => {
    if (!editor || !youtubeUrl) return;

    editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src: youtubeUrl,
        // No need to specify width and height, the CSS will handle it
      })
      .run();
    setYoutubeUrl("");
    setShowYoutubeInput(false);
  }, [editor, youtubeUrl]);

  // Call this when editor content changes
  const handleContentChange = useCallback(
    (newHtml: string) => {
      onChange(newHtml);

      // Check for removed images by comparing old and new content
      if (prevContentRef.current !== newHtml) {
        // Extract image URLs from previous content
        const prevImageUrls = new Set<string>();
        const imgRegex = /<img[^>]+src="([^"]+)"[^>]*>/g;
        let match: RegExpExecArray | null;

        // Process previous content
        let iterationResult = imgRegex.exec(prevContentRef.current);
        while (iterationResult !== null) {
          // Only consider remote URLs (not blob: or data:)
          if (
            !iterationResult[1].startsWith("blob:") &&
            !iterationResult[1].startsWith("data:")
          ) {
            prevImageUrls.add(iterationResult[1]);
          }
          iterationResult = imgRegex.exec(prevContentRef.current);
        }

        // Extract image URLs from new content
        const newImageUrls = new Set<string>();
        imgRegex.lastIndex = 0; // Reset regex index

        // Process new content
        iterationResult = imgRegex.exec(newHtml);
        while (iterationResult !== null) {
          if (
            !iterationResult[1].startsWith("blob:") &&
            !iterationResult[1].startsWith("data:")
          ) {
            newImageUrls.add(iterationResult[1]);
          }
          iterationResult = imgRegex.exec(newHtml);
        }

        // Find images that were in the old content but not in the new content
        const newlyRemovedImages: RemovedImage[] = [];
        for (const url of prevImageUrls) {
          if (!newImageUrls.has(url)) {
            newlyRemovedImages.push({ url });
          }
        }

        // Update state if there are newly removed images
        if (newlyRemovedImages.length > 0) {
          setRemovedImages((prev) => [...prev, ...newlyRemovedImages]);
        }

        // Update the previous content reference
        prevContentRef.current = newHtml;
      }
    },
    [onChange]
  );

  if (!editor) {
    return null;
  }

  const MenuBar = () => (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-50 rounded-t-md border border-gray-300">
      <button
        onMouseDown={(e) => e.preventDefault()} // Prevent blur on mousedown
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className={`p-2 rounded hover:bg-gray-200 text-gray-700 ${
          !editor.can().chain().focus().undo().run() ? "opacity-30" : ""
        }`}
        title="Undo"
        type="button"
      >
        <Undo size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className={`p-2 rounded hover:bg-gray-200 text-gray-700 ${
          !editor.can().chain().focus().redo().run() ? "opacity-30" : ""
        }`}
        title="Redo"
        type="button"
      >
        <Redo size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("bold") ? "bg-gray-200 text-primary" : "text-gray-700"
        }`}
        title="Bold"
        type="button"
      >
        <Bold size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("italic")
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Italic"
        type="button"
      >
        <Italic size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("code") ? "bg-gray-200 text-primary" : "text-gray-700"
        }`}
        title="Code"
        type="button"
      >
        <Code size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("heading", { level: 1 })
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Heading 1"
        type="button"
      >
        <Heading1 size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("heading", { level: 2 })
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Heading 2"
        type="button"
      >
        <Heading2 size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("bulletList")
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Bullet List"
        type="button"
      >
        <List size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("orderedList")
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Ordered List"
        type="button"
      >
        <ListOrdered size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("blockquote")
            ? "bg-gray-200 text-primary"
            : "text-gray-700"
        }`}
        title="Blockquote"
        type="button"
      >
        <Quote size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Horizontal Rule"
        type="button"
      >
        <Minus size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.chain().focus().run();
          setShowLinkInput(!showLinkInput);
        }}
        className={`p-2 rounded hover:bg-gray-200 ${
          editor.isActive("link") ? "bg-gray-200 text-primary" : "text-gray-700"
        }`}
        title="Link"
        type="button"
      >
        <LinkIcon size={18} />
      </button>

      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleImageSelection}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="Image"
        type="button"
      >
        <ImageIcon size={18} />
      </button>

      {/* Add YouTube button */}
      <button
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          editor.chain().focus().run();
          setShowYoutubeInput(!showYoutubeInput);
        }}
        className="p-2 rounded hover:bg-gray-200 text-gray-700"
        title="YouTube Video"
        type="button"
      >
        <YoutubeIcon size={18} />
      </button>

      {/* Image alignment controls - these will apply to the selected image */}
      <div className="flex gap-1 ml-1 border-l border-gray-300 pl-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setImageAlignOption("left")}
          className={`p-2 rounded hover:bg-gray-200 ${
            imageAlignment === "left"
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Image Left (wrap text)"
          type="button"
        >
          <AlignLeft size={18} />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setImageAlignOption("center")}
          className={`p-2 rounded hover:bg-gray-200 ${
            imageAlignment === "center"
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Image Center"
          type="button"
        >
          <AlignCenter size={18} />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setImageAlignOption("right")}
          className={`p-2 rounded hover:bg-gray-200 ${
            imageAlignment === "right"
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Image Right (wrap text)"
          type="button"
        >
          <AlignRight size={18} />
        </button>
      </div>

      {/* Text alignment controls */}
      <div className="flex gap-1 border-l border-gray-300 pl-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "left" })
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Text Left"
          type="button"
        >
          <AlignLeft size={18} />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "center" })
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Text Center"
          type="button"
        >
          <AlignCenter size={18} />
        </button>

        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive({ textAlign: "right" })
              ? "bg-gray-200 text-primary"
              : "text-gray-700"
          }`}
          title="Align Text Right"
          type="button"
        >
          <AlignRight size={18} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <MenuBar />

      {/* Hidden file input for image selection */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileSelected}
        accept="image/*"
        className="hidden"
      />

      {showLinkInput && (
        <div className="p-2 bg-gray-100 flex items-center gap-2">
          <input
            type="url"
            placeholder="Enter URL"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              setLink();
            }}
            className="bg-primary text-white px-3 py-2 rounded"
            type="button"
          >
            Set Link
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowLinkInput(false);
            }}
            className="bg-gray-300 px-3 py-2 rounded"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Add YouTube input UI */}
      {showYoutubeInput && (
        <div className="p-2 bg-gray-100 flex items-center gap-2">
          <input
            type="url"
            placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ)"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              insertYoutubeVideo();
            }}
            className="bg-primary text-white px-3 py-2 rounded"
            type="button"
          >
            Embed Video
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              setShowYoutubeInput(false);
            }}
            className="bg-gray-300 px-3 py-2 rounded"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      <EditorContent
        editor={editor}
        className="tiptap-editor-content border rounded-b-md border-gray-300 min-h-[400px] prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:italic prose-ul:list-disc prose-ol:list-decimal"
      />

      {/* Help text for image resizing and YouTube */}
      <div className="mt-2 text-sm text-gray-500">
        <p>
          💡 Tip: Click on an image to activate resize handles. Drag to resize,
          and use the alignment buttons to position images. Use the YouTube
          button to embed videos directly in your content.
        </p>
      </div>

      {/* Add global styles for YouTube embeds */}
      <style>
        {`
          /* Make YouTube videos responsive */
          .tiptap-editor-content [data-youtube-video] {
            position: relative;
            padding-bottom: 56.25%; /* 16:9 aspect ratio */
            height: 0;
            overflow: hidden;
            width: 100% !important;
            max-width: 100%;
            border-radius: 0.5rem;
            margin: 1.5rem 0;
          }
          
          .tiptap-editor-content [data-youtube-video] iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: 0;
          }

          /* Add responsive styling for the ProseMirror editor */
          .ProseMirror {
            overflow-wrap: break-word;
            word-wrap: break-word;
            word-break: break-word;
          }

          /* Ensure videos don't exceed container width */
          .ProseMirror iframe {
            max-width: 100%;
          }
        `}
      </style>
    </div>
  );
};

export default TiptapEditor;
