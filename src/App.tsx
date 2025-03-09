import { useEffect, useState, Suspense, useRef } from "react";
import { Outlet, useRouter, Link } from "@tanstack/react-router";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import ModelShowcase from "./components/ModelShowcase";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

// Import images
import havalH6Image from "./assets/haval_h6.jpg";
import havalJolionImage from "./assets/haval_jolion.jpg";
import tank300Image from "./assets/tank_300.jpg";
import tank500Image from "./assets/tank_500.jpg";

// Define section names for better accessibility and keys
const sections = [
  { id: "hero", name: "Home" },
  { id: "haval-h6", name: "Haval H6" },
  { id: "haval-jolion", name: "Haval Jolion" },
  { id: "tank-300", name: "Tank 300" },
  { id: "tank-500", name: "Tank 500" },
  { id: "contact", name: "Contact" },
];

function App() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = sections.length;
  const currentRoute = router.state.location.pathname;
  const isHomePage = currentRoute === "/";
  const prevRoute = useRef(currentRoute);

  // Reset scroll position on route change
  useEffect(() => {
    if (prevRoute.current !== currentRoute) {
      window.scrollTo(0, 0);
      prevRoute.current = currentRoute;
    }
  }, [currentRoute]);

  // Handle scroll event for sections - only on home page
  useEffect(() => {
    if (!isHomePage) return;

    const handleScroll = () => {
      // Calculate current section based on scroll position
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

  const scrollToSection = (sectionIndex: number) => {
    // For mobile, make sure we're not using a fixed height calculation
    const sectionElement = document.getElementById(sections[sectionIndex].id);
    if (sectionElement) {
      sectionElement.scrollIntoView({ behavior: "smooth" });
    } else {
      // Fallback to height-based scrolling if element not found
      window.scrollTo({
        top: sectionIndex * window.innerHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <Navbar />

      {isHomePage ? (
        // Home Page Content
        <div className="snap-y snap-mandatory">
          <div className="fixed right-4 md:right-10 top-1/2 -translate-y-1/2 z-40 hidden md:block">
            <div className="flex flex-col gap-4">
              {sections.map((section, index) => (
                <button
                  key={`nav-dot-${section.id}`}
                  type="button"
                  onClick={() => scrollToSection(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentSection === index
                      ? "bg-primary scale-125"
                      : "bg-gray-400 hover:bg-gray-600"
                  }`}
                  aria-label={`Scroll to ${section.name}`}
                />
              ))}
            </div>
          </div>

          {/* Main content with single scroll context */}
          <div id={sections[0].id} className="section-container">
            <Hero
              backgroundImage={havalH6Image}
              title="GWM Indonesia"
              subtitle="Great Wall Motors - Mobil berkualitas tinggi dengan teknologi terkini"
              primaryButtonText="Jelajahi Mobil"
              secondaryButtonText="Pesan Sekarang"
              primaryButtonLink="/tipe-mobil"
              secondaryButtonLink="/pesan"
            />
          </div>

          <div id={sections[1].id} className="section-container">
            <ModelShowcase
              imageUrl={havalH6Image}
              title="Haval H6"
              description="SUV premium dengan desain elegan dan performa tangguh. Dilengkapi dengan berbagai fitur keselamatan dan kenyamanan terkini."
              features={[
                "Mesin Turbo 2.0L (184 HP)",
                "Transmisi 7-Speed DCT",
                "Panoramic Sunroof",
                "360° Camera View",
                "Wireless Charging",
                "Futuristic Audio System",
                "Advanced Safety Features",
                "Smart Connectivity",
              ]}
              primaryButtonText="Lihat Detail"
              secondaryButtonText="Test Drive"
              primaryButtonLink="/haval-h6"
              secondaryButtonLink="/test-drive"
            />
          </div>

          <div id={sections[2].id} className="section-container">
            <ModelShowcase
              imageUrl={havalJolionImage}
              title="Haval Jolion"
              description="Compact SUV stylish yang menggabungkan teknologi mutakhir dengan desain berkelas. Pilihan sempurna untuk mobilitas perkotaan modern."
              features={[
                "Mesin Turbo 1.5L (147 HP)",
                "Transmisi 7-Speed DCT",
                "LED Headlights",
                "Panoramic Sunroof",
                '10.25" Touchscreen Display',
                "Wireless Apple CarPlay",
                "Hill Descent Control",
                "Electric Parking Brake",
              ]}
              primaryButtonText="Lihat Detail"
              secondaryButtonText="Test Drive"
              primaryButtonLink="/haval-jolion"
              secondaryButtonLink="/test-drive"
              isReversed={true}
            />
          </div>

          <div id={sections[3].id} className="section-container">
            <ModelShowcase
              imageUrl={tank300Image}
              title="Tank 300"
              description="SUV off-road tangguh yang didesain untuk petualangan. Menggabungkan kapabilitas off-road sejati dengan kenyamanan premium."
              features={[
                "Mesin Turbo 2.0L (220 HP)",
                "Transmisi 8-Speed Automatic",
                "4WD dengan Locking Differential",
                "Tank Turn Function",
                "Wading Depth 700mm",
                "Approach Angle 33°",
                "Departure Angle 34°",
                "50+ Smart Driving Features",
              ]}
              primaryButtonText="Lihat Detail"
              secondaryButtonText="Hubungi Kami"
              primaryButtonLink="/tank-300"
              secondaryButtonLink="/kontak"
            />
          </div>

          <div id={sections[4].id} className="section-container">
            <ModelShowcase
              imageUrl={tank500Image}
              title="Tank 500"
              description="Luxury off-road SUV yang menggabungkan kemewahan dengan kemampuan off-road premium. Pengalaman berkendara mewah dalam segala kondisi."
              features={[
                "Mesin V6 Turbo 3.0L (350 HP)",
                "Transmisi 9-Speed Automatic",
                "Intelligent 4WD System",
                "Genuine 7-Seater Capability",
                "Adaptive Air Suspension",
                "Premium Leather Interior",
                "Advanced Terrain Management",
                "Luxury Infotainment System",
              ]}
              primaryButtonText="Lihat Detail"
              secondaryButtonText="Hubungi Kami"
              primaryButtonLink="/tank-500"
              secondaryButtonLink="/kontak"
              isReversed={true}
            />
          </div>

          {/* Call to action section */}
          <div id={sections[5].id} className="section-container">
            <section className="h-screen flex flex-col justify-center items-center snap-start bg-gradient-to-br from-primary/5 to-primary/10 text-center px-6">
              <h2 className="text-4xl md:text-5xl font-medium mb-6 tracking-tight text-primary animate-fadeIn">
                Ready to Experience GWM?
              </h2>
              <p className="text-base md:text-lg max-w-xl mx-auto mb-10 text-secondary animate-fadeIn animation-delay-100">
                Jadwalkan test drive atau kunjungi showroom kami untuk merasakan
                langsung pengalaman berkendara bersama GWM.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/kontak"
                  className="px-8 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-all duration-300 text-sm font-medium uppercase animate-fadeIn animation-delay-200"
                >
                  Hubungi Kami
                </Link>
                <a
                  href="/test-drive"
                  className="px-8 py-3 bg-white text-primary border border-primary/20 rounded-md hover:bg-gray-50 transition-all duration-300 text-sm font-medium uppercase animate-fadeIn animation-delay-300"
                >
                  Test Drive
                </a>
              </div>
            </section>
          </div>
        </div>
      ) : currentRoute === "/kontak" ? (
        // Contact page - render with proper top padding with Suspense fallback
        <Suspense
          fallback={
            <div className="min-h-screen pt-24 flex items-center justify-center">
              <div className="animate-pulse text-primary">Loading...</div>
            </div>
          }
        >
          {/* Direct content instead of importing Contact again, since it's already imported in router */}
          <Outlet />
        </Suspense>
      ) : (
        // Other routes - fallback to router outlet
        <Suspense
          fallback={
            <div className="min-h-screen pt-24 flex items-center justify-center">
              <div className="animate-pulse text-primary">Loading...</div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      )}

      <WhatsAppButton />
      <Footer />
    </div>
  );
}

export default App;
