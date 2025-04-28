import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
const SplitComponent = function TipeMobilPage() {
  return /* @__PURE__ */ jsx("div", { className: "py-10", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 sm:px-6 lg:px-8", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-8", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 sm:text-4xl", children: "Type Mobil GWM" }),
      /* @__PURE__ */ jsx("p", { className: "mt-3 text-xl text-gray-500", children: "Temukan berbagai type mobil GWM yang sesuai dengan kebutuhan Anda" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300", children: [
        /* @__PURE__ */ jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: "https://gwm.kopimap.com/tank_300.webp", alt: "Tank 300 GWM", className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Tank 300" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road luar biasa dengan kenyamanan premium" }),
          /* @__PURE__ */ jsx(Link, { to: "/models/$type", params: {
            type: "tank-300"
          }, className: "mt-3 inline-block text-primary font-medium", children: "Lihat Detail" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300", children: [
        /* @__PURE__ */ jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: "https://gwm.kopimap.com/tank_500.webp", alt: "Tank 500 GWM", className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Tank 500" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang" }),
          /* @__PURE__ */ jsx(Link, { to: "/models/$type", params: {
            type: "tank-500"
          }, className: "mt-3 inline-block text-primary font-medium", children: "Lihat Detail" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300", children: [
        /* @__PURE__ */ jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: "https://gwm.kopimap.com/haval_jolion.webp", alt: "Haval Jolion Ultra GWM", className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Haval Jolion Ultra" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "Compact SUV stylish dengan teknologi mutakhir dan desain berkelas untuk mobilitas perkotaan modern" }),
          /* @__PURE__ */ jsx(Link, { to: "/models/$type", params: {
            type: "haval-jolion-ultra"
          }, className: "mt-3 inline-block text-primary font-medium", children: "Lihat Detail" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300", children: [
        /* @__PURE__ */ jsx("div", { className: "h-48 bg-gray-200 flex items-center justify-center overflow-hidden", children: /* @__PURE__ */ jsx("img", { src: "https://gwm.kopimap.com/haval_h6.jpg", alt: "Haval H6 GWM", className: "w-full h-full object-cover transition-transform duration-500 hover:scale-105" }) }),
        /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-xl font-semibold", children: "Haval H6" }),
          /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-600", children: "SUV premium dengan desain elegan dan performa tangguh, dilengkapi fitur keselamatan dan kenyamanan terkini" }),
          /* @__PURE__ */ jsx(Link, { to: "/models/$type", params: {
            type: "haval-h6"
          }, className: "mt-3 inline-block text-primary font-medium", children: "Lihat Detail" })
        ] })
      ] })
    ] })
  ] }) });
};
export {
  SplitComponent as component
};
