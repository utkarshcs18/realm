require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const dns = require("node:dns");
// Force IPv4 to prevent Discord Voice IPv6 UDP drops on Windows
dns.setDefaultResultOrder("ipv4first");

// ── Global production safety net ────────────────────────────────────────────
// Catch async promise rejections that were never caught with .catch()
process.on("unhandledRejection", (reason, promise) => {
  console.error("[UnhandledRejection]", reason);
});
// Catch synchronous throws that propagated all the way to the top of the event loop
process.on("uncaughtException", (error) => {
  console.error("[UncaughtException]", error);
  // Give the logger a moment to flush before exiting
  setTimeout(() => process.exit(1), 500);
});

const { Client, GatewayIntentBits, Collection, Partials } = require("discord.js");

// --- FFmpeg: point discord-player to the bundled binary ---
const ffmpegPath = require("ffmpeg-static");
process.env.FFMPEG_PATH = ffmpegPath;

// Force discord-player to use patched YouTube downloader to bypass blocks
process.env.DP_FORCE_YTDL_MOD = "@distube/ytdl-core";

// Suppress unstable extractor warnings
const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  if (typeof warning === "string" && warning.includes("YoutubeExtractor uses scraping-based")) return;
  return originalEmitWarning.call(process, warning, ...args);
};
const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && (args[0].includes('YoutubeExtractor uses scraping-based') || args[0].includes('[YOUTUBEJS]'))) return;
  originalConsoleWarn(...args);
};

const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require('discord-player-youtubei');
const { connectDatabase } = require("./database/connect");
const config = require("./config/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    // GatewayIntentBits.GuildMembers, // removed – enable in dev portal if needed
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.cooldowns = new Collection();

// discord-player setup — tell it explicitly where FFmpeg lives and increase timeouts
client.musicPlayer = new Player(client, {
  ffmpeg: { path: ffmpegPath },
  ytdlOptions: {
    quality: 'highestaudio',
    highWaterMark: 1 << 25, // buffer size
  },
  connectionTimeout: 60000, // 60 seconds (defaults to 20s which might be too short for slow connections)
});

// Emit when a track starts playing
client.musicPlayer.events.on('playerStart', (queue, track) => {
  queue.metadata?.channel?.send(
    `🎵 Now playing: **${track.title}** by *${track.author}* \`${track.duration}\``
  ).catch(() => null);
});

// Emit on errors
client.musicPlayer.events.on('error', (queue, error) => {
  console.error(`[Player Error] Guild: ${queue.guild.id} | Track: ${queue.currentTrack?.title}`);
  console.error(`[Player Error] Full error:`, error?.message || error);
  queue.metadata?.channel?.send(`❌ Playback error: ${error?.message ?? 'Unknown error'}`).catch(() => null);
});

client.musicPlayer.events.on('playerError', (queue, error) => {
  console.error(`[PlayerError] Guild: ${queue.guild.id} | Track: ${queue.currentTrack?.title}`);
  console.error(`[PlayerError] Full error:`, error?.message || error);
  queue.metadata?.channel?.send(`❌ Player error: ${error?.message ?? 'Unknown error'}`).catch(() => null);
});



const commandFolders = fs.readdirSync(path.join(__dirname, "commands"));
for (const folder of commandFolders) {
  const commandPath = path.join(__dirname, "commands", folder);
  const commandFiles = fs.readdirSync(commandPath).filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const command = require(path.join(commandPath, file));
    if (command?.data?.name && typeof command.execute === "function") {
      client.commands.set(command.data.name, command);
    }
  }
}

const eventFiles = fs
  .readdirSync(path.join(__dirname, "events"))
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const event = require(path.join(__dirname, "events", file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

(async () => {
  try {
    // Load default extractors (Spotify, SoundCloud, Apple Music, etc.) but exclude the broken default YoutubeExtractor
    await client.musicPlayer.extractors.loadDefault(
      (ext) => ext !== 'YouTubeExtractor'
    );
    // Register YoutubeiExtractor which actually works for searching
    await client.musicPlayer.extractors.register(YoutubeiExtractor, {});
    console.log('[Music] Extractors loaded successfully (Youtubei).');

    await connectDatabase();
    await client.login(config.discord.token);
  } catch (error) {
    console.error("Fatal startup error:", error);
    process.exit(1);
  }
})();