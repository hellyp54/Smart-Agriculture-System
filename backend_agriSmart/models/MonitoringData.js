const mongoose = require("mongoose");

const monitoringDataSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  zoneId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  metrics: {
    moisture: Number,
    temperature: Number,
    ph: Number,
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    organic: Number
  },
  pests: {
    aphids: Number,
    mites: Number
  },
  status: { type: String, enum: ["Optimal", "Attention", "Stable", "Warning", "Critical"], default: "Optimal" }
});

monitoringDataSchema.index({ zoneId: 1, timestamp: -1 });

module.exports = mongoose.model("MonitoringData", monitoringDataSchema);
