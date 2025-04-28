import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { R as Route } from "../entry-server.js";
import "react-dom/server";
const SplitComponent = function VehicleDetailPage() {
  const {
    vehicle,
    relatedVehicles
  } = Route.useLoaderData();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);
  return /* @__PURE__ */ jsxs("div", { className: `transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative bg-gray-900 text-white", children: [
      /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-cover bg-center opacity-30", style: {
        backgroundImage: `url(${vehicle.imageUrl})`
      } }),
      /* @__PURE__ */ jsxs("div", { className: "relative container mx-auto px-4 py-24 sm:py-32", children: [
        /* @__PURE__ */ jsx("span", { className: "inline-block px-3 py-1 bg-primary text-white text-sm rounded-md mb-4", children: vehicle.categoryDisplay }),
        /* @__PURE__ */ jsx("h1", { className: "text-4xl sm:text-5xl font-bold mb-4", children: vehicle.name }),
        /* @__PURE__ */ jsx("p", { className: "text-xl max-w-2xl mb-6", children: vehicle.description }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-semibold", children: vehicle.price })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-16", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16", children: [
        /* @__PURE__ */ jsx("div", { className: "rounded-lg overflow-hidden shadow-lg", children: /* @__PURE__ */ jsx("img", { src: vehicle.imageUrl, alt: vehicle.name, className: "w-full h-full object-cover" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Fitur Unggulan" }),
          /* @__PURE__ */ jsx("div", { className: "bg-gray-50 p-6 rounded-lg", children: /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: vehicle.features.map((feature, idx) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "flex-shrink-0 mt-1 text-primary font-bold", children: "✓" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-700", children: feature })
          ] }, `${vehicle.id}-feature-${idx}`)) }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-8 space-y-4", children: [
            /* @__PURE__ */ jsx("a", { href: `https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`, target: "_blank", rel: "noopener noreferrer", className: "w-full block py-3 bg-primary text-white text-center rounded-md font-medium hover:bg-primary/90 transition-colors", children: "Hubungi Untuk Test Drive" }),
            /* @__PURE__ */ jsx("a", { href: "/kontak", className: "w-full block py-3 border border-gray-300 text-gray-700 text-center rounded-md font-medium hover:bg-gray-50 transition-colors", children: "Pelajari Lebih Lanjut" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mb-16", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-gray-900 mb-6", children: [
          "Tentang ",
          vehicle.name
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "prose prose-lg max-w-none", children: [
          /* @__PURE__ */ jsxs("p", { children: [
            vehicle.name,
            " dirancang untuk memenuhi kebutuhan pengguna yang menginginkan kendaraan dengan performa tinggi dan fitur modern. Setiap detail dalam desain dan teknologi dipilih untuk memberikan pengalaman berkendara yang optimal."
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-4", children: [
            "Dengan ",
            vehicle.features[0].toLowerCase(),
            ", ",
            vehicle.name,
            " ",
            "memberikan tenaga dan torsi yang cukup untuk menghadapi berbagai kondisi jalan. Kombinasi dengan",
            " ",
            vehicle.features[1].toLowerCase(),
            " menawarkan perpindahan gigi yang halus dan responsif."
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "mt-4", children: [
            "Interior ",
            vehicle.name,
            " dirancang dengan mengutamakan kenyamanan dan kemudahan penggunaan. Teknologi-teknologi canggih diintegrasikan untuk meningkatkan keselamatan dan kenyamanan berkendara."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold text-gray-900 text-center mb-12", children: "Type Mobil GWM Lainnya" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6", children: relatedVehicles.map((relatedVehicle) => /* @__PURE__ */ jsx("div", { className: "bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg", children: /* @__PURE__ */ jsxs(Link, { to: "/models/$type", params: {
          type: relatedVehicle.id
        }, className: "block h-full", onClick: (e) => {
          e.preventDefault();
          window.location.href = `/models/${relatedVehicle.id}`;
        }, children: [
          /* @__PURE__ */ jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: relatedVehicle.imageUrl, alt: relatedVehicle.name, className: "w-full h-full object-cover" }) }),
          /* @__PURE__ */ jsxs("div", { className: "p-6", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 mb-1 block", children: relatedVehicle.categoryDisplay }),
            /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold mb-2", children: relatedVehicle.name }),
            /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-4 line-clamp-2", children: relatedVehicle.description }),
            /* @__PURE__ */ jsx("span", { className: "text-primary font-medium", children: "Lihat Detail →" })
          ] })
        ] }) }, relatedVehicle.id)) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "mt-24 bg-gray-100 rounded-xl p-8 md:p-12", children: /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-2xl md:text-3xl font-bold text-gray-900 mb-4", children: [
          "Tertarik dengan ",
          vehicle.name,
          "?"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mb-8 max-w-2xl mx-auto", children: "Konsultasikan kebutuhan Anda dengan sales consultant kami untuk mendapatkan informasi terbaru mengenai harga, promo, dan ketersediaan." }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
          /* @__PURE__ */ jsx("a", { href: "/kontak", className: "px-6 py-3 bg-primary text-white rounded-md font-medium text-center hover:bg-primary/90 transition-colors", children: "Hubungi Kami" }),
          /* @__PURE__ */ jsx("a", { href: `https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`, target: "_blank", rel: "noopener noreferrer", className: "px-6 py-3 bg-green-500 text-white rounded-md font-medium text-center hover:bg-green-600 transition-colors", children: "Chat WhatsApp" })
        ] })
      ] }) })
    ] })
  ] });
};
export {
  SplitComponent as component
};
