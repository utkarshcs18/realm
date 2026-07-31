// commands/music/queue.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue.'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    if (!queue || (!queue.isPlaying() && queue.tracks.size === 0)) {
      return interaction.reply({ content: '❌ The queue is empty.', flags: MessageFlags.Ephemeral });
    }

    const current = queue.currentTrack;
    const tracks = queue.tracks.toArray().slice(0, 10); // show max 10 upcoming

    const upcomingLines = tracks.length > 0
      ? tracks.map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) — *${t.author}* \`${t.duration}\``)
      : ['*No more tracks queued.*'];

    const embed = new EmbedBuilder()
      .setColor('#1DB954')
      .setTitle('🎶 Music Queue')
      .addFields(
        {
          name: '🎵 Now Playing',
          value: current
            ? `[${current.title}](${current.url}) — *${current.author}* \`${current.duration}\``
            : '*Nothing playing*',
        },
        {
          name: `📋 Up Next (${queue.tracks.size} track${queue.tracks.size !== 1 ? 's' : ''})`,
          value: upcomingLines.join('\n'),
        }
      )
      .setThumbnail(current?.thumbnail)
      .setFooter({
        text: queue.tracks.size > 10
          ? `...and ${queue.tracks.size - 10} more tracks`
          : 'Use /play to add more tracks!',
      });

    return interaction.reply({ embeds: [embed] });
  },
};
