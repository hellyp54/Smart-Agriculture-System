/**
 * Rule-based evaluation of farm environmental conditions
 */
const evaluateConditions = (temperature, humidity, soilMoisture) => {
  const flags = [];
  let status = "Optimal";

  if (temperature > 35) {
    flags.push("Heat stress warning");
    status = "Critical";
  } else if (temperature < 5) {
    flags.push("Frost risk");
    status = "Warning";
  }

  if (soilMoisture < 20) {
    flags.push("Severe drought risk - Irrigation strongly recommended");
    if (status !== "Critical") status = "Warning";
  } else if (soilMoisture > 85) {
    flags.push("Waterlogging risk - Drain field");
    if (status !== "Critical") status = "Warning";
  }

  if (humidity > 90 && temperature > 20) {
    flags.push("High risk of fungal disease");
  }

  return {
    status,
    flags
  };
};

module.exports = {
  evaluateConditions
};
