import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { b as Route, g as getStrapiImageUrl, c as fetchArticleBySlug } from "../entry-server.js";
import "react-dom/server";
console.log("Article route file loaded");
const SplitComponent = function ArticleDetailPage() {
  var _a;
  const {
    slug
  } = Route.useParams();
  const {
    article: loaderArticle,
    error: loaderError
  } = Route.useLoaderData();
  const [article, setArticle] = useState(loaderArticle || null);
  const [isLoading, setIsLoading] = useState(!loaderArticle);
  const [error, setError] = useState(loaderError || null);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  console.log("kanjai", article);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (loaderArticle) return;
    async function loadArticle() {
      try {
        setIsLoading(true);
        setError(null);
        const articleData = await fetchArticleBySlug(slug);
        console.log("Article data:", articleData);
        setArticle(articleData);
      } catch (err) {
        console.error("Error loading article:", err);
        setError("Failed to load article.");
      } finally {
        setIsLoading(false);
      }
    }
    if (slug) {
      loadArticle();
    }
  }, [slug, loaderArticle]);
  useEffect(() => {
    if (article) {
      document.title = article.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && article.excerpt) {
        metaDesc.setAttribute("content", article.excerpt);
      }
    }
  }, [article]);
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };
  const YouTubeEmbed = ({
    url
  }) => {
    const getYouTubeVideoId = (youtubeUrl) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = youtubeUrl.match(regExp);
      return match && match[2].length === 11 ? match[2] : null;
    };
    const videoId = getYouTubeVideoId(url);
    if (!videoId) {
      return /* @__PURE__ */ jsx("div", { className: "text-red-500", children: "Invalid YouTube URL" });
    }
    return /* @__PURE__ */ jsx("div", { className: "relative w-full my-6", style: {
      paddingBottom: "56.25%"
    }, children: /* @__PURE__ */ jsx("iframe", { src: `https://www.youtube.com/embed/${videoId}`, title: "YouTube video player", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, className: "absolute top-0 left-0 w-full h-full rounded-lg" }) });
  };
  console.log("Rendering state:", {
    isLoading,
    error,
    article,
    isPageLoaded
  });
  return /* @__PURE__ */ jsxs("div", { className: `pt-16 bg-gray-50 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`, style: {
    viewTransitionName: "main-content"
  }, children: [
    isLoading && /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsx("div", { className: "max-w-3xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse", children: [
      /* @__PURE__ */ jsx("div", { className: "h-8 bg-gray-200 rounded w-3/4 mb-4" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
        /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-5 w-20 rounded" }),
        /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-5 w-32 rounded" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-64 bg-gray-200 rounded-lg mb-6" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-5/6" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }),
        /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-4/6" })
      ] })
    ] }) }) }),
    !isLoading && error && /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto bg-red-50 border border-red-200 text-red-800 rounded-md p-4", children: [
      /* @__PURE__ */ jsx("p", { children: error }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: () => window.history.back(), className: "mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition", children: "Kembali" })
    ] }) }),
    !isLoading && article && /* @__PURE__ */ jsx("div", { className: "container mx-auto px-4 py-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto", children: [
      /* @__PURE__ */ jsxs("div", { className: "mb-8 content-fade-in", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-4 text-gray-900", children: article.title }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-6", children: [
          /* @__PURE__ */ jsx("span", { className: `text-sm font-medium px-3 py-1 rounded-full ${article.category === "News" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`, children: article.category }),
          /* @__PURE__ */ jsx("span", { className: "text-sm text-gray-600", children: formatDate(article.publishedAt) })
        ] }),
        ((_a = article == null ? void 0 : article.featuredImage) == null ? void 0 : _a.url) && /* @__PURE__ */ jsx("div", { className: "mb-8", children: /* @__PURE__ */ jsx("img", { src: getStrapiImageUrl(article.featuredImage.url), alt: article.title, className: "rounded-lg w-full h-auto object-cover max-h-[500px] image-load-transition", loading: "lazy", onLoad: (e) => e.currentTarget.classList.add("image-loaded") }) }),
        article.youtube_url && /* @__PURE__ */ jsx(YouTubeEmbed, { url: article.youtube_url }),
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "prose prose-lg max-w-none text-gray-700",
            dangerouslySetInnerHTML: {
              __html: DOMPurify.sanitize(article.content)
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200 pt-8 mt-8", children: /* @__PURE__ */ jsxs(Link, { to: "/info-promo", className: "inline-flex items-center text-primary hover:underline", viewTransition: {
        types: ["slide-right"]
      }, children: [
        /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5 mr-2", viewBox: "0 0 20 20", fill: "currentColor", children: [
          /* @__PURE__ */ jsx("title", { children: "Back Arrow" }),
          /* @__PURE__ */ jsx("path", { fillRule: "evenodd", d: "M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z", clipRule: "evenodd" })
        ] }),
        "Kembali ke Info & Promo"
      ] }) })
    ] }) })
  ] });
};
export {
  SplitComponent as component
};
