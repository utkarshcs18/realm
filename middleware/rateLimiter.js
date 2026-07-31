// middleware/rateLimiter.js
function checkCooldown(client, userId, commandName, cooldownSeconds) {
  const now = Date.now();
  const key = `${userId}:${commandName}`;
  const timestamps = client.cooldowns.get(key) || 0;
  if (now - timestamps < cooldownSeconds * 1000) {
    return false; // still on cooldown
  }
  client.cooldowns.set(key, now);
  return true;
}

module.exports = { checkCooldown };
