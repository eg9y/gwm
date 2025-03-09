import { createFileRoute } from "@tanstack/react-router";
import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";
import { Helmet } from "react-helmet";
import { useEffect, useState } from "react";

// Import images
import havalH6Image from "../assets/haval_h6.jpg";
import havalJolionImage from "../assets/haval_jolion.jpg";
import tank300Image from "../assets/tank_300.jpg";
import tank500Image from "../assets/tank_500.jpg";

// Define section names for better accessibility and keys
export const sections = [
  { id: "hero", name: "Home" },
  { id: "haval-h6", name: "Haval H6" },
  { id: "haval-jolion", name: "Haval Jolion" },
  { id: "tank-300", name: "Tank 300" },
  { id: "tank-500", name: "Tank 500" },
  { id: "contact", name: "Contact" },
];

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [sectionsLoaded, setSectionsLoaded] = useState(false);

  useEffect(() => {
    // Start the loading process immediately, but delay just a tiny bit
    // to allow for a smoother transition
    const timer = setTimeout(() => {
      setSectionsLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Helmet>
        <title>GWM Indonesia - Home | Great Wall Motors</title>
        <meta
          name="description"
          content="GWM Indonesia - Discover our range of premium SUVs including Haval H6, Haval Jolion, Tank 300, and Tank 500. Great Wall Motors vehicles combine cutting-edge technology with superior performance."
        />
        <meta
          name="keywords"
          content="GWM, Great Wall Motors, Indonesia, SUV, Haval H6, Haval Jolion, Tank 300, Tank 500"
        />
        <link rel="canonical" href="https://gwm-indonesia.com/" />
      </Helmet>

      <div
        className={`snap-y snap-mandatory transition-opacity duration-500 ${sectionsLoaded ? "opacity-100" : "opacity-0"}`}
      >
        <div className="fixed right-4 md:right-10 top-1/2 -translate-y-1/2 z-40 hidden md:block">
          <div className="flex flex-col gap-4">
            {sections.map((section, index) => (
              <a
                key={`nav-dot-${section.id}`}
                href={`#${section.id}`}
                className="w-3 h-3 rounded-full transition-all duration-300 bg-gray-400 hover:bg-gray-600 focus:bg-primary"
                aria-label={`Scroll to ${section.name}`}
              >
                <span className="sr-only">Scroll to {section.name}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Main content with section-based scrolling */}
        <section id={sections[0].id} className="section-container">
          <Hero
            backgroundImage={havalH6Image}
            title="GWM Indonesia"
            subtitle="Great Wall Motors - Mobil berkualitas tinggi dengan teknologi terkini"
            primaryButtonText="Jelajahi Mobil"
            secondaryButtonText="Pesan Sekarang"
            primaryButtonLink="/tipe-mobil"
            secondaryButtonLink="/pesan"
          />
        </section>

        <section id={sections[1].id} className="section-container">
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
        </section>

        <section id={sections[2].id} className="section-container">
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
        </section>

        <section id={sections[3].id} className="section-container">
          <ModelShowcase
            imageUrl={tank300Image}
            title="Tank 300"
            description="Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road yang luar biasa dengan kenyamanan premium di dalam kabin."
            features={[
              "Mesin Turbo 2.0L (220 HP)",
              "Transmisi 8-Speed Automatic",
              "4WD dengan Electronic Locking Differentials",
              "700mm Wading Depth",
              "Tank Turn Capability",
              "Crawl Control",
              "Multi-Terrain Select",
              "Luxury Interior",
            ]}
            primaryButtonText="Lihat Detail"
            secondaryButtonText="Test Drive"
            primaryButtonLink="/tank-300"
            secondaryButtonLink="/test-drive"
          />
        </section>

        <section id={sections[4].id} className="section-container">
          <ModelShowcase
            imageUrl={tank500Image}
            title="Tank 500"
            description="Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang."
            features={[
              "Mesin Turbo 3.0L V6 (354 HP)",
              "Transmisi 9-Speed Automatic",
              "Advanced 4WD System",
              "Terrain Management System",
              "Air Suspension",
              "High-End Leather Interior",
              "Panoramic Sunroof",
              "14.6-inch Touchscreen",
            ]}
            primaryButtonText="Lihat Detail"
            secondaryButtonText="Test Drive"
            primaryButtonLink="/tank-500"
            secondaryButtonLink="/test-drive"
            isReversed={true}
          />
        </section>
      </div>
    </>
  );
}
