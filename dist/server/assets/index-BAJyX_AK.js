import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { g as getStrapiImageUrl, a as fetchPromos } from "../entry-server.js";
import "react-dom/server";
const Hero = ({
  backgroundImage,
  // Keeping for backward compatibility
  desktopImage,
  mobileImage,
  title,
  subtitle,
  primaryButtonText,
  secondaryButtonText,
  primaryButtonLink = "/",
  secondaryButtonLink = "/"
}) => {
  return /* @__PURE__ */ jsxs("section", { className: "w-full relative text-primary snap-start sm:min-h-screen", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: "hidden sm:flex absolute inset-0 bg-cover bg-center bg-no-repeat w-full h-full flex-col justify-between items-center pt-20",
        style: { backgroundImage: `url(${desktopImage || backgroundImage})` },
        children: [
          /* @__PURE__ */ jsxs("div", { className: "text-center px-5 max-w-7xl mx-auto pt-[5vh] z-10", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-5xl md:text-6xl font-bold mb-3 tracking-tight leading-tight text-shadow-sm", children: title }),
            subtitle && /* @__PURE__ */ jsx("p", { className: "text-sm md:text-base font-normal mb-8 opacity-90 animate-fadeIn max-w-xl mx-auto leading-relaxed", children: subtitle })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-row gap-4 md:gap-6 justify-center items-center w-full px-8 mb-20 z-10", children: [
            primaryButtonText && /* @__PURE__ */ jsx(
              "a",
              {
                href: primaryButtonLink,
                className: "min-w-[180px] md:min-w-[240px] px-6 py-3 rounded bg-primary/90 text-white text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-primary hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-100 w-auto max-w-xs hover:shadow-lg",
                children: primaryButtonText
              }
            ),
            secondaryButtonText && /* @__PURE__ */ jsx(
              "a",
              {
                href: secondaryButtonLink,
                className: "min-w-[180px] md:min-w-[240px] px-6 py-3 rounded bg-white/75 text-[#393c41] text-sm font-medium text-center uppercase transition-all duration-300 hover:bg-white/90 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-200 w-auto max-w-xs hover:shadow-lg",
                children: secondaryButtonText
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[bounce_2s_infinite] z-10", children: /* @__PURE__ */ jsx("span", { className: "w-[30px] h-[50px] border-2 border-primary rounded-[25px] relative before:content-[''] before:absolute before:w-[6px] before:h-[6px] before:bg-primary before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2s_infinite]" }) })
        ]
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "block sm:hidden w-full", children: /* @__PURE__ */ jsxs("div", { className: "relative w-full", children: [
      /* @__PURE__ */ jsx(
        "img",
        {
          src: mobileImage || backgroundImage,
          alt: "Hero background",
          className: "w-full h-auto object-contain"
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-center px-4 max-w-7xl mx-auto pt-20", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold mb-2 tracking-tight leading-tight text-shadow-sm", children: title }),
          subtitle && /* @__PURE__ */ jsx("p", { className: "text-xs font-normal mb-4 opacity-90 animate-fadeIn max-w-md mx-auto leading-relaxed", children: subtitle })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 justify-center items-center w-full px-4 absolute bottom-24 left-0 right-0", children: [
          primaryButtonText && /* @__PURE__ */ jsx(
            "a",
            {
              href: primaryButtonLink,
              className: "w-full px-5 py-3 rounded-md bg-gradient-to-r from-black/20 to-black/30 text-white text-xs font-medium text-center uppercase transition-all duration-300 hover:from-black/95 hover:to-black/80 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-100 max-w-xs hover:shadow-md backdrop-blur-xs border border-white/10 shadow-lg",
              children: primaryButtonText
            }
          ),
          secondaryButtonText && /* @__PURE__ */ jsx(
            "a",
            {
              href: secondaryButtonLink,
              className: "w-full px-5 py-3 rounded-md bg-white/80 text-[#393c41] text-xs font-medium text-center uppercase transition-all duration-300 hover:bg-white/95 hover:-translate-y-0.5 active:translate-y-0 animate-fadeIn animation-delay-200 max-w-xs hover:shadow-md backdrop-blur-sm shadow-lg",
              children: secondaryButtonText
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center animate-[bounce_2s_infinite]", children: /* @__PURE__ */ jsx("span", { className: "w-[24px] h-[40px] border-2 border-primary rounded-[25px] relative before:content-[''] before:absolute before:w-[5px] before:h-[5px] before:bg-primary before:rounded-full before:left-1/2 before:-translate-x-1/2 before:top-[10px] before:animate-[scroll_2s_infinite]" }) })
      ] })
    ] }) })
  ] });
};
const ModelShowcase = ({
  imageUrl,
  title,
  description,
  price,
  features = [],
  // primaryButtonText,
  // secondaryButtonText,
  // primaryButtonLink = "/",
  // secondaryButtonLink = "/",
  isReversed = false
}) => {
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: `min-h-screen snap-start flex flex-col lg:flex-row ${isReversed ? "lg:flex-row-reverse" : ""} overflow-hidden bg-white`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "w-full lg:w-1/2 h-[40vh] sm:h-[50vh] lg:h-screen overflow-hidden relative", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: imageUrl,
            alt: title,
            className: "w-full h-full object-cover object-center transition-transform duration-300 ease-in-out hover:scale-[1.03]"
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "w-full lg:w-1/2 px-6 py-8 sm:p-8 md:p-12 lg:p-16 flex flex-col justify-center text-primary", children: [
          /* @__PURE__ */ jsx("h2", { className: "text-3xl sm:text-4xl md:text-5xl font-medium mb-2 tracking-tight", children: title }),
          price && /* @__PURE__ */ jsx("p", { className: "text-xl sm:text-2xl font-semibold text-accent mb-4", children: price }),
          /* @__PURE__ */ jsx("p", { className: "text-sm sm:text-base md:text-lg leading-relaxed mb-6 text-secondary max-w-xl", children: description }),
          features.length > 0 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-8 sm:mb-10", children: features.map((feature) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: "flex items-start gap-x-3",
              children: [
                /* @__PURE__ */ jsx("span", { className: "flex h-[1lh] items-center", children: /* @__PURE__ */ jsx("span", { className: "text-accent text-xl font-bold", children: "✓" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs sm:text-base text-secondary", children: feature })
              ]
            },
            `${title}-${feature.replace(/\s+/g, "-").toLowerCase()}`
          )) })
        ] })
      ]
    }
  );
};
function Promos() {
  const [promos, setPromos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function loadPromos() {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchPromos(1, 4);
        setPromos(response.data);
      } catch (err) {
        console.error("Error fetching promos:", err);
        setError("Failed to load promotional content");
      } finally {
        setIsLoading(false);
      }
    }
    loadPromos();
  }, []);
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: "flex justify-center items-center min-h-[200px]", children: /* @__PURE__ */ jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "text-center py-8", children: /* @__PURE__ */ jsx("p", { className: "text-red-500", children: error }) });
  }
  if (promos.length === 0) {
    return null;
  }
  return /* @__PURE__ */ jsx("div", { className: "py-12 bg-gray-50", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-2xl md:text-3xl font-bold", children: "Promo Spesial" }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          to: "/info-promo",
          className: "text-primary hover:underline flex items-center",
          children: [
            "Lihat Semua",
            /* @__PURE__ */ jsxs(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "h-5 w-5 ml-1",
                viewBox: "0 0 20 20",
                fill: "currentColor",
                children: [
                  /* @__PURE__ */ jsx("title", { children: "Lihat Semua Arrow" }),
                  /* @__PURE__ */ jsx(
                    "path",
                    {
                      fillRule: "evenodd",
                      d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z",
                      clipRule: "evenodd"
                    }
                  )
                ]
              }
            )
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: promos.map((promo) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition duration-300",
        children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-w-16 aspect-h-9", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: getStrapiImageUrl(promo.promo_image.url),
              alt: promo.promo_text || "promo",
              className: "object-cover w-full h-48"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "p-4", children: [
            /* @__PURE__ */ jsx("span", { className: "inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full mb-2", children: "Promo" }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                to: "/info-promo",
                className: "text-primary font-medium hover:underline flex items-center text-sm",
                children: [
                  "Selengkapnya",
                  /* @__PURE__ */ jsxs(
                    "svg",
                    {
                      xmlns: "http://www.w3.org/2000/svg",
                      className: "h-4 w-4 ml-1",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      stroke: "currentColor",
                      children: [
                        /* @__PURE__ */ jsx("title", { children: "Read More Arrow" }),
                        /* @__PURE__ */ jsx(
                          "path",
                          {
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            strokeWidth: 2,
                            d: "M14 5l7 7m0 0l-7 7m7-7H3"
                          }
                        )
                      ]
                    }
                  )
                ]
              }
            )
          ] })
        ]
      },
      promo.id
    )) })
  ] }) });
}
const sections = [{
  id: "hero",
  name: "Home"
}, {
  id: "haval-h6",
  name: "Haval H6"
}, {
  id: "haval-jolion-ultra",
  name: "Haval Jolion"
}, {
  id: "tank-300",
  name: "Tank 300"
}, {
  id: "tank-500",
  name: "Tank 500"
}, {
  id: "promos",
  name: "Promos"
}, {
  id: "contact",
  name: "Contact"
}];
const vehicleModels = [{
  id: 1,
  name: "Tank 300",
  price: "Rp. 837.000.000",
  description: "Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road yang luar biasa dengan kenyamanan premium di dalam kabin.",
  features: ["Mesin Turbo 2.0 T HEV (342 HP | 648 NM)", "Transmisi 8-Speed Automatic", "4WD dengan Electronic Locking Differentials", "900 mm Wading Depth", "Comfort Luxury Nappa Leather", "Auto Park", "Multi-Terrain Select", "ADAS Lvl 2"],
  learnMoreLink: "/tank-300",
  // imageUrl: tank300Image,
  imageUrl: "https://gwm.kopimap.com/tank_300.webp"
}, {
  id: 2,
  name: "Tank 500",
  price: "Rp. 1.208.000.000",
  description: "Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang.",
  features: ["Mesin Turbo 2.0 T HEV (342 HP | 648 NM)", "Transmisi 8-Speed Automatic", "4WD dengan Electronic Locking Differentials", "900 mm Wading Depth", "Comfort Luxury Nappa Leather", "Auto Park", "Massage Seat", "ADAS Lvl 2"],
  learnMoreLink: "/tank-500",
  // imageUrl: tank500Image,
  imageUrl: "https://gwm.kopimap.com/tank_500.webp"
}, {
  id: 3,
  name: "Haval Jolion Ultra",
  price: "Rp. 418.000.000",
  description: "Compact SUV stylish yang menggabungkan teknologi mutakhir dengan desain berkelas. Pilihan sempurna untuk mobilitas perkotaan modern.",
  features: ["Mesin 1.5 HEV (187 HP | 375 NM)", "Transmisi 7-Speed DHT", "Efisien 20 Km/liter", "Panoramic Sunroof", '10.25" Touchscreen Display', "Carplay dan Android auto", "ADAS Lvl 2", "EV Mode"],
  learnMoreLink: "/haval-jolion-ultra",
  // imageUrl: havalJolionImage,
  imageUrl: "https://gwm.kopimap.com/haval_jolion.webp"
}, {
  id: 4,
  name: "Haval H6",
  price: "Rp. 602.000.000",
  description: "SUV premium dengan desain elegan dan performa tangguh. Dilengkapi dengan berbagai fitur keselamatan dan kenyamanan terkini.",
  features: ["Mesin Turbo 1.5 T HEV (235 HP | 530 NM)", "Transmisi 7-Speed DHT", "Panoramic Sunroof", "540° Camera View", "Auto Parking", "ADAS Lvl 2", "Advanced Safety Features", "Smart Connectivity"],
  learnMoreLink: "/haval-h6",
  // imageUrl: havalH6Image,
  imageUrl: "https://gwm.kopimap.com/haval_h6.jpg"
}];
const SplitComponent = function HomePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = sections.length;
  const currentRoute = router.state.location.pathname;
  const isHomePage = currentRoute === "/";
  const prevRoute = useRef(currentRoute);
  useEffect(() => {
    if (prevRoute.current !== currentRoute) {
      window.scrollTo(0, 0);
      prevRoute.current = currentRoute;
    }
  }, [currentRoute]);
  useEffect(() => {
    if (!isHomePage) return;
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const newSection = Math.floor(scrollPosition / windowHeight);
      if (newSection !== currentSection && newSection < totalSections) {
        setCurrentSection(newSection);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentSection, totalSections, isHomePage]);
  return /* @__PURE__ */ jsx("div", { className: "relative min-h-screen overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "snap-y snap-mandatory", children: [
    /* @__PURE__ */ jsx("div", { id: sections[0].id, className: "section-container", children: /* @__PURE__ */ jsx(
      Hero,
      {
        desktopImage: "https://gwm.kopimap.com/hero_image.webp",
        mobileImage: "https://gwm.kopimap.com/hero_image_mobile.png",
        title: "GWM Indonesia",
        subtitle: "Great Wall Motors - Mobil berkualitas tinggi dengan teknologi terkini",
        primaryButtonText: "Jelajahi Mobil",
        secondaryButtonText: "Pesan Sekarang",
        primaryButtonLink: "/tipe-mobil",
        secondaryButtonLink: "https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20.."
      }
    ) }),
    vehicleModels.map((model, index) => {
      const sectionIndex = index + 1;
      const isHavalModel = model.name.toLowerCase().includes("haval");
      const secondaryButtonText = isHavalModel ? "Test Drive" : "Hubungi Kami";
      const secondaryButtonLink = isHavalModel ? "/test-drive" : "/kontak";
      return /* @__PURE__ */ jsx("div", { id: sections[sectionIndex].id, className: "section-container", children: /* @__PURE__ */ jsx(
        ModelShowcase,
        {
          imageUrl: model.imageUrl,
          title: model.name,
          price: model.price,
          description: model.description,
          features: model.features,
          primaryButtonText: "Lihat Detail",
          secondaryButtonText,
          primaryButtonLink: model.learnMoreLink,
          secondaryButtonLink,
          isReversed: index % 2 !== 0
        }
      ) }, model.id);
    }),
    /* @__PURE__ */ jsx("div", { id: sections[5].id, className: "section-container", children: /* @__PURE__ */ jsx(Promos, {}) })
  ] }) });
};
export {
  SplitComponent as component
};
