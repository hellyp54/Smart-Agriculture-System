// routes/dataRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");

router.post("/location-data", async (req, res) => {
  const { lat, lng } = req.body;

  try {
    const weather = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=YOUR_API_KEY&units=metric`
    );

    res.json({
      temperature: weather.data.main.temp,
      humidity: weather.data.main.humidity,
      moisture: Math.floor(Math.random() * 100), // replace later with IoT
    });
  } catch (err) {
    res.status(500).json(err.message);
  }
});

module.exports = router;