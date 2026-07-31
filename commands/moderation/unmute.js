const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { v4: uuidv4 } = require('uuid');
const config = require("../../config/config");
const { logModerationAction } = require("../../systems/logger");
const GuildConfig = require("../../database/models/GuildConfig");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unmute")
    .setDescription("Unmute/remove timeout from a user.")
    .addUserOption((option) => option.setName("user").setDescription("User to unmute").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Unmute reason"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const user = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason") || "No reason provided.";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (!member) {
      return interaction.reply({ content: "User not found in this guild.", flags: MessageFlags.Ephemeral });
    }

    // 1. Remove native Discord timeout if active
    let timeoutRemoved = false;
    if (member.communicationDisabledUntilTimestamp && member.communicationDisabledUntilTimestamp > Date.now()) {
      await member.timeout(null, reason);
      timeoutRemoved = true;
    }

    // 2. Remove Muted Role if configured
    let roleRemoved = false;
    const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
    const mutedRoleId = guildConfig?.mutedRoleId || config.moderation.mutedRoleId;
    
    if (mutedRoleId && member.roles.cache.has(mutedRoleId)) {
      await member.roles.remove(mutedRoleId, reason);
      roleRemoved = true;
    }

    if (!timeoutRemoved && !roleRemoved) {
      return interaction.reply({ content: `${user.tag} is not timed out or muted.`, flags: MessageFlags.Ephemeral });
    }

    const caseId = uuidv4();

    await interaction.reply({ content: `✅ Unmuted ${user.tag}.`, flags: MessageFlags.Ephemeral });

    await logModerationAction({
      client: interaction.client,
      guildId: interaction.guild.id,
      type: "UNMUTE",
      details: {
        caseId,
        userId: user.id,
        modId: interaction.user.id,
        reason,
        channelId: interaction.channelId
      }
    });
  }
};
