const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../mockDatabase.json');

const loadStore = () => {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (error) {
    console.error("Error reading local database file", error);
  }
  return { zones: [], alerts: [] };
};

const saveStore = (data) => {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to local database file", error);
  }
};

module.exports = { loadStore, saveStore };
