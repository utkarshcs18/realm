const { SlashCommandBuilder, MessageFlags} = require('discord.js');
const { createEmbed } = require('../../utils/createEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display available commands'),
  async execute(interaction) {
    const commands = interaction.client.commands.map(cmd => `/${cmd.data.name} – ${cmd.data.description}`).join('\n');
    const embed = createEmbed({
      title: 'Help – Command List',
      description: commands,
    });

    try {
      await interaction.user.send({ embeds: [embed] });
      await interaction.reply({ content: '📬 I have sent you a DM with all the commands!', flags: MessageFlags.Ephemeral });
    } catch (err) {
      // This happens if the user has DMs disabled for this server
      await interaction.reply({ content: '❌ I tried to send you a DM, but your DMs are closed! Please enable DMs to receive the help menu.', flags: MessageFlags.Ephemeral });
    }
  },
};
