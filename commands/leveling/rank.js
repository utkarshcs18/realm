const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const UserLevel = require("../../database/models/UserLevel");
const { requiredXpForLevel } = require("../../systems/leveling");
const { createEmbed } = require("../../utils/createEmbed");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Show rank and XP.")
    .addUserOption((option) => option.setName("user").setDescription("User to check")),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user") || interaction.user;
    
    const data = await UserLevel.findOne({ guildId: interaction.guildId, userId: targetUser.id });
    if (!data) return interaction.reply({ content: 'No rank data found.', flags: MessageFlags.Ephemeral });

    const nextLevelXp = requiredXpForLevel(data.level);

    const embed = createEmbed({
      title: `${targetUser.username}'s Rank`,
      fields: [
        { name: 'Level', value: `${data.level}`, inline: true },
        { name: 'XP', value: `${data.xp}/${nextLevelXp}`, inline: true },
      ],
      thumbnail: targetUser.displayAvatarURL(),
    });

    await interaction.reply({ embeds: [embed] });
  },
};
