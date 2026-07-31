// commands/music/skip.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track.'),

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

    const skipped = queue.currentTrack;
    queue.node.skip();

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('⏭️ Skipped')
      .setDescription(`Skipped **${skipped?.title}**`)
      .setFooter({
        text: queue.tracks.size > 0
          ? `Next up: ${queue.tracks.peekAt(0)?.title}`
          : 'Queue is now empty.',
      });

    return interaction.reply({ embeds: [embed] });
  },
};
