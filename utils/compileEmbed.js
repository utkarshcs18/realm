const { EmbedBuilder } = require('discord.js');

/**
 * Compiles a CustomEmbed database template into a Discord EmbedBuilder
 * replacing placeholders like {user}, {user_tag}, {guild}, and {member_count}.
 * 
 * @param {Object} template - Mongoose CustomEmbed document
 * @param {import('discord.js').GuildMember} member - Guild member context
 * @returns {EmbedBuilder}
 */
function compileEmbed(template, member) {
  const embed = new EmbedBuilder();

  const replacePlaceholders = (text) => {
    if (!text) return '';
    return text
      .replace(/{user}/g, member.toString())
      .replace(/{user_tag}/g, member.user.tag)
      .replace(/{guild}/g, member.guild.name)
      .replace(/{member_count}/g, member.guild.memberCount.toString());
  };

  if (template.title) embed.setTitle(replacePlaceholders(template.title));
  if (template.description) embed.setDescription(replacePlaceholders(template.description));
  if (template.footerText) embed.setFooter({ text: replacePlaceholders(template.footerText) });

  // Resolve color
  if (template.color) {
    const hex = /^#[0-9A-F]{6}$/i.test(template.color.trim()) ? template.color.trim() : '#5865F2';
    embed.setColor(hex);
  } else {
    embed.setColor('#5865F2');
  }

  // Resolve Thumbnail
  if (template.thumbnailType === 'user_avatar') {
    embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true }));
  } else if (template.thumbnailType === 'guild_icon') {
    const icon = member.guild.iconURL({ dynamic: true });
    if (icon) embed.setThumbnail(icon);
  } else if (template.thumbnailType === 'custom' && template.thumbnailUrl) {
    embed.setThumbnail(template.thumbnailUrl);
  }

  // Resolve Image
  if (template.imageUrl) {
    embed.setImage(template.imageUrl);
  }

  return embed;
}

module.exports = { compileEmbed };
