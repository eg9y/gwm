import { jsx, jsxs } from "react/jsx-runtime";
import { Suspense } from "react";
const Contact = () => {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-white", children: /* @__PURE__ */ jsx("main", { className: "pt-24 pb-16 px-4 md:px-8 max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("section", { className: "mb-16", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-3xl md:text-4xl font-medium text-primary mb-6", children: "Kontak GWM Jakarta" }),
    /* @__PURE__ */ jsx("p", { className: "text-base text-secondary max-w-3xl mb-10 leading-relaxed", children: "GWM, merek otomotif global yang inovatif, resmi hadir di Jakarta dengan membawa semangat baru dalam industri otomotif Indonesia. Dengan desain yang modern, performa tangguh, dan teknologi terkini, GWM siap memenuhi kebutuhan konsumen Indonesia. Dealer Resmi GWM Jakarta hadir untuk memberikan pengalaman berkendara yang tak terlupakan dan menjadi pilihan utama bagi para pecinta otomotif." }),
    /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-6 md:p-8 rounded-lg shadow-sm", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-medium text-primary mb-6", children: "Contact Information" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-primary mb-2", children: "Location" }),
            /* @__PURE__ */ jsxs("p", { className: "text-secondary", children: [
              "GWM Jakarta – Indonesia",
              /* @__PURE__ */ jsx("br", {}),
              "Agora Mall Thamrin",
              /* @__PURE__ */ jsx("br", {}),
              "Jl. M.H. Thamrin No.10, Kb. Melati, Tanah Abang, Jakarta Pusat, DKI Jakarta 10230"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-primary mb-2", children: "Phone" }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "tel:+6287774377422",
                className: "text-secondary hover:text-primary transition-colors",
                children: "0877 7437 7422 (Call/WA)"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-primary mb-2", children: "Email" }),
            /* @__PURE__ */ jsx(
              "a",
              {
                href: "mailto:ramarkan.pratama@inchcape.co.id",
                className: "text-secondary hover:text-primary transition-colors",
                children: "ramarkan.pratama@inchcape.co.id"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-medium text-primary mb-2", children: "Open Hours" }),
            /* @__PURE__ */ jsxs("ul", { className: "text-secondary space-y-1", children: [
              /* @__PURE__ */ jsx("li", { children: "Monday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Tuesday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Wednesday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Thursday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Friday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Saturday : 9am – 9pm" }),
              /* @__PURE__ */ jsx("li", { children: "Sunday : 9am – 9pm" })
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "h-[400px] md:h-auto rounded-lg overflow-hidden shadow-sm", children: /* @__PURE__ */ jsx(
        Suspense,
        {
          fallback: /* @__PURE__ */ jsx("div", { className: "w-full h-full bg-gray-100 animate-pulse" }),
          children: /* @__PURE__ */ jsx(
            "iframe",
            {
              src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.654660146815!2d106.82031827568823!3d-6.1917807936267395!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f5d48d1e1ad7%3A0x7a5a18978e5b8397!2sAgora%20Mall%20Thamrin!5e0!3m2!1sen!2sid!4v1709871560288!5m2!1sen!2sid",
              width: "100%",
              height: "100%",
              style: { border: 0 },
              allowFullScreen: true,
              loading: "lazy",
              referrerPolicy: "no-referrer-when-downgrade",
              title: "GWM Jakarta Location",
              className: "w-full h-full min-h-[400px]"
            }
          )
        }
      ) })
    ] })
  ] }) }) });
};
export {
  Contact as default
};
