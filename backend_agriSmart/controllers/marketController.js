const CropPrice = require("../models/CropPrice");
const { getConnected } = require("../config/db");

exports.getPrices = async (req, res) => {
  try {
    const mockPrices = [
      { cropName: "Wheat", price: 250 + Math.floor(Math.random() * 20), unit: "Quintal", trend: Math.random() > 0.5 ? "up" : "down" },
      { cropName: "Rice", price: 400 + Math.floor(Math.random() * 30), unit: "Quintal", trend: Math.random() > 0.5 ? "up" : "down" },
      { cropName: "Cotton", price: 800 + Math.floor(Math.random() * 50), unit: "Quintal", trend: Math.random() > 0.5 ? "up" : "down" },
      { cropName: "Soybean", price: 500 + Math.floor(Math.random() * 40), unit: "Quintal", trend: Math.random() > 0.5 ? "up" : "down" },
      { cropName: "Sugarcane", price: 300 + Math.floor(Math.random() * 15), unit: "Quintal", trend: Math.random() > 0.5 ? "up" : "down" }
    ];

    if (!getConnected()) {
      return res.json(mockPrices);
    }
    const prices = await CropPrice.find();
    res.json(prices.length > 0 ? prices : mockPrices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};