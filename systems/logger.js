// systems/logger.js
const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

/**
 * Logs a moderation action to the configured log channel.
 * Accepts an object containing client, guildId, type, and details.
 * @param {Object} param0 - Payload.
 * @param {Object} param0.client - Discord client instance.
 * @param {string} param0.guildId - ID of the guild where the action occurred.
 * @param {string} param0.type - Action type (e.g., BAN, KICK, PURGE).
 * @param {Object} param0.details - Additional info (caseId, userId, modId, reason, channelId, amount, etc.).
 */
async function logAction({ client, guildId, type, details }) {
  try {
    const guild = await client.guilds.fetch(guildId);
    
    // Fetch log channel from DB, fall back to global env config
    const GuildConfig = require('../database/models/GuildConfig');
    const guildConfig = await GuildConfig.findOne({ guildId });
    const channelId = guildConfig?.modLogChannelId || config.moderation?.logChannelId || details.channelId;
    
    if (!channelId) return;
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setColor(0xff9900)
      .setTitle('Moderation Action')
      .addFields(
        { name: 'Action', value: type, inline: true },
        { name: 'Target', value: `<@${details.userId || details.targetId || ''}>`, inline: true },
        { name: 'Moderator', value: `<@${details.modId || details.moderatorId || ''}>`, inline: true },
        { name: 'Reason', value: details.reason || 'No reason provided.', inline: false }
      );
    if (details.caseId) embed.addFields({ name: 'Case ID', value: details.caseId, inline: true });
    if (details.amount) embed.addFields({ name: 'Amount', value: `${details.amount}`, inline: true });
    embed.setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Failed moderation logging:', error);
  }
}

module.exports = { logAction, logModerationAction: logAction };
