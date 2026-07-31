// middleware/rateLimiter.js
/**
 * Simple in‑memory rate limiter per user per command.
 * The `cooldowns` map is stored on the client (client.cooldowns).
 */
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
