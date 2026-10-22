const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const MonitoringData = require('./models/MonitoringData');
const AgronomistInsight = require('./models/AgronomistInsight');
const User = require('./models/User');

const MONGO_URI = 'mongodb+srv://Helly:456@cluster0.fvhhsjq.mongodb.net/de_agriSmart2';

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Reading mockDatabase.json...');
    const data = JSON.parse(fs.readFileSync('mockDatabase.json', 'utf8'));

    console.log('Clearing existing data...');
    await MonitoringData.deleteMany({});
    await AgronomistInsight.deleteMany({});
    await User.deleteMany({});

    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const users = [
      { name: 'Admin', email: 'admin@gmail.com', phone: '1234567890', password: hashedPassword, role: 'Farmer' },
      { name: 'Helly', email: 'helly@gmail.com', phone: '1234567890', password: hashedPassword, role: 'Farmer' },
      { name: 'Pujan', email: 'pujan@gmail.com', phone: '1234567890', password: hashedPassword, role: 'Farmer' }
    ];
    await User.insertMany(users);

    console.log('Inserting MonitoringData...');
    const zonesToInsert = data.zones.map(z => {
      const copy = { ...z };
      delete copy._id; // Let Mongo generate ID
      return copy;
    });
    await MonitoringData.insertMany(zonesToInsert);

    console.log('Inserting AgronomistInsights...');
    const alertsToInsert = data.alerts.map(a => {
      const copy = { ...a };
      delete copy._id;
      return copy;
    });
    await AgronomistInsight.insertMany(alertsToInsert);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
