const express = require("express");
const router = express.Router();
const Zone = require("../models/Zone");
const { getConnected } = require("../config/db");

// ── In-memory fallback store (used when MongoDB is offline) ────────────────
let memZones = [];
let memIdCounter = 1;

// CREATE ZONE
router.post("/create", async (req, res) => {
  try {
    if (!getConnected()) {
      const zone = {
        _id: `mem_${memIdCounter++}`,
        ...req.body,
        createdAt: new Date().toISOString(),
      };
      memZones.push(zone);
      return res.json(zone);
    }

    console.log("BODY RECEIVED:", req.body);
    const zone = new Zone(req.body);
    const saved = await zone.save();
    res.json(saved);
  } catch (err) {
    console.error("ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET ALL ZONES
router.get("/", async (req, res) => {
  try {
    if (!getConnected()) {
      return res.json(memZones);
    }
    const zones = await Zone.find();
    res.json(zones);
  } catch (err) {
    res.json(memZones);
  }
});

// DELETE ZONE
router.delete("/:id", async (req, res) => {
  try {
    if (!getConnected()) {
      memZones = memZones.filter((z) => z._id !== req.params.id);
      return res.json({ message: "Zone deleted successfully" });
    }
    await Zone.findByIdAndDelete(req.params.id);
    res.json({ message: "Zone deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET DATA BY LOCATION
router.post("/location-data", async (req, res) => {
  try {
    if (!getConnected()) {
      return res.json({ moisture: 50, temperature: 25, humidity: 60 });
    }
    const zone = await Zone.findOne();
    if (!zone) {
      return res.json({ moisture: 50, temperature: 25, humidity: 60 });
    }
    res.json({
      moisture: zone.soilMoisture,
      temperature: zone.temperature,
      humidity: zone.humidity,
    });
  } catch (err) {
    res.json({ moisture: 50, temperature: 25, humidity: 60 });
  }
});

module.exports = router;