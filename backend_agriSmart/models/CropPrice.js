const mongoose = require('mongoose');

const CropPriceSchema = new mongoose.Schema({
    cropName: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    trend: { type: String, enum: ['up', 'down', 'stable'] }
}, { timestamps: true });

module.exports = mongoose.model('CropPrice', CropPriceSchema);