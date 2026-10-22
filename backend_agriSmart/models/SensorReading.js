const mongoose = require("mongoose");

const SensorReadingSchema = new mongoose.Schema({
  sensorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sensor', required: true },
  temperature: { type: Number },
  humidity: { type: Number },
  moisture: { type: Number },
  timestamp: { type: Date, default: Date.now }
});

SensorReadingSchema.index({ sensorId: 1, timestamp: -1 });

module.exports = mongoose.model("SensorReading", SensorReadingSchema);
