const MonitoringData = require("../models/MonitoringData");
const AgronomistInsight = require("../models/AgronomistInsight");
const { getConnected } = require("../config/db");

/**
 * Simulate live data generation for the Monitoring page.
 * This ensures that even without hardware, the page shows "LIVE" data trends.
 */
const simulateLiveData = async () => {
  if (!getConnected()) return;
  const zones = ["Zone A-12", "Zone B-04", "North Orchard", "East Vineyard"];
  
  for (const zone of zones) {
    const lastData = await MonitoringData.findOne({ zoneId: zone }).sort({ timestamp: -1 });
    
    // Slight random variations from previous data or default base values
    const baseMoisture = lastData?.metrics.moisture || 40;
    const baseTemp = lastData?.metrics.temperature || 24;
    const baseNitrogen = lastData?.metrics.nitrogen || 180;

    const newEntry = {
      zoneId: zone,
      timestamp: new Date(),
      metrics: {
        moisture: Math.max(0, Math.min(100, baseMoisture + (Math.random() * 4 - 2))),
        temperature: baseTemp + (Math.random() * 2 - 1),
        ph: 6.5 + (Math.random() * 0.6 - 0.3),
        nitrogen: baseNitrogen + (Math.random() * 10 - 5),
        phosphorus: 40 + (Math.random() * 5 - 2.5),
        potassium: 210 + (Math.random() * 10 - 5),
        organic: 3.2 + (Math.random() * 0.4 - 0.2)
      },
      pests: {
        aphids: Math.floor(Math.random() * 20),
        mites: Math.floor(Math.random() * 10)
      },
      status: Math.random() > 0.9 ? "Attention" : (Math.random() > 0.7 ? "Stable" : "Optimal")
    };

    await MonitoringData.create(newEntry);
  }

  // Occasionally add a new insight
  if (Math.random() > 0.95) {
    const insights = [
      { title: "Nitrogen Peak", message: "Zone A-12 shows a 5% increase in Nitrogen. Conditions optimal for growth.", type: "success" },
      { title: "Low Moisture Alert", message: "East Vineyard moisture dropped below 35%. Check irrigation valves.", type: "warning" },
      { title: "Pest Activity", message: "Slight increase in Aphid counts in North Orchard. Monitor closely.", type: "info" },
      { title: "Soil pH Stable", message: "All zones showing stable pH levels between 6.4 and 7.0.", type: "success" }
    ];
    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    await AgronomistInsight.create({ ...randomInsight, timestamp: new Date() });
  }

  console.log("AgriSmart: Simulated live monitoring data generated.");
};

// Initialize with some historical data if empty
const initHistoricalData = async () => {
  if (!getConnected()) return;
  const count = await MonitoringData.countDocuments();
  if (count === 0) {
    console.log("AgriSmart: Generating historical data for monitoring trends...");
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const zones = ["Zone A-12", "Zone B-04", "North Orchard", "East Vineyard"];
      for (const zone of zones) {
        await MonitoringData.create({
          zoneId: zone,
          timestamp: date,
          metrics: {
            moisture: 35 + Math.random() * 15,
            temperature: 20 + Math.random() * 8,
            ph: 6.2 + Math.random() * 0.8,
            nitrogen: 150 + Math.random() * 50,
            phosphorus: 35 + Math.random() * 15,
            potassium: 180 + Math.random() * 60,
            organic: 3.0 + Math.random() * 0.5
          },
          pests: {
            aphids: Math.floor(Math.random() * 30),
            mites: Math.floor(Math.random() * 15)
          },
          status: "Optimal"
        });
      }
    }
  }

  const insightCount = await AgronomistInsight.countDocuments();
  if (insightCount === 0) {
    await AgronomistInsight.create({
      title: "Optimal Conditions",
      message: "Nitrogen levels in Zone A-12 have increased by 4% following the last fertilization cycle. Soil pH remains steady at 6.8.",
      type: "success"
    });
    await AgronomistInsight.create({
      title: "Trend Analysis",
      message: "Organic matter is trending upwards (3.5%). This indicates high biological activity and sustainable soil health.",
      type: "info"
    });
  }
};

module.exports = { simulateLiveData, initHistoricalData };
