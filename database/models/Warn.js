// database/models/Warn.js
const { Schema, model } = require('mongoose');

const warnSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  moderatorId: { type: String, required: true },
  caseId: { type: String, required: true, unique: true },
  reason: { type: String, default: 'No reason provided.' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = model('Warn', warnSchema);
