const mongoose = require('mongoose');

const FieldZoneSchema = new mongoose.Schema({
    name: { type: String, required: true },
    location: {
        type: { type: String, enum: ['Polygon'], required: true },
        coordinates: { type: [[[Number]]], required: true } // Array of [lng, lat]
    },
    metrics: {
        ndvi: { type: Number, default: 0.8 },
        moisture: { type: Number, default: 45 },
        temperature: { type: Number, default: 22 },
        humidity: { type: Number, default: 60 },
        cropType: { type: String, default: 'Wheat' }
    },
    lastUpdated: { type: Date, default: Date.now }
});
// Enable geospatial indexing for real-time location queries
FieldZoneSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('FieldZone', FieldZoneSchema);