const MonitoringData = require("../models/MonitoringData");
const AgronomistInsight = require("../models/AgronomistInsight");
const { getConnected } = require("../config/db");

const jwt = require('jsonwebtoken');

const getUserId = (req) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            return decoded.email || decoded.id; // Try email first, fallback to id
        } catch (e) { return null; }
    }
    return null;
}

// Get trends (last 7 days by default)
exports.getTrends = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);

    const { zoneId, days = 7 } = req.query;
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));

    if (!getConnected()) {
      let data = global.mockDatabase.zones.filter(z => z.userId === userId);
      if (data.length === 0) data = global.mockDatabase.zones.slice(0, 10); // Fallback to any data
      if (zoneId) data = data.filter(z => z.zoneId === zoneId);
      return res.json(data);
    }
    
    const query = { userId: userId };
    if (zoneId) query.zoneId = zoneId;

    let data = await MonitoringData.find(query).sort({ timestamp: 1 });
    
    // If no user data, fallback to any available data for demo purposes
    if (data.length === 0) {
        data = await MonitoringData.find(zoneId ? { zoneId } : {}).sort({ timestamp: 1 }).limit(20);
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get latest insights
exports.getInsights = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);

    if (!getConnected()) {
      let data = global.mockDatabase.alerts.filter(a => a.userId === userId);
      if (data.length === 0) data = global.mockDatabase.alerts.slice(0, 5);
      return res.json(data.sort((a,b) => b.timestamp - a.timestamp));
    }
    
    let insights = await AgronomistInsight.find({ userId }).sort({ timestamp: -1 }).limit(10);
    if (insights.length === 0) {
        insights = await AgronomistInsight.find().sort({ timestamp: -1 }).limit(5);
    }
    res.json(insights);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get latest zone status grid
exports.getZoneStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json([]);

    if (!getConnected()) {
      let data = global.mockDatabase.zones.filter(z => z.userId === userId);
      if (data.length === 0) data = global.mockDatabase.zones.slice(0, 5);
      return res.json(data);
    }

    // Get latest reading for each unique zone
    let zones = await MonitoringData.aggregate([
      { $match: { userId: userId } },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$zoneId",
          latest: { $first: "$$ROOT" }
        }
      }
    ]);
    
    if (zones.length === 0) {
        zones = await MonitoringData.aggregate([
            { $sort: { timestamp: -1 } },
            {
              $group: {
                _id: "$zoneId",
                latest: { $first: "$$ROOT" }
              }
            },
            { $limit: 5 }
        ]);
    }
    
    res.json(zones.map(z => z.latest));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add a single monitoring entry (manually or via simulation)
exports.addMonitoringData = async (req, res) => {
  try {
    const data = await MonitoringData.create(req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a zone
exports.deleteZone = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!getConnected()) {
      global.mockDatabase.zones = global.mockDatabase.zones.filter(z => z._id !== id);
      const { saveStore } = require('../config/localStore');
      saveStore(global.mockDatabase);
      return res.json({ success: true });
    }
    
    await MonitoringData.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an alert
exports.deleteAlert = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    if (!getConnected()) {
      global.mockDatabase.alerts = global.mockDatabase.alerts.filter(a => a._id !== id);
      const { saveStore } = require('../config/localStore');
      saveStore(global.mockDatabase);
      return res.json({ success: true });
    }
    
    await AgronomistInsight.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

