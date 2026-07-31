// config/config.js
require('dotenv').config();

function requiredEnv(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

// Snowflake validation to prevent Discord API crashes from dummy .env strings
function validSnowflake(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  // Discord IDs are typically 17-20 digit numbers
  return /^\d{17,20}$/.test(trimmed) ? trimmed : '';
}

function validSnowflakesArray(value) {
  if (!value || typeof value !== 'string') return [];
  return value.split(',').map(id => id.trim()).filter(id => /^\d{17,20}$/.test(id));
}

const config = {
  discord: {
    token: requiredEnv('DISCORD_TOKEN'),
    clientId: requiredEnv('DISCORD_CLIENT_ID'),
    guildId: requiredEnv('GUILD_ID'),
  },
  mongodb: {
    uri: requiredEnv('MONGODB_URI'),
  },
  botPrefix: (process.env.BOT_PREFIX || '`').trim(), // default: backtick
  permissions: {
    // Calculated permission integer for invite link (no Administrator)
    invite: 274878200896,
  },
  // Moderation settings
  moderation: {
    badWords: ['badword1', 'badword2'], // example bad words
    spamWindowMs: 5000, // time window for spam detection
    spamMessageLimit: 5, // messages allowed in window
    logChannelId: validSnowflake(process.env.MOD_LOG_CHANNEL_ID),
    mutedRoleId: validSnowflake(process.env.MUTED_ROLE_ID),
    staffRoleIds: validSnowflakesArray(process.env.STAFF_ROLE_IDS),
  },
  // Leveling settings
  leveling: {
    xpPerMessageMin: 15,
    xpPerMessageMax: 25,
    cooldownMs: 30000,
  },

  tickets: {
    categoryId: validSnowflake(process.env.TICKET_CATEGORY_ID),
    transcriptChannelId: validSnowflake(process.env.TRANSCRIPT_CHANNEL_ID),
  },
};


console.log(`[CONFIG] Bot prefix loaded as: "${config.botPrefix}" (charCode: ${config.botPrefix.charCodeAt(0)})`);
module.exports = config;
