// systems/setupSystem.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelSelectMenuBuilder,
  RoleSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle, MessageFlags} = require('discord.js');
const GuildConfig = require('../database/models/GuildConfig');

// Utility to build the main dashboard embed showing current configuration status
async function buildDashboardEmbed(guild) {
  let config = await GuildConfig.findOne({ guildId: guild.id });
  if (!config) {
    config = await GuildConfig.create({ guildId: guild.id });
  }

  const welcomeChan = config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : '*Not Configured*';
  const modLogs = config.modLogChannelId ? `<#${config.modLogChannelId}>` : '*Not Configured*';
  const muteRole = config.mutedRoleId ? `<@&${config.mutedRoleId}>` : '*Not Configured*';
  
  const welcomeDetails = config.welcomeEmbedName
    ? `• **Channel**: ${welcomeChan}\n• **Custom Embed (Active)**: \`${config.welcomeEmbedName}\``
    : `• **Channel**: ${welcomeChan}\n• **Message (Standard)**: ${config.welcomeMessage ? `\`${config.welcomeMessage}\`` : '*Not Configured*'}`;
  
  const staffRoles = config.staffRoleIds && config.staffRoleIds.length > 0
    ? config.staffRoleIds.map(id => `<@&${id}>`).join(', ')
    : '*Not Configured*';
  
  const ticketCategory = config.ticketCategoryId ? `<#${config.ticketCategoryId}>` : '*Not Configured*';
  const ticketTranscript = config.ticketTranscriptChannelId ? `<#${config.ticketTranscriptChannelId}>` : '*Not Configured*';

  const musicChannels = config.allowedVoiceChannelIds && config.allowedVoiceChannelIds.length > 0
    ? config.allowedVoiceChannelIds.map(id => `<#${id}>`).join(', ')
    : '🌐 *Unrestricted (any voice channel)*';

  return new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('⚙️ Server Configuration Panel')
    .setDescription('Select an option from the dropdown below to configure different systems for your server.')
    .addFields(
      { name: '👋 Welcome System', value: welcomeDetails, inline: false },
      { name: '🛠️ Staff Roles', value: `• ${staffRoles}`, inline: false },
      { name: '🎫 Ticket System', value: `• **Category**: ${ticketCategory}\n• **Transcripts**: ${ticketTranscript}`, inline: false },
      { name: '📝 Moderation Logs', value: `• **Channel**: ${modLogs}`, inline: true },
      { name: '🔇 Muted Role', value: `• **Role**: ${muteRole}`, inline: true },
      { name: '🎵 Music Voice Channels', value: `• **Allowed**: ${musicChannels}`, inline: false }
    )
    .setTimestamp();
}

// Build the main dropdown component
function buildMainDropdownRow() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('setup:menu')
    .setPlaceholder('Select a system to configure...')
    .addOptions([
      { label: '👋 Welcome System', description: 'Configure welcome messages and channel', value: 'welcome' },
      { label: '🛠️ Staff Roles', description: 'Set roles allowed to run staff commands', value: 'staff' },
      { label: '🎫 Ticket System', description: 'Configure ticket category and transcripts', value: 'tickets' },
      { label: '📝 Moderation Logs', description: 'Set where mod logs are posted', value: 'modlogs' },
      { label: '🔇 Muted Role', description: 'Set the role used for muted users', value: 'muterole' },
      { label: '🎵 Music Voice Channels', description: 'Restrict bot to specific voice channels', value: 'musicchannels' },
    ]);

  return new ActionRowBuilder().addComponents(select);
}

