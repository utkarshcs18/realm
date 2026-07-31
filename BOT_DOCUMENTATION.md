#  Realm Bot - Deep Dive Documentation

Welcome to the comprehensive guide for this Discord bot. This document is designed for developers, server owners, or anyone who wants to understand exactly how this bot is built, how it operates under the hood, and what makes it production-ready.

---

##  Bot Features (For Owners & Users)

This bot is a fully-featured, multi-purpose powerhouse designed to run your entire Discord server. Here is what it can do for you:

###  Advanced Music System
Enjoy high-quality, buffer-free music in your voice channels.
- **Play Anything:** Search and play music seamlessly from YouTube, Spotify, and SoundCloud.
- **Queue Management:** Queue up multiple songs, skip, pause, resume, and loop tracks or entire playlists.
- **High Quality:** Uses a dedicated Opus audio encoder for crystal clear audio without lag.

###  Moderation Toolkit
Keep your server safe and organized with powerful moderation commands.
- **Kick, Ban, and Mute:** Easily remove or silence problematic users.
- **Warn System:** Track user infractions securely in the bot's database.
- **Automod Integration:** Automatically detect and act on bad behavior.

###  Leveling & XP
Engage your community by rewarding activity.
- **Global XP Tracking:** Users earn experience points for chatting and participating in the server.
- **Rank Cards:** Users can check their level and rank on the leaderboard.

###  Welcome & Goodbye System
Make a great first impression on new members.
- **Custom Welcome Messages:** Automatically greet new users when they join with personalized text and images.
- **Auto-Roles:** Automatically assign roles to users the moment they verify or join.

###  Utility & Misc
- **Server Info & Ping:** Instantly check server stats and bot latency.
- **Database Driven:** All settings are saved securely, meaning your server configuration is never lost.

---

##  Architecture & Tech Stack

This bot is built using modern JavaScript and follows a highly modular architecture.

### Core Technologies
- **Node.js (v24+)**: The JavaScript runtime powering the entire application.
- **Discord.js (v14)**: The official, most powerful library for interacting with the Discord API. It handles all gateway events, slash commands, and message caching.
- **MongoDB & Mongoose**: A NoSQL database used to store persistent data (like user profiles, server settings, or warnings) securely and efficiently.
- **Winston**: A professional-grade logging library that keeps track of errors and events in the background without flooding the console.

### Audio & Music Engine
The music system is the most complex and robust part of this bot:
- **Discord-Player (v6)**: A powerful audio framework built on top of Discord.js. It manages music queues, track extraction, and playback logic.
- **@distube/ytdl-core**: A specially patched YouTube downloader that bypasses YouTube's strict stream-blocking algorithms.
- **FFmpeg (ffmpeg-static)**: The engine that transcodes raw audio streams (like MP3s or web streams) into the high-quality Opus format required by Discord Voice.
- **Opus & Sodium (opusscript & libsodium-wrappers)**: Core encryption and encoding libraries. Discord requires all voice packets to be encrypted using the Sodium cipher and encoded in Opus before they can be sent over UDP.

---

##  How the Bot Actually Works

### 1. The Entry Point (`index.js`)
When you run `npm start`, the `index.js` file wakes up. It performs several critical startup tasks:
- **Environment Setup**: Loads `.env` variables (like your secret Bot Token and MongoDB URI).
- **Network Patching**: Forces Node.js to use IPv4 (`dns.setDefaultResultOrder('ipv4first')`). This is a crucial fix that prevents Discord Voice UDP packets from failing on strict Windows networks.
- **Client Initialization**: Logs into Discord and tells the API which "Intents" (permissions to read data) the bot needs.
- **Handler Loading**: Dynamically reads the `commands` and `events` folders, injecting all your code into the bot's memory automatically.

### 2. The Command Handler (`/commands/`)
Instead of having one massive file with thousands of lines of code, this bot uses a **Dynamic Command Handler**. 
Every command (like `/play` or `/ping`) gets its own dedicated file. 
- When a user types a slash command in Discord, the `interactionCreate` event catches it.
- The event looks at the command name, searches the bot's memory (the `client.commands` collection), and executes the specific file. This makes adding new commands as easy as dragging and dropping a file!

### 3. The Music Pipeline
When a user types `/play dhun`, a massive sequence of events happens in milliseconds:
1. **Search**: The bot queries YouTube using `YoutubeiExtractor`.
2. **Queueing**: The track is added to the server's specific `GuildQueue`.
3. **Voice Connection**: The bot joins the user's voice channel. Behind the scenes, it negotiates a UDP WebSocket connection with Discord's Media Servers.
4. **Extraction & Transcoding**: The bot downloads the audio stream via `@distube/ytdl-core`, pipes it through `FFmpeg` to convert it to Opus, encrypts it using `libsodium`, and pushes it to Discord.

### 4. Database Connection (`/database/connect.js`)
Before the bot goes fully online, it establishes a secure connection to MongoDB. This ensures that any commands relying on database reads/writes don't crash upon startup.

---

## 🛠️ Local Development vs. Production Deployment

### Running Locally (Testing)
When running the bot on a local Windows PC, you might encounter strict firewall rules that block the bot from streaming audio. Because Discord Voice requires outbound UDP packets, Windows Defender Firewall can sometimes block the bot.
*Fix:* We bypass this during development by allowing `node.exe` through the firewall, or by tunneling the connection through a VPN.

### Running in Production (Deployment)
When you deploy this bot to a real server host (like Railway, Heroku, or an Ubuntu VPS):
- The bot runs 24/7.
- UDP voice packets are **never blocked** because Linux server environments do not use strict desktop firewalls.
- The connection to Discord is significantly faster and more stable due to data center internet speeds.

---

##  Adding Features in the Future

Because of the modular architecture, expanding the bot is incredibly simple:
- **Need a new command?** Create a new file in the `commands` folder. Provide the `data` (name and description) and the `execute` function. The handler does the rest.
- **Need a new event?** Create a new file in the `events` folder. Name it after the Discord event (like `messageCreate.js`) and it will automatically listen for it.

This structure ensures the bot remains scalable, maintainable, and easy to read for any developer who joins the project!

---

##  Full Command List

Below is the complete list of all slash commands currently available in the bot, categorized by their modules:

###  LEVELING
- **/leaderboard**: Show top leveling users.
- **/rank**: Show rank and XP.

###  MODERATION
- **/ban**: Ban a user.
- **/kick**: Kick a user.
- **/mute**: Timeout a user.
- **/purge**: Delete a number of recent messages.
- **/unmute**: Unmute/remove timeout from a user.
- **/warn**: Warn a user.

###  MUSIC
- **/leave**: Make the bot leave the voice channel and clear the queue.
- **/pause**: Pause the currently playing track.
- **/play**: Play a song by name or URL (YouTube, Spotify, SoundCloud).
- **/queue**: Show the current music queue.
- **/resume**: Resume paused playback.
- **/skip**: Skip the current track.

###  UTILITY
- **/embed create**: Create a new custom embed template.
- **/embed edit**: Use the editor to preview and edit an existing embed.
- **/embed show**: Preview an embed.
- **/embed delete**: Delete an embed.
- **/embed list**: List all saved embed templates.
- **/help**: Display available commands.
- **/ping**: Check bot latency.
- **/reactionrole**: Send reaction role setup message.
- **/setup**: Configure bot settings (including welcome channel & embed).
- **/ticket**: Ticket system commands.
