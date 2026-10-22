const express = require("express");
const router = express.Router();

const {
  getAlerts,
  addAlert,
  resolveAlert,
} = require("../controllers/alertController");

router.get("/", getAlerts);
router.post("/add", addAlert);
router.put("/resolve/:id", resolveAlert);
// app.use("/api/alerts", alertRoutes);
module.exports = router;