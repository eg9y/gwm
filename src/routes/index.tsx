import { useEffect, useState, useRef } from "react";
import { useRouter, createFileRoute } from "@tanstack/react-router";

import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";
import Promos from "../components/Promos";
import { seo } from "../utils/seo";

// Define section names for better accessibility and keys
const sections = [
  { id: "hero", name: "Home" },
  { id: "haval-h6", name: "Haval H6" },
  { id: "haval-jolion", name: "Haval Jolion" },
  { id: "tank-300", name: "Tank 300" },
  { id: "tank-500", name: "Tank 500" },
  { id: "promos", name: "Promos" },
  { id: "contact", name: "Contact" },
];

// Replace the existing vehicle models section with this updated content
const vehicleModels = [
  {
    id: 1,
    name: "Tank 300",
    price: "Rp. 837.000.000",
    description:
      "Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road yang luar biasa dengan kenyamanan premium di dalam kabin.",
    features: [
      "Mesin Turbo 2.0 T HEV (342 HP | 648 NM)",
      "Transmisi 8-Speed Automatic",
      "4WD dengan Electronic Locking Differentials",
      "900 mm Wading Depth",
      "Comfort Luxury Nappa Leather",
      "Auto Park",
      "Multi-Terrain Select",
      "ADAS Lvl 2",
    ],
    learnMoreLink: "/tank-300",
    // imageUrl: tank300Image,
    imageUrl: "https://gwm.kopimap.com/tank_300.webp",
  },
  {
    id: 2,
    name: "Tank 500",
    price: "Rp. 1.208.000.000",
    description:
      "Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang.",
    features: [
      "Mesin Turbo 2.0 T HEV (342 HP | 648 NM)",
      "Transmisi 8-Speed Automatic",
      "4WD dengan Electronic Locking Differentials",
      "900 mm Wading Depth",
      "Comfort Luxury Nappa Leather",
      "Auto Park",
      "Massage Seat",
      "ADAS Lvl 2",
    ],
    learnMoreLink: "/tank-500",
    // imageUrl: tank500Image,
    imageUrl: "https://gwm.kopimap.com/tank_500.webp",
  },
  {
    id: 3,
    name: "Haval Jolion Ultra",
    price: "Rp. 418.000.000",
    description:
      "Compact SUV stylish yang menggabungkan teknologi mutakhir dengan desain berkelas. Pilihan sempurna untuk mobilitas perkotaan modern.",
    features: [
      "Mesin 1.5 HEV (187 HP | 375 NM)",
      "Transmisi 7-Speed DHT",
      "Efisien 20 Km/liter",
      "Panoramic Sunroof",
      '10.25" Touchscreen Display',
      "Carplay dan Android auto",
      "ADAS Lvl 2",
      "EV Mode",
    ],
    learnMoreLink: "/haval-jolion",
    // imageUrl: havalJolionImage,
    imageUrl: "https://gwm.kopimap.com/haval_jolion.webp",
  },
  {
    id: 4,
    name: "Haval H6",
    price: "Rp. 602.000.000",
    description:
      "SUV premium dengan desain elegan dan performa tangguh. Dilengkapi dengan berbagai fitur keselamatan dan kenyamanan terkini.",
    features: [
      "Mesin Turbo 1.5 T HEV (235 HP | 530 NM)",
      "Transmisi 7-Speed DHT",
      "Panoramic Sunroof",
      "540° Camera View",
      "Auto Parking",
      "ADAS Lvl 2",
      "Advanced Safety Features",
      "Smart Connectivity",
    ],
    learnMoreLink: "/haval-h6",
    // imageUrl: havalH6Image,
    imageUrl: "https://gwm.kopimap.com/haval_h6.jpg",
  },
];

export const Route = createFileRoute("/")({
  component: HomePage,
  // Add head metadata for the homepage
  head: () => ({
    meta: [
      ...seo({
        title: "GWM Indonesia - Great Wall Motors | Mobil SUV Premium Terbaik",
        description:
          "Great Wall Motors Indonesia - Mobil SUV premium berkualitas tinggi dengan teknologi terkini. Haval, Tank, dan ORA tersedia di Indonesia.",
        keywords:
          "GWM, Great Wall Motors, Haval H6, Haval Jolion, Tank 300, Tank 500, SUV Premium, Mobil Hybrid, Indonesia",
        image: "https://gwm.kopimap.com/hero_image.webp",
      }),
    ],
    links: [
      {
        rel: "canonical",
        href: "https://gwm.co.id/",
      },
    ],
  }),
});

function HomePage() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const totalSections = sections.length;
  const currentRoute = router.state.location.pathname;
  const isHomePage = currentRoute === "/";

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

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <div className="snap-y snap-mandatory">
        {/* Main content with single scroll context */}
        <div id={sections[0].id} className="section-container">
          <Hero
            // backgroundImage={heroImage}
            desktopImage={"https://gwm.kopimap.com/hero_image.webp"}
            mobileImage={"https://gwm.kopimap.com/hero_image_mobile.png"}
            title="GWM Indonesia"
            subtitle="Great Wall Motors - Mobil berkualitas tinggi dengan teknologi terkini"
            primaryButtonText="Jelajahi Mobil"
            secondaryButtonText="Pesan Sekarang"
            primaryButtonLink="/tipe-mobil"
            secondaryButtonLink="https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20promo%20terbaru%20mobil%20GWM.%20Saya:%20...%20Domisili:%20.."
          />
        </div>

        {/* Vehicle model showcase sections */}
        {vehicleModels.map((model, index) => {
          // Determine which section this maps to
          const sectionIndex = index + 1; // +1 because the first section is the hero

          // Get secondary button text and link based on model
          const isHavalModel = model.name.toLowerCase().includes("haval");
          const secondaryButtonText = isHavalModel
            ? "Test Drive"
            : "Hubungi Kami";
          const secondaryButtonLink = isHavalModel ? "/test-drive" : "/kontak";

          return (
            <div
              key={model.id}
              id={sections[sectionIndex].id}
              className="section-container"
            >
              <ModelShowcase
                imageUrl={model.imageUrl}
                title={model.name}
                price={model.price}
                description={model.description}
                features={model.features}
                primaryButtonText="Lihat Detail"
                secondaryButtonText={secondaryButtonText}
                primaryButtonLink={model.learnMoreLink}
                secondaryButtonLink={secondaryButtonLink}
                isReversed={index % 2 !== 0} // Alternate isReversed (odd indexes are reversed)
              />
            </div>
          );
        })}

        {/* Promos section */}
        <div id={sections[5].id} className="section-container">
          <Promos />
        </div>

        {/* Contact section - add a placeholder for the last section */}
      </div>
    </div>
  );
}
