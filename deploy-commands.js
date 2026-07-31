require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const config = require("./config/config");

const commands = [];
const commandRoot = path.join(__dirname, "commands");
for (const folder of fs.readdirSync(commandRoot)) {
  const folderPath = path.join(commandRoot, folder);
  const files = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));
  for (const file of files) {
    const command = require(path.join(folderPath, file));
    if (command?.data) commands.push(command.data.toJSON());
  }
}

async function deploy() {
  if (!config.discord.token || !config.discord.clientId || !config.discord.guildId) {
    throw new Error("DISCORD_TOKEN, CLIENT_ID and GUILD_ID are required in .env");
  }

  const rest = new REST({ version: "10" }).setToken(config.discord.token);
  await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), {
    body: commands
  });
  console.log(`Deployed ${commands.length} guild slash commands.`);
}

deploy().catch((error) => {
  console.error("Command deployment failed:", error);
  process.exit(1);
});
