const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { v4: uuidv4 } = require('uuid');
const Warn = require("../../database/models/Warn");
const { logModerationAction } = require("../../systems/logger");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user.")
    .addUserOption((option) => option.setName("user").setDescription("User to warn").setRequired(true))
    .addStringOption((option) => option.setName("reason").setDescription("Warn reason"))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    // Acknowledge the command immediately to avoid the 3-second timeout
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    
    try {
      const user = interaction.options.getUser("user", true);
      const reason = interaction.options.getString("reason") || "No reason provided.";
      
      const caseId = uuidv4();

      await new Warn({
        guildId: interaction.guild.id,
        userId: user.id,
        moderatorId: interaction.user.id,
        caseId,
        reason
      }).save();

      await interaction.editReply(`Warned ${user.tag}.`);

      await logModerationAction({
        client: interaction.client,
        guildId: interaction.guild.id,
        type: "WARN",
        details: {
          caseId,
          userId: user.id,
          modId: interaction.user.id,
          reason,
          channelId: interaction.channelId
        }
      });
    } catch (err) {
      console.error("Warn Command Error:", err);
      await interaction.editReply("An error occurred while trying to warn this user. Please try again.");
    }
  }
};
