const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },

    type: {
      type: String,
      enum: ["Critical", "Warning", "Info"],
      default: "Info",
    },

    // ✅ NEW: track status
    status: {
      type: String,
      enum: ["Active", "Resolved"],
      default: "Active",
    },

    // ✅ optional: sensor type
    category: {
      type: String, // moisture, temperature, humidity
    },

    // ✅ prevent duplicates smartly
    lastTriggered: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);