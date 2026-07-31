// events/guildMemberAdd.js
const GuildConfig = require('../database/models/GuildConfig');
const CustomEmbed = require('../database/models/CustomEmbed');
const { compileEmbed } = require('../utils/compileEmbed');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    const guildConfig = await GuildConfig.findOne({ guildId: member.guild.id });
    if (!guildConfig?.welcomeChannelId || !guildConfig?.welcomeEmbedName) return;

    const channel = await member.guild.channels.fetch(guildConfig.welcomeChannelId).catch(() => null);
    if (!channel?.isTextBased()) return;

    const template = await CustomEmbed.findOne({
      guildId: member.guild.id,
      name: guildConfig.welcomeEmbedName,
    });

    if (!template) {
      console.warn(`[Welcome] Embed template "${guildConfig.welcomeEmbedName}" not found for guild ${member.guild.id}. Skipping welcome.`);
      return;
    }

    const embed = compileEmbed(template, member);
    await channel.send({ embeds: [embed] }).catch(() => null);
  },
};
