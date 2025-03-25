import type { KeyboardEvent } from "react";
import { useEffect, useState } from "react";
import { getContactInfo } from "../server/contact-info";
import type { ContactInfo } from "../db";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch contact info
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const info = await getContactInfo();
        setContactInfo(info);
      } catch (error) {
        console.error("Error fetching contact info:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContactInfo();
  }, []);

  const handleKeyPress = (
    event: KeyboardEvent<HTMLButtonElement>,
    url: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <footer
      className="bg-white py-8 sm:py-10 text-primary border-t border-gray-100"
      id="contact"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-10">
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-10">
          <div className="col-span-1">
            <h3 className="text-sm font-medium mb-2 sm:mb-3">GWM Indonesia</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a
                  href="/tentang-kami"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Tentang Kami
                </a>
              </li>
              <li>
                <a
                  href="/berita"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Berita
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-medium mb-2 sm:mb-3">Tipe Mobil</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a
                  href="/tipe-mobil/suv"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  SUV
                </a>
              </li>
              <li>
                <a
                  href="/tipe-mobil/pickup"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Pickup
                </a>
              </li>
              <li>
                <a
                  href="/tipe-mobil/electric"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Electric
                </a>
              </li>
              <li>
                <a
                  href="/tipe-mobil/hybrid"
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  Hybrid
                </a>
              </li>
            </ul>
          </div>

          <div className="col-span-1">
            <h3 className="text-sm font-medium mb-2 sm:mb-3">Kontak</h3>
            <ul className="space-y-1 sm:space-y-2">
              <li>
                <a
                  href={`tel:${contactInfo?.phone || "+6287774377422"}`}
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  {contactInfo?.phone || "+62 877 7437 7422"}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contactInfo?.email || "info@gwmindonesia.co.id"}`}
                  className="text-gray-500 hover:text-primary text-xs transition"
                >
                  {contactInfo?.email || "info@gwmindonesia.co.id"}
                </a>
              </li>
              <li className="text-gray-500 text-xs">
                {contactInfo?.address ||
                  "Jl. Gatot Subroto Kav. 36-38, Jakarta Selatan"}
              </li>
            </ul>
            <div className="flex gap-4 mt-5">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    contactInfo?.facebook || "https://facebook.com",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                onKeyDown={(e) =>
                  handleKeyPress(
                    e,
                    contactInfo?.facebook || "https://facebook.com"
                  )
                }
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors"
                aria-label="Kunjungi Facebook GWM Indonesia"
              >
                <i className="fab fa-facebook-f text-sm" />
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    contactInfo?.instagram || "https://instagram.com/indo.tank",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                onKeyDown={(e) =>
                  handleKeyPress(
                    e,
                    contactInfo?.instagram || "https://instagram.com/indo.tank"
                  )
                }
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors"
                aria-label="Kunjungi Instagram GWM Indonesia"
              >
                <i className="fab fa-instagram text-sm" />
              </button>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    contactInfo?.x || "https://twitter.com",
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                onKeyDown={(e) =>
                  handleKeyPress(e, contactInfo?.x || "https://twitter.com")
                }
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-primary transition-colors"
                aria-label="Kunjungi Twitter GWM Indonesia"
              >
                <i className="fab fa-twitter text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 pt-5 border-t border-gray-100 px-10">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-xs text-gray-400 order-2 md:order-1">
            © {currentYear} GWM Indonesia. All rights reserved.
          </p>

          <div className="flex space-x-3 items-center order-1 md:order-2">
            <span className="text-xs text-gray-400 mr-2">Follow Us</span>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Facebook"
              onClick={() =>
                window.open(
                  contactInfo?.facebook || "https://facebook.com/gwmindonesia",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              onKeyDown={(e) =>
                handleKeyPress(
                  e,
                  contactInfo?.facebook || "https://facebook.com/gwmindonesia"
                )
              }
            >
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12.5 2C6.71484 2 2 6.71484 2 12.5C2 17.7461 5.75781 22.0664 10.7148 22.8711V15.5977H8.04688V12.5H10.7148V10.1562C10.7148 7.46484 12.2188 5.99219 14.6484 5.99219C15.8164 5.99219 17.0547 6.1875 17.0547 6.1875V8.69531H15.7773C14.5 8.69531 14.0742 9.50781 14.0742 10.3438V12.5H16.9453L16.457 15.5977H14.0742V22.8711C19.0312 22.0664 22.7891 17.7461 22.7891 12.5C22.7891 6.71484 18.2852 2 12.5 2Z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="Instagram"
              onClick={() =>
                window.open(
                  contactInfo?.instagram || "https://instagram.com/indo.tank",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              onKeyDown={(e) =>
                handleKeyPress(
                  e,
                  contactInfo?.instagram || "https://instagram.com/indo.tank"
                )
              }
            >
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12.5 2C9.51562 2 9.12891 2.01562 8.02734 2.05469C6.92969 2.09375 6.15234 2.28125 5.46875 2.53125C4.78125 2.78125 4.17969 3.12891 3.58594 3.72266C2.98828 4.31641 2.64062 4.91797 2.39062 5.60547C2.14062 6.28516 1.95312 7.0625 1.91406 8.16016C1.875 9.26172 1.85938 9.64844 1.85938 12.6328C1.85938 15.6172 1.875 16.0039 1.91406 17.1055C1.95312 18.2031 2.14062 18.9805 2.39062 19.6602C2.64062 20.3477 2.98828 20.9492 3.58594 21.543C4.17969 22.1367 4.78125 22.4844 5.46875 22.7344C6.14844 22.9844 6.92578 23.1719 8.02734 23.2109C9.12891 23.25 9.51562 23.2656 12.5 23.2656C15.4844 23.2656 15.8711 23.25 16.9727 23.2109C18.0742 23.1719 18.8516 22.9844 19.5312 22.7344C20.2188 22.4844 20.8203 22.1367 21.4141 21.543C22.0078 20.9492 22.3555 20.3477 22.6055 19.6602C22.8555 18.9805 23.043 18.2031 23.082 17.1055C23.1211 16.0039 23.1367 15.6172 23.1367 12.6328C23.1367 9.64844 23.1211 9.26172 23.082 8.16016C23.043 7.05859 22.8555 6.28516 22.6055 5.60547C22.3555 4.91797 22.0078 4.31641 21.4141 3.72266C20.8203 3.12891 20.2188 2.78125 19.5312 2.53125C18.8516 2.28125 18.0742 2.09375 16.9727 2.05469C15.8711 2.01562 15.4844 2 12.5 2ZM12.5 4.14062C15.4375 4.14062 15.7852 4.15625 16.8711 4.19531C17.8516 4.23438 18.4336 4.41406 18.8125 4.57422C19.3125 4.78125 19.6602 5.02344 20.0352 5.39844C20.4102 5.77344 20.6523 6.12109 20.8594 6.62109C21.0156 7 21.1992 7.58203 21.2383 8.5625C21.2773 9.64844 21.293 9.99609 21.293 12.9336C21.293 15.8711 21.2773 16.2188 21.2383 17.3047C21.1992 18.2852 21.0156 18.8672 20.8594 19.2461C20.6523 19.7461 20.4102 20.0938 20.0352 20.4688C19.6602 20.8438 19.3125 21.0859 18.8125 21.293C18.4336 21.4492 17.8516 21.6328 16.8711 21.6719C15.7852 21.7109 15.4375 21.7266 12.5 21.7266C9.5625 21.7266 9.21484 21.7109 8.12891 21.6719C7.14844 21.6328 6.56641 21.4492 6.1875 21.293C5.6875 21.0859 5.33984 20.8438 4.96484 20.4688C4.58984 20.0938 4.34766 19.7461 4.14453 19.2461C3.98438 18.8672 3.79688 18.2852 3.76172 17.3047C3.72266 16.2188 3.70703 15.8711 3.70703 12.9336C3.70703 9.99609 3.72266 9.64844 3.76172 8.5625C3.80078 7.58203 3.98438 7 4.14453 6.62109C4.34766 6.12109 4.58984 5.77344 4.96484 5.39844C5.33984 5.02344 5.6875 4.78125 6.1875 4.57422C6.56641 4.41406 7.14844 4.23438 8.12891 4.19531C9.21484 4.15625 9.5625 4.14062 12.5 4.14062Z M12.5 7.09375C9.44922 7.09375 6.96094 9.58203 6.96094 12.6328C6.96094 15.6836 9.44922 18.1719 12.5 18.1719C15.5508 18.1719 18.0391 15.6836 18.0391 12.6328C18.0391 9.58203 15.5508 7.09375 12.5 7.09375ZM12.5 16.0312C10.6289 16.0312 9.10156 14.5039 9.10156 12.6328C9.10156 10.7617 10.6289 9.23438 12.5 9.23438C14.3711 9.23438 15.8984 10.7617 15.8984 12.6328C15.8984 14.5039 14.3711 16.0312 12.5 16.0312Z M19.5312 6.875C19.5312 7.60547 18.9375 8.19922 18.207 8.19922C17.4766 8.19922 16.8828 7.60547 16.8828 6.875C16.8828 6.14453 17.4766 5.55078 18.207 5.55078C18.9375 5.55078 19.5312 6.14453 19.5312 6.875Z" />
              </svg>
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="YouTube"
              onClick={() =>
                window.open(
                  contactInfo?.youtube || "https://youtube.com/gwmindonesia",
                  "_blank",
                  "noopener,noreferrer"
                )
              }
              onKeyDown={(e) =>
                handleKeyPress(
                  e,
                  contactInfo?.youtube || "https://youtube.com/gwmindonesia"
                )
              }
            >
              <svg
                className="w-4 h-4 text-primary"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M22.9396 6.69571C22.6685 5.7846 22.0608 5.05792 21.2669 4.74901C19.8743 4.2005 12.5 4.2005 12.5 4.2005C12.5 4.2005 5.12573 4.2005 3.73315 4.74901C2.93921 5.05792 2.33151 5.7846 2.06044 6.69571C1.5 8.33314 1.5 12.1 1.5 12.1C1.5 12.1 1.5 15.8669 2.06044 17.5043C2.33151 18.4154 2.93921 19.1421 3.73315 19.451C5.12573 19.9995 12.5 19.9995 12.5 19.9995C12.5 19.9995 19.8743 19.9995 21.2669 19.451C22.0608 19.1421 22.6685 18.4154 22.9396 17.5043C23.5 15.8669 23.5 12.1 23.5 12.1C23.5 12.1 23.5 8.33314 22.9396 6.69571ZM10.3023 15.2999V8.90015L16.1991
                    12.1L10.3023 15.2999Z"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-4 md:mt-6 text-center md:text-left">
          <ul className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
            <li>
              <a
                href="/privacy-policy"
                className="text-xs text-gray-400 hover:text-primary transition"
              >
                Privacy Policy
              </a>
            </li>
            <li>
              <a
                href="/terms"
                className="text-xs text-gray-400 hover:text-primary transition"
              >
                Terms of Service
              </a>
            </li>
            <li>
              <a
                href="/cookie-policy"
                className="text-xs text-gray-400 hover:text-primary transition"
              >
                Cookie Policy
              </a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
