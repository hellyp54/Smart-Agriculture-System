const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.warn('⚠️  MONGO_URI not set in .env — running WITHOUT database. Zone saving/history disabled.');
        return;
    }

    try {
        const conn = await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000, // fail fast — don't hang
        });
        isConnected = true;
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`⚠️  MongoDB connection failed: ${error.message}`);
        console.warn('   Running WITHOUT database — zone saving/history disabled.');
        // DO NOT call process.exit(1) — let the server keep running
    }
};

const getConnected = () => isConnected;

module.exports = connectDB;
module.exports.getConnected = getConnected;