// commands/music/play.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { useMainPlayer, QueryType } = require('discord-player');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song by name or URL (YouTube, Spotify, SoundCloud).')
    .addStringOption(opt =>
      opt.setName('query')
        .setDescription('Song name, artist, or paste a YouTube/Spotify/SoundCloud link')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    // --- Guard: must be in a voice channel ---
    const memberVoice = interaction.member?.voice?.channel;
    if (!memberVoice) {
      return interaction.reply({
        content: '❌ You must be in a voice channel to play music!',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Acknowledge the interaction immediately (gives us 15 min to process)
    await interaction.deferReply();

    const query = interaction.options.getString('query', true);
    const player = useMainPlayer();

    try {
      // Check if server has restricted music to specific voice channels
      const guildConfig = await GuildConfig.findOne({ guildId: interaction.guildId });
      if (guildConfig?.allowedVoiceChannelIds?.length > 0) {
        if (!guildConfig.allowedVoiceChannelIds.includes(memberVoice.id)) {
          const allowedList = guildConfig.allowedVoiceChannelIds.map(id => `<#${id}>`).join(', ');
          return interaction.editReply({ content: `❌ I'm only allowed to join: ${allowedList}` });
        }
      }

      // Search for the track
      const searchResult = await player.search(query, {
        requestedBy: interaction.user
      });

      if (!searchResult?.tracks?.length) {
        return interaction.editReply({
          content: `❌ Could not find any results for **${query}**.\n> Make sure the song exists and is publicly available.`,
        });
      }

      // Play the first result
      const { track } = await player.play(memberVoice, searchResult.tracks[0], {
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            client: interaction.guild.members.me,
            requestedBy: interaction.user,
          },
          selfDeaf: true,
          volume: 80,
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300_000,
          leaveOnEnd: true,
          leaveOnEndCooldown: 300_000,
        },
      });

      const embed = new EmbedBuilder()
        .setColor('#1DB954')
        .setTitle('🎵 Track Queued')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: '👤 Artist',       value: track.author   || 'Unknown', inline: true },
          { name: '⏱️ Duration',     value: track.duration || 'Unknown', inline: true },
          { name: '📻 Source',       value: track.source   || 'Unknown', inline: true },
          { name: '🙋 Requested by', value: `${interaction.user}`,       inline: true },
        )
        .setThumbnail(track.thumbnail)
        .setFooter({ text: 'discord-player • Use /queue to see all queued tracks' });

      return interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('[Play Error]', error);
      return interaction.editReply({
        content: `❌ Could not play **${query}**.\n> ${error?.message ?? 'Unknown error occurred.'}`,
      });
    }
  },
};
