const { getNearbyFarmBoundaries } = require("../services/farmBoundaryService");
const { getLiveConditions } = require("../services/liveConditionsService");
const { generateFarmInsight } = require("../services/geminiInsightService");
const { evaluateConditions } = require("../services/cropRecommendationService");

exports.getNearbyFarms = async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });
    
    const result = await getNearbyFarmBoundaries(Number(lat), Number(lng), Number(radius) || 2000);
    
    // Include metadata so frontend can show helpful messaging
    res.json({
      ...result,
      found: result.features.length > 0,
      message: result.features.length === 0
        ? `No mapped agricultural areas found within ${result.meta?.usedRadius || 5000}m. Try drawing one manually.`
        : `Found ${result.features.length} mapped agricultural areas (up to ${result.meta?.usedRadius}m radius).`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.analyzeFarm = async (req, res) => {
  try {
    const { lat, lng, areaSqMeters, name } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: "Missing center coordinates" });

    // 1. Fetch Live Env Conditions
    const conditions = await getLiveConditions(Number(lat), Number(lng));
    
    // 2. Rule based conditions check
    const rulesMatch = evaluateConditions(conditions.temperature, conditions.humidity, conditions.soilMoisture);
    
    // 3. Optional: Pass to Gemini for Insights
    let insights = null;
    let fallbackGenerated = false;

    try {
      insights = await generateFarmInsight({
        temperature: conditions.temperature,
        humidity: conditions.humidity,
        soilMoisture: conditions.soilMoisture,
        areaSqMeters: areaSqMeters || 10000,
        lat,
        lng
      });
    } catch(aiErr) {
      console.warn("AI Insight failed, using advanced rule-based fallback");
      fallbackGenerated = true;
      
      // Smart Fallback Logic
      const temp = conditions.temperature;
      const moisture = conditions.soilMoisture;
      let suitableCrops = ["Sorghum", "Millet"]; // default drought resistant
      let nextSteps = "Monitor conditions closely.";

      if (temp >= 20 && temp <= 30 && moisture >= 40 && moisture <= 70) {
        suitableCrops = ["Cotton", "Soybean", "Maize", "Wheat"];
        nextSteps = "Conditions are optimal. Maintain current irrigation and monitoring schedule.";
      } else if (temp > 30) {
        suitableCrops = ["Sorghum", "Pearl Millet", "Guar", "Castor"];
        nextSteps = "High temperatures detected. Increase irrigation frequency and consider shade netting for sensitive crops.";
      } else if (temp < 15) {
        suitableCrops = ["Mustard", "Chickpea", "Barley", "Winter Wheat"];
        nextSteps = "Low temperatures detected. Protect young plants from frost and reduce irrigation.";
      }

      if (moisture > 75) {
        suitableCrops = ["Rice", "Jute", "Sugarcane"];
        nextSteps = "Soil is very wet. Ensure proper drainage to prevent root rot and hold off on irrigation.";
      } else if (moisture < 25) {
        nextSteps = "Critical moisture deficit. Initiate emergency deep irrigation immediately.";
      }

      // If frontend passed context (optional enhancement)
      if (req.body.context && req.body.context.stateProfile) {
        suitableCrops = req.body.context.stateProfile.commonCrops || suitableCrops;
      }

      insights = {
        summary: `Local conditions indicate a ${rulesMatch.status.toLowerCase()} environment. Temperature is ${temp.toFixed(1)}°C with ${moisture.toFixed(1)}% soil moisture.`,
        suitableCrops: suitableCrops,
        cautions: rulesMatch.flags.length ? rulesMatch.flags : ["Maintain regular field checks to ensure stability"],
        nextSteps: nextSteps
      };
    }

    // Optional Authentication Check to Save Activity
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        try {
            const jwt = require('jsonwebtoken');
            token = token.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123'); // Ensure valid
            const userId = decoded.id;
            
            const { getConnected } = require('../config/db');
            if (getConnected()) {
              const AgronomistInsight = require('../models/AgronomistInsight');
              await AgronomistInsight.create({
                title: `Analysis: ${name || "Field Area"}`,
                message: `${insights.summary} ${insights.nextSteps}`,
                type: rulesMatch.status === 'Optimal' ? 'success' : (rulesMatch.status === 'Critical' ? 'danger' : 'warning'),
                timestamp: new Date()
              });
            } else {
              // Save to In-Memory mock database
              const zoneId = name || `Farm Zone ${Math.floor(Math.random() * 1000)}`;
              
              global.mockDatabase.zones.push({
                _id: Date.now().toString(),
                userId,
                zoneId,
                metrics: {
                  moisture: conditions.soilMoisture,
                  temperature: conditions.temperature,
                  ph: parseFloat((6.5 + (Math.random() * 1 - 0.5)).toFixed(1)),
                  nitrogen: Math.floor(150 + Math.random() * 50),
                  phosphorus: Math.floor(50 + Math.random() * 20),
                  potassium: Math.floor(100 + Math.random() * 40),
                  organic: parseFloat((2 + Math.random() * 3).toFixed(1))
                },
                status: rulesMatch.status,
                timestamp: new Date()
              });

              if (rulesMatch.status !== 'Optimal' || insights.cautions.length > 0) {
                const addressStr = req.body.context?.address ? ` - Loc: ${req.body.context.address}` : '';
                global.mockDatabase.alerts.push({
                  _id: Date.now().toString() + "-alert",
                  userId,
                  title: `${rulesMatch.status} Alert: ${zoneId}${addressStr}`,
                  message: `${insights.summary} ${insights.cautions.join(', ')}. ${insights.nextSteps}`,
                  type: rulesMatch.status === 'Critical' ? 'danger' : 'warning',
                  timestamp: new Date()
                });
              }

              const { saveStore } = require('../config/localStore');
              saveStore(global.mockDatabase);
            }
        } catch (e) {
            console.warn("Auth/DB error during save, skipping storage.");
        }
    }

    res.json({
        farmData: {
          name: name || "Analyzed Agricultural Area",
          lat, lng,
          areaSqMeters: areaSqMeters || null,
          source: conditions.source,
          updatedAt: conditions.updatedAt,
          weather: {
            temperature: conditions.temperature,
            humidity: conditions.humidity,
            soilMoisture: conditions.soilMoisture,
            status: rulesMatch.status
          }
        },
        insights: {
          ...insights,
          isFallback: fallbackGenerated,
          rulesFlags: rulesMatch.flags
        }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
