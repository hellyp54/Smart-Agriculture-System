const mongoose = require("mongoose");

const ApiCacheSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "lat,lng" rounded
  data: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now, expires: 1800 } // TTL index for 30 min cache
});

module.exports = mongoose.model("ApiCache", ApiCacheSchema);
