// commands/moderation/kick.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { checkPermissions } = require('../../middleware/permissions');
const { checkCooldown } = require('../../middleware/rateLimiter');
const { logAction } = require('../../systems/logger');
const { createEmbed } = require('../../utils/createEmbed');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server.')
    .addUserOption(opt => opt.setName('user').setDescription('User to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Kick reason'))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const hasPerm = await checkPermissions(interaction, ['KickMembers']);
    if (!hasPerm) return;

    if (!checkCooldown(interaction.client, interaction.user.id, 'kick', 4)) {
      return interaction.reply({ content: 'Command is on cooldown.', flags: MessageFlags.Ephemeral });
    }

    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'User not found in this guild.', flags: MessageFlags.Ephemeral });
    }

    await member.kick(reason);

    const caseId = uuidv4();
    await logAction({
      client: interaction.client,
      guildId: interaction.guildId,
      type: 'KICK',
      details: { caseId, userId: user.id, modId: interaction.user.id, reason, channelId: interaction.channelId },
    });

    const embed = createEmbed({
      title: 'User Kicked',
      description: `${user.tag} has been kicked.`,
      fields: [{ name: 'Reason', value: reason, inline: true }],
    });
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