// Handler for all setup-related interactions (select menus, buttons, modals)
async function handleSetupInteraction(interaction) {
  const guildId = interaction.guildId;
  let config = await GuildConfig.findOne({ guildId });
  if (!config) config = await GuildConfig.create({ guildId });

  // 1. String Select Menu (Main Menu choice)
  if (interaction.isStringSelectMenu() && interaction.customId === 'setup:menu') {
    const selected = interaction.values[0];

    if (selected === 'welcome') {
      const channelSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup:welcome_channel')
        .setPlaceholder('Select Welcome Channel')
        .setChannelTypes([ChannelType.GuildText]);

      const embedButton = new ButtonBuilder()
        .setCustomId('setup:btn_welcome_embed')
        .setLabel('🖼️ Link Embed Template')
        .setStyle(ButtonStyle.Primary);

      const clearEmbedButton = new ButtonBuilder()
        .setCustomId('setup:btn_welcome_clear_embed')
        .setLabel('🗑️ Unlink Embed')
        .setStyle(ButtonStyle.Danger);

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(channelSelect);
      const row2 = new ActionRowBuilder().addComponents(embedButton, clearEmbedButton, backButton);

      const currentEmbed = config.welcomeEmbedName
        ? `\n\n**Currently linked embed:** \`${config.welcomeEmbedName}\``
        : '\n\n**No embed linked yet.** Create one with `/embed create`, then link it here.';

      return interaction.update({
        content: `👉 **Welcome System Setup**: Select a channel for welcome messages, then link a custom embed template.${currentEmbed}`,
        components: [row1, row2]
      });
    }

    if (selected === 'staff') {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup:staff_roles')
        .setPlaceholder('Select Staff Roles')
        .setMinValues(0)
        .setMaxValues(10); // allow selecting multiple roles

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(roleSelect);
      const row2 = new ActionRowBuilder().addComponents(backButton);

      return interaction.update({
        content: '👉 **Staff Roles Setup**: Select the roles that are allowed to see and manage ticket channels, plus run staff commands.',
        components: [row1, row2]
      });
    }

    if (selected === 'tickets') {
      const categorySelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup:ticket_category')
        .setPlaceholder('Select Ticket Category')
        .setChannelTypes([ChannelType.GuildCategory]);

      const transcriptSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup:ticket_transcript')
        .setPlaceholder('Select Transcript Channel (Optional)')
        .setChannelTypes([ChannelType.GuildText]);

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(categorySelect);
      const row2 = new ActionRowBuilder().addComponents(transcriptSelect);
      const row3 = new ActionRowBuilder().addComponents(backButton);

      return interaction.update({
        content: '👉 **Ticket System Setup**: Choose a category for new ticket channels, and select a transcript log channel.',
        components: [row1, row2, row3]
      });
    }

    if (selected === 'modlogs') {
      const logSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup:mod_logs')
        .setPlaceholder('Select Mod Logs Channel')
        .setChannelTypes([ChannelType.GuildText]);

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(logSelect);
      const row2 = new ActionRowBuilder().addComponents(backButton);

      return interaction.update({
        content: '👉 **Moderation Logs Setup**: Select a text channel where moderation action embeds (warnings, mutes, kicks, bans) will be posted.',
        components: [row1, row2]
      });
    }

    if (selected === 'muterole') {
      const roleSelect = new RoleSelectMenuBuilder()
        .setCustomId('setup:mute_role')
        .setPlaceholder('Select Muted Role')
        .setMaxValues(1);

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(roleSelect);
      const row2 = new ActionRowBuilder().addComponents(backButton);

      return interaction.update({
        content: '👉 **Muted Role Setup**: Select the fallback role to apply/remove when running mute/unmute commands (timeouts are handled natively by Discord).',
        components: [row1, row2]
      });
    }

    if (selected === 'musicchannels') {
      const currentList = config.allowedVoiceChannelIds && config.allowedVoiceChannelIds.length > 0
        ? `\n\n**Currently restricted to:** ${config.allowedVoiceChannelIds.map(id => `<#${id}>`).join(', ')}`
        : '\n\n**Currently:** Unrestricted — the bot can join any voice channel.';

      const voiceSelect = new ChannelSelectMenuBuilder()
        .setCustomId('setup:music_channels')
        .setPlaceholder('Pick allowed voice channels (up to 10)')
        .setChannelTypes([ChannelType.GuildVoice])
        .setMinValues(1)
        .setMaxValues(10);

      const clearButton = new ButtonBuilder()
        .setCustomId('setup:btn_music_clear')
        .setLabel('🗑️ Remove All Restrictions')
        .setStyle(ButtonStyle.Danger);

      const backButton = new ButtonBuilder()
        .setCustomId('setup:btn_back')
        .setLabel('⬅️ Back')
        .setStyle(ButtonStyle.Secondary);

      const row1 = new ActionRowBuilder().addComponents(voiceSelect);
      const row2 = new ActionRowBuilder().addComponents(clearButton, backButton);

      return interaction.update({
        content: `👉 **Music Voice Channel Restrictions**${currentList}\n\nSelect one or more **voice channels** to lock the bot to. Users in any other VC will not be able to use /play.`,
        components: [row1, row2]
      });
    }
  }

  // 2. Buttons
  if (interaction.isButton()) {
    if (interaction.customId === 'setup:btn_back') {
      const embed = await buildDashboardEmbed(interaction.guild);
      return interaction.update({
        content: null,
        embeds: [embed],
        components: [buildMainDropdownRow()]
      });
    }

    // Clear all music channel restrictions
    if (interaction.customId === 'setup:btn_music_clear') {
      config.allowedVoiceChannelIds = [];
      await config.save();
      return interaction.reply({
        content: '✅ Music channel restrictions **removed**. The bot can now join any voice channel.',
        flags: MessageFlags.Ephemeral
      });
    }

    // Modal trigger for linking a Welcome Embed Template
    if (interaction.customId === 'setup:btn_welcome_embed') {
      const modal = new ModalBuilder()
        .setCustomId('setup:modal_welcome_embed')
        .setTitle('Link Welcome Embed');

      const textInput = new TextInputBuilder()
        .setCustomId('embed_name')
        .setLabel('Embed template name (from /embed list)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('welcome')
        .setValue(config.welcomeEmbedName || '')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(textInput));
      return interaction.showModal(modal);
    }

    // Clear welcome embed link
    if (interaction.customId === 'setup:btn_welcome_clear_embed') {
      config.welcomeEmbedName = null;
      await config.save();
      return interaction.reply({
        content: '✅ Welcome embed has been **unlinked**. No welcome message will be sent until you link a new embed.',
        flags: MessageFlags.Ephemeral
      });
    }
  }

  // 3. Channel Select Menus
  if (interaction.isChannelSelectMenu()) {
    const selectedChannel = interaction.values[0];

    if (interaction.customId === 'setup:welcome_channel') {
      config.welcomeChannelId = selectedChannel;
      await config.save();
      return interaction.reply({ content: `✅ Welcome channel has been set to <#${selectedChannel}>.`, flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'setup:ticket_category') {
      config.ticketCategoryId = selectedChannel;
      await config.save();
      return interaction.reply({ content: `✅ Tickets will now be created under category <#${selectedChannel}>.`, flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'setup:ticket_transcript') {
      config.ticketTranscriptChannelId = selectedChannel;
      await config.save();
      return interaction.reply({ content: `✅ Ticket transcripts will now be saved in <#${selectedChannel}>.`, flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'setup:mod_logs') {
      config.modLogChannelId = selectedChannel;
      await config.save();
      return interaction.reply({ content: `✅ Moderation logs will now be sent to <#${selectedChannel}>.`, flags: MessageFlags.Ephemeral });
    }

    // Music voice channels — supports multiple selections
    if (interaction.customId === 'setup:music_channels') {
      const selectedChannels = interaction.values; // array of voice channel IDs
      config.allowedVoiceChannelIds = selectedChannels;
      await config.save();
      const mentions = selectedChannels.map(id => `<#${id}>`).join(', ');
      return interaction.reply({
        content: `✅ Music bot is now **restricted** to: ${mentions}\n\nAnyone in a different voice channel will be blocked from using /play.`,
        flags: MessageFlags.Ephemeral
      });
    }
  }

  // 4. Role Select Menus
  if (interaction.isRoleSelectMenu()) {
    const selectedRoles = interaction.values;

    if (interaction.customId === 'setup:staff_roles') {
      config.staffRoleIds = selectedRoles;
      await config.save();
      return interaction.reply({ content: `✅ Staff roles have been configured to: ${selectedRoles.map(id => `<@&${id}>`).join(', ')}.`, flags: MessageFlags.Ephemeral });
    }

    if (interaction.customId === 'setup:mute_role') {
      config.mutedRoleId = selectedRoles[0] || null;
      await config.save();
      return interaction.reply({ content: `✅ Muted role fallback has been set to <@&${selectedRoles[0]}>.`, flags: MessageFlags.Ephemeral });
    }
  }

  // 5. Modal Submissions
  if (interaction.isModalSubmit() && interaction.customId === 'setup:modal_welcome_embed') {
    const embedName = interaction.fields.getTextInputValue('embed_name').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    
    const CustomEmbed = require('../database/models/CustomEmbed');
    const template = await CustomEmbed.findOne({ guildId, name: embedName });
    
    if (!template) {
      return interaction.reply({
        content: `❌ No embed template called **\`${embedName}\`** found. Create one first with \`/embed create name:${embedName}\`.`,
        flags: MessageFlags.Ephemeral
      });
    }

    config.welcomeEmbedName = embedName;
    await config.save();
    return interaction.reply({
      content: `✅ Welcome embed linked to template **\`${embedName}\`**! New members will now see this embed when they join.`,
      flags: MessageFlags.Ephemeral
    });
  }
}

module.exports = {
  buildDashboardEmbed,
  buildMainDropdownRow,
  handleSetupInteraction
};
