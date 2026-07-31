// database/models/GuildConfig.js
const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
  guildId: { type: String, required: true, unique: true },
  welcomeChannelId: { type: String, default: null },
  welcomeMessage: { type: String, default: null },
  autoRoleId: { type: String, default: null },
  prefix: { type: String, default: '`' }, // backtick default
  embedCount: { type: Number, default: 0 },
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date, default: null },
  
  // New Multi-Guild Fields
  staffRoleIds: { type: [String], default: [] },
  ticketCategoryId: { type: String, default: null },
  ticketTranscriptChannelId: { type: String, default: null },
  modLogChannelId: { type: String, default: null },
  mutedRoleId: { type: String, default: null },
  welcomeEmbedName: { type: String, default: null },
  allowedVoiceChannelIds: { type: [String], default: [] },
  // Reaction roles: persists messageId -> roleId mappings across restarts
  reactionRoles: {
    type: [{ messageId: String, roleId: String }],
    default: [],
  },
});

module.exports = model('GuildConfig', guildConfigSchema);
