import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState, useEffect, useRef } from "react";
import { seo } from "../utils/seo";
import { submitContactForm } from "../server/contact";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Hero from "../components/Hero";

// Define the form validation schema with Zod
const contactFormSchema = z.object({
  fullName: z.string().min(1, "Nama lengkap harus diisi"),
  email: z.string().email("Format email tidak valid"),
  phoneNumber: z.string().min(1, "Nomor telepon harus diisi"),
  location: z.string().min(1, "Tempat tinggal harus dipilih"),
  carModelInterest: z.string().min(1, "Minat unit harus dipilih"),
  recaptchaToken: z.string().min(1, "Verifikasi reCAPTCHA diperlukan"),
});

// Infer the form data type from the schema
type ContactFormData = z.infer<typeof contactFormSchema>;

// Define window with recaptcha callback
declare global {
  interface Window {
    onRecaptchaLoad?: () => void;
    onRecaptchaSuccess?: (token: string) => void;
    grecaptcha?: {
      reset: () => void;
    };
  }
}

// Lazy-load the Contact component
export const Route = createFileRoute("/kontak")({
  component: ContactPage,
  head: () => ({
    meta: [
      ...seo({
        title: "Kontak GWM Indonesia - Hubungi Kami",
        description:
          "Hubungi GWM Indonesia untuk informasi produk, test drive, atau layanan purna jual. Temukan dealer terdekat dan jadwalkan kunjungan Anda.",
        keywords:
          "kontak GWM, dealer GWM, test drive GWM, layanan purna jual, Great Wall Motors Indonesia",
        image: "https://gwm.kopimap.com/kontak_banner.jpg",
      }),
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm.co.id/kontak",
      },
    ],
  }),
});

