const express = require('express');
const router = express.Router();
const { getConnected } = require('../config/db');

const { getLatestData } = require('../controllers/sensorController');
const { getPrices } = require('../controllers/marketController');
const { getLiveConditions } = require('../controllers/liveConditionsController');
const { getTrends, getInsights, getZoneStatus, addMonitoringData, deleteZone, deleteAlert } = require('../controllers/monitoringController');

router.get('/sensors/latest', getLatestData);
router.get('/market/prices', getPrices);
router.get('/live-conditions', getLiveConditions);

// Monitoring Trends & Insights
router.get('/monitoring/trends', getTrends);
router.get('/monitoring/insights', getInsights);
router.get('/monitoring/zones', getZoneStatus);
router.post('/monitoring/data', addMonitoringData);

// Delete Endpoints for User Data Management
router.delete('/monitoring/zones/:id', deleteZone);
router.delete('/monitoring/insights/:id', deleteAlert);

// Save sensor data
router.post("/sensor", async (req, res) => {
  if (!getConnected()) {
    return res.json({ message: "DB offline — sensor data not saved", ...req.body });
  }
  try {
    const Sensor = require("../models/Sensor");
    const data = await Sensor.create(req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get latest sensor per zone
router.get("/zones/:id", async (req, res) => {
  if (!getConnected()) {
    return res.json(null);
  }
  try {
    const Sensor = require("../models/Sensor");
    const sensor = await Sensor.findOne({ zoneId: req.params.id }).sort({ createdAt: -1 });
    res.json(sensor);
  } catch (err) {
    res.json(null);
  }
});

// Get all zones (proxied from apiRoutes — actual zone data served by zoneRoutes)
router.get("/zones", async (req, res) => {
  if (!getConnected()) {
    return res.json([]);
  }
  try {
    const Zone = require("../models/Zone");
    const zones = await Zone.find();
    res.json(zones);
  } catch (err) {
    res.json([]);
  }
});

module.exports = router;