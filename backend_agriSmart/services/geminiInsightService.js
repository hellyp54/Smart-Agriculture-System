const { GoogleGenerativeAI } = require("@google/generative-ai");

const generateFarmInsight = async (farmContext) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing from environment variables.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const farmSizeHa = farmContext.areaSqMeters
    ? (farmContext.areaSqMeters / 10000).toFixed(2)
    : "Unknown";

  const prompt = `
    You are an expert digital agronomist AI.
    Analyze the following farm context data and provide insights.
    
    Data:
    - Temperature: ${farmContext.temperature}°C
    - Humidity: ${farmContext.humidity}%
    - Soil Moisture: ${farmContext.soilMoisture}%
    - Farm Size: ${farmSizeHa} Hectares
    - Location: Lat ${farmContext.lat}, Lng ${farmContext.lng}
    
    Respond ONLY with a valid JSON object using these exact keys:
    {
      "summary": "2 sentence summary of current farm conditions",
      "suitableCrops": ["Crop1", "Crop2", "Crop3"],
      "cautions": ["Risk1", "Risk2"],
      "nextSteps": "One specific actionable recommendation for the farmer"
    }

    Output pure JSON only. No markdown, no code blocks, no extra text.
  `;

  try {
    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    // Strip any markdown code block wrappers Gemini may add
    text = text.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "").trim();
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini AI API Error:", err.message || err);
    throw new Error("Failed to generate AI insights.");
  }
};

module.exports = {
  generateFarmInsight
};
