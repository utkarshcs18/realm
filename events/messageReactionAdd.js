const { handleReactionRole } = require("../systems/reactionRoles");

module.exports = {
  name: "messageReactionAdd",
  async execute(reaction, user) {
    if (reaction.partial) await reaction.fetch().catch(() => null);
    await handleReactionRole(reaction, user, true);
  }
};
