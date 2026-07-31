const { loadReactionRoles } = require('../systems/reactionRoles');

module.exports = {
  name: "clientReady",
  once: true,
  async execute(client) {
    console.log(`✅ Logged in as ${client.user.tag}`);

    // Hydrate the in-memory reaction-role map from the database
    // so reaction roles survive bot restarts
    await loadReactionRoles(client);
  },
};
