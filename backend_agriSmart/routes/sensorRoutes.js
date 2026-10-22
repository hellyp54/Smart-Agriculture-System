const express = require("express");
const router = express.Router();

const {
  addSensorData,
  getLatestData,
} = require("../controllers/sensorController");

// Save data
router.post("/add", addSensorData);

// Get latest data
router.get("/latest", getLatestData);

module.exports = router;