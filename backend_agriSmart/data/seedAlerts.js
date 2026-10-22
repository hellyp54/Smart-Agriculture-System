const mongoose = require("mongoose");
const Alert = require("../models/Alert");

const seed = async () => {
  await mongoose.connect("mongodb+srv://Helly:456@cluster0.fvhhsjq.mongodb.net/de_agriSmart");

  await Alert.deleteMany();

  await Alert.insertMany([
    {
      message: "Low soil moisture in Zone A",
      type: "Critical",
      category: "moisture",
    },
    {
      message: "High temperature detected",
      type: "Warning",
      category: "temperature",
    },
    {
      message: "Market info update",
      type: "Info",
      category: "general",
    },
  ]);

  console.log("✅ Alerts seeded");
  process.exit();
};

seed();