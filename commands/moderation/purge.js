// commands/moderation/purge.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require('discord.js');
const { checkPermissions } = require('../../middleware/permissions');
const { logAction } = require('../../systems/logger');
const { createEmbed } = require('../../utils/createEmbed');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a number of recent messages.')
    .addIntegerOption(opt =>
      opt.setName('amount')
        .setDescription('Number of messages to delete (max 100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const hasPerm = await checkPermissions(interaction, ['ManageMessages']);
    if (!hasPerm) return;

    const amount = interaction.options.getInteger('amount');
    const channel = interaction.channel;
    if (!channel?.isTextBased()) {
      return interaction.reply({ content: 'This command can only be used in text channels.', flags: MessageFlags.Ephemeral });
    }

    try {
      await channel.bulkDelete(amount, true);
    } catch (err) {
      return interaction.reply({ content: 'Failed to delete messages. Ensure they are not older than 14 days.', flags: MessageFlags.Ephemeral });
    }

    // Log the purge action
    const caseId = uuidv4();
    await logAction({
      client: interaction.client,
      guildId: interaction.guildId,
      type: 'PURGE',
      details: {
        caseId,
        amount,
        moderatorId: interaction.user.id,
        channelId: interaction.channelId,
      },
    });

    const embed = createEmbed({
      title: 'Messages Purged',
      description: `${amount} messages have been deleted.`,
      fields: [{ name: 'Case ID', value: caseId, inline: true }],
    });
    
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
