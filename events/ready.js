const { loadReactionRoles } = require('../systems/reactionRoles');

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    await loadReactionRoles(client);
  },
};
