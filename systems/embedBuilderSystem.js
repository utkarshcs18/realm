// systems/embedBuilderSystem.js
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const CustomEmbed = require('../database/models/CustomEmbed');
const { compileEmbed } = require('../utils/compileEmbed');

// Helper: build mock member for preview placeholders
function getMockMember(guild) {
  return {
    toString: () => `<@${guild.ownerId}>`,
    user: {
      tag: 'User#0000',
      displayAvatarURL: () => guild.iconURL() || 'https://discord.com/assets/f9bbda527b40c0555ee45b12a28a9b70.png',
    },
    guild: {
      name: guild.name,
      memberCount: guild.memberCount,
      iconURL: () => guild.iconURL(),
    },
  };
}

// Helper: build the builder panel message payload
async function getBuilderMessage(guild, name) {
  let template = await CustomEmbed.findOne({ guildId: guild.id, name });
  if (!template) {
    template = new CustomEmbed({
      guildId: guild.id,
      name,
      title: 'Draft Title',
      description: 'This is a draft description. Click the buttons below to customize this template!',
    });
  }

  const previewEmbed = compileEmbed(template, getMockMember(guild));

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`emb_build:edit_text:${name}`)
      .setLabel('✍️ Edit Text')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`emb_build:edit_style:${name}`)
      .setLabel('🎨 Edit Style')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`emb_build:edit_images:${name}`)
      .setLabel('🖼️ Edit Images')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`emb_build:save_close:${name}`)
      .setLabel('✅ Save & Close')
      .setStyle(ButtonStyle.Success)
  );

  return {
    content: `🛠️ **Embed Builder — Template: \`${name}\`**\nUse the buttons below to edit each section. Changes are **auto-saved** after each edit.`,
    embeds: [previewEmbed],
    components: [row1, row2],
    flags: MessageFlags.Ephemeral,
  };
}

async function handleBuilderInteraction(interaction) {
  const parts = interaction.customId.split(':');
  const action = parts[1];
  const name = parts[2];
  const guildId = interaction.guildId;

  // ── BUTTON INTERACTIONS ────────────────────────────────────────────────────
  if (interaction.isButton()) {
    // Ensure the template document exists in DB before showing modals
    let template = await CustomEmbed.findOne({ guildId, name });
    if (!template) {
      template = await CustomEmbed.create({
        guildId,
        name,
        title: 'Draft Title',
        description: 'This is a draft description. Click the buttons below to customize this template!',
      });
    }

    if (action === 'edit_text') {
      const modal = new ModalBuilder()
        .setCustomId(`emb_build:modal_text:${name}`)
        .setTitle('Edit Title & Description');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('title')
            .setLabel('Embed Title')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Welcome to our server!')
            .setValue(template.title || '')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description ({user}, {guild}, {member_count})')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Welcome {user} to {guild}! You are member #{member_count}.')
            .setValue(template.description || '')
            .setRequired(false)
        )
      );

      return interaction.showModal(modal);
    }

    if (action === 'edit_style') {
      const modal = new ModalBuilder()
        .setCustomId(`emb_build:modal_style:${name}`)
        .setTitle('Edit Color & Footer');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('color')
            .setLabel('Color Hex (e.g. #FF5733)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('#5865F2')
            .setValue(template.color || '')
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('footer')
            .setLabel('Footer Text')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enjoy your stay!')
            .setValue(template.footerText || '')
            .setRequired(false)
        )
      );

      return interaction.showModal(modal);
    }

    if (action === 'edit_images') {
      const modal = new ModalBuilder()
        .setCustomId(`emb_build:modal_images:${name}`)
        .setTitle('Edit Images');

      const thumbCurrent = template.thumbnailType === 'custom'
        ? (template.thumbnailUrl || '')
        : (template.thumbnailType || 'none');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('thumbnail')
            .setLabel('Thumbnail: user / guild / none / URL')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('user')
            .setValue(thumbCurrent)
            .setRequired(false)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('image')
            .setLabel('Banner Image URL (blank to remove)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('https://example.com/banner.png')
            .setValue(template.imageUrl || '')
            .setRequired(false)
        )
      );

      return interaction.showModal(modal);
    }

    if (action === 'save_close') {
      // Explicitly save the template if it's still only in memory (never edited)
      const existing = await CustomEmbed.findOne({ guildId, name });
      if (!existing) {
        await CustomEmbed.create({
          guildId,
          name,
          title: template.title,
          description: template.description,
        });
      }

      return interaction.update({
        content: `✅ Embed **\`${name}\`** has been saved!\n\n💡 Use \`/setup\` → Welcome System → Link Embed to use it as your welcome message, or \`/embed show name:${name}\` to preview it.`,
        embeds: [],
        components: [],
      });
    }
  }

  // ── MODAL SUBMIT INTERACTIONS ──────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    // Defer the update FIRST — this acknowledges the modal and lets us edit the original message
    await interaction.deferUpdate();

    let template = await CustomEmbed.findOne({ guildId, name });
    if (!template) {
      template = new CustomEmbed({ guildId, name });
    }

    if (action === 'modal_text') {
      const titleVal = interaction.fields.getTextInputValue('title').trim();
      const descVal = interaction.fields.getTextInputValue('description').trim();
      template.title = titleVal || null;
      template.description = descVal || null;
      await template.save();
    }

    if (action === 'modal_style') {
      const colorVal = interaction.fields.getTextInputValue('color').trim();
      const footerVal = interaction.fields.getTextInputValue('footer').trim();
      template.color = /^#[0-9A-Fa-f]{6}$/.test(colorVal) ? colorVal : (colorVal === '' ? null : '#5865F2');
      template.footerText = footerVal || null;
      await template.save();
    }

    if (action === 'modal_images') {
      const thumbVal = interaction.fields.getTextInputValue('thumbnail').trim().toLowerCase();
      const imageVal = interaction.fields.getTextInputValue('image').trim();

      if (thumbVal === 'user') {
        template.thumbnailType = 'user_avatar';
        template.thumbnailUrl = null;
      } else if (thumbVal === 'guild') {
        template.thumbnailType = 'guild_icon';
        template.thumbnailUrl = null;
      } else if (thumbVal === '' || thumbVal === 'none') {
        template.thumbnailType = 'none';
        template.thumbnailUrl = null;
      } else {
        // Treat as custom URL
        template.thumbnailType = 'custom';
        template.thumbnailUrl = thumbVal;
      }

      template.imageUrl = imageVal || null;
      await template.save();
    }

    // Rebuild the builder panel and update the original message
    const updatedPanel = await getBuilderMessage(interaction.guild, name);
    return interaction.editReply(updatedPanel);
  }
}

module.exports = { getBuilderMessage, handleBuilderInteraction };
