// utils/createEmbed.js
const { EmbedBuilder } = require('discord.js');

/**
 * Creates a standard embed with the glossy red color and a footer.
 * @param {Object} options - Embed options (title, description, fields, etc.).
 * @returns {EmbedBuilder}
 */
function createEmbed({ title = '', description = '', fields = [], thumbnail = null, image = null, url = null } = {}) {
  const embed = new EmbedBuilder()
    .setColor('#FF4500') // glossy red
    .setTitle(title)
    .setDescription(description)
    .setTimestamp();

  if (fields.length) embed.addFields(fields);
  if (thumbnail) embed.setThumbnail(thumbnail);
  if (image) embed.setImage(image);
  if (url) embed.setURL(url);

  embed.setFooter({ text: 'discordBot', iconURL: null });
  return embed;
}

module.exports = { createEmbed };
