const liveConditionsService = require("../services/liveConditionsService");

exports.getLiveConditions = async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "Missing lat or lng" });
    }

    const data = await liveConditionsService.getLiveConditions(Number(lat), Number(lng));
    res.json(data);
  } catch (error) {
    console.error("Error in getLiveConditions controller:", error);
    res.status(500).json({ error: "Failed to fetch live conditions" });
  }
};
