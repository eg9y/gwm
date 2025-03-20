import { useState, useEffect, type KeyboardEvent, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
// import gwmLogo from "../assets/gwm_logo.webp";
// import tank300NavShot from "../assets/navbar/tank_300_nav_shot.png";
// import tank500NavShot from "../assets/navbar/tank_500_nav_shot.png";
// import havalH6NavShot from "../assets/navbar/haval_h6_nav_shot.png";
// import havalJolionNavShot from "../assets/navbar/haval_jolion_nav_shot.png";

// Define vehicle models for the dropdown
const vehicleModels = [
  { id: "tank-300", name: "Tank 300", category: "SUV" },
  { id: "tank-500", name: "Tank 500", category: "SUV" },
  { id: "haval-jolion-ultra", name: "Haval Jolion Ultra", category: "SUV" },
  { id: "haval-h6", name: "Haval H6", category: "SUV" },
];

// Add a new ClientOnly wrapper component
function ClientOnly({ children, fallback = null }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return isClient ? children : fallback;
}

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = router.state.location.pathname === "/";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);
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

  // Check if a path is active
  const isActive = (path: string) => {
    return router.state.location.pathname === path;
  };

  // Base style classes
  const baseNavClass =
    "text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded hover:bg-black/5";
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

  return (
    <nav
      className={`flex justify-between items-center px-4 sm:px-6 md:px-10 h-[60px] sm:h-[70px] w-full transition-all duration-300 ${
        scrolled || !isHomePage ? "bg-white/95 shadow-sm" : "bg-transparent"
      }`}
    >
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link to="/" className="inline-block">
          <img
            src="https://gwm.kopimap.com/gwm_logo.webp"
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
              className={`${baseNavClass} ${isActive("/") ? activeClass : ""}`}
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
              className={`${baseNavClass} ${isActive("/models") ? activeClass : ""} flex items-center gap-1`}
            >
              Type Mobil
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
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Link>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 min-w-[240px] z-50">
                {vehicleModels.map((model) => (
                  <Link
                    key={model.id}
                    to="/models/$type"
                    params={{
                      type: model.id,
                    }}
                    preload="intent"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <span className="flex-1">{model.name}</span>
                    <span className="text-xs text-gray-500">
                      {model.category}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li>
            <Link
              to="/info-promo"
              className={`${baseNavClass} ${isActive("/info-promo") ? activeClass : ""}`}
            >
              Info & Promo
            </Link>
          </li>
          <li>
            <Link
              to="/kontak"
              className={`${baseNavClass} ${
                isActive("/kontak") ? activeClass : ""
              }`}
            >
              Kontak
            </Link>
          </li>
        </ul>
      </div>

      {/* Right - WhatsApp & Order Buttons */}
      <div className="flex items-center gap-2 sm:gap-4">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden lg:flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
          aria-label="Chat on WhatsApp"
        >
          <span className="sr-only">Chat with GWM Indonesia on WhatsApp</span>
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
          <span className="font-medium text-sm">WhatsApp</span>
        </a>
        {/* Mobile WhatsApp Button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex lg:hidden items-center justify-center w-9 h-9 text-green-600 hover:text-green-700 transition-colors"
          aria-label="Chat on WhatsApp"
        >
          <span className="sr-only">Chat with GWM Indonesia on WhatsApp</span>
          <svg
            className="w-6 h-6"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            aria-hidden="true"
          >
            <title>WhatsApp Icon</title>
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </a>

        <button
          type="button"
          className="lg:hidden flex items-center gap-1 cursor-pointer bg-white/20 border-0 p-1.5 px-2 text-primary font-medium text-sm rounded hover:bg-black/5"
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
              className={`${baseMobileNavClass} ${
                isActive("/") ? activeClass : ""
              }`}
              onClick={closeMenu}
            >
              Home
            </Link>
          </li>
          <li className="mb-5">
            <div className="flex items-center justify-between">
              <Link
                to="/tipe-mobil"
                className={`${baseMobileNavClass} ${isActive("/tipe-mobil") ? activeClass : ""}`}
                onClick={closeMenu}
              >
                Type Mobil
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
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
            </div>
            {mobileSubmenuOpen && (
              <div className="pl-4 mt-2 space-y-2 border-l-2 border-gray-100">
                {vehicleModels.map((model) => (
                  <Link
                    key={model.id}
                    to="/models/$type"
                    params={{
                      type: model.id,
                    }}
                    preload="intent"
                    className="block py-1.5 text-sm text-gray-700 hover:text-primary"
                    onClick={(e) => {
                      closeMenu();
                    }}
                  >
                    {model.name}{" "}
                    <span className="text-xs text-gray-500">
                      ({model.category})
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </li>
          <li className="mb-5">
            <Link
              to="/info-promo"
              className={`${baseMobileNavClass} ${isActive("/info-promo") ? activeClass : ""}`}
              onClick={closeMenu}
            >
              Info & Promo
            </Link>
          </li>
          <li className="mb-5">
            <Link
              to="/kontak"
              className={`${baseMobileNavClass} ${
                isActive("/kontak") ? activeClass : ""
              }`}
              onClick={closeMenu}
            >
              Kontak
            </Link>
          </li>
          <li className="mb-5">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary no-underline text-base font-medium block py-2.5 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5 text-green-600"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 448 512"
                aria-hidden="true"
              >
                <title>WhatsApp Icon</title>
                <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
              </svg>
              WhatsApp
            </a>
          </li>
          <li>
            <a
              href="/pesan"
              className="mt-5 py-2.5 bg-primary/80 text-white text-center rounded block hover:bg-primary transition-colors"
            >
              Pesan Sekarang
            </a>
          </li>
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
