const express = require('express');
const router = express.Router();
const { getNearbyFarms, analyzeFarm } = require('../controllers/farmController');

router.get('/nearby', getNearbyFarms);
router.post('/analyze', analyzeFarm);
router.post('/manual-draw/analyze', analyzeFarm); // Uses the same logic at the moment

module.exports = router;
