// commands/utility/reactionrole.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { sendReactionRoleMessage } = require("../../systems/reactionRoles");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reactionrole")
    .setDescription("Send a reaction role message.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addRoleOption(opt =>
      opt.setName("role")
        .setDescription("The role to assign when a user reacts")
        .setRequired(true)
    ),

  async execute(interaction) {
    const role = interaction.options.getRole("role", true);

    await sendReactionRoleMessage(interaction.channel, role.id);
    await interaction.reply({
      content: `✅ Reaction role message sent! Reacting with ✅ will grant **${role.name}**.`,
      flags: MessageFlags.Ephemeral,
    });
  }
};
