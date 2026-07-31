// commands/moderation/mute.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { checkPermissions } = require('../../middleware/permissions');
const { logAction } = require('../../systems/logger');
const { createEmbed } = require('../../utils/createEmbed');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user (up to 28 days).')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g., 10m, 1h, 2d)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const hasPerm = await checkPermissions(interaction, ['ModerateMembers']);
    if (!hasPerm) return;

    const user = interaction.options.getUser('user', true);
    const durationStr = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided.';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ content: 'User not found in this guild.', flags: MessageFlags.Ephemeral });
    }

    // Parse duration: supports s, m, h, d
    const match = durationStr.match(/^(\d+)(s|m|h|d)$/);
    if (!match) {
      return interaction.reply({ content: 'Invalid duration format. Use like: `10m`, `1h`, `2d`.', flags: MessageFlags.Ephemeral });
    }
    const value = parseInt(match[1]);
    const unit = match[2];
    const msMap = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
    const timeoutMs = value * msMap[unit];

    if (timeoutMs > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: 'Maximum timeout duration is 28 days.', flags: MessageFlags.Ephemeral });
    }

    await member.timeout(timeoutMs, reason);

    const caseId = uuidv4();
    await logAction({
      client: interaction.client,
      guildId: interaction.guildId,
      type: 'MUTE',
      details: { caseId, userId: user.id, modId: interaction.user.id, reason, channelId: interaction.channelId },
    });

    const embed = createEmbed({
      title: 'User Timed Out',
      description: `${user.tag} has been muted for **${durationStr}**.`,
      fields: [{ name: 'Reason', value: reason, inline: true }],
    });
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
