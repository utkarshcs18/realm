const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits, MessageFlags} = require("discord.js");
const { createTranscript } = require("discord-html-transcripts");
const Ticket = require("../database/models/Ticket");
const config = require("../config/config");

function buildTicketPanelEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle("Support Tickets")
    .setDescription("Need help? Click the button below to create a private support ticket.")
    .setTimestamp();
}

function buildTicketPanelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:create")
      .setLabel("Create Ticket")
      .setStyle(ButtonStyle.Primary)
  );
}

function buildTicketControlsRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("ticket:close")
      .setLabel("Close")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ticket:delete")
      .setLabel("Delete")
      .setStyle(ButtonStyle.Danger)
  );
}

async function createTicketForUser(interaction) {
  const guild = interaction.guild;
  const existing = await Ticket.findOne({
    guildId: guild.id,
    ownerId: interaction.user.id,
    closed: false
  });

  if (existing) {
    return interaction.reply({ content: `You already have an open ticket: <#${existing.channelId}>`, flags: MessageFlags.Ephemeral });
  }

  const GuildConfig = require("../database/models/GuildConfig");
  const guildConfig = await GuildConfig.findOne({ guildId: guild.id });

  const staffRoleIds = (guildConfig?.staffRoleIds && guildConfig.staffRoleIds.length > 0)
    ? guildConfig.staffRoleIds
    : config.moderation.staffRoleIds;

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  for (const roleId of staffRoleIds) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels
      ]
    });
  }

  const categoryId = guildConfig?.ticketCategoryId || config.tickets.categoryId || null;

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
    type: ChannelType.GuildText,
    parent: categoryId,
    permissionOverwrites
  });

  await new Ticket({
    guildId: guild.id,
    channelId: channel.id,
    ownerId: interaction.user.id
  }).save();

  await channel.send({
    content: `${interaction.user} Welcome! Staff will assist you soon.`,
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("Ticket Created")
        .setDescription("Use the buttons below when your issue is solved.")
    ],
    components: [buildTicketControlsRow()]
  });

  await interaction.reply({
    content: `Your ticket has been created: ${channel}`,
    flags: MessageFlags.Ephemeral
  });
}

async function closeTicket(interaction) {
  const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ content: "This is not a tracked ticket channel.", flags: MessageFlags.Ephemeral });
  }
  ticket.closed = true;
  ticket.closedBy = interaction.user.id;
  await ticket.save();
  await interaction.reply({ content: "✅ Ticket marked as closed. Use the **Delete** button to remove the channel." });
}

async function deleteTicket(interaction) {
  const ticket = await Ticket.findOne({ guildId: interaction.guild.id, channelId: interaction.channel.id });
  if (!ticket) {
    return interaction.reply({ content: "This is not a tracked ticket channel.", flags: MessageFlags.Ephemeral });
  }

  const GuildConfig = require("../database/models/GuildConfig");
  const guildConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
  const transcriptChannelId = guildConfig?.ticketTranscriptChannelId || config.tickets.transcriptChannelId;

  let transcriptAttachment = null;
  if (transcriptChannelId) {
    transcriptAttachment = await createTranscript(interaction.channel, {
      filename: `transcript-${interaction.channel.name}.html`,
      saveImages: true,
      poweredBy: false
    }).catch(() => null);
  }

  if (transcriptAttachment && transcriptChannelId) {
    const transcriptChannel = await interaction.guild.channels
      .fetch(transcriptChannelId)
      .catch(() => null);
    if (transcriptChannel?.isTextBased()) {
      const sent = await transcriptChannel
        .send({
          content: `Transcript for ${interaction.channel.name} (closed by <@${interaction.user.id}>)`,
          files: [transcriptAttachment]
        })
        .catch(() => null);
      if (sent?.attachments?.first()) {
        ticket.transcriptUrl = sent.attachments.first().url;
      }
    }
  }

  await ticket.deleteOne();

  // Capture channel ref now — interaction.channel may be stale inside the setTimeout
  const channelToDelete = interaction.channel;
  await interaction.reply({ content: "🗑️ Deleting ticket in 3 seconds..." });
  setTimeout(() => channelToDelete.delete().catch(() => null), 3000);
}

module.exports = {
  buildTicketPanelEmbed,
  buildTicketPanelRow,
  createTicketForUser,
  closeTicket,
  deleteTicket
};
