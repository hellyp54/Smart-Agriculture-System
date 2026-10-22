const Alert = require("../models/Alert");

/* =========================
   GET ALL ALERTS
========================= */
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addAlert = async (req, res) => {
  try {
    const { message, type, category } = req.body;

    const alert = await Alert.create({
      message,
      type,
      category,
    });

    res.json(alert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* =========================
   RESOLVE ALERT
========================= */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await Alert.findByIdAndUpdate(
      id,
      { status: "Resolved" },
      { new: true }
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};