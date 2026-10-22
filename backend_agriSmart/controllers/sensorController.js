const Sensor = require("../models/Sensor");
const Alert = require("../models/Alert");

exports.addSensorData = async (req, res) => {
  try {
    const { moisture, temperature, humidity } = req.body;

    const saved = await Sensor.create({
      moisture,
      temperature,
      humidity,
    });

    /* =========================
       🌱 MOISTURE ALERT
    ========================= */
    if (moisture < 30) {
      const existing = await Alert.findOne({
        category: "moisture",
        status: "Active",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (!existing) {
        await Alert.create({
          message: "Low soil moisture detected",
          type: "Critical",
          category: "moisture",
        });
      }
    } else {
      // ✅ auto resolve if fixed
      await Alert.updateMany(
        { category: "moisture", status: "Active" },
        { status: "Resolved" }
      );
    }

    /* =========================
       🌡️ TEMPERATURE ALERT
    ========================= */
    if (temperature > 40) {
      const existing = await Alert.findOne({
        category: "temperature",
        status: "Active",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (!existing) {
        await Alert.create({
          message: "High temperature detected",
          type: "Warning",
          category: "temperature",
        });
      }
    }

    /* =========================
       💧 HUMIDITY ALERT
    ========================= */
    if (humidity > 90) {
      const existing = await Alert.findOne({
        category: "humidity",
        status: "Active",
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
      });

      if (!existing) {
        await Alert.create({
          message: "High humidity detected",
          type: "Info",
          category: "humidity",
        });
      }
    }

    res.json({
      message: "Sensor data saved",
      data: saved,
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
/* =========================
   GET LATEST SENSOR DATA
========================= */
exports.getLatestData = async (req, res) => {
  try {
    const latest = await Sensor.findOne().sort({ _id: -1 });

    if (!latest) {
      return res.json({
        moisture: 0,
        temperature: 0,
        humidity: 0,
      });
    }

    res.json(latest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};