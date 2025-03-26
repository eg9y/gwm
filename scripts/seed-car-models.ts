import { db } from "../src/db";
import { carModels } from "../src/db/schema";

async function seedCarModels() {
  try {
    console.log("Seeding car models...");

    // Check if we already have car models
    const existingModels = await db.select().from(carModels).all();
    if (existingModels.length > 0) {
      console.log(
        `Database already has ${existingModels.length} car models. Skipping seeding.`
      );
      return;
    }

    // Sample car model
    const sampleModel = {
      id: "tank-300",
      name: "GWM TANK 300",
      featuredImage: "https://example.com/tank-300-hero.jpg",
      subheader: "The Ultimate Off-Road SUV",
      price: "Rp. 500.000.000",
      subImage: "https://example.com/tank-300-sub.jpg",
      features: [
        "Powerful Engine",
        "Advanced Safety Features",
        "Premium Interior",
        "Cutting-edge Technology",
      ],
      description:
        "Experience the perfect blend of style, performance, and innovation with the GWM TANK 300, the ultimate off-road SUV.",
      mainProductImage: "https://example.com/tank-300-main.jpg",
      colors: [
        {
          name: "Black",
          hex: "#000000",
          backgroundColor: "#f5f5f5",
          imageUrl: "https://example.com/tank-300-black.jpg",
        },
        {
          name: "White",
          hex: "#ffffff",
          backgroundColor: "#e0e0e0",
          imageUrl: "https://example.com/tank-300-white.jpg",
        },
      ],
      category: "suv",
      categoryDisplay: "SUV",
      has180View: 1,
      published: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Insert the sample model
    await db.insert(carModels).values(sampleModel);
    console.log("Sample car model added successfully!");
  } catch (error) {
    console.error("Error seeding car models:", error);
  }
}

// Run the seeding function
seedCarModels()
  .then(() => console.log("Seeding completed"))
  .catch((error) => console.error("Seeding failed:", error))
  .finally(() => process.exit(0));
