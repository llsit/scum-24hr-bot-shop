// Configuration Settings
// ----------------------------------------------

// Daily bonus configuration
export const DAILY_BONUS_COINS = 500;
export const DAILY_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Bot configuration
export const BOT_CONFIG = {
  embedColor: 0x00ff00,
  footerText: "SCUM 24HR Weapon Shop Bot",
  rateLimitDelay: 500, // Delay between messages to avoid rate limiting
  itemSpawnDelay: 100  // Delay between spawning items
};

// Database configuration
export const DB_CONFIG = {
  filename: "./shop.db",
  tables: {
    users: `
      CREATE TABLE IF NOT EXISTS users (
        discordId TEXT PRIMARY KEY,
        steamId TEXT,
        coins INTEGER DEFAULT 0,
        lastDailyAt INTEGER DEFAULT 0,
        welcomePackReceived INTEGER DEFAULT 0
      )
    `,
    purchases: `
      CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discordId TEXT NOT NULL,
        item TEXT NOT NULL,
        price INTEGER NOT NULL,
        createdAt INTEGER NOT NULL
      )
    `,
    shop_channels: `
      CREATE TABLE IF NOT EXISTS shop_channels (
        channelId TEXT PRIMARY KEY,
        guildId TEXT NOT NULL,
        setupBy TEXT NOT NULL,
        setupAt INTEGER NOT NULL
      )
    `
  }
};

// RCON configuration
export const RCON_CONFIG = {
  reconnectDelay: 3000, // 3 seconds
  maxReconnectAttempts: 10
};
