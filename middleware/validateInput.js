// middleware/validateInput.js
/**
 * Sanitizes a user‑provided string.
 * - Trims whitespace
 * - Limits length (default 2000 chars)
 * - Strips @everyone / @here mentions
 * @param {string} input - Raw user input.
 * @param {number} [maxLength=2000]
 * @returns {string}
 */
function sanitize(input, maxLength = 2000) {
  if (typeof input !== 'string') return '';
  let out = input.trim();
  // Remove mass mentions
  out = out.replace(/@everyone/g, '@​everyone').replace(/@here/g, '@​here');
  if (out.length > maxLength) out = out.slice(0, maxLength) + '…';
  return out;
}

module.exports = { sanitize };
