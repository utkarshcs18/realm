// commands/music/leave.js
const { SlashCommandBuilder, EmbedBuilder, MessageFlags} = require('discord.js');
const { useQueue } = require('discord-player');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Make the bot leave the voice channel and clear the queue.'),

  async execute(interaction) {
    const queue = useQueue(interaction.guild.id);

    // Check if bot is even in a voice channel
    const botVoice = interaction.guild.members.me?.voice?.channel;
    if (!botVoice) {
      return interaction.reply({
        content: '❌ I am not in any voice channel.',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Check the user is in the same voice channel
    const memberVoice = interaction.member.voice.channel;
    if (!memberVoice || memberVoice.id !== botVoice.id) {
      return interaction.reply({
        content: `❌ You need to be in <#${botVoice.id}> to make me leave!`,
        flags: MessageFlags.Ephemeral,
      });
    }

    // Delete the queue (stops playback, clears queue, disconnects)
    if (queue) {
      queue.delete();
    } else {
      // No queue but bot is still connected — force disconnect
      interaction.guild.members.me.voice.disconnect();
    }

    const embed = new EmbedBuilder()
      .setColor('#E74C3C')
      .setTitle('👋 Left Voice Channel')
      .setDescription(`Disconnected from **${botVoice.name}** and cleared the queue.`);

    return interaction.reply({ embeds: [embed] });
  },
};
