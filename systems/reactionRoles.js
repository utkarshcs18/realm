const { EmbedBuilder } = require("discord.js");
const GuildConfig = require("../database/models/GuildConfig");

// In-memory map: messageId -> roleId (populated on startup from DB and on new role setup)
const roleMap = new Map();

/**
 * Loads all persisted reaction role mappings from the DB into the in-memory map.
 * Must be called on bot ready so mappings survive restarts.
 * @param {import('discord.js').Client} client
 */
async function loadReactionRoles(client) {
  try {
    const configs = await GuildConfig.find({ 'reactionRoles.0': { $exists: true } });
    let count = 0;
    for (const config of configs) {
      for (const { messageId, roleId } of config.reactionRoles) {
        if (messageId && roleId) {
          roleMap.set(messageId, roleId);
          count++;
        }
      }
    }
    console.log(`[ReactionRoles] Loaded ${count} mapping(s) from database.`);
  } catch (err) {
    console.error('[ReactionRoles] Failed to load role mappings:', err);
  }
}

/**
 * Sends a reaction role message and persists the messageId -> roleId mapping.
 * @param {import('discord.js').TextChannel} channel
 * @param {string} roleId
 * @returns {{ messageId: string, roleId: string }}
 */
async function sendReactionRoleMessage(channel, roleId) {
  const embed = new EmbedBuilder()
    .setColor(0xfee75c)
    .setTitle("Reaction Roles")
    .setDescription("React with ✅ to get the role.");

  const message = await channel.send({ embeds: [embed] });
  await message.react('✅');

  // Store in memory
  roleMap.set(message.id, roleId);

  // Persist to DB so it survives restarts
  try {
    let config = await GuildConfig.findOne({ guildId: channel.guild.id });
    if (!config) config = await GuildConfig.create({ guildId: channel.guild.id });

    // Remove any stale entry for this message (shouldn't exist, but be safe)
    config.reactionRoles = config.reactionRoles.filter(r => r.messageId !== message.id);
    config.reactionRoles.push({ messageId: message.id, roleId });
    await config.save();
  } catch (err) {
    console.error('[ReactionRoles] Failed to persist reaction role to DB:', err);
  }

  return { messageId: message.id, roleId };
}

/**
 * Handles a reaction add/remove event to assign or revoke a role.
 * @param {import('discord.js').MessageReaction} reaction
 * @param {import('discord.js').User} user
 * @param {boolean} add
 */
async function handleReactionRole(reaction, user, add) {
  if (user.bot) return;
  if (reaction.emoji.name !== '✅') return;

  // Fetch partial message if needed so guild is accessible
  if (reaction.message.partial) {
    await reaction.message.fetch().catch(() => null);
  }
  if (!reaction.message.guild) return;

  const roleId = roleMap.get(reaction.message.id);
  if (!roleId) return; // No role associated with this message

  const guild = reaction.message.guild;
  const role = guild.roles.cache.get(roleId) || (await guild.roles.fetch(roleId).catch(() => null));
  if (!role) return;

  const member = await guild.members.fetch(user.id).catch(() => null);
  if (!member) return;

  if (add) {
    await member.roles.add(role).catch(err =>
      console.error(`[ReactionRoles] Failed to add role ${roleId} to ${user.id}:`, err)
    );
  } else {
    await member.roles.remove(role).catch(err =>
      console.error(`[ReactionRoles] Failed to remove role ${roleId} from ${user.id}:`, err)
    );
  }
}

module.exports = { loadReactionRoles, sendReactionRoleMessage, handleReactionRole };
