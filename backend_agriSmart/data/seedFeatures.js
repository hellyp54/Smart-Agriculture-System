const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Feature = require("../models/Feature");

const seedFeatures = async () => {
  try {
    // 1. Connect DB FIRST
    await connectDB();

    console.log("📡 Connected to MongoDB for seeding...");

    // 2. Clear old data
    await Feature.deleteMany();

    // 3. Insert new data
    await Feature.insertMany([
      {
        title: "Real-time Monitoring",
        description:
          "Deploy a network of IoT sensors that track soil moisture, pH levels, and nutrient density second-by-second.",
        icon: "sensors",
        type: "monitoring",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDkdxbJmcrEQ_ex2iru1zdey-VE1Y40SsnqhA9zCOaTYssYaYfgD9_B2Xh62PFz1FXr2Yzu7qlGNlc2maOJjBIuQxpSSzHB5b9il2BUEjd50rncSkLOUJxErms6x0O7uEhnA_IyPniy4SR150CnxlB5Qe3Yo-oIvFzWQQE8LsPXgJAZEnS0U3KhAcXbbwpNGCYpx_OorbAN5r5zQQgV0wEWEkkup5IIGUE-KaQ2lyG2cXNKkgu2xD3ovM26YKXGuxVVbzx_ICQgfBUZ",
      },

      {
        title: "Market Sync",
        description:
          "Direct integration with global commodity markets.",
        icon: "trending_up",
        type: "market",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDkdxbJmcrEQ_ex2iru1zdey-VE1Y40SsnqhA9zCOaTYssYaYfgD9_B2Xh62PFz1FXr2Yzu7qlGNlc2maOJjBIuQxpSSzHB5b9il2BUEjd50rncSkLOUJxErms6x0O7uEhnA_IyPniy4SR150CnxlB5Qe3Yo-oIvFzWQQE8LsPXgJAZEnS0U3KhAcXbbwpNGCYpx_OorbAN5r5zQQgV0wEWEkkup5IIGUE-KaQ2lyG2cXNKkgu2xD3ovM26YKXGuxVVbzx_ICQgfBUZ",
        data: [
          { name: "Wheat", price: "+0.24", status: "up" },
          { name: "Corn", price: "-0.12", status: "down" },
        ],
      },

      {
        title: "Smart Irrigation",
        description: "AI-controlled water distribution system.",
        icon: "water_drop",
        type: "irrigation",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDin2wBccz6ww4FoJktI2yJ4okp8ehJSi0JYPjiErLPmhS2TdPnV7V5a17aRsW6QT0xkH1x7uPsxnI0DIjEOAzDNpxFmiOX2pNS873avZWcaoj1qbYXOU8lAY-9kpBtDrlTgWjId63GeXeBk0lmO48X_FG7j0LtsqdBeU09vl5UXxMnJ7kKuB0wmjv4snBIgAVkiX5nYwPpUtbxqXvhp54SgdYOey8pWT-OnkcsKlxWVn6fH8IIjEYu7J__aR0UPvxvWNJ9Ospjk5EN",
        progress: 75,
      },

      {
        title: "Ready to Scale?",
        description:
          "Join over 5,000 precision farmers improving yield.",
        type: "cta",
        buttonText: "Start Free Trial",
      },
    ]);

    console.log("✅ Features Seeded Successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Seed Error:", err);
    process.exit(1);
  }
};

seedFeatures();