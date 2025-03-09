import { useState, useEffect, type KeyboardEvent, useRef } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import gwmLogo from "../assets/gwm_logo.webp";
import tank300NavShot from "../assets/navbar/tank_300_nav_shot.png";
import tank500NavShot from "../assets/navbar/tank_500_nav_shot.png";
import havalH6NavShot from "../assets/navbar/haval_h6_nav_shot.png";
import havalJolionNavShot from "../assets/navbar/haval_jolion_nav_shot.png";

const Navbar = () => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isHomePage = router.state.location.pathname === "/";
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      toggleMenu();
    }
  };

  const whatsappUrl =
    "https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20..";

  // Close mobile menu when navigating
  const handleNavigation = (path: string) => {
    if (menuOpen) {
      toggleMenu();
    }

    // Explicitly navigate using the router instead of relying on Link component
    if (path) {
      router.navigate({ to: path });
      // Reset scroll position
      window.scrollTo(0, 0);
    }
  };

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

  return (
    <nav
      className={`flex justify-between items-center px-4 sm:px-6 md:px-10 h-[60px] sm:h-[70px] fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || !isHomePage ? "bg-white/95 shadow-sm" : "bg-transparent"
      }`}
    >
      {/* Left - Logo */}
      <div className="flex items-center">
        <Link
          to="/"
          className="inline-block"
          onClick={(e) => {
            e.preventDefault();
            handleNavigation("/");
          }}
        >
          <img
            src={gwmLogo}
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
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/");
              }}
            >
              Home
            </Link>
          </li>
          <li className="relative">
            <a
              href="#tipe-mobil"
              className="text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded hover:bg-black/5"
              onMouseEnter={showDropdown}
              onMouseLeave={hideDropdown}
            >
              Tipe Mobil
            </a>
            <div
              className={`absolute left-0 right-0 mt-1 bg-white shadow-lg rounded-md z-10 transition-all duration-300 ease-in-out ${
                dropdownOpen
                  ? "opacity-100 visible transform-none"
                  : "opacity-0 invisible translate-y-2 pointer-events-none"
              }`}
              style={{
                width: "100vw",
                position: "fixed",
                left: 0,
                top: "70px",
              }}
              onMouseEnter={showDropdown}
              onMouseLeave={hideDropdown}
            >
              <div className="max-w-7xl mx-auto px-4">
                <ul className="grid grid-cols-4 gap-2 py-8 max-w-3xl mx-auto">
                  <li className="flex flex-col items-center gap-3 transform transition-all duration-300 hover:scale-105">
                    <div className="h-24 flex items-center justify-center">
                      <img
                        src={tank300NavShot}
                        alt="Tank 300"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <span className="text-primary font-medium">Tank 300</span>
                  </li>
                  <li className="flex flex-col items-center gap-3 transform transition-all duration-300 hover:scale-105">
                    <div className="h-24 flex items-center justify-center">
                      <img
                        src={tank500NavShot}
                        alt="Tank 500"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <span className="text-primary font-medium">Tank 500</span>
                  </li>
                  <li className="flex flex-col items-center gap-3 transform transition-all duration-300 hover:scale-105">
                    <div className="h-24 flex items-center justify-center">
                      <img
                        src={havalJolionNavShot}
                        alt="Haval Jolion"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <span className="text-primary font-medium">
                      Haval Jolion
                    </span>
                  </li>
                  <li className="flex flex-col items-center gap-3 transform transition-all duration-300 hover:scale-105">
                    <div className="h-24 flex items-center justify-center">
                      <img
                        src={havalH6NavShot}
                        alt="Haval H6"
                        className="max-h-full w-auto object-contain"
                      />
                    </div>
                    <span className="text-primary font-medium">Haval H6</span>
                  </li>
                </ul>
              </div>
            </div>
          </li>
          <li>
            <a
              href="/info-promo"
              className="text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 rounded hover:bg-black/5"
            >
              Info & Promo
            </a>
          </li>
          <li>
            <Link
              to="/kontak"
              className={`${baseNavClass} ${
                isActive("/kontak") ? activeClass : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/kontak");
              }}
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
          className="lg:hidden flex items-center justify-center w-9 h-9 text-green-600 hover:text-green-700 transition-colors"
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
          className="lg:hidden cursor-pointer w-[30px] h-[30px] relative bg-transparent border-0 p-0"
          onClick={toggleMenu}
          onKeyDown={handleKeyPress}
          aria-label="Toggle menu"
        >
          <span
            className={`absolute w-[22px] h-[2px] bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              menuOpen ? "rotate-45" : ""
            }`}
          />
          <span
            className={`absolute w-[22px] h-[2px] bg-primary top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-300 before:content-[''] before:absolute before:w-[22px] before:h-[2px] before:bg-primary before:transition-all before:duration-300 before:-top-[6px] after:content-[''] after:absolute after:w-[22px] after:h-[2px] after:bg-primary after:transition-all after:duration-300 after:top-[6px] ${
              menuOpen ? "before:opacity-0 after:rotate-90 after:top-0" : ""
            }`}
          />
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
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/");
              }}
            >
              Home
            </Link>
          </li>
          <li className="mb-5">
            <a
              href="/tipe-mobil"
              className="text-primary no-underline text-base font-medium block py-2.5"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/tipe-mobil");
              }}
            >
              Tipe Mobil
            </a>
          </li>
          <li className="mb-5">
            <a
              href="/info-promo"
              className="text-primary no-underline text-base font-medium block py-2.5"
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/info-promo");
              }}
            >
              Info & Promo
            </a>
          </li>
          <li className="mb-5">
            <Link
              to="/kontak"
              className={`${baseMobileNavClass} ${
                isActive("/kontak") ? activeClass : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                handleNavigation("/kontak");
              }}
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
