// commands/utility/setup.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require('discord.js');
const { buildDashboardEmbed, buildMainDropdownRow } = require('../../systems/setupSystem');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configure bot settings for this server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = await buildDashboardEmbed(interaction.guild);
    const row = buildMainDropdownRow();

    await interaction.reply({
      embeds: [embed],
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }
};
