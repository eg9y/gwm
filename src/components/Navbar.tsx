import { useState, useEffect, type KeyboardEvent, useRef } from "react";
import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignInButton,
} from "@clerk/tanstack-start";

// Define vehicle models for the dropdown
const vehicleModels = [
  {
    id: "tank-300",
    name: "Tank 300",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/tank_300_nav_shot.png",
  },
  {
    id: "tank-500",
    name: "Tank 500",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/tank_500_nav_shot.png",
  },
  {
    id: "haval-jolion",
    name: "Haval Jolion Ultra",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/haval_jolion_nav_shot.png",
  },
  {
    id: "haval-h6",
    name: "Haval H6",
    category: "SUV",
    image: "https://gwm.kopimap.com/navbar/haval_h6_nav_shot.png",
  },
];

// Define pages that should start with transparent navbar
const transparentNavbarPages = ["/", "/kontak"];

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const currentPath = useRouterState({
    select: (state) => state.location.pathname,
  });
  const shouldStartTransparent = transparentNavbarPages.includes(currentPath);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(true);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownRef = useRef<HTMLLIElement | null>(null);

  // Handle body scroll locking when mobile menu is open
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

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Call once to set initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Add click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) {
        clearTimeout(dropdownTimeoutRef.current);
      }
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    // Close submenu when main menu is closed
    if (!menuOpen === false) {
      setMobileSubmenuOpen(false);
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      toggleMenu();
    }
  };

  const whatsappUrl =
    "https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20..";

  // Base style classes - enhanced for transparency
  const getNavTextColor = () => {
    if (shouldStartTransparent && !scrolled) {
      return "text-white"; // Use white text when navbar is transparent
    }
    return "text-primary"; // Default text color
  };

  const getNavTextShadow = () => {
    if (shouldStartTransparent && !scrolled) {
      return "drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"; // Add shadow when navbar is transparent
    }
    return "";
  };

  const baseNavClass = `${getNavTextColor()} ${getNavTextShadow()} text-sm font-medium transition-all duration-200 px-3 py-1.5 rounded hover:bg-black/5 flex items-center h-full`;
  const baseMobileNavClass =
    "text-primary no-underline text-base font-medium block py-2.5";
  const activeClass = "font-semibold";

  // Functions to show and hide dropdown with delay
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
    }, 150); // Small delay to prevent accidental closing
  };

  // Toggle mobile submenu
  const toggleMobileSubmenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMobileSubmenuOpen(!mobileSubmenuOpen);
  };

  const closeMenu = () => {
    // Add a small timeout to ensure the close happens after navigation starts
    setTimeout(() => {
      setMenuOpen(false);
      setMobileSubmenuOpen(false);
    }, 10);
  };

  // Get navbar background style
  const getNavbarStyle = () => {
    if (scrolled) {
      return "bg-white/95 shadow-sm";
    }

    if (!shouldStartTransparent) {
      // For pages that don't start transparent, show as solid right away
      return "bg-white/95 shadow-sm";
    }

    return "bg-transparent";
  };

  // Get logo color
  const getLogoVariant = () => {
    if (shouldStartTransparent && !scrolled) {
      //   return "/gwm_logo_white.webp"; // White logo for transparent navbar
      return "https://gwm.kopimap.com/gwm_logo.webp"; // Default colored logo
    }
    return "https://gwm.kopimap.com/gwm_logo.webp"; // Default colored logo
  };

  return (
    <nav
      className={`flex justify-between items-center px-4 sm:px-6 md:px-10 h-[60px] sm:h-[70px] w-full transition-all duration-300 ${getNavbarStyle()}`}
    >
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link to="/" className="inline-block">
          <img
            src={getLogoVariant()}
            alt="GWM Indonesia Logo"
            className="h-7 sm:h-9 m-0"
          />
        </Link>
      </div>

      {/* Center - Navigation Links */}
      <div className="hidden lg:flex justify-center">
        <ul className="flex list-none m-0 p-0 gap-6">
          <li>
            <Link
              to="/"
              className={baseNavClass}
              activeProps={{ className: `${baseNavClass} ${activeClass}` }}
            >
              Home
            </Link>
          </li>
          <li
            className="relative"
            ref={dropdownRef}
            onMouseEnter={showDropdown}
            onMouseLeave={hideDropdown}
          >
            <Link
              to="/tipe-mobil"
              className={`${baseNavClass} gap-1`}
              activeProps={{
                className: `${baseNavClass} ${activeClass} gap-1`,
              }}
            >
              Tipe Mobil
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <title>Dropdown Icon</title>
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Link>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 min-w-[280px] z-50">
                {vehicleModels.map((model) => (
                  <Link
                    key={model.id}
                    to="/tipe-mobil/$model"
                    params={{
                      model: model.id,
                    }}
                    preload="intent"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-14 h-10 object-cover rounded mr-3"
                    />
                    <div>
                      <span className="flex-1 font-medium">{model.name}</span>
                      <span className="text-xs text-gray-500 block">
                        {model.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <Link
              to="/info-promo"
              className={baseNavClass}
              activeProps={{ className: `${baseNavClass} ${activeClass}` }}
            >
              Info & Promo
            </Link>
          </li>
          <li>
            <Link
              to="/kontak"
              className={baseNavClass}
              activeProps={{ className: `${baseNavClass} ${activeClass}` }}
            >
              Kontak
            </Link>
          </li>

          {/* Admin link - only visible when signed in */}
          <SignedIn>
            <li>
              <Link
                to="/admin/kontak"
                className={baseNavClass}
                activeProps={{ className: `${baseNavClass} ${activeClass}` }}
              >
                Admin
              </Link>
            </li>
          </SignedIn>
        </ul>
      </div>

      {/* Right - WhatsApp & Order Buttons */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* SignIn/UserButton based on auth state - only show UserButton when signed in */}
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>

        {/* WhatsApp Button - Now visible on all screen sizes */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center transition-all duration-200"
          aria-label="Chat on WhatsApp"
        >
          {/* Desktop & Tablet Version - Text + Icon */}
          <div className="hidden md:flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-md shadow-sm">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              aria-hidden="true"
            >
              <title>WhatsApp Icon</title>
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
            <span className="font-medium text-sm whitespace-nowrap">
              Test Drive
            </span>
          </div>

          {/* Mobile Version - Icon Only */}
          <div
            className={`flex md:hidden items-center justify-center w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-sm ${shouldStartTransparent && !scrolled ? "border border-white/30" : ""}`}
          >
            <svg
              className="w-5 h-5"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              aria-hidden="true"
            >
              <title>WhatsApp Icon</title>
              <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
            </svg>
          </div>
        </a>

        <button
          type="button"
          className={`lg:hidden flex items-center gap-1 cursor-pointer ${
            shouldStartTransparent && !scrolled
              ? "bg-white/20 text-white border border-white/30 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              : "bg-white/20 border-0 text-primary"
          } p-1.5 px-2 font-medium text-sm rounded hover:bg-black/5`}
          onClick={toggleMenu}
          onKeyDown={handleKeyPress}
          aria-label="Toggle menu"
        >
          <span className="font-semibold">Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`fixed top-0 right-0 w-[280px] h-screen bg-white shadow-[-5px_0_15px_rgba(0,0,0,0.1)] p-[60px_20px_30px] z-[101] lg:hidden transition-transform duration-300 transform ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          className="absolute top-4 right-4 text-[28px] cursor-pointer text-primary bg-transparent border-0 p-0"
          onClick={toggleMenu}
          onKeyDown={handleKeyPress}
          aria-label="Close menu"
        >
          ×
        </button>
        <ul className="list-none p-0 m-0">
          <li className="mb-5">
            <Link
              to="/"
              className={baseMobileNavClass}
              activeProps={{
                className: `${baseMobileNavClass} ${activeClass}`,
              }}
              onClick={closeMenu}
            >
              Home
            </Link>
          </li>
          <li className="mb-5">
            <div className="flex items-center justify-between">
              <Link
                to="/tipe-mobil"
                className={baseMobileNavClass}
                activeProps={{
                  className: `${baseMobileNavClass} ${activeClass}`,
                }}
                onClick={closeMenu}
              >
                Tipe Mobil
              </Link>
              <button
                type="button"
                onClick={toggleMobileSubmenu}
                className="py-2 px-3 text-gray-500 hover:text-primary"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform duration-200 ${mobileSubmenuOpen ? "rotate-180" : ""}`}
                  aria-hidden="true"
                >
                  <title>Submenu Icon</title>
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            {mobileSubmenuOpen && (
              <div className="pl-4 mt-2 space-y-3 border-l-2 border-gray-100">
                {vehicleModels.map((model) => (
                  <Link
                    key={model.id}
                    to="/tipe-mobil/$model"
                    params={{
                      model: model.id,
                    }}
                    preload="intent"
                    className="flex items-center py-1.5 text-sm text-gray-700 hover:text-primary"
                    onClick={(e) => {
                      closeMenu();
                    }}
                  >
                    <img
                      src={model.image}
                      alt={model.name}
                      className="w-12 h-9 object-cover rounded mr-2"
                    />
                    <div>
                      <span>{model.name}</span>
                      <span className="text-xs text-gray-500 block">
                        {model.category}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li className="mb-5">
            <Link
              to="/info-promo"
              className={baseMobileNavClass}
              activeProps={{
                className: `${baseMobileNavClass} ${activeClass}`,
              }}
              onClick={closeMenu}
            >
              Info & Promo
            </Link>
          </li>
          <li className="mb-5">
            <Link
              to="/kontak"
              className={baseMobileNavClass}
              activeProps={{
                className: `${baseMobileNavClass} ${activeClass}`,
              }}
              onClick={closeMenu}
            >
              Kontak
            </Link>
          </li>

          {/* Only show admin link if signed in */}
          <SignedIn>
            <li className="mb-5">
              <Link
                to="/admin/kontak"
                className={baseMobileNavClass}
                activeProps={{
                  className: `${baseMobileNavClass} ${activeClass}`,
                }}
                onClick={closeMenu}
              >
                Admin
              </Link>
            </li>
          </SignedIn>

          {/* Sign in/out only in mobile menu - only show when signed in */}
          <SignedIn>
            <li className="mb-5 pt-3 border-t border-gray-100">
              <UserButton afterSignOutUrl="/" />
            </li>
          </SignedIn>
        </ul>
      </div>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <button
          type="button"
          onClick={toggleMenu}
          className="fixed inset-0 bg-black bg-opacity-50 z-[100] lg:hidden cursor-pointer border-0 p-0"
          aria-label="Close mobile menu"
        />
      )}
    </nav>
  );
};

export default Navbar;
