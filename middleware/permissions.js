// middleware/permissions.js
const { PermissionsBitField, MessageFlags} = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');
const logger = require('../utils/appLogger');

/**
 * Checks if a member has the required Discord permission(s) and any custom role restrictions.
 * @param {Interaction} interaction - The command interaction.
 * @param {Array<string>} requiredPermissions - Array of Discord permission strings.
 * @param {Array<string>} [requiredRoleIds] - Optional array of role IDs that are allowed.
 * @returns {boolean} - True if allowed, otherwise replies with an error and returns false.
 */
async function checkPermissions(interaction, requiredPermissions = [], requiredRoleIds = []) {
  if (!interaction.inGuild()) {
    await interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
    return false;
  }

  const member = interaction.member;
  const missing = [];

  // Discord permission check
  const perms = new PermissionsBitField(requiredPermissions);
  if (!member.permissions.has(perms)) {
    missing.push(...requiredPermissions);
  }

  // Custom role restriction check (if any roles are defined in guild config)
  if (requiredRoleIds.length > 0) {
    const guildConfig = await GuildConfig.findOne({ guildId: interaction.guildId }).lean();
    const allowedRoles = guildConfig?.staffRoleIds || [];
    const hasAllowedRole = member.roles.cache.some((role) => allowedRoles.includes(role.id));
    if (!hasAllowedRole) {
      missing.push('custom role');
    }
  }

  if (missing.length > 0) {
    await interaction.reply({
      content: `You lack the required permission(s): ${missing.join(', ')}`,
      flags: MessageFlags.Ephemeral,
    });
    logger.warn(`Permission denied for ${interaction.user.tag} on ${interaction.commandName}`);
    return false;
  }

  return true;
}

module.exports = { checkPermissions };
