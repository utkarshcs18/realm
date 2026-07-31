const { SlashCommandBuilder, MessageFlags} = require("discord.js");
const UserLevel = require("../../database/models/UserLevel");
const { createEmbed } = require("../../utils/createEmbed");
const GuildConfig = require("../../database/models/GuildConfig");

module.exports = {
  data: new SlashCommandBuilder().setName("leaderboard").setDescription("Show top leveling users."),
  async execute(interaction) {
    const top = await UserLevel.find({ guildId: interaction.guild.id })
      .sort({ level: -1, xp: -1 })
      .limit(10);

    if (!top.length) return interaction.reply({ content: "No leaderboard data yet.", flags: MessageFlags.Ephemeral });

    const lines = await Promise.all(
      top.map(async (entry, index) => {
        const user = await interaction.client.users.fetch(entry.userId).catch(() => null);
        return `**${index + 1}.** ${user ? user.tag : entry.userId} - Level ${entry.level} (${entry.xp} XP)`;
      })
    );

    const embed = createEmbed({
      title: 'Leaderboard',
      description: lines.join('\n'),
    });
    await interaction.reply({ embeds: [embed] });
  }
};
