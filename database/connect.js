// database/connect.js
const mongoose = require('mongoose');
const logger = require('../utils/appLogger');
const config = require('../config/config');


async function connectDatabase() {
  const uri = config.mongodb.uri;
  const options = {}; 

  const maxAttempts = 5;
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      await mongoose.connect(uri, options);
      logger.info('✅ Connected to MongoDB');
      break;
    } catch (err) {
      attempts += 1;
      logger.error(`MongoDB connection attempt ${attempts} failed: ${err.message}`);
      if (attempts >= maxAttempts) {
        throw err;
      }
      // exponential backoff
      await new Promise((r) => setTimeout(r, 2000 * attempts));
    }
  }
}

module.exports = { connectDatabase };
