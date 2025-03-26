-- Delete existing records to avoid duplicates
DELETE FROM car_models;

-- Insert Tank 300
INSERT INTO car_models (
  id, name, featured_image, subheader, price, description, 
  features, main_product_image, colors, category, category_display, 
  published, created_at, updated_at
) 
VALUES (
  'tank-300',
  'Tank 300',
  'https://gwm.kopimap.com/tank_300.webp',
  'Discover the all-new',
  'Rp. 837.000.000',
  'Off-road SUV dengan gaya retro yang menggabungkan kemampuan off-road yang luar biasa dengan kenyamanan premium di dalam kabin.',
  json('[
    "Mesin Turbo 2.0 T HEV (342 HP | 648 NM)",
    "Transmisi 8-Speed Automatic",
    "4WD dengan Electronic Locking Differentials",
    "900 mm Wading Depth",
    "Comfort Luxury Nappa Leather",
    "Auto Park",
    "Multi-Terrain Select",
    "ADAS Lvl 2"
  ]'),
  'https://gwm.kopimap.com/tank_300.webp',
  json('[
    {
      "name": "Dusk Orange",
      "hex": "#FF6B00",
      "backgroundColor": "#FFF0E6",
      "imageUrl": "https://gwm.kopimap.com/tank_300.webp"
    },
    {
      "name": "Crystal Black",
      "hex": "#000000",
      "backgroundColor": "#E6E6E6",
      "imageUrl": "https://gwm.kopimap.com/tank_300.webp"
    },
    {
      "name": "Fossil Grey",
      "hex": "#808080",
      "backgroundColor": "#F5F5F5",
      "imageUrl": "https://gwm.kopimap.com/tank_300.webp"
    },
    {
      "name": "Pearl White",
      "hex": "#FFFFFF",
      "backgroundColor": "#EBF4FF",
      "imageUrl": "https://gwm.kopimap.com/tank_300.webp"
    }
  ]'),
  'suv',
  'SUV',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Tank 500
INSERT INTO car_models (
  id, name, featured_image, subheader, price, description, 
  features, main_product_image, colors, category, category_display, 
  published, created_at, updated_at
) 
VALUES (
  'tank-500',
  'Tank 500',
  'https://gwm.kopimap.com/tank_500.webp',
  'Discover the all-new',
  'Rp. 1.208.000.000',
  'Luxury SUV berukuran besar dengan kemampuan off-road superior dan interior mewah berkapasitas 7 penumpang.',
  json('[
    "Mesin Turbo 2.0 T HEV (342 HP | 648 NM)",
    "Transmisi 8-Speed Automatic",
    "4WD dengan Electronic Locking Differentials",
    "900 mm Wading Depth",
    "Comfort Luxury Nappa Leather",
    "Auto Park",
    "Massage Seat",
    "ADAS Lvl 2"
  ]'),
  'https://gwm.kopimap.com/tank_500.webp',
  json('[
    {
      "name": "Onyx Silver",
      "hex": "#4D5157",
      "backgroundColor": "#F0F0F0",
      "imageUrl": "https://gwm.kopimap.com/tank_500.webp"
    }
  ]'),
  'suv',
  'SUV',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Haval Jolion
INSERT INTO car_models (
  id, name, featured_image, subheader, price, description, 
  features, main_product_image, colors, category, category_display, 
  published, created_at, updated_at
) 
VALUES (
  'haval-jolion',
  'Haval Jolion Ultra',
  'https://gwm.kopimap.com/haval_jolion.webp',
  'Discover the all-new',
  'Rp. 418.000.000',
  'Compact SUV stylish yang menggabungkan teknologi mutakhir dengan desain berkelas. Pilihan sempurna untuk mobilitas perkotaan modern.',
  json('[
    "Mesin 1.5 HEV (187 HP | 375 NM)",
    "Transmisi 7-Speed DHT",
    "Efisien 20 Km/liter",
    "Panoramic Sunroof",
    "10.25\" Touchscreen Display",
    "Carplay dan Android auto",
    "ADAS Lvl 2",
    "EV Mode"
  ]'),
  'https://gwm.kopimap.com/haval_jolion.webp',
  json('[
    {
      "name": "Ayers Grey",
      "hex": "#6C6C6C",
      "backgroundColor": "#F5F5F5",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    },
    {
      "name": "Azure Blue",
      "hex": "#0077B6",
      "backgroundColor": "#E6F0F5",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    },
    {
      "name": "Golden Black",
      "hex": "#1A1A1A",
      "backgroundColor": "#E8E8E8",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    },
    {
      "name": "Hamilton White",
      "hex": "#FFFFFF",
      "backgroundColor": "#F0F4F8",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    },
    {
      "name": "Mars Red",
      "hex": "#D62828",
      "backgroundColor": "#FFF0F0",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    },
    {
      "name": "Pale Blue",
      "hex": "#8ECAE6",
      "backgroundColor": "#F0F8FF",
      "imageUrl": "https://gwm.kopimap.com/haval_jolion.webp"
    }
  ]'),
  'suv',
  'SUV',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- Insert Haval H6
INSERT INTO car_models (
  id, name, featured_image, subheader, price, description, 
  features, main_product_image, colors, category, category_display, 
  published, created_at, updated_at
) 
VALUES (
  'haval-h6',
  'Haval H6',
  'https://gwm.kopimap.com/haval_h6.jpg',
  'Discover the all-new',
  'Rp. 602.000.000',
  'SUV premium dengan desain elegan dan performa tangguh. Dilengkapi dengan berbagai fitur keselamatan dan kenyamanan terkini.',
  json('[
    "Mesin Turbo 1.5 T HEV (235 HP | 530 NM)",
    "Transmisi 7-Speed DHT",
    "Panoramic Sunroof",
    "540° Camera View",
    "Auto Parking",
    "ADAS Lvl 2",
    "Advanced Safety Features",
    "Smart Connectivity"
  ]'),
  'https://gwm.kopimap.com/haval_h6.jpg',
  json('[
    {
      "name": "Energy Green",
      "hex": "#2A9D8F",
      "backgroundColor": "#E6F5F3",
      "imageUrl": "https://gwm.kopimap.com/haval_h6.jpg"
    },
    {
      "name": "Sapphire Blue",
      "hex": "#1E3A8A",
      "backgroundColor": "#E6EAF5",
      "imageUrl": "https://gwm.kopimap.com/haval_h6.jpg"
    }
  ]'),
  'suv',
  'SUV',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
); 