const { runAutoModeration } = require("../systems/autoModeration");
const { addMessageXp } = require("../systems/leveling");

module.exports = {
  name: "messageCreate",
  async execute(message) {
    if (message.author.bot || !message.guild) return;

    const blocked = await runAutoModeration(message);
    if (blocked) return;

    await addMessageXp(message);
  },
};
