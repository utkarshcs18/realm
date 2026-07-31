// commands/music/resume.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused playback.'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue) {
      return interaction.reply({ content: '❌ No active music session.', flags: MessageFlags.Ephemeral });
    }

    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice || memberVoice.id !== queue.channel?.id) {
      return interaction.reply({
        content: `❌ You need to be in <#${queue.channel?.id}> to control the music!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!queue.node.isPaused()) {
      return interaction.reply({ content: '▶️ Playback is already running!', flags: MessageFlags.Ephemeral });
    }

    queue.node.resume();

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('▶️ Resumed')
      .setDescription(`Resumed **${queue.currentTrack?.title}**`);

    return interaction.reply({ embeds: [embed] });
  },
};
