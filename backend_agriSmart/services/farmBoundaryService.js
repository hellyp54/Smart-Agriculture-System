const axios = require("axios");
const turf = require("@turf/turf");

// Public Overpass API mirrors to rotate and avoid 429 errors
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
];

let mirrorIndex = 0;
const getMirror = () => OVERPASS_MIRRORS[mirrorIndex++ % OVERPASS_MIRRORS.length];

// Simple in-memory cache to prevent hammered requests on the same location
const queryCache = new Map();
const CACHE_TTL = 120000; // 2 minutes

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Agricultural landuse tags we care about (polygons, not POIs)
const AG_TAGS = [
  "farmland",
  "farmyard",
  "orchard",
  "vineyard",
  "meadow",
  "greenhouse_horticulture",
  "plant_nursery",
  "allotments",
  "village_green",
];

// Progressive radii to try (meters)
const SEARCH_RADII = [500, 1000, 2000, 5000, 10000];

/**
 * Build an Overpass QL query that returns WAY polygons for all ag landuse tags.
 * Does NOT filter by name — returns named and unnamed polygons.
 */
const buildQuery = (lat, lng, radius) => {
  const conditions = AG_TAGS.map(
    (tag) => `way["landuse"="${tag}"](around:${radius},${lat},${lng});`
  ).join("\n      ");

  // We also include relation types in case large farm areas are modelled as relations
  const relConditions = AG_TAGS.map(
    (tag) => `relation["landuse"="${tag}"](around:${radius},${lat},${lng});`
  ).join("\n      ");

  return `
    [out:json][timeout:25];
    (
      ${conditions}
      ${relConditions}
    );
    out geom;
  `;
};

/**
 * Convert a single Overpass way element to a GeoJSON Feature.
 * Names unnamed polygons with auto-generated labels.
 */
const wayToFeature = (el, index) => {
  if (el.type !== "way" || !el.geometry || el.geometry.length < 4) return null;

  // Build coordinate ring from geometry nodes
  const coords = el.geometry.map((p) => [p.lon, p.lat]);

  // Close the ring if not already closed
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    coords.push([first[0], first[1]]);
  }

  // Need at least 4 points for a valid polygon
  if (coords.length < 4) return null;

  let polygon, area, center;
  try {
    polygon = turf.polygon([coords]);
    area = turf.area(polygon);
    center = turf.centerOfMass(polygon);
  } catch (e) {
    return null; // Skip self-intersecting or otherwise invalid polygons
  }

  const tags = el.tags || {};
  const landuse = tags.landuse || "farmland";

  // Generate a human-readable label if unnamed
  const rawName = tags.name || tags["name:en"] || tags["alt_name"];
  const autoLabel = rawName
    ? rawName
    : generateAutoLabel(landuse, index, center.geometry.coordinates);

  return {
    type: "Feature",
    geometry: polygon.geometry,
    properties: {
      osmId: el.id,
      name: autoLabel,
      landuse,
      source: "OSM Mapped Polygon",
      // Future-ready field: 'satellite' | 'osm' | 'manual' | 'ai'
      boundaryType: "osm",
      areaSqMeters: Math.round(area),
      areaHa: +(area / 10000).toFixed(2),
      centerLat: center.geometry.coordinates[1],
      centerLng: center.geometry.coordinates[0],
      hasOfficialName: !!rawName,
      rawTags: tags,
    },
  };
};

/**
 * Auto-generate a meaningful label for unnamed polygons.
 */
const generateAutoLabel = (landuse, index, coords) => {
  const typeLabel = {
    farmland: "Agricultural Area",
    farmyard: "Farm Yard",
    orchard: "Orchard",
    vineyard: "Vineyard",
    meadow: "Meadow",
    greenhouse_horticulture: "Greenhouse Area",
    plant_nursery: "Plant Nursery",
    allotments: "Allotment Plot",
    village_green: "Village Green",
  }[landuse] || "Farm Parcel";

  return `${typeLabel} ${index + 1}`;
};

/**
 * Main export: fetch nearby agricultural polygons with progressive radius.
 * Returns a GeoJSON FeatureCollection.
 */
const getNearbyFarmBoundaries = async (lat, lng, requestedRadius = 2000) => {
  // Check cache first
  const cacheKey = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cachedResult = queryCache.get(cacheKey);
  if (cachedResult && (Date.now() - cachedResult.timestamp < CACHE_TTL)) {
    console.log("Returning cached farm boundaries for", cacheKey);
    return cachedResult.data;
  }

  // Build list of radii to try progressively
  const radiiToTry = SEARCH_RADII.filter((r) => r <= Math.max(requestedRadius, 10000));
  
  let features = [];
  let usedRadius = 0;

  for (const radius of radiiToTry) {
    usedRadius = radius;
    const query = buildQuery(lat, lng, radius);
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      const url = getMirror();
      try {
        const res = await axios.post(
          url,
          `data=${encodeURIComponent(query)}`,
          {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            timeout: 20000,
          }
        );

        const elements = res.data.elements || [];
        const parsedFeatures = elements
          .map((el, i) => wayToFeature(el, i))
          .filter(Boolean);

        if (parsedFeatures.length > 0) {
          features = parsedFeatures;
          console.log(
            `Found ${features.length} agricultural polygons within ${radius}m using mirror ${url}`
          );
          
          const result = {
            type: "FeatureCollection",
            features,
            meta: {
              count: features.length,
              usedRadius,
              lat,
              lng,
              searchedRadii: radiiToTry,
              source: url
            },
          };
          
          // Save to cache
          queryCache.set(cacheKey, { timestamp: Date.now(), data: result });
          return result;
        }

        console.log(`No polygons at ${radius}m on mirror ${url}, trying next...`);
        break; // Move to next radius if no results found on this mirror
      } catch (err) {
        attempts++;
        const isRateLimit = err.response && err.response.status === 429;
        console.warn(`Mirror ${url} error (${isRateLimit ? "429 Rate Limit" : err.message}). Attempt ${attempts}/${maxAttempts}`);
        
        if (isRateLimit) {
          await sleep(1500 * attempts); // Backoff with jitter
        }
        
        if (attempts >= maxAttempts) {
          console.error(`Giving up on radius ${radius}m after ${maxAttempts} failed mirrors.`);
        }
      }
    }
  }

  const emptyResult = {
    type: "FeatureCollection",
    features: [],
    meta: {
      count: 0,
      usedRadius,
      lat,
      lng,
      searchedRadii: radiiToTry,
    },
  };
  return emptyResult;
};

module.exports = {
  getNearbyFarmBoundaries,
};
