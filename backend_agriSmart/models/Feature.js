const mongoose = require("mongoose");

const featureSchema = new mongoose.Schema({
  title: String,
  description: String,
  icon: String,
  type: String, // "monitoring", "market", etc.
  image: String, // optional
  data: Array,   // for Market Sync items etc.
  progress: Number, // for irrigation %
  buttonText: String,
});

module.exports = mongoose.model("Feature", featureSchema);