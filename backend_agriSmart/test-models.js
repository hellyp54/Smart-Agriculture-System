// Full pipeline test: weather + Gemini AI
const { getLiveConditions } = require("./services/liveConditionsService");
const { generateFarmInsight } = require("./services/geminiInsightService");
const { evaluateConditions } = require("./services/cropRecommendationService");
require("dotenv").config();

(async () => {
  try {
    const lat = 21.1702, lng = 72.8311;
    console.log("1. Fetching live conditions...");
    const conditions = await getLiveConditions(lat, lng);
    console.log("   ✅ Temp:", conditions.temperature, "Humidity:", conditions.humidity, "Soil:", conditions.soilMoisture);

    console.log("2. Running rule evaluation...");
    const rules = evaluateConditions(conditions.temperature, conditions.humidity, conditions.soilMoisture);
    console.log("   ✅ Status:", rules.status, "Flags:", rules.flags);

    console.log("3. Calling Gemini AI...");
    const insights = await generateFarmInsight({
      temperature: conditions.temperature,
      humidity: conditions.humidity,
      soilMoisture: conditions.soilMoisture,
      areaSqMeters: null, // Testing the null case
      lat, lng
    });
    console.log("   ✅ AI Summary:", insights.summary);
    console.log("   ✅ Crops:", insights.suitableCrops);
    console.log("   ✅ Cautions:", insights.cautions);
    console.log("\n✅ FULL PIPELINE WORKING!");
  } catch (err) {
    console.error("❌ Pipeline Error:", err.message);
  }
})();
