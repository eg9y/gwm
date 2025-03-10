import { useEffect, useState, useRef } from "react";
import { useRouter, createFileRoute } from "@tanstack/react-router";

// Import images
import havalH6Image from "../assets/haval_h6.jpg";
import havalJolionImage from "../assets/haval_jolion.jpg";
import tank300Image from "../assets/tank_300.jpg";
import tank500Image from "../assets/tank_500.jpg";
import Hero from "../components/Hero";
import ModelShowcase from "../components/ModelShowcase";

// Define section names for better accessibility and keys
const sections = [
  { id: "hero", name: "Home" },
  { id: "haval-h6", name: "Haval H6" },
  { id: "haval-jolion", name: "Haval Jolion" },
  { id: "tank-300", name: "Tank 300" },
  { id: "tank-500", name: "Tank 500" },
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
    imageUrl: tank300Image,
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
    imageUrl: tank500Image,
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
    learnMoreLink: "/haval-jolion-ultra",
    imageUrl: havalJolionImage,
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
    imageUrl: havalH6Image,
  },
];

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
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

  return (
    <div className="relative min-h-screen overflow-y-auto">
      <div className="snap-y snap-mandatory">
        {/* Main content with single scroll context */}
        <div id={sections[0].id} className="section-container">
          <Hero
            backgroundImage={havalH6Image}
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

        {/* Contact section - add a placeholder for the last section */}
      </div>
    </div>
  );
}
