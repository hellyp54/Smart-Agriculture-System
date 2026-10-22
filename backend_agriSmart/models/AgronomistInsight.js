const mongoose = require("mongoose");

const agronomistInsightSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  zoneId: { type: String },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["success", "warning", "info", "danger"], default: "info" },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("AgronomistInsight", agronomistInsightSchema);
