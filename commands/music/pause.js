// commands/music/pause.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the currently playing track.'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || !queue.isPlaying()) {
      return interaction.reply({ content: '❌ Nothing is currently playing.', flags: MessageFlags.Ephemeral });
    }

    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice || memberVoice.id !== queue.channel?.id) {
      return interaction.reply({
        content: `❌ You need to be in <#${queue.channel?.id}> to control the music!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    queue.node.pause();

    const embed = new EmbedBuilder()
      .setColor('#F0A500')
      .setTitle('⏸️ Paused')
      .setDescription(`Paused **${queue.currentTrack?.title}**\nUse \`/resume\` to continue.`);

    return interaction.reply({ embeds: [embed] });
  },
};
