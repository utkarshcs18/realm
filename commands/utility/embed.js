// commands/utility/embed.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags} = require('discord.js');
const CustomEmbed = require('../../database/models/CustomEmbed');
const GuildConfig = require('../../database/models/GuildConfig');
const { compileEmbed } = require('../../utils/compileEmbed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Manage custom saved embeds.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    
    // /embed create
    .addSubcommand(sub =>
      sub.setName('create')
        .setDescription('Create a new custom embed template.')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of this new template (e.g. welcome) - alphanumeric only')
            .setRequired(true)))

    // /embed edit
    .addSubcommand(sub =>
      sub.setName('edit')
        .setDescription('Use the editor to preview and edit an existing embed.')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of the template to edit')
            .setRequired(true)))

    // /embed show
    .addSubcommand(sub =>
      sub.setName('show')
        .setDescription('Preview an embed.')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of the template to preview')
            .setRequired(true)))

    // /embed delete
    .addSubcommand(sub =>
      sub.setName('delete')
        .setDescription('Delete an embed.')
        .addStringOption(opt =>
          opt.setName('name')
            .setDescription('Name of the template to delete')
            .setRequired(true)))

    // /embed list
    .addSubcommand(sub =>
      sub.setName('list')
        .setDescription('List all saved embed templates.')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guildId = interaction.guildId;

    let guildConfig = await GuildConfig.findOne({ guildId });
    if (!guildConfig) {
      guildConfig = await GuildConfig.create({ guildId });
    }

    // 1. Create Subcommand
    if (sub === 'create') {
      const name = interaction.options.getString('name').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

      if (!name) {
        return interaction.reply({ content: '❌ Invalid template name. Use alphanumeric characters only.', flags: MessageFlags.Ephemeral });
      }

      // Check premium caps (limit to 5 free embeds)
      const count = await CustomEmbed.countDocuments({ guildId });
      const existing = await CustomEmbed.findOne({ guildId, name });

      if (existing) {
         return interaction.reply({ content: `❌ Template **\`${name}\`** already exists. Use \`/embed edit\` to modify it.`, flags: MessageFlags.Ephemeral });
      }

      if (!guildConfig.isPremium && count >= 5) {
        return interaction.reply({
          content: `❌ **Embed limit reached.** Non-premium servers are limited to 5 saved custom embeds. Please upgrade to premium for unlimited templates!`,
          flags: MessageFlags.Ephemeral
        });
      }

      // Launch the interactive builder panel
      const { getBuilderMessage } = require('../../systems/embedBuilderSystem');
      const builderMessage = await getBuilderMessage(interaction.guild, name);
      return interaction.reply(builderMessage);
    }

    // 2. Edit Subcommand
    if (sub === 'edit') {
      const name = interaction.options.getString('name').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
      const existing = await CustomEmbed.findOne({ guildId, name });
      
      if (!existing) {
         return interaction.reply({ content: `❌ Template **\`${name}\`** not found. Create it first with \`/embed create\`.`, flags: MessageFlags.Ephemeral });
      }

      const { getBuilderMessage } = require('../../systems/embedBuilderSystem');
      const builderMessage = await getBuilderMessage(interaction.guild, name);
      return interaction.reply(builderMessage);
    }

    // 3. Show Subcommand (Preview)
    if (sub === 'show') {
      const name = interaction.options.getString('name').trim().toLowerCase();
      const template = await CustomEmbed.findOne({ guildId, name });

      if (!template) {
        return interaction.reply({ content: `❌ Template **\`${name}\`** not found.`, flags: MessageFlags.Ephemeral });
      }

      const member = await interaction.guild.members.fetch(interaction.user.id);
      const embed = compileEmbed(template, member);

      return interaction.reply({
        content: `👀 Here is a preview of the template **\`${name}\`**:`,
        embeds: [embed],
        flags: MessageFlags.Ephemeral
      });
    }

    // 4. Delete Subcommand
    if (sub === 'delete') {
      const name = interaction.options.getString('name').trim().toLowerCase();
      const template = await CustomEmbed.findOne({ guildId, name });
      
      if (!template) {
        return interaction.reply({ content: `❌ Template **\`${name}\`** not found.`, flags: MessageFlags.Ephemeral });
      }

      await template.deleteOne();

      // Clear linked welcome reference if deleted
      if (guildConfig.welcomeEmbedName === name) {
        guildConfig.welcomeEmbedName = null;
        await guildConfig.save();
      }

      return interaction.reply({ content: `🗑️ Deleted custom embed template **\`${name}\`**.`, flags: MessageFlags.Ephemeral });
    }

    // 5. List Subcommand
    if (sub === 'list') {
      const templates = await CustomEmbed.find({ guildId });
      if (!templates.length) {
        return interaction.reply({ content: '📝 No custom embed templates saved yet. Create one using \`/embed create\`!', flags: MessageFlags.Ephemeral });
      }

      const listStr = templates.map(t => `• **\`${t.name}\`** ${guildConfig.welcomeEmbedName === t.name ? '*(Linked to Welcome)*' : ''}`).join('\n');
      return interaction.reply({
        embeds: [{
          color: 0x5865F2,
          title: '📝 Saved Custom Embed Templates',
          description: listStr,
          footer: { text: `Total: ${templates.length}/5 free limit active` }
        }],
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
