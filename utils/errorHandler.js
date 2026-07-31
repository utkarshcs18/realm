// utils/errorHandler.js
const { MessageFlags } = require('discord.js');
const logger = require('./appLogger');

/**
 * Wrap an async command execution to catch errors and prevent the bot from crashing.
 * @param {Function} fn - The async function to execute.
 * @param {...any} args - Arguments to pass to the function.
 */
module.exports = async function errorHandler(fn, ...args) {
  try {
    await fn(...args);
  } catch (error) {
    logger.error('Command execution error:', error);
    // If the first argument is an Interaction, reply with an error embed.
    const interaction = args[0];
    if (interaction && interaction.reply) {
      try {
        await interaction.reply({
          content: 'An unexpected error occurred. The incident has been logged.',
          flags: MessageFlags.Ephemeral,
        });
      } catch (e) {
        logger.error('Failed to reply with error message:', e);
      }
    }
  }
};
