import { jsxs, jsx } from "react/jsx-runtime";
import { renderToString } from "react-dom/server";
import { useState, useRef, useEffect, StrictMode, Suspense } from "react";
import { useRouter, Link, createRootRouteWithContext, HeadContent, Scripts, Outlet, createFileRoute, lazyRouteComponent, createRouter, createMemoryHistory, RouterProvider } from "@tanstack/react-router";
const vehicleModels = [
  {
    id: "tank-300",
    name: "Tank 300",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/tank_300_nav_shot.png"
  },
  {
    id: "tank-500",
    name: "Tank 500",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/tank_500_nav_shot.png"
  },
  {
    id: "haval-jolion-ultra",
    name: "Haval Jolion Ultra",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/haval_jolion_nav_shot.png"
  },
  {
    id: "haval-h6",
    name: "Haval H6",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/haval_h6_nav_shot.png"
  }
];
const Navbar = () => {
  const router2 = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = router2.state.location.pathname === "/";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(true);
  const dropdownTimeoutRef = useRef(null);
  const dropdownRef = useRef(null);
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen === false) {
      setMobileSubmenuOpen(false);
    }
  };
  const handleKeyPress = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      toggleMenu();
    }
  };
  const whatsappUrl = "https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20..";
  const isActive = (path) => {
    return router2.state.location.pathname === path;
  };
  const baseNavClass = "text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded hover:bg-black/5";
  const baseMobileNavClass = "text-primary no-underline text-base font-medium block py-2.5";
  const activeClass = "font-semibold";
  const showDropdown = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }
    setDropdownOpen(true);
  };
  const hideDropdown = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
  };
  const toggleMobileSubmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileSubmenuOpen(!mobileSubmenuOpen);
  };
  const closeMenu = () => {
    setTimeout(() => {
      setMenuOpen(false);
      setMobileSubmenuOpen(false);
    }, 10);
  };
  return /* @__PURE__ */ jsxs(
    "nav",
    {
      className: `flex justify-between items-center px-4 sm:px-6 md:px-10 h-[60px] sm:h-[70px] w-full transition-all duration-300 ${scrolled || !isHomePage ? "bg-white/95 shadow-sm" : "bg-transparent"}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex items-center", children: /* @__PURE__ */ jsx(Link, { to: "/", className: "inline-block", children: /* @__PURE__ */ jsx(
          "img",
          {
            src: "https://gwm.kopimap.com/gwm_logo.webp",
            alt: "GWM Indonesia Logo",
            className: "h-7 sm:h-9 m-0"
          }
        ) }) }),
        /* @__PURE__ */ jsx("div", { className: "hidden lg:flex justify-center", children: /* @__PURE__ */ jsxs("ul", { className: "flex list-none m-0 p-0 gap-6", children: [
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
            Link,
            {
              to: "/",
              className: `${baseNavClass} ${isActive("/") ? activeClass : ""}`,
              children: "Home"
            }
          ) }),
          /* @__PURE__ */ jsxs(
            "li",
            {
              className: "relative",
              ref: dropdownRef,
              onMouseEnter: showDropdown,
              onMouseLeave: hideDropdown,
              children: [
                /* @__PURE__ */ jsxs(
                  Link,
                  {
                    to: "/tipe-mobil",
                    className: `${baseNavClass} ${isActive("/models") ? activeClass : ""} flex items-center gap-1`,
                    children: [
                      "Type Mobil",
                      /* @__PURE__ */ jsx(
                        "svg",
                        {
                          xmlns: "http://www.w3.org/2000/svg",
                          width: "12",
                          height: "12",
                          viewBox: "0 0 24 24",
                          fill: "none",
                          stroke: "currentColor",
                          strokeWidth: "2",
                          strokeLinecap: "round",
                          strokeLinejoin: "round",
                          className: `transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`,
                          "aria-hidden": "true",
                          children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" })
                        }
                      )
                    ]
                  }
                ),
                dropdownOpen && /* @__PURE__ */ jsx("div", { className: "absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 min-w-[280px] z-50", children: vehicleModels.map((model) => /* @__PURE__ */ jsxs(
                  Link,
                  {
                    to: "/models/$type",
                    params: {
                      type: model.id
                    },
                    preload: "intent",
                    className: "flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100",
                    children: [
                      /* @__PURE__ */ jsx(
                        "img",
                        {
                          src: model.image,
                          alt: model.name,
                          className: "w-14 h-10 object-cover rounded mr-3"
                        }
                      ),
                      /* @__PURE__ */ jsxs("div", { children: [
                        /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: model.name }),
                        /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 block", children: model.category })
                      ] })
                    ]
                  },
                  model.id
                )) })
              ]
            }
          ),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
            Link,
            {
              to: "/info-promo",
              className: `${baseNavClass} ${isActive("/info-promo") ? activeClass : ""}`,
              children: "Info & Promo"
            }
          ) }),
          /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
            Link,
            {
              to: "/kontak",
              className: `${baseNavClass} ${isActive("/kontak") ? activeClass : ""}`,
              children: "Kontak"
            }
          ) })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 sm:gap-4", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: whatsappUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "hidden lg:flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors",
              "aria-label": "Chat on WhatsApp",
              children: [
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Chat with GWM Indonesia on WhatsApp" }),
                /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    className: "w-5 h-5",
                    fill: "currentColor",
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 448 512",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsx("title", { children: "WhatsApp Icon" }),
                      /* @__PURE__ */ jsx("path", { d: "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "WhatsApp" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: whatsappUrl,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "hidden sm:flex lg:hidden items-center justify-center w-9 h-9 text-green-600 hover:text-green-700 transition-colors",
              "aria-label": "Chat on WhatsApp",
              children: [
                /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Chat with GWM Indonesia on WhatsApp" }),
                /* @__PURE__ */ jsxs(
                  "svg",
                  {
                    className: "w-6 h-6",
                    fill: "currentColor",
                    xmlns: "http://www.w3.org/2000/svg",
                    viewBox: "0 0 448 512",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsx("title", { children: "WhatsApp Icon" }),
                      /* @__PURE__ */ jsx("path", { d: "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" })
                    ]
                  }
                )
              ]
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "lg:hidden flex items-center gap-1 cursor-pointer bg-white/20 border-0 p-1.5 px-2 text-primary font-medium text-sm rounded hover:bg-black/5",
              onClick: toggleMenu,
              onKeyDown: handleKeyPress,
              "aria-label": "Toggle menu",
              children: /* @__PURE__ */ jsx("span", { className: "font-semibold", children: "Menu" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `fixed top-0 right-0 w-[280px] h-screen bg-white shadow-[-5px_0_15px_rgba(0,0,0,0.1)] p-[60px_20px_30px] z-[101] lg:hidden transition-transform duration-300 transform ${menuOpen ? "translate-x-0" : "translate-x-full"}`,
            children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "absolute top-4 right-4 text-[28px] cursor-pointer text-primary bg-transparent border-0 p-0",
                  onClick: toggleMenu,
                  onKeyDown: handleKeyPress,
                  "aria-label": "Close menu",
                  children: "×"
                }
              ),
              /* @__PURE__ */ jsxs("ul", { className: "list-none p-0 m-0", children: [
                /* @__PURE__ */ jsx("li", { className: "mb-5", children: /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/",
                    className: `${baseMobileNavClass} ${isActive("/") ? activeClass : ""}`,
                    onClick: closeMenu,
                    children: "Home"
                  }
                ) }),
                /* @__PURE__ */ jsxs("li", { className: "mb-5", children: [
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                    /* @__PURE__ */ jsx(
                      Link,
                      {
                        to: "/tipe-mobil",
                        className: `${baseMobileNavClass} ${isActive("/tipe-mobil") ? activeClass : ""}`,
                        onClick: closeMenu,
                        children: "Type Mobil"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: toggleMobileSubmenu,
                        className: "py-2 px-3 text-gray-500 hover:text-primary",
                        children: /* @__PURE__ */ jsx(
                          "svg",
                          {
                            xmlns: "http://www.w3.org/2000/svg",
                            width: "16",
                            height: "16",
                            viewBox: "0 0 24 24",
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: "2",
                            strokeLinecap: "round",
                            strokeLinejoin: "round",
                            className: `transition-transform duration-200 ${mobileSubmenuOpen ? "rotate-180" : ""}`,
                            "aria-hidden": "true",
                            children: /* @__PURE__ */ jsx("path", { d: "m6 9 6 6 6-6" })
                          }
                        )
                      }
                    )
                  ] }),
                  mobileSubmenuOpen && /* @__PURE__ */ jsx("div", { className: "pl-4 mt-2 space-y-3 border-l-2 border-gray-100", children: vehicleModels.map((model) => /* @__PURE__ */ jsxs(
                    Link,
                    {
                      to: "/models/$type",
                      params: {
                        type: model.id
                      },
                      preload: "intent",
                      className: "flex items-center py-1.5 text-sm text-gray-700 hover:text-primary",
                      onClick: (e) => {
                        closeMenu();
                      },
                      children: [
                        /* @__PURE__ */ jsx(
                          "img",
                          {
                            src: model.image,
                            alt: model.name,
                            className: "w-12 h-9 object-cover rounded mr-2"
                          }
                        ),
                        /* @__PURE__ */ jsxs("div", { children: [
                          /* @__PURE__ */ jsx("span", { children: model.name }),
                          /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-500 block", children: model.category })
                        ] })
                      ]
                    },
                    model.id
                  )) })
                ] }),
                /* @__PURE__ */ jsx("li", { className: "mb-5", children: /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/info-promo",
                    className: `${baseMobileNavClass} ${isActive("/info-promo") ? activeClass : ""}`,
                    onClick: closeMenu,
                    children: "Info & Promo"
                  }
                ) }),
                /* @__PURE__ */ jsx("li", { className: "mb-5", children: /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/kontak",
                    className: `${baseMobileNavClass} ${isActive("/kontak") ? activeClass : ""}`,
                    onClick: closeMenu,
                    children: "Kontak"
                  }
                ) }),
                /* @__PURE__ */ jsx("li", { className: "mb-5", children: /* @__PURE__ */ jsxs(
                  "a",
                  {
                    href: whatsappUrl,
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-primary no-underline text-base font-medium block py-2.5 flex items-center gap-2",
                    children: [
                      /* @__PURE__ */ jsxs(
                        "svg",
                        {
                          className: "w-5 h-5 text-green-600",
                          fill: "currentColor",
                          xmlns: "http://www.w3.org/2000/svg",
                          viewBox: "0 0 448 512",
                          "aria-hidden": "true",
                          children: [
                            /* @__PURE__ */ jsx("title", { children: "WhatsApp Icon" }),
                            /* @__PURE__ */ jsx("path", { d: "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" })
                          ]
                        }
                      ),
                      "WhatsApp"
                    ]
                  }
                ) }),
                /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "/pesan",
                    className: "mt-5 py-2.5 bg-primary/80 text-white text-center rounded block hover:bg-primary transition-colors",
                    children: "Pesan Sekarang"
                  }
                ) })
              ] })
            ]
          }
        ),
        menuOpen && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: toggleMenu,
            className: "fixed inset-0 bg-black bg-opacity-50 z-[100] lg:hidden cursor-pointer border-0 p-0",
            "aria-label": "Close mobile menu"
          }
        )
      ]
    }
  );
};
const Footer = () => {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const handleKeyPress = (event, url) => {
    if (event.key === "Enter" || event.key === " ") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };
  return /* @__PURE__ */ jsxs(
    "footer",
    {
      className: "bg-white py-8 sm:py-10 text-primary border-t border-gray-100",
      id: "contact",
      children: [
        /* @__PURE__ */ jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-5 md:px-10", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium mb-2 sm:mb-3", children: "GWM Indonesia" }),
            /* @__PURE__ */ jsxs("ul", { className: "space-y-1 sm:space-y-2", children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/tentang-kami",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "Tentang Kami"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/berita",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "Berita"
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium mb-2 sm:mb-3", children: "Type Mobil" }),
            /* @__PURE__ */ jsxs("ul", { className: "space-y-1 sm:space-y-2", children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/tipe-mobil/suv",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "SUV"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/tipe-mobil/pickup",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "Pickup"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/tipe-mobil/electric",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "Electric"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "/tipe-mobil/hybrid",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "Hybrid"
                }
              ) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "col-span-1", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-medium mb-2 sm:mb-3", children: "Kontak" }),
            /* @__PURE__ */ jsxs("ul", { className: "space-y-1 sm:space-y-2", children: [
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "tel:+6287774377422",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "+62 877 7437 7422"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
                "a",
                {
                  href: "mailto:info@gwm.co.id",
                  className: "text-gray-500 hover:text-primary text-xs transition",
                  children: "info@gwmindonesia.co.id"
                }
              ) }),
              /* @__PURE__ */ jsx("li", { className: "text-gray-500 text-xs", children: "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan" })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-4 mt-5", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => window.open(
                    "https://facebook.com",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://facebook.com"),
                  className: "w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors",
                  "aria-label": "Kunjungi Facebook GWM Indonesia",
                  children: /* @__PURE__ */ jsx("i", { className: "fab fa-facebook-f text-sm" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => window.open(
                    "https://instagram.com/indo.tank",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://instagram.com/indo.tank"),
                  className: "w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors",
                  "aria-label": "Kunjungi Instagram GWM Indonesia",
                  children: /* @__PURE__ */ jsx("i", { className: "fab fa-instagram text-sm" })
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => window.open(
                    "https://twitter.com",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://twitter.com"),
                  className: "w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors",
                  "aria-label": "Kunjungi Twitter GWM Indonesia",
                  children: /* @__PURE__ */ jsx("i", { className: "fab fa-twitter text-sm" })
                }
              )
            ] })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-10 pt-5 border-t border-gray-100 px-10", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 order-2 md:order-1", children: [
              "© ",
              currentYear,
              " GWM Indonesia. All rights reserved."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex space-x-3 items-center order-1 md:order-2", children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400 mr-2", children: "Follow Us" }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                  "aria-label": "Facebook",
                  onClick: () => window.open(
                    "https://facebook.com/gwmindonesia",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://facebook.com/gwmindonesia"),
                  children: /* @__PURE__ */ jsx(
                    "svg",
                    {
                      className: "w-4 h-4 text-primary",
                      fill: "currentColor",
                      viewBox: "0 0 24 24",
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsx("path", { d: "M12.5 2C6.71484 2 2 6.71484 2 12.5C2 17.7461 5.75781 22.0664 10.7148 22.8711V15.5977H8.04688V12.5H10.7148V10.1562C10.7148 7.46484 12.2188 5.99219 14.6484 5.99219C15.8164 5.99219 17.0547 6.1875 17.0547 6.1875V8.69531H15.7773C14.5 8.69531 14.0742 9.50781 14.0742 10.3438V12.5H16.9453L16.457 15.5977H14.0742V22.8711C19.0312 22.0664 22.7891 17.7461 22.7891 12.5C22.7891 6.71484 18.2852 2 12.5 2Z" })
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                  "aria-label": "Instagram",
                  onClick: () => window.open(
                    "https://instagram.com/indo.tank",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://instagram.com/indo.tank"),
                  children: /* @__PURE__ */ jsx(
                    "svg",
                    {
                      className: "w-4 h-4 text-primary",
                      fill: "currentColor",
                      viewBox: "0 0 24 24",
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsx("path", { d: "M12.5 2C9.51562 2 9.12891 2.01562 8.02734 2.05469C6.92969 2.09375 6.15234 2.28125 5.46875 2.53125C4.78125 2.78125 4.17969 3.12891 3.58594 3.72266C2.98828 4.31641 2.64062 4.91797 2.39062 5.60547C2.14062 6.28516 1.95312 7.0625 1.91406 8.16016C1.875 9.26172 1.85938 9.64844 1.85938 12.6328C1.85938 15.6172 1.875 16.0039 1.91406 17.1055C1.95312 18.2031 2.14062 18.9805 2.39062 19.6602C2.64062 20.3477 2.98828 20.9492 3.58594 21.543C4.17969 22.1367 4.78125 22.4844 5.46875 22.7344C6.14844 22.9844 6.92578 23.1719 8.02734 23.2109C9.12891 23.25 9.51562 23.2656 12.5 23.2656C15.4844 23.2656 15.8711 23.25 16.9727 23.2109C18.0742 23.1719 18.8516 22.9844 19.5312 22.7344C20.2188 22.4844 20.8203 22.1367 21.4141 21.543C22.0078 20.9492 22.3555 20.3477 22.6055 19.6602C22.8555 18.9805 23.043 18.2031 23.082 17.1055C23.1211 16.0039 23.1367 15.6172 23.1367 12.6328C23.1367 9.64844 23.1211 9.26172 23.082 8.16016C23.043 7.05859 22.8555 6.28516 22.6055 5.60547C22.3555 4.91797 22.0078 4.31641 21.4141 3.72266C20.8203 3.12891 20.2188 2.78125 19.5312 2.53125C18.8516 2.28125 18.0742 2.09375 16.9727 2.05469C15.8711 2.01562 15.4844 2 12.5 2ZM12.5 4.14062C15.4375 4.14062 15.7852 4.15625 16.8711 4.19531C17.8516 4.23438 18.4336 4.41406 18.8125 4.57422C19.3125 4.78125 19.6602 5.02344 20.0352 5.39844C20.4102 5.77344 20.6523 6.12109 20.8594 6.62109C21.0156 7 21.1992 7.58203 21.2383 8.5625C21.2773 9.64844 21.293 9.99609 21.293 12.9336C21.293 15.8711 21.2773 16.2188 21.2383 17.3047C21.1992 18.2852 21.0156 18.8672 20.8594 19.2461C20.6523 19.7461 20.4102 20.0938 20.0352 20.4688C19.6602 20.8438 19.3125 21.0859 18.8125 21.293C18.4336 21.4492 17.8516 21.6328 16.8711 21.6719C15.7852 21.7109 15.4375 21.7266 12.5 21.7266C9.5625 21.7266 9.21484 21.7109 8.12891 21.6719C7.14844 21.6328 6.56641 21.4492 6.1875 21.293C5.6875 21.0859 5.33984 20.8438 4.96484 20.4688C4.58984 20.0938 4.34766 19.7461 4.14453 19.2461C3.98438 18.8672 3.79688 18.2852 3.76172 17.3047C3.72266 16.2188 3.70703 15.8711 3.70703 12.9336C3.70703 9.99609 3.72266 9.64844 3.76172 8.5625C3.80078 7.58203 3.98438 7 4.14453 6.62109C4.34766 6.12109 4.58984 5.77344 4.96484 5.39844C5.33984 5.02344 5.6875 4.78125 6.1875 4.57422C6.56641 4.41406 7.14844 4.23438 8.12891 4.19531C9.21484 4.15625 9.5625 4.14062 12.5 4.14062Z M12.5 7.09375C9.44922 7.09375 6.96094 9.58203 6.96094 12.6328C6.96094 15.6836 9.44922 18.1719 12.5 18.1719C15.5508 18.1719 18.0391 15.6836 18.0391 12.6328C18.0391 9.58203 15.5508 7.09375 12.5 7.09375ZM12.5 16.0312C10.6289 16.0312 9.10156 14.5039 9.10156 12.6328C9.10156 10.7617 10.6289 9.23438 12.5 9.23438C14.3711 9.23438 15.8984 10.7617 15.8984 12.6328C15.8984 14.5039 14.3711 16.0312 12.5 16.0312Z M19.5312 6.875C19.5312 7.60547 18.9375 8.19922 18.207 8.19922C17.4766 8.19922 16.8828 7.60547 16.8828 6.875C16.8828 6.14453 17.4766 5.55078 18.207 5.55078C18.9375 5.55078 19.5312 6.14453 19.5312 6.875Z" })
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  className: "w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors",
                  "aria-label": "YouTube",
                  onClick: () => window.open(
                    "https://youtube.com/gwmindonesia",
                    "_blank",
                    "noopener,noreferrer"
                  ),
                  onKeyDown: (e) => handleKeyPress(e, "https://youtube.com/gwmindonesia"),
                  children: /* @__PURE__ */ jsx(
                    "svg",
                    {
                      className: "w-4 h-4 text-primary",
                      fill: "currentColor",
                      viewBox: "0 0 24 24",
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsx(
                        "path",
                        {
                          d: "M22.9396 6.69571C22.6685 5.7846 22.0608 5.05792 21.2669 4.74901C19.8743 4.2005 12.5 4.2005 12.5 4.2005C12.5 4.2005 5.12573 4.2005 3.73315 4.74901C2.93921 5.05792 2.33151 5.7846 2.06044 6.69571C1.5 8.33314 1.5 12.1 1.5 12.1C1.5 12.1 1.5 15.8669 2.06044 17.5043C2.33151 18.4154 2.93921 19.1421 3.73315 19.451C5.12573 19.9995 12.5 19.9995 12.5 19.9995C12.5 19.9995 19.8743 19.9995 21.2669 19.451C22.0608 19.1421 22.6685 18.4154 22.9396 17.5043C23.5 15.8669 23.5 12.1 23.5 12.1C23.5 12.1 23.5 8.33314 22.9396 6.69571ZM10.3023 15.2999V8.90015L16.1991\n                    12.1L10.3023 15.2999Z"
                        }
                      )
                    }
                  )
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 md:mt-6 text-center md:text-left", children: /* @__PURE__ */ jsxs("ul", { className: "flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2", children: [
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              "a",
              {
                href: "/privacy-policy",
                className: "text-xs text-gray-400 hover:text-primary transition",
                children: "Privacy Policy"
              }
            ) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              "a",
              {
                href: "/terms",
                className: "text-xs text-gray-400 hover:text-primary transition",
                children: "Terms of Service"
              }
            ) }),
            /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
              "a",
              {
                href: "/cookie-policy",
                className: "text-xs text-gray-400 hover:text-primary transition",
                children: "Cookie Policy"
              }
            ) })
          ] }) })
        ] })
      ]
    }
  );
};
const WhatsAppButton = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const whatsappUrl = "https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20..";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `fixed ${isMobile ? "bottom-4 right-4" : "bottom-6 right-6"} z-[100]`,
      children: [
        isHovered && !isMobile && /* @__PURE__ */ jsxs("div", { className: "absolute bottom-16 right-0 bg-white rounded-lg shadow-lg p-3 mb-2 w-52 text-sm animate-fadeIn", children: [
          /* @__PURE__ */ jsx("p", { className: "text-gray-700 font-medium", children: "Tanya Promo GWM" }),
          /* @__PURE__ */ jsx("p", { className: "text-gray-600 text-xs mt-1", children: "Kak Arkan akan membalas pesan Anda segera" })
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: whatsappUrl,
            target: "_blank",
            rel: "noopener noreferrer",
            className: `flex items-center justify-center ${isMobile ? "w-auto h-12 px-4" : "w-auto h-14 px-6"} bg-green-500 hover:bg-green-600 rounded-full shadow-lg transition-all duration-300 hover:scale-105`,
            onMouseEnter: () => setIsHovered(true),
            onMouseLeave: () => setIsHovered(false),
            "aria-label": "Schedule Drive on WhatsApp",
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Schedule a test drive with GWM Indonesia on WhatsApp" }),
              /* @__PURE__ */ jsxs(
                "svg",
                {
                  className: `${isMobile ? "w-6 h-6" : "w-7 h-7"} text-white mr-2`,
                  fill: "currentColor",
                  xmlns: "http://www.w3.org/2000/svg",
                  viewBox: "0 0 448 512",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsx("title", { children: "WhatsApp Logo" }),
                    /* @__PURE__ */ jsx("path", { d: "M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" })
                  ]
                }
              ),
              /* @__PURE__ */ jsx(
                "span",
                {
                  className: `text-white font-medium ${isMobile ? "text-sm" : "text-base"}`,
                  children: "Test Drive Now"
                }
              )
            ]
          }
        )
      ]
    }
  );
};
const STRAPI_API_URL = "https://gwm-admin.blogstreak.com";
const Route$7 = createRootRouteWithContext()({
  component: () => /* @__PURE__ */ jsxs("html", { lang: "id", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "UTF-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1.0" }),
      /* @__PURE__ */ jsx(HeadContent, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsx(RootComponent, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] }),
  // Default head metadata for the entire site
  head: () => ({
    meta: [
      {
        title: "GWM Indonesia - Great Wall Motors"
      },
      {
        name: "description",
        content: "Great Wall Motors Indonesia - Mobil berkualitas tinggi dengan teknologi terkini"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      }
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm-indonesia.com"
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg"
      }
    ]
  })
});
function RootComponent() {
  const prevPathname = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const handleRouteChange = () => {
      const pathname = window.location.pathname;
      if (prevPathname.current !== pathname) {
        window.scrollTo(0, 0);
        prevPathname.current = pathname;
      }
    };
    handleRouteChange();
    window.addEventListener("popstate", handleRouteChange);
    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative min-h-screen overflow-y-auto",
      "data-react-root": "true",
      children: [
        /* @__PURE__ */ jsx("div", { className: "fixed top-0 left-0 right-0 z-50 bg-transparent", children: /* @__PURE__ */ jsx(Navbar, {}) }),
        /* @__PURE__ */ jsxs("div", { className: "pt-[70px]", children: [
          /* @__PURE__ */ jsx("main", { children: isLoading ? /* @__PURE__ */ jsx("div", { className: "w-full animate-pulse", children: /* @__PURE__ */ jsxs("div", { className: "h-screen bg-gray-100 flex flex-col", children: [
            /* @__PURE__ */ jsx("div", { className: "bg-gray-200 h-1/3 w-full" }),
            /* @__PURE__ */ jsxs("div", { className: "px-4 py-8 max-w-7xl mx-auto w-full", children: [
              /* @__PURE__ */ jsx("div", { className: "h-8 bg-gray-200 rounded w-1/3 mb-4" }),
              /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-2/3 mb-6" }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-8", children: [
                /* @__PURE__ */ jsx("div", { className: "h-64 bg-gray-200 rounded" }),
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsx("div", { className: "h-6 bg-gray-200 rounded w-3/4" }),
                  /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-full" }),
                  /* @__PURE__ */ jsx("div", { className: "h-4 bg-gray-200 rounded w-full" })
                ] })
              ] })
            ] })
          ] }) }) : /* @__PURE__ */ jsx("div", { className: "transition-opacity duration-300 opacity-100", children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
          /* @__PURE__ */ jsx(Footer, {}),
          /* @__PURE__ */ jsx(WhatsAppButton, {})
        ] })
      ]
    }
  );
}
const $$splitComponentImporter$6 = () => import("./assets/tipe-mobil-DlVGNHgE.js");
const Route$6 = createFileRoute("/tipe-mobil")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component", () => Route$6.ssr),
  head: () => ({
    meta: [{
      title: "Type Mobil GWM Indonesia - Tank, Haval, ORA | Great Wall Motors"
    }, {
      name: "description",
      content: "Temukan berbagai type mobil GWM Indonesia - Tank 300, Tank 500, Haval H6, Haval Jolion, dan lainnya. Pilih kendaraan yang sesuai dengan gaya hidup dan kebutuhan Anda."
    }]
  })
});
const $$splitComponentImporter$5 = () => import("./assets/kontak-Cq1wef69.js");
const Route$5 = createFileRoute("/kontak")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component", () => Route$5.ssr),
  head: () => ({
    title: "Kontak GWM Indonesia - Hubungi Kami",
    meta: [{
      name: "description",
      content: "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda."
    }, {
      name: "keywords",
      content: "kontak GWM, dealer GWM, test drive GWM, layanan purna jual, Great Wall Motors Indonesia"
    }, {
      property: "og:title",
      content: "Kontak GWM Indonesia - Hubungi Kami"
    }, {
      property: "og:description",
      content: "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda."
    }, {
      property: "og:image",
      content: "https://gwm.kopimap.com/kontak_banner.jpg"
    }, {
      property: "og:url",
      content: "https://gwm.co.id/kontak"
    }, {
      property: "og:type",
      content: "website"
    }],
    links: [{
      rel: "canonical",
      href: "https://gwm.co.id/kontak"
    }]
  })
});
const $$splitComponentImporter$4 = () => import("./assets/info-promo-B6QDWopC.js");
const Route$4 = createFileRoute("/info-promo")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component", () => Route$4.ssr),
  head: () => ({
    meta: [{
      title: "Info & Promo - GWM Indonesia"
    }, {
      name: "description",
      content: "Berita terbaru dan promo spesial dari GWM Indonesia. Dapatkan informasi tentang peluncuran produk, promo penjualan, dan kegiatan GWM lainnya."
    }, {
      name: "keywords",
      content: "GWM Indonesia, promo mobil, berita otomotif, Tank 300, Tank 500, Haval H6, Haval Jolion"
    }, {
      property: "og:title",
      content: "Info & Promo - GWM Indonesia"
    }, {
      property: "og:description",
      content: "Berita terbaru dan promo spesial dari GWM Indonesia. Dapatkan informasi tentang peluncuran produk, promo penjualan, dan kegiatan GWM lainnya."
    }, {
      property: "og:url",
      content: "https://gwm.co.id/info-promo"
    }, {
      property: "og:type",
      content: "website"
    }],
    links: [{
      rel: "canonical",
      href: "https://gwm.co.id/info-promo"
    }]
  })
});
const $$splitComponentImporter$3 = () => import("./assets/admin-CWtVfKSb.js");
const Route$3 = createFileRoute("/admin")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component", () => Route$3.ssr)
});
const $$splitComponentImporter$2 = () => import("./assets/index-BAJyX_AK.js");
const Route$2 = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component", () => Route$2.ssr),
  // Add head metadata for the homepage
  head: () => ({
    title: "GWM Indonesia - Great Wall Motors | Mobil SUV Premium Terbaik",
    meta: [{
      name: "description",
      content: "Great Wall Motors Indonesia - Mobil SUV premium berkualitas tinggi dengan teknologi terkini. Haval, Tank, dan ORA tersedia di Indonesia."
    }, {
      name: "keywords",
      content: "GWM, Great Wall Motors, Haval H6, Haval Jolion, Tank 300, Tank 500, SUV Premium, Mobil Hybrid, Indonesia"
    }, {
      property: "og:title",
      content: "GWM Indonesia - Great Wall Motors | Mobil SUV Premium Terbaik"
    }, {
      property: "og:description",
      content: "Great Wall Motors Indonesia - Mobil SUV premium berkualitas tinggi dengan teknologi terkini. Haval, Tank, dan ORA tersedia di Indonesia."
    }, {
      property: "og:image",
      content: "https://gwm.kopimap.com/hero_image.webp"
    }, {
      property: "og:url",
      content: "https://gwm.co.id/"
    }, {
      property: "og:type",
      content: "website"
    }],
    links: [{
      rel: "canonical",
      href: "https://gwm.co.id/"
    }]
  })
});
const $$splitComponentImporter$1 = () => import("./assets/_type-__01TcYC.js");
const vehiclesById = {
  "tank-300": {
    id: "tank-300",
    name: "Tank 300",
    price: "Rp. 837.000.000",
    category: "suv",
    categoryDisplay: "SUV",
    description: "Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road yang luar biasa dengan kenyamanan premium di dalam kabin.",
    features: ["Mesin Turbo 2.0 T HEV (342 HP | 648 NM)", "Transmisi 8-Speed Automatic", "4WD dengan Electronic Locking Differentials", "900 mm Wading Depth", "Comfort Luxury Nappa Leather", "Auto Park", "Multi-Terrain Select", "ADAS Lvl 2"],
    imageUrl: "https://gwm.kopimap.com/tank_300.webp",
    relatedModels: ["tank-500", "haval-h6", "haval-jolion-ultra"]
    // related models by ID
  },
  "tank-500": {
    id: "tank-500",
    name: "Tank 500",
    price: "Rp. 1.208.000.000",
    category: "suv",
    categoryDisplay: "SUV",
    description: "Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang.",
    features: ["Mesin Turbo 2.0 T HEV (342 HP | 648 NM)", "Transmisi 8-Speed Automatic", "4WD dengan Electronic Locking Differentials", "900 mm Wading Depth", "Comfort Luxury Nappa Leather", "Auto Park", "Massage Seat", "ADAS Lvl 2"],
    imageUrl: "https://gwm.kopimap.com/tank_500.webp",
    relatedModels: ["tank-300", "haval-h6", "haval-jolion-ultra"]
  },
  "haval-jolion-ultra": {
    id: "haval-jolion-ultra",
    name: "Haval Jolion Ultra",
    price: "Rp. 418.000.000",
    category: "suv",
    categoryDisplay: "SUV",
    description: "Compact SUV stylish yang menggabungkan teknologi mutakhir dengan desain berkelas. Pilihan sempurna untuk mobilitas perkotaan modern.",
    features: ["Mesin 1.5 HEV (187 HP | 375 NM)", "Transmisi 7-Speed DHT", "Efisien 20 Km/liter", "Panoramic Sunroof", '10.25" Touchscreen Display', "Carplay dan Android auto", "ADAS Lvl 2", "EV Mode"],
    imageUrl: "https://gwm.kopimap.com/haval_jolion.webp",
    relatedModels: ["haval-h6", "tank-300", "tank-500"]
  },
  "haval-h6": {
    id: "haval-h6",
    name: "Haval H6",
    price: "Rp. 602.000.000",
    category: "suv",
    categoryDisplay: "SUV",
    description: "SUV premium dengan desain elegan dan performa tangguh. Dilengkapi dengan berbagai fitur keselamatan dan kenyamanan terkini.",
    features: ["Mesin Turbo 1.5 T HEV (235 HP | 530 NM)", "Transmisi 7-Speed DHT", "Panoramic Sunroof", "540° Camera View", "Auto Parking", "ADAS Lvl 2", "Advanced Safety Features", "Smart Connectivity"],
    imageUrl: "https://gwm.kopimap.com/haval_h6.jpg",
    relatedModels: ["haval-jolion-ultra", "tank-300", "tank-500"]
  }
};
const Route$1 = createFileRoute("/models/$type")({
  beforeLoad: ({
    params
  }) => {
    const {
      type
    } = params;
    if (!vehiclesById[type]) {
      throw new Error(`Invalid vehicle model: ${type}`);
    }
  },
  loader: ({
    params
  }) => {
    const {
      type
    } = params;
    const vehicle = vehiclesById[type];
    if (!vehicle) {
      throw new Error(`No vehicle found with ID: ${type}`);
    }
    const relatedVehicles = vehicle.relatedModels.map((id) => vehiclesById[id]).filter((v) => v !== void 0);
    return {
      vehicle,
      relatedVehicles
    };
  },
  head: ({
    loaderData
  }) => {
    const {
      vehicle
    } = loaderData;
    return {
      meta: [{
        title: `${vehicle.name} - Type Mobil GWM Indonesia | Great Wall Motors`
      }, {
        name: "description",
        content: `${vehicle.name} - ${vehicle.description} Dapatkan informasi lengkap mengenai spesifikasi, harga, dan fitur ${vehicle.name}.`
      }, {
        name: "keywords",
        content: `GWM, Great Wall Motors, ${vehicle.name}, ${vehicle.categoryDisplay}, Type Mobil GWM, ${vehicle.name} Indonesia, ${vehicle.name} Spesifikasi`
      }, {
        property: "og:title",
        content: `${vehicle.name} - Type Mobil GWM Indonesia | Great Wall Motors`
      }, {
        property: "og:description",
        content: `${vehicle.name} - ${vehicle.description} Dapatkan informasi lengkap mengenai spesifikasi, harga, dan fitur.`
      }, {
        property: "og:image",
        content: vehicle.imageUrl
      }, {
        property: "og:url",
        content: `https://gwm.co.id/models/${vehicle.id}`
      }, {
        property: "og:type",
        content: "website"
      }],
      links: [{
        rel: "canonical",
        href: `https://gwm.co.id/models/${vehicle.id}`
      }]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$1, "component", () => Route$1.ssr)
});
async function fetchArticles(page = 1, pageSize = 9, category, searchQuery) {
  const queryParams = new URLSearchParams({
    "pagination[page]": page.toString(),
    "pagination[pageSize]": pageSize.toString(),
    populate: "featuredImage",
    sort: "publishedAt:desc"
  });
  if (category && category !== "All") {
    queryParams.append("filters[category][$eq]", category);
  }
  if (searchQuery) {
    queryParams.append("filters[$or][0][title][$containsi]", searchQuery);
    queryParams.append("filters[$or][1][content][$containsi]", searchQuery);
  }
  const response = await fetch(
    `${STRAPI_API_URL}/api/articles?${queryParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Error fetching articles: ${response.statusText}`);
  }
  return response.json();
}
async function fetchArticleBySlug(slug) {
  const params = new URLSearchParams({
    "filters[slug][$eq]": slug,
    populate: "*"
  });
  try {
    const response = await fetch(`${STRAPI_API_URL}/api/articles?${params}`);
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    const data = await response.json();
    console.log("API response:", data);
    if (!data.data || data.data.length === 0) {
      throw new Error("Article not found");
    }
    const article = data.data[0];
    console.log("Article:", article);
    return article;
  } catch (error) {
    console.error("Error fetching article by slug:", error);
    throw error;
  }
}
async function fetchPromos(page = 1, pageSize = 4) {
  const queryParams = new URLSearchParams({
    "pagination[page]": page.toString(),
    "pagination[pageSize]": pageSize.toString(),
    populate: "promo_image",
    sort: "publishedAt:desc"
  });
  const response = await fetch(
    `${STRAPI_API_URL}/api/promos?${queryParams.toString()}`
  );
  if (!response.ok) {
    throw new Error(`Error fetching promos: ${response.statusText}`);
  }
  return response.json();
}
function getStrapiImageUrl(imageUrl) {
  if (!imageUrl) return "";
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return `${STRAPI_API_URL}${imageUrl}`;
}
const $$splitComponentImporter = () => import("./assets/_slug-Bdmc6z5S.js");
console.log("Article route file loaded");
const Route = createFileRoute("/artikel/$slug")({
  // Add a loader to fetch article data on the server
  loader: async ({
    params
  }) => {
    try {
      const article = await fetchArticleBySlug(params.slug);
      return {
        article
      };
    } catch (error) {
      console.error("Error loading article:", error);
      return {
        article: null,
        error: "Failed to load article"
      };
    }
  },
  // Use the loaded data for head metadata
  head: ({
    loaderData
  }) => {
    var _a;
    const {
      article
    } = loaderData;
    if (!article) {
      return {
        meta: [{
          title: "Article Not Found - GWM Indonesia"
        }, {
          name: "description",
          content: "The requested article could not be found."
        }]
      };
    }
    return {
      meta: [{
        title: `${article.title} - GWM Indonesia`
      }, {
        name: "description",
        content: article.excerpt || `${article.title} - Great Wall Motors Indonesia`
      }, {
        name: "keywords",
        content: `GWM, Great Wall Motors, ${article.category}, ${article.title}`
      }, {
        property: "og:title",
        content: `${article.title} - GWM Indonesia`
      }, {
        property: "og:description",
        content: article.excerpt || `${article.title} - Great Wall Motors Indonesia`
      }, {
        property: "og:image",
        content: ((_a = article.featuredImage) == null ? void 0 : _a.url) ? getStrapiImageUrl(article.featuredImage.url) : "https://gwm.kopimap.com/hero_image.webp"
      }, {
        property: "og:url",
        content: `https://gwm.co.id/artikel/${article.slug}`
      }, {
        property: "og:type",
        content: "article"
      }, {
        property: "article:published_time",
        content: article.publishedAt
      }, {
        property: "article:section",
        content: article.category || "News"
      }],
      links: [{
        rel: "canonical",
        href: `https://gwm.co.id/artikel/${article.slug}`
      }]
    };
  },
  component: lazyRouteComponent($$splitComponentImporter, "component", () => Route.ssr)
});
const TipeMobilRoute = Route$6.update({
  id: "/tipe-mobil",
  path: "/tipe-mobil",
  getParentRoute: () => Route$7
});
const KontakRoute = Route$5.update({
  id: "/kontak",
  path: "/kontak",
  getParentRoute: () => Route$7
});
const InfoPromoRoute = Route$4.update({
  id: "/info-promo",
  path: "/info-promo",
  getParentRoute: () => Route$7
});
const AdminRoute = Route$3.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$7
});
const IndexRoute = Route$2.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$7
});
const ModelsTypeRoute = Route$1.update({
  id: "/models/$type",
  path: "/models/$type",
  getParentRoute: () => Route$7
});
const ArtikelSlugRoute = Route.update({
  id: "/artikel/$slug",
  path: "/artikel/$slug",
  getParentRoute: () => Route$7
});
const rootRouteChildren = {
  IndexRoute,
  AdminRoute,
  InfoPromoRoute,
  KontakRoute,
  TipeMobilRoute,
  ArtikelSlugRoute,
  ModelsTypeRoute
};
const routeTree = Route$7._addFileChildren(rootRouteChildren)._addFileTypes();
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  // Enable view transitions by default for all route changes
  defaultViewTransition: true,
  // Keep existing scroll restoration
  scrollRestoration: true
});
async function render(url) {
  var _a;
  const memoryHistory = createMemoryHistory({
    initialEntries: [url]
  });
  router.update({
    history: memoryHistory
  });
  await router.load();
  const statusCode = router.hasNotFoundMatch() ? 404 : 200;
  const appHtml = renderToString(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(
      Suspense,
      {
        fallback: /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-screen bg-white animate-fade-in", children: /* @__PURE__ */ jsx("div", { className: "text-primary", children: /* @__PURE__ */ jsxs("div", { className: "animate-pulse flex flex-col items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" }),
          /* @__PURE__ */ jsx("p", { className: "text-lg font-medium", children: "Loading GWM Indonesia..." })
        ] }) }) }),
        children: /* @__PURE__ */ jsx(RouterProvider, { router })
      }
    ) })
  );
  let headTags = "";
  try {
    const routerState = router.state;
    const matches = (routerState == null ? void 0 : routerState.matches) || [];
    const lastMatch = matches.length > 0 ? matches[matches.length - 1] : null;
    if ((_a = lastMatch == null ? void 0 : lastMatch.route) == null ? void 0 : _a.options) {
      const headConfig = lastMatch.route.options.head;
      const loaderData = lastMatch.loaderData;
      if (typeof headConfig === "function") {
        const headResult = headConfig({ loaderData });
        if (headResult.title) {
          headTags += `<title>${headResult.title}</title>
`;
        }
        if (headResult.meta && Array.isArray(headResult.meta)) {
          for (const meta of headResult.meta) {
            if (meta.title) {
              headTags += `<title>${meta.title}</title>
`;
              continue;
            }
            const metaAttrs = Object.entries(meta).map(([key, value]) => `${key}="${value}"`).join(" ");
            headTags += `<meta ${metaAttrs}>
`;
          }
        }
        if (headResult.links && Array.isArray(headResult.links)) {
          for (const link of headResult.links) {
            const linkAttrs = Object.entries(link).map(([key, value]) => `${key}="${value}"`).join(" ");
            headTags += `<link ${linkAttrs}>
`;
          }
        }
      }
    }
    headTags += `<meta name="view-transition" content="same-origin">
`;
  } catch (error) {
    console.error("Error generating head tags:", error);
    headTags = "<title>GWM Indonesia</title>\n";
  }
  return {
    appHtml,
    headTags,
    statusCode
  };
}
export {
  Route$1 as R,
  STRAPI_API_URL as S,
  fetchPromos as a,
  Route as b,
  fetchArticleBySlug as c,
  fetchArticles as f,
  getStrapiImageUrl as g,
  render
};