function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStatus, setFormStatus] = useState<{
    success?: boolean;
    message?: string;
  }>({});
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);

  // React Hook Form setup with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      location: "",
      carModelInterest: "",
      recaptchaToken: "",
    },
  });

  // Set up reCAPTCHA callbacks
  useEffect(() => {
    // Called when reCAPTCHA API is loaded
    window.onRecaptchaLoad = () => {
      console.log("reCAPTCHA loaded");
    };

    // Called when user completes the reCAPTCHA
    window.onRecaptchaSuccess = (token) => {
      setRecaptchaToken(token);
      setValue("recaptchaToken", token);
    };

    // Add the reCAPTCHA script
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Clean up
      try {
        document.body.removeChild(script);
        window.onRecaptchaLoad = undefined;
        window.onRecaptchaSuccess = undefined;
      } catch (error) {
        console.error("Error cleaning up reCAPTCHA:", error);
      }
    };
  }, [setValue]);

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    setFormStatus({});

    try {
      // Convert form data to FormData for the server function
      const formData = new FormData();
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
      }

      const result = await submitContactForm({ data: formData });

      setFormStatus({
        success: true,
        message: result.message || "Formulir berhasil dikirim!",
      });

      // Reset form and reCAPTCHA
      reset();
      resetRecaptcha();
      // Add a short delay to ensure DOM has updated
      setTimeout(() => {
        if (notificationRef.current) {
          notificationRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error submitting form:", error);
      setFormStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengirim formulir. Silakan coba lagi.",
      });
      // Add scroll into view for error case too with a delay
      setTimeout(() => {
        if (notificationRef.current) {
          notificationRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      }, 100);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetRecaptcha = () => {
    // Reset reCAPTCHA
    setRecaptchaToken("");
    setValue("recaptchaToken", "");
    if (window.grecaptcha) {
      window.grecaptcha.reset();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Add Hero Section with darker background */}
      <Hero
        desktopImage="https://gwm.kopimap.com/kontak.webp"
        mobileImage="https://gwm.kopimap.com/kontak.webp"
        title="Hubungi Kami"
        tagline="GWM Jakarta"
        subtitle="Diskusikan kebutuhan mobil Anda dengan tim kami yang siap membantu Anda menemukan kendaraan GWM yang sempurna"
        overlayOpacity={0.4}
        highlightColor="#CF0E0E"
        imageDarkenAmount={50}
      />

      <main className="py-16 px-4 md:px-8 max-w-7xl mx-auto -mt-16 relative z-10">
        <section className="mb-16">
          <h1 className="text-3xl md:text-4xl font-medium text-primary mb-6">
            Kontak GWM Jakarta
          </h1>
          <p className="text-base text-secondary max-w-3xl mb-10 leading-relaxed">
            GWM, merek otomotif global yang inovatif, resmi hadir di Jakarta
            dengan membawa semangat baru dalam industri otomotif Indonesia.
            Dengan desain yang modern, performa tangguh, dan teknologi terkini,
            GWM siap memenuhi kebutuhan konsumen Indonesia. Dealer Resmi GWM
            Jakarta hadir untuk memberikan pengalaman berkendara yang tak
            terlupakan dan menjadi pilihan utama bagi para pecinta otomotif.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
              <h2 className="text-xl font-medium text-primary mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 mr-2 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Information Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Informasi Kontak
              </h2>

              <div className="space-y-6">
                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-1 mr-3 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Location Pin Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Lokasi
                    </h3>
                    <p className="text-secondary">
                      GWM Jakarta – Indonesia
                      <br />
                      Agora Mall Thamrin
                      <br />
                      Jl. M.H. Thamrin No.10, Kb. Melati, Tanah Abang, Jakarta
                      Pusat, DKI Jakarta 10230
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-1 mr-3 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Phone Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Telepon
                    </h3>
                    <a
                      href="tel:+6287774377422"
                      className="text-secondary hover:text-red-500 transition-colors flex items-center"
                    >
                      0877 7437 7422 (Call/WA)
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-1 mr-3 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Email Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Email
                    </h3>
                    <a
                      href="mailto:ramarkan.pratama@inchcape.co.id"
                      className="text-secondary hover:text-red-500 transition-colors"
                    >
                      ramarkan.pratama@inchcape.co.id
                    </a>
                  </div>
                </div>

                <div className="flex items-start">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mt-1 mr-3 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Clock Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-lg font-medium text-primary mb-2">
                      Jam Buka
                    </h3>
                    <ul className="text-secondary space-y-1">
                      <li className="flex justify-between">
                        <span>Senin</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Selasa</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Rabu</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Kamis</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Jumat</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Sabtu</span>
                        <span>9am – 9pm</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Minggu</span>
                        <span>9am – 9pm</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="mt-8 space-y-3">
                <a
                  href="tel:+6287774377422"
                  className="flex items-center justify-center w-full py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all transform hover:-translate-y-0.5 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Call Button Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Hubungi Sekarang
                </a>
                <a
                  href="https://wa.me/6287774377422"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all transform hover:-translate-y-0.5 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>WhatsApp Button Icon</title>
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                  Chat WhatsApp
                </a>
                <a
                  href="https://www.google.com/maps/dir//AGORA+Mall,+Jalan+M.H.+Thamrin,+Kebon+Melati,+Central+Jakarta+City,+Jakarta,+Indonesia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all transform hover:-translate-y-0.5 shadow-sm"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <title>Directions Icon</title>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Petunjuk Arah
                </a>
              </div>
            </div>

            <div className="h-[400px] md:h-auto rounded-xl overflow-hidden shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
              <Suspense
                fallback={
                  <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center">
                    <svg
                      className="animate-spin h-8 w-8 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <title>Loading Spinner</title>
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  </div>
                }
              >
                <iframe
                  src="https://www.google.com/maps/embed/v1/place?q=AGORA+Mall,+Jalan+M.H.+Thamrin,+Kebon+Melati,+Central+Jakarta+City,+Jakarta,+Indonesia&key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="GWM Jakarta Location"
                  className="w-full h-full min-h-[400px]"
                />
              </Suspense>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-medium text-primary mb-4">
              Formulir Kontak
            </h2>
            <p className="text-secondary max-w-xl mx-auto">
              Tertarik dengan mobil GWM? Isi formulir di bawah ini dan kami akan
              segera menghubungi Anda untuk mengatur test drive atau memberikan
              informasi lebih lanjut.
            </p>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
            {/* Form Benefits */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <title>Benefits Icon</title>
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Dapatkan keuntungan eksklusif:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Jadwal test drive prioritas</li>
                      <li>Konsultasi harga dan pembiayaan khusus</li>
                      <li>Info promo terbaru langsung ke email Anda</li>
                      <li>Penawaran khusus untuk pemesanan melalui website</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <form
              className="grid md:grid-cols-2 gap-6"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-2">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-primary"
                >
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>User Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="fullName"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors ${
                      errors.fullName
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Masukkan nama lengkap"
                    {...register("fullName")}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.fullName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-primary"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Email Icon</title>
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors ${
                      errors.email
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Masukkan alamat email"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="phoneNumber"
                  className="block text-sm font-medium text-primary"
                >
                  Nomor Telepon <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Phone Icon</title>
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.948.684l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors ${
                      errors.phoneNumber
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    placeholder="Masukkan nomor telepon"
                    {...register("phoneNumber")}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-primary"
                >
                  Tempat Tinggal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Location Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <select
                    id="location"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors ${
                      errors.location
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    {...register("location")}
                  >
                    <option value="">Pilih kota</option>
                    <option value="Jakarta">Jakarta</option>
                    <option value="Surabaya">Surabaya</option>
                    <option value="Bandung">Bandung</option>
                    <option value="Bali">Bali</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Dropdown Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {errors.location && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.location.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label
                  htmlFor="carModelInterest"
                  className="block text-sm font-medium text-primary"
                >
                  Minat Unit <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Car Icon</title>
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h3a1 1 0 001-1v-3a1 1 0 00-.7-.7l-3.3-1.1V7h1a1 1 0 001-1V5a1 1 0 00-1-1H3zM2 5a2 2 0 012-2h9a2 2 0 012 2v1a2 2 0 01-2 2h-1v1.38l3.3 1.1A2 2 0 0116 10.5v3a2 2 0 01-2 2h-3v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
                    </svg>
                  </div>
                  <select
                    id="carModelInterest"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 transition-colors ${
                      errors.carModelInterest
                        ? "border-red-500 bg-red-50"
                        : "border-gray-300"
                    }`}
                    {...register("carModelInterest")}
                  >
                    <option value="">Pilih model</option>
                    <option value="Haval">Haval</option>
                    <option value="Tank">Tank</option>
                    <option value="Ora">Ora</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <svg
                      className="w-5 h-5"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <title>Dropdown Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                {errors.carModelInterest && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.carModelInterest.message}
                  </p>
                )}
              </div>

              <div className="md:col-span-2 mt-4">
                {/* reCAPTCHA */}
                <div className="mb-6 flex justify-center">
                  <div
                    className="g-recaptcha"
                    data-sitekey="6LcVRf0qAAAAADuDcfd1Stg2VyLc88m_WkqqMXup"
                    data-callback="onRecaptchaSuccess"
                  />
                </div>
                {errors.recaptchaToken && (
                  <p className="text-red-500 text-xs mt-1 flex items-center justify-center mb-4">
                    <svg
                      className="h-3 w-3 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <title>Form Error Icon</title>
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {errors.recaptchaToken.message}
                  </p>
                )}

                {/* Privacy note */}
                <p className="text-xs text-gray-500 mb-4">
                  Dengan mengirimkan formulir ini, Anda menyetujui bahwa data
                  Anda akan diproses sesuai dengan kebijakan privasi kami. Kami
                  tidak akan membagikan informasi Anda kepada pihak ketiga tanpa
                  persetujuan Anda.
                </p>
                <button
                  type="submit"
                  className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/30 disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform transition-transform hover:-translate-y-0.5 active:translate-y-0 w-full text-lg font-medium"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <title>Button Loading Spinner</title>
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Mengirim...
                    </span>
                  ) : (
                    <>
                      <span className="flex items-center justify-center">
                        Kirim Permintaan
                        <svg
                          className="ml-2 h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <title>Submit Arrow</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                          />
                        </svg>
                      </span>
                    </>
                  )}
                </button>

                {/* Notification area with ref for scrolling */}
                <div ref={notificationRef} className="mt-4 scroll-mt-6">
                  {formStatus.success ? (
                    <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-5 rounded-lg animate-notification shadow-md">
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-green-500 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <title>Success Icon</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <p className="font-medium text-base">
                          {formStatus.message}
                        </p>
                      </div>
                    </div>
                  ) : formStatus.message ? (
                    <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-5 rounded-lg animate-notification shadow-md">
                      <div className="flex items-center">
                        <svg
                          className="h-6 w-6 text-red-500 mr-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <title>Error Icon</title>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <p className="font-medium text-base">
                          {formStatus.message}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </form>
          </div>
        </section>

        {/* Add animated trust indicators */}
        <section className="mt-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="text-red-500 mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Quality Badge Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-primary">Kualitas Premium</h3>
              <p className="text-xs text-secondary mt-1">
                Teknologi dan kualitas terbaik untuk pengalaman berkendara
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="text-red-500 mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Service Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-primary">Layanan Prima</h3>
              <p className="text-xs text-secondary mt-1">
                Tim profesional kami siap memberikan pelayanan terbaik
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="text-red-500 mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Warranty Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-primary">Garansi Panjang</h3>
              <p className="text-xs text-secondary mt-1">
                Perlindungan kendaraan dengan garansi pabrik hingga 5 tahun
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 text-center shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md hover:-translate-y-1">
              <div className="text-red-500 mx-auto mb-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <title>Support Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <h3 className="font-medium text-primary">Layanan 24/7</h3>
              <p className="text-xs text-secondary mt-1">
                Dukungan purna jual dan bantuan darurat 24 jam sehari
              </p>
            </div>
          </div>
        </section>

        {/* Customer Testimonials Section */}
        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-medium text-primary mb-4">
              Apa Kata Pelanggan Kami
            </h2>
            <p className="text-secondary max-w-xl mx-auto">
              Lihat pengalaman pelanggan yang telah membeli dan menggunakan
              kendaraan GWM
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl mr-4">
                  AB
                </div>
                <div>
                  <h4 className="font-medium text-primary">Andi Budiman</h4>
                  <p className="text-xs text-secondary">Pemilik GWM Haval</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-secondary italic">
                "Saya sangat puas dengan Haval saya. Fitur keselamatan dan
                kenyamanannya luar biasa, dan konsumsi bahan bakarnya juga
                hemat. Layanan purna jual GWM juga sangat membantu."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl mr-4">
                  RS
                </div>
                <div>
                  <h4 className="font-medium text-primary">Ratna Sari</h4>
                  <p className="text-xs text-secondary">Pemilik GWM Tank</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-secondary italic">
                "Tank 300 adalah SUV yang tangguh namun tetap nyaman. Saya
                sering menggunakannya untuk bepergian ke luar kota dan
                performanya tidak pernah mengecewakan. Tim sales GWM juga sangat
                informatif."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transform transition-all duration-300 hover:shadow-md">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xl mr-4">
                  DW
                </div>
                <div>
                  <h4 className="font-medium text-primary">Denny Wijaya</h4>
                  <p className="text-xs text-secondary">Pemilik GWM Ora</p>
                </div>
              </div>
              <div className="flex text-yellow-400 mb-3">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <title>Star Rating</title>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <p className="text-secondary italic">
                "Mobil listrik Ora sangat menghemat biaya operasional saya.
                Pengisian daya cepat dan jangkauan baterai yang luar biasa.
                Pilihan terbaik untuk mobilitas ramah lingkungan di kota."
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-8">
            <a
              href="https://wa.me/6287774377422?text=Halo,%20saya%20tertarik%20dengan%20mobil%20GWM.%20Bisa%20bantu%20informasi%20lebih%20lanjut?"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 bg-red-600 text-white font-medium rounded-lg shadow-md hover:bg-red-700 transition-all transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-red-500/30"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <title>WhatsApp Icon</title>
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              Hubungi Kami Sekarang
            </a>
          </div>
        </section>
      </main>

      {/* Add custom animation styles */}
      <style>{`
        @keyframes fadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-notification {
          animation: fadeIn 0.5s ease-in-out forwards, pulse 2s ease-in-out 0.5s;
        }
      `}</style>

      {/* Remove WhatsApp button and Footer since they're already in App component */}
      {/* <WhatsAppButton /> */}
      {/* <Footer /> */}
    </div>
  );
}
