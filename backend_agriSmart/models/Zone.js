const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema({
  name: String,
  geometry: Object,
  soilMoisture: Number,
  temperature: Number,
  humidity: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ THIS LINE IS CRITICAL
module.exports = mongoose.model("Zone", zoneSchema);