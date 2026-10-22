const axios = require("axios");
const providerConfig = require("../config/providerConfig");

const getApiCache = () => { try { return require("../models/ApiCache"); } catch { return null; } };
const getFieldZone = () => { try { return require("../models/FieldZone"); } catch { return null; } };
const getSensor = () => { try { return require("../models/Sensor"); } catch { return null; } };

const { getConnected } = require("../config/db");

// Cache TTL: 10 minutes (fresh enough for real-time use, avoids stale desert data)
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Fetch live weather + soil moisture from Open-Meteo.
 * Key fix: uses the CURRENT HOUR index for soil moisture, not index[0] (midnight).
 * Also fetches daily max/min temperature for daytime context.
 */
const fetchFromProvider = async (lat, lng) => {
  const provider = providerConfig.providers[providerConfig.activeProvider];
  const url = `${provider.baseUrl}${provider.endpoints.liveConditions(lat, lng)}`;

  try {
    const res = await axios.get(url, { timeout: 10000 });
    const data = res.data;

    const current = data.current || {};
    const hourly = data.hourly || {};
    const daily = data.daily || {};

    // ── Current readings ─────────────────────────────────────────────────
    const temperature = current.temperature_2m ?? 25;
    const humidity = current.relative_humidity_2m ?? 60;
    const windSpeed = current.wind_speed_10m ?? 0;
    const apparentTemp = current.apparent_temperature ?? temperature;

    // ── Soil Moisture: use CURRENT HOUR index ───────────────────────────
    // API returns 24 hourly values — pick the value for the current hour
    const nowISO = current.time || new Date().toISOString(); // e.g. "2024-04-22T14:00"
    const currentHour = parseInt(nowISO.slice(11, 13), 10) || new Date().getHours();

    // Try from shallowest to deepest layer for best accuracy
    const sm0 = hourly.soil_moisture_0_to_1cm?.[currentHour];
    const sm1 = hourly.soil_moisture_1_to_3cm?.[currentHour];
    const sm3 = hourly.soil_moisture_3_to_9cm?.[currentHour];

    // Use deepest available non-null reading (more stable)
    const rawSM = sm1 ?? sm0 ?? sm3 ?? 0.25;

    // Convert from volumetric (m³/m³) to percentage — clamp 0–100
    let soilMoisture = Math.round(rawSM * 100);
    soilMoisture = Math.max(3, Math.min(95, soilMoisture));

    // ── Daily max/min for regional context ─────────────────────────────
    const tempMax = daily.temperature_2m_max?.[0] ?? temperature;
    const tempMin = daily.temperature_2m_min?.[0] ?? temperature;
    const precipSum = daily.precipitation_sum?.[0] ?? 0;
    const et0 = daily.et0_fao_evapotranspiration?.[0] ?? 3;

    // ── Derive aridity index (ET0 / (precip+1)) — high = arid region ──
    const aridityIndex = parseFloat((et0 / (precipSum + 1)).toFixed(2));

    return {
      temperature,           // Current (may be nighttime)
      temperatureMax: parseFloat(tempMax.toFixed(1)),  // Today's max — crucial for Rajasthan
      temperatureMin: parseFloat(tempMin.toFixed(1)),
      humidity,
      soilMoisture,
      windSpeed,
      apparentTemp: parseFloat(apparentTemp.toFixed(1)),
      precipitation: parseFloat(precipSum.toFixed(1)),
      aridityIndex,          // Key indicator for desert/semi-arid classification
      soilMoistureDepth: "1-3cm",
      source: "Open-Meteo API",
      updatedAt: new Date().toISOString(),
      status: "Optimal",
    };
  } catch (error) {
    console.error("Open-Meteo fetch error:", error.message);
    throw new Error("External weather API failed");
  }
};

/**
 * Try to find a nearby hardware sensor.
 * Skipped entirely if DB is not connected.
 */
const tryGetSensorData = async (lat, lng) => {
  if (!getConnected()) return null;

  const FieldZone = getFieldZone();
  const Sensor = getSensor();
  if (!FieldZone || !Sensor) return null;

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("sensor_lookup_timeout")), 3000)
  );
  const dbQuery = FieldZone.findOne({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: 5000,
      },
    },
  });

  try {
    const closestField = await Promise.race([dbQuery, timeout]);
    if (!closestField) return null;

    const sensor = await Sensor.findOne({ zoneId: closestField._id }).sort({ createdAt: -1 });
    if (!sensor) return null;

    return {
      areaName: closestField.name,
      lat, lng,
      temperature: sensor.temperature,
      humidity: sensor.humidity,
      soilMoisture: sensor.moisture,
      soilMoistureDepth: "Sensor Depth",
      source: "Hardware Sensor",
      updatedAt: sensor.createdAt,
      status: "Optimal",
    };
  } catch (err) {
    if (err.message !== "sensor_lookup_timeout") {
      console.warn("Sensor lookup skipped:", err.message);
    }
    return null;
  }
};

const getLiveConditions = async (lat, lng) => {
  // 1. Try hardware sensor first (fastest, only if DB connected)
  const sensorData = await tryGetSensorData(lat, lng);
  if (sensorData) return sensorData;

  // 2. Check API cache (only if DB connected AND cache is fresh)
  if (getConnected()) {
    const ApiCache = getApiCache();
    if (ApiCache) {
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      try {
        const cached = await ApiCache.findOne({ key: cacheKey });
        if (cached) {
          const age = Date.now() - new Date(cached.data.updatedAt).getTime();
          if (age < CACHE_TTL_MS) {
            // Cache is still fresh (< 10 minutes)
            return { ...cached.data, areaName: "Selected Area", lat, lng, source: "Open-Meteo API (Cached)" };
          } else {
            // Cache expired — delete it and fetch fresh
            ApiCache.deleteOne({ key: cacheKey }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn("Cache lookup failed:", err.message);
      }
    }
  }

  // 3. Fetch fresh data from Open-Meteo
  const apiData = await fetchFromProvider(lat, lng);

  // Save to cache (non-blocking, only if DB connected)
  if (getConnected()) {
    const ApiCache = getApiCache();
    if (ApiCache) {
      const cacheKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
      ApiCache.create({ key: cacheKey, data: apiData }).catch((err) =>
        console.warn("Cache save failed:", err.message)
      );
    }
  }

  return { ...apiData, areaName: "Selected Area", lat, lng };
};

module.exports = { getLiveConditions };
