import { createFileRoute, Link } from "@tanstack/react-router";

function TipeMobilPage() {
  return (
    <div className="pt-32 pb-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Type Mobil GWM
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Temukan berbagai type mobil GWM yang sesuai dengan kebutuhan Anda
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Tank 300 section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src="https://gwm.kopimap.com/tank_300.webp"
                alt="Tank 300 GWM"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">Tank 300</h3>
              <p className="mt-2 text-gray-600">
                Off-road SUV dengan gaya retro yang menggabungkan kemampuan
                off-road luar biasa dengan kenyamanan premium
              </p>
              <Link
                to="/tipe-mobil/$model"
                params={{ model: "tank-300" }}
                className="mt-3 inline-block text-primary font-medium"
              >
                Lihat Detail
              </Link>
            </div>
          </div>

          {/* Tank 500 section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src="https://gwm.kopimap.com/tank_500.webp"
                alt="Tank 500 GWM"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">Tank 500</h3>
              <p className="mt-2 text-gray-600">
                Luxury SUV berukuran besar dengan kemampuan off-road superior
                dan interior mewah berkapasitas 7 penumpang
              </p>
              <Link
                to="/tipe-mobil/$model"
                params={{ model: "tank-500" }}
                className="mt-3 inline-block text-primary font-medium"
              >
                Lihat Detail
              </Link>
            </div>
          </div>

          {/* Haval Jolion Ultra section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src="https://gwm.kopimap.com/haval_jolion.webp"
                alt="Haval Jolion Ultra GWM"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">Haval Jolion Ultra</h3>
              <p className="mt-2 text-gray-600">
                Compact SUV stylish dengan teknologi mutakhir dan desain
                berkelas untuk mobilitas perkotaan modern
              </p>
              <Link
                to="/tipe-mobil/$model"
                params={{ model: "haval-jolion-ultra" }}
                className="mt-3 inline-block text-primary font-medium"
              >
                Lihat Detail
              </Link>
            </div>
          </div>

          {/* Haval H6 section */}
          <div className="bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
              <img
                src="https://gwm.kopimap.com/haval_h6.jpg"
                alt="Haval H6 GWM"
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="p-4">
              <h3 className="text-xl font-semibold">Haval H6</h3>
              <p className="mt-2 text-gray-600">
                SUV premium dengan desain elegan dan performa tangguh,
                dilengkapi fitur keselamatan dan kenyamanan terkini
              </p>
              <Link
                to="/tipe-mobil/$model"
                params={{ model: "haval-h6" }}
                className="mt-3 inline-block text-primary font-medium"
              >
                Lihat Detail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/tipe-mobil/")({
  component: TipeMobilPage,
  head: () => ({
    meta: [
      {
        title:
          "Type Mobil GWM Indonesia - Tank, Haval, ORA | Great Wall Motors",
      },
      {
        name: "description",
        content:
          "Temukan berbagai type mobil GWM Indonesia - Tank 300, Tank 500, Haval H6, Haval Jolion, dan lainnya. Pilih kendaraan yang sesuai dengan gaya hidup dan kebutuhan Anda.",
      },
    ],
  }),
});
