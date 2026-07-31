// commands/moderation/ban.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { checkPermissions } = require('../../middleware/permissions');
const { checkCooldown } = require('../../middleware/rateLimiter');
const { logAction } = require('../../systems/logger');
const { createEmbed } = require('../../utils/createEmbed');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server.')
    .addUserOption(opt => opt.setName('user').setDescription('User to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Ban reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const hasPerm = await checkPermissions(interaction, ['BanMembers']);
    if (!hasPerm) return;

    if (!checkCooldown(interaction.client, interaction.user.id, 'ban', 4)) {
      return interaction.reply({ content: 'Command is on cooldown.', flags: MessageFlags.Ephemeral });
    }

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'User not found in this guild.', flags: MessageFlags.Ephemeral });
    }

    await member.ban({ reason });

    const caseId = uuidv4();
    await logAction({
      client: interaction.client,
      guildId: interaction.guildId,
      type: 'BAN',
      details: { caseId, userId: user.id, modId: interaction.user.id, reason, channelId: interaction.channelId },
    });

    const embed = createEmbed({
      title: 'User Banned',
      description: `${user.tag} has been banned.`,
      fields: [{ name: 'Reason', value: reason, inline: true }],
    });
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
