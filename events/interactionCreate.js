const { MessageFlags } = require("discord.js");
const {
  createTicketForUser,
  closeTicket,
  deleteTicket
} = require("../systems/ticketSystem");
const { handleSetupInteraction } = require("../systems/setupSystem");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    // Route any configuration setup interaction
    if (
      (interaction.isButton() ||
       interaction.isStringSelectMenu() ||
       interaction.isChannelSelectMenu() ||
       interaction.isRoleSelectMenu() ||
       interaction.isModalSubmit()) &&
      interaction.customId?.startsWith("setup:")
    ) {
      return handleSetupInteraction(interaction);
    }

    // Route any embed builder interaction
    if (
      (interaction.isButton() ||
       interaction.isModalSubmit()) &&
      interaction.customId?.startsWith("emb_build:")
    ) {
      const { handleBuilderInteraction } = require("../systems/embedBuilderSystem");
      return handleBuilderInteraction(interaction);
    }

    // Slash command handler
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction, client);
      } catch (error) {
        console.error(`Error in /${interaction.commandName}:`, error);
        const payload = { content: "There was an error executing this command.", flags: MessageFlags.Ephemeral };
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload).catch(() => null);
        } else {
          await interaction.reply(payload).catch(() => null);
        }
      }
    }

    // Ticket button handlers — wrapped in try/catch so a DB error
    // never leaves the interaction hanging with no response
    if (interaction.isButton()) {
      if (interaction.customId === "ticket:create") {
        try {
          return await createTicketForUser(interaction);
        } catch (err) {
          console.error('[Ticket] createTicketForUser error:', err);
          return interaction.reply({ content: '❌ Failed to create ticket. Please try again.', flags: MessageFlags.Ephemeral }).catch(() => null);
        }
      }
      if (interaction.customId === "ticket:close") {
        try {
          return await closeTicket(interaction);
        } catch (err) {
          console.error('[Ticket] closeTicket error:', err);
          return interaction.reply({ content: '❌ Failed to close ticket. Please try again.', flags: MessageFlags.Ephemeral }).catch(() => null);
        }
      }
      if (interaction.customId === "ticket:delete") {
        try {
          return await deleteTicket(interaction);
        } catch (err) {
          console.error('[Ticket] deleteTicket error:', err);
          return interaction.reply({ content: '❌ Failed to delete ticket. Please try again.', flags: MessageFlags.Ephemeral }).catch(() => null);
        }
      }
    }
  }
};
