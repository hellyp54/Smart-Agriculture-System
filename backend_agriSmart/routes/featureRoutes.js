const express = require("express");
const router = express.Router();
const Feature = require("../models/Feature");

// GET all features
router.get("/", async (req, res) => {
  try {
    const features = await Feature.find();
    res.json(features);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;