// database/models/CustomEmbed.js
const { Schema, model } = require('mongoose');

const customEmbedSchema = new Schema({
  guildId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  title: { type: String, default: null },
  description: { type: String, default: null },
  color: { type: String, default: '#5865F2' },
  thumbnailType: { type: String, default: 'none' },
  thumbnailUrl: { type: String, default: null },    
  imageUrl: { type: String, default: null },
  footerText: { type: String, default: null },
});

// Enforce unique names per guild
customEmbedSchema.index({ guildId: 1, name: 1 }, { unique: true });

module.exports = model('CustomEmbed', customEmbedSchema);
