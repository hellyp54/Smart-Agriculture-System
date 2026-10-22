// models/Sensor.js
const mongoose = require("mongoose");

const sensorSchema = new mongoose.Schema({
  zoneId: String,
  moisture: Number,
  temperature: Number,
  humidity: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Sensor", sensorSchema);