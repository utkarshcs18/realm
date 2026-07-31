const config = require("../config/config");
const UserLevel = require("../database/models/UserLevel");

function randomXp() {
  const { xpPerMessageMin, xpPerMessageMax } = config.leveling;
  return Math.floor(Math.random() * (xpPerMessageMax - xpPerMessageMin + 1)) + xpPerMessageMin;
}

function requiredXpForLevel(level) {
  return 5 * level * level + 50 * level + 100;
}

async function addMessageXp(message) {
  if (!message.guild || message.author.bot) return;

  const now = new Date();
  const userData =
    (await UserLevel.findOne({ guildId: message.guild.id, userId: message.author.id })) ||
    new UserLevel({ guildId: message.guild.id, userId: message.author.id });

  if (
    userData.lastMessageAt &&
    now.getTime() - userData.lastMessageAt.getTime() < config.leveling.cooldownMs
  ) {
    return;
  }

  userData.xp += randomXp();
  userData.lastMessageAt = now;

  let leveledUp = false;
  while (userData.xp >= requiredXpForLevel(userData.level)) {
    userData.xp -= requiredXpForLevel(userData.level);
    userData.level += 1;
    leveledUp = true;
  }

  await userData.save();

  if (leveledUp) {
    await message.channel
      .send(`Congrats ${message.author}, you reached **Level ${userData.level}**!`)
      .catch(() => null);
  }
}

module.exports = {
  addMessageXp,
  requiredXpForLevel
};
