import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { f as fetchArticles, g as getStrapiImageUrl } from "../entry-server.js";
import "react-dom/server";
const SplitComponent = function InfoPromoPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    async function loadArticles() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchArticles(currentPage, 9, activeCategory === "All" ? void 0 : activeCategory, searchQuery || void 0);
        console.log("response", response);
        setArticles(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pageCount);
        }
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Using mock data instead.");
      } finally {
        setIsLoading(false);
      }
    }
    loadArticles();
  }, [activeCategory, searchQuery, currentPage]);
  const getImageUrl = (article) => {
    var _a;
    if ((_a = article.featuredImage) == null ? void 0 : _a.url) {
      return getStrapiImageUrl(article.featuredImage.url);
    }
    return "https://source.unsplash.com/random/800x600/?car";
  };
  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric"
    };
    return new Date(dateString).toLocaleDateString("id-ID", options);
  };
  const filteredArticles = articles;
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: `bg-gray-50 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`, style: {
    viewTransitionName: "main-content"
  }, children: [
    /* @__PURE__ */ jsx("div", { className: "bg-primary py-12 md:py-20", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-bold mb-4 content-fade-in", children: "Info & Promo" }),
      /* @__PURE__ */ jsx("p", { className: "text-lg md:text-xl max-w-3xl content-fade-in animation-delay-100", children: "Dapatkan informasi terbaru dan penawaran spesial dari GWM Indonesia" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 overflow-x-auto pb-2 md:pb-0 content-fade-in stagger-item", children: [
          /* @__PURE__ */ jsx("button", { type: "button", className: `px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === "All" ? "bg-primary text-slate-700" : "bg-slate-100 text-gray-700 hover:bg-gray-100"}`, onClick: () => {
            setActiveCategory("All");
            setCurrentPage(1);
          }, children: "Semua" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: `px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === "News" ? "bg-primary text-slate-700" : "bg-slate-100 text-gray-700 hover:bg-gray-100"}`, onClick: () => {
            setActiveCategory("News");
            setCurrentPage(1);
          }, children: "Berita" }),
          /* @__PURE__ */ jsx("button", { type: "button", className: `px-4 py-2 rounded-full text-sm font-medium transition ${activeCategory === "Promo" ? "bg-primary text-slate-700" : "bg-slate-100 text-gray-700 hover:bg-gray-100"}`, onClick: () => {
            setActiveCategory("Promo");
            setCurrentPage(1);
          }, children: "Promo" })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "w-full md:w-auto content-fade-in stagger-item", children: /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          setCurrentPage(1);
        }, className: "relative", children: [
          /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Cari info atau promo...", className: "w-full md:w-64 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value) }),
          /* @__PURE__ */ jsx("button", { type: "submit", className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400", children: /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsx("title", { children: "Search Icon" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })
          ] }) })
        ] }) })
      ] }),
      isLoading && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12", children: [1, 2, 3, 4, 5, 6].map((i) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg overflow-hidden shadow-md animate-pulse", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-w-16 aspect-h-9 bg-gray-200 h-48" }),
        /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-6 w-16 rounded" }),
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-4 w-24 rounded" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-6 w-full rounded mb-2" }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2 mb-4", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-4 w-full rounded" }),
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-4 w-5/6 rounded" }),
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-4 w-4/6 rounded" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-8 w-36 rounded" })
        ] })
      ] }, `skeleton-${i}`)) }),
      !isLoading && error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-8", children: /* @__PURE__ */ jsx("p", { children: error }) }),
      !isLoading && !error && filteredArticles.length > 0 ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12", children: filteredArticles.map((article) => /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300 flex flex-col transform hover:-translate-y-1 content-fade-in", children: [
          /* @__PURE__ */ jsx(Link, { to: "/artikel/$slug", params: {
            slug: article.slug
          }, "aria-label": `Read more about ${article.title}`, className: "block h-48 overflow-hidden", viewTransition: {
            types: ["slide-left"]
          }, children: /* @__PURE__ */ jsx("img", { src: getImageUrl(article), alt: article.title, className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-5", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-3", children: [
              /* @__PURE__ */ jsx("span", { className: `text-xs font-medium px-2 py-1 rounded ${article.category === "News" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`, children: article.category }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500", children: formatDate(article.publishedAt) })
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold mb-2 text-gray-800 line-clamp-2", children: article.title }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4 line-clamp-3", children: article.excerpt })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/artikel/$slug", params: {
            slug: article.slug
          }, "aria-label": `Read more about ${article.title}`, className: "px-3 pb-3 text-primary font-medium hover:underline flex items-center", viewTransition: {
            types: ["slide-left"]
          }, children: [
            "Baca Selengkapnya",
            /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 ml-1", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsx("title", { children: "Arrow Right" }),
              /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M14 5l7 7m0 0l-7 7m7-7H3" })
            ] })
          ] })
        ] }, article.id)) }),
        totalPages > 1 && /* @__PURE__ */ jsx("div", { className: "flex justify-center mb-12", children: /* @__PURE__ */ jsxs("nav", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.max(1, prev - 1)), disabled: currentPage === 1, className: `p-2 rounded-md ${currentPage === 1 ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`, children: /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("title", { children: "Previous Page" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" })
          ] }) }),
          Array.from({
            length: totalPages
          }, (_, i) => i + 1).map((page) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCurrentPage(page), className: `w-10 h-10 rounded-md ${currentPage === page ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`, children: page }, `page-${page}`)),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setCurrentPage((prev) => Math.min(totalPages, prev + 1)), disabled: currentPage === totalPages, className: `p-2 rounded-md ${currentPage === totalPages ? "text-gray-400 cursor-not-allowed" : "text-gray-700 hover:bg-gray-100"}`, children: /* @__PURE__ */ jsxs("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
            /* @__PURE__ */ jsx("title", { children: "Next Page" }),
            /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 5l7 7-7 7" })
          ] }) })
        ] }) })
      ] }) : !isLoading && filteredArticles.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
        /* @__PURE__ */ jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-16 w-16 text-gray-300 mb-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsx("title", { children: "Sad Face Icon" }),
          /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 1.5, d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold text-gray-700 mb-2", children: "Tidak Ditemukan" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-500 max-w-md", children: "Maaf, tidak ada hasil yang sesuai dengan pencarian Anda. Silakan coba dengan kata kunci lain." }),
        /* @__PURE__ */ jsx("button", { type: "button", onClick: () => {
          setSearchQuery("");
          setActiveCategory("All");
          setCurrentPage(1);
        }, className: "mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition", children: "Reset Pencarian" })
      ] }) : null
    ] })
  ] }) });
};
export {
  SplitComponent as component
};
