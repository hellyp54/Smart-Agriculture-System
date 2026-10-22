const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  role: {
    type: String,
    enum: ['Farmer', 'Expert', 'Buyer'],
    default: 'Farmer'
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);