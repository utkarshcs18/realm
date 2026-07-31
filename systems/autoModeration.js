const config = require("../config/config");
const { logModerationAction } = require("./logger");
const { v4: uuidv4 } = require('uuid');

const spamTracker = new Map();

function hasBadWords(content) {
  const normalized = content.toLowerCase();
  return config.moderation.badWords.some((word) => normalized.includes(word));
}

async function runAutoModeration(message) {
  if (!message.guild || message.author.bot) return false;

  if (hasBadWords(message.content)) {
    await message.delete().catch(() => null);
    await message.channel
      .send(`${message.author}, your message contained blocked words and was removed.`)
      .then((msg) => setTimeout(() => msg.delete().catch(() => null), 6000))
      .catch(() => null);

    const caseId = uuidv4();

    await logModerationAction({
      client: message.client,
      guildId: message.guild.id,
      type: "AUTOMOD: BAD WORD",
      details: {
        caseId,
        userId: message.author.id,
        modId: message.client.user.id,
        reason: "Blocked word detected.",
        channelId: message.channel.id
      }
    });
    return true;
  }

  const userKey = `${message.guild.id}:${message.author.id}`;
  const now = Date.now();
  const timestamps = spamTracker.get(userKey) || [];
  const filtered = timestamps.filter((ts) => now - ts <= config.moderation.spamWindowMs);
  filtered.push(now);
  spamTracker.set(userKey, filtered);

  if (filtered.length >= config.moderation.spamMessageLimit) {
    await message.delete().catch(() => null);
    await message.member.timeout(5 * 60 * 1000, "AutoMod anti-spam trigger").catch(() => null);
    spamTracker.delete(userKey);

    const caseId = uuidv4();

    await logModerationAction({
      client: message.client,
      guildId: message.guild.id,
      type: "AUTOMOD: SPAM TIMEOUT",
      details: {
        caseId,
        userId: message.author.id,
        modId: message.client.user.id,
        reason: "Spam detected.",
        channelId: message.channel.id
      }
    });
    return true;
  }

  return false;
}

module.exports = { runAutoModeration };
