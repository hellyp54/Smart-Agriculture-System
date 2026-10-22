module.exports = {
  activeProvider: "open-meteo",
  providers: {
    "open-meteo": {
      baseUrl: "https://api.open-meteo.com/v1/forecast",
      endpoints: {
        // Fetches current conditions + hourly soil moisture (all 24 hours) + daily min/max temp
        liveConditions: (lat, lng) =>
          `?latitude=${lat}&longitude=${lng}` +
          `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature` +
          `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,evapotranspiration` +
          `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,et0_fao_evapotranspiration` +
          `&timezone=auto&forecast_days=1`,
      },
    },
  },
};
