const FieldZone = require('../models/FieldZone');

// Get all field zones for the initial heatmap overlay
exports.getHeatmap = async (req, res) => {
    try {
        const zones = await FieldZone.find({});
        res.json(zones);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get specific insights for a clicked point (Lat/Lng)
exports.getInsights = async (req, res) => {
    const { lat, lng } = req.query;
    try {
        const zone = await FieldZone.findOne({
            location: {
                $geoIntersects: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    }
                }
            }
        });

        if (!zone) return res.status(404).json({ message: "No zone found at this location." });

        // AI Recommendation Engine Logic
        let recommendation = "Condition: Healthy. Growth cycle on track.";
        let riskLevel = "Optimal";

        if (zone.metrics.ndvi < 0.3) {
            recommendation = "Critical: Severe crop stress detected. Check for pests.";
            riskLevel = "Critical";
        } else if (zone.metrics.moisture < 25) {
            recommendation = "Warning: Low moisture. Schedule irrigation cycle.";
            riskLevel = "Warning";
        } else if (zone.metrics.temperature > 35) {
            recommendation = "Notice: High heat stress. Monitor transpiration.";
            riskLevel = "Alert";
        }

        res.json({
            ...zone._doc,
            ai: { recommendation, riskLevel }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
