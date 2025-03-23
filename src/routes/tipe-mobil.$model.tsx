import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { seo } from "../utils/seo";

// Vehicle data organized by model ID
const vehiclesById = {
  "tank-300": {
    id: "tank-300",
    name: "Tank 300",
    price: "Rp. 837.000.000",
    category: "suv",
    categoryDisplay: "SUV",
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
    imageUrl: "https://gwm.kopimap.com/tank_300.webp",
    relatedModels: ["tank-500", "haval-h6", "haval-jolion-ultra"], // related models by ID
  },
  "tank-500": {
    id: "tank-500",
    name: "Tank 500",
    price: "Rp. 1.208.000.000",
    category: "suv",
    categoryDisplay: "SUV",
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
    imageUrl: "https://gwm.kopimap.com/tank_500.webp",
    relatedModels: ["tank-300", "haval-h6", "haval-jolion-ultra"],
  },
  "haval-jolion-ultra": {
    id: "haval-jolion-ultra",
    name: "Haval Jolion Ultra",
    price: "Rp. 418.000.000",
    category: "suv",
    categoryDisplay: "SUV",
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
    imageUrl: "https://gwm.kopimap.com/haval_jolion.webp",
    relatedModels: ["haval-h6", "tank-300", "tank-500"],
  },
  "haval-h6": {
    id: "haval-h6",
    name: "Haval H6",
    price: "Rp. 602.000.000",
    category: "suv",
    categoryDisplay: "SUV",
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
    imageUrl: "https://gwm.kopimap.com/haval_h6.jpg",
    relatedModels: ["haval-jolion-ultra", "tank-300", "tank-500"],
  },
};

// Define the expected types for loader data
type LoaderData = {
  vehicle: (typeof vehiclesById)[keyof typeof vehiclesById];
  relatedVehicles: (typeof vehiclesById)[keyof typeof vehiclesById][];
};

export const Route = createFileRoute("/tipe-mobil/$model")({
  beforeLoad: ({ params }) => {
    const { model } = params;
    // Check if the vehicle model exists
    if (!vehiclesById[model as keyof typeof vehiclesById]) {
      throw new Error(`Invalid vehicle model: ${model}`);
    }
  },

  loader: ({ params }) => {
    const { model } = params;
    const vehicle = vehiclesById[model as keyof typeof vehiclesById];

    if (!vehicle) {
      throw new Error(`No vehicle found with ID: ${model}`);
    }

    // Get related vehicles
    const relatedVehicles = vehicle.relatedModels
      .map((id) => vehiclesById[id as keyof typeof vehiclesById])
      .filter((v) => v !== undefined);

    return {
      vehicle,
      relatedVehicles,
    } satisfies LoaderData;
  },

  head: ({ loaderData }) => {
    const { vehicle } = loaderData;

    return {
      meta: [
        ...seo({
          title: `${vehicle.name} - Type Mobil GWM Indonesia | Great Wall Motors`,
          description: `${vehicle.name} - ${vehicle.description} Dapatkan informasi lengkap mengenai spesifikasi, harga, dan fitur ${vehicle.name}.`,
          keywords: `GWM, Great Wall Motors, ${vehicle.name}, ${vehicle.categoryDisplay}, Type Mobil GWM, ${vehicle.name} Indonesia, ${vehicle.name} Spesifikasi`,
          image: vehicle.imageUrl,
        }),
      ],
      links: [
        {
          rel: "canonical",
          href: `https://gwm.co.id/tipe-mobil/${vehicle.id}`,
        },
      ],
    };
  },

  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  const { vehicle, relatedVehicles } = Route.useLoaderData();
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // Add a small delay for smooth transition effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className={`pt-16 transition-opacity duration-500 ${isPageLoaded ? "opacity-100" : "opacity-0"}`}
    >
      {/* Hero section */}
      <div className="relative bg-gray-900 text-white">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(${vehicle.imageUrl})`,
          }}
        />
        <div className="relative container mx-auto px-4 py-24 sm:py-32">
          <span className="inline-block px-3 py-1 bg-primary text-white text-sm rounded-md mb-4">
            {vehicle.categoryDisplay}
          </span>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">
            {vehicle.name}
          </h1>
          <p className="text-xl max-w-2xl mb-6">{vehicle.description}</p>
          <p className="text-2xl font-semibold">{vehicle.price}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-16">
        {/* Vehicle details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Image */}
          <div className="rounded-lg overflow-hidden shadow-lg">
            <img
              src={vehicle.imageUrl}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Features */}
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Fitur Unggulan
            </h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ul className="space-y-4">
                {vehicle.features.map((feature, idx) => (
                  <li
                    key={`${vehicle.id}-feature-${idx}`}
                    className="flex items-start gap-3"
                  >
                    <span className="flex-shrink-0 mt-1 text-primary font-bold">
                      ✓
                    </span>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action buttons */}
            <div className="mt-8 space-y-4">
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block py-3 bg-primary text-white text-center rounded-md font-medium hover:bg-primary/90 transition-colors"
              >
                Hubungi Untuk Test Drive
              </a>
              <a
                href="/kontak"
                className="w-full block py-3 border border-gray-300 text-gray-700 text-center rounded-md font-medium hover:bg-gray-50 transition-colors"
              >
                Pelajari Lebih Lanjut
              </a>
            </div>
          </div>
        </div>

        {/* Vehicle description */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Tentang {vehicle.name}
          </h2>
          <div className="prose prose-lg max-w-none">
            <p>
              {vehicle.name} dirancang untuk memenuhi kebutuhan pengguna yang
              menginginkan kendaraan dengan performa tinggi dan fitur modern.
              Setiap detail dalam desain dan teknologi dipilih untuk memberikan
              pengalaman berkendara yang optimal.
            </p>
            <p className="mt-4">
              Dengan {vehicle.features[0].toLowerCase()}, {vehicle.name}{" "}
              memberikan tenaga dan torsi yang cukup untuk menghadapi berbagai
              kondisi jalan. Kombinasi dengan{" "}
              {vehicle.features[1].toLowerCase()} menawarkan perpindahan gigi
              yang halus dan responsif.
            </p>
            <p className="mt-4">
              Interior {vehicle.name} dirancang dengan mengutamakan kenyamanan
              dan kemudahan penggunaan. Teknologi-teknologi canggih
              diintegrasikan untuk meningkatkan keselamatan dan kenyamanan
              berkendara.
            </p>
          </div>
        </div>

        {/* Related vehicles */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            Type Mobil GWM Lainnya
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedVehicles.map((relatedVehicle) => (
              <div
                key={relatedVehicle.id}
                className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg"
              >
                <Link
                  to="/tipe-mobil/$model"
                  params={{ model: relatedVehicle.id }}
                  className="block h-full"
                >
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                    <img
                      src={relatedVehicle.imageUrl}
                      alt={relatedVehicle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-xs text-gray-500 mb-1 block">
                      {relatedVehicle.categoryDisplay}
                    </span>
                    <h3 className="text-xl font-semibold mb-2">
                      {relatedVehicle.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {relatedVehicle.description}
                    </p>
                    <span className="text-primary font-medium">
                      Lihat Detail →
                    </span>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-24 bg-gray-100 rounded-xl p-8 md:p-12">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Tertarik dengan {vehicle.name}?
            </h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Konsultasikan kebutuhan Anda dengan sales consultant kami untuk
              mendapatkan informasi terbaru mengenai harga, promo, dan
              ketersediaan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/kontak"
                className="px-6 py-3 bg-slate-200 text-slate-700 rounded-md font-medium text-center hover:bg-primary/90 transition-colors"
              >
                Hubungi Kami
              </a>
              <a
                href={`https://wa.me/6287774377422?text=Hello,%20Kak%20ARKAN.%20Saya%20ingin%20tanya%20tentang%20${vehicle.name}.%20Saya:%20...%20Domisili:%20..`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3 bg-green-500 text-white rounded-md font-medium text-center hover:bg-green-600 transition-colors"
              >
                Chat WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
