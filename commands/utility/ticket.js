const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require("discord.js");
const { buildTicketPanelEmbed, buildTicketPanelRow } = require("../../systems/ticketSystem");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Ticket system commands.")
    .addSubcommand((sub) => sub.setName("panel").setDescription("Send the ticket panel."))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    if (sub === "panel") {
      await interaction.channel.send({
        embeds: [buildTicketPanelEmbed()],
        components: [buildTicketPanelRow()]
      });
      return interaction.reply({ content: "Ticket panel sent.", flags: MessageFlags.Ephemeral });
    }
  }
};
