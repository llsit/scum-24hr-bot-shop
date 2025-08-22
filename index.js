import { Client, GatewayIntentBits, ActionRowBuilder, StringSelectMenuBuilder, Partials, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";
import Rcon from "rcon";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import { WELCOME_PACK_ITEMS, handleWelcomeCommand, getWelcomePackInfo } from "./welcomePack.js";
import { SHOP_ITEMS, getShopItemsInfo } from "./shopItems.js";
import { DAILY_BONUS_COINS, DAILY_COOLDOWN_MS, BOT_CONFIG, DB_CONFIG, RCON_CONFIG } from "./config.js";

// Load environment variables
dotenv.config();

// ----------------------------------------------
// Configuration (use env vars if defined)
// ----------------------------------------------
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Check if Discord token is provided
if (!DISCORD_BOT_TOKEN || DISCORD_BOT_TOKEN === "your_discord_bot_token_here") {
  console.error("❌ ERROR: Discord Bot Token is missing!");
  console.error("Please create a .env file with your Discord bot token:");
  console.error("DISCORD_BOT_TOKEN=your_actual_bot_token_here");
  console.error("");
  console.error("To get a Discord bot token:");
  console.error("1. Go to https://discord.com/developers/applications");
  console.error("2. Create a new application or select existing one");
  console.error("3. Go to 'Bot' section");
  console.error("4. Copy the token and paste it in .env file");
  process.exit(1);
}

const RCON_HOST = process.env.RCON_HOST || "IP_SERVER"; // e.g. 127.0.0.1
const RCON_PORT = Number(process.env.RCON_PORT || 12345);
const RCON_PASSWORD = process.env.RCON_PASSWORD || "RCON_PASSWORD";
const ENABLE_RCON = (process.env.ENABLE_RCON || "false").toLowerCase() === "true";





// ----------------------------------------------
// Database setup (SQLite)
// ----------------------------------------------
const db = new sqlite3.Database("./shop.db");
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (" +
      "discordId TEXT PRIMARY KEY, " +
      "steamId TEXT, " +
      "coins INTEGER DEFAULT 0, " +
      "lastDailyAt INTEGER DEFAULT 0, " +
      "welcomePackReceived INTEGER DEFAULT 0" +
    ")"
  );
  
  // Add welcomePackReceived column to existing users table if it doesn't exist
  db.run("ALTER TABLE users ADD COLUMN welcomePackReceived INTEGER DEFAULT 0");

  db.run(
    "CREATE TABLE IF NOT EXISTS purchases (" +
      "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
      "discordId TEXT NOT NULL, " +
      "item TEXT NOT NULL, " +
      "price INTEGER NOT NULL, " +
      "createdAt INTEGER NOT NULL" +
    ")"
  );

  db.run(
    "CREATE TABLE IF NOT EXISTS shop_channels (" +
      "channelId TEXT PRIMARY KEY, " +
      "guildId TEXT NOT NULL, " +
      "setupBy TEXT NOT NULL, " +
      "setupAt INTEGER NOT NULL" +
    ")"
  );
});

function ensureUserRow(discordId, callback) {
  db.get("SELECT discordId FROM users WHERE discordId = ?", [discordId], (err, row) => {
    if (err) {
      callback(err);
      return;
    }
    if (row) {
      callback(null);
      return;
    }
    db.run("INSERT INTO users (discordId, coins, lastDailyAt) VALUES (?, 0, 0)", [discordId], (insertErr) => {
      callback(insertErr || null);
    });
  });
}

// ----------------------------------------------
// RCON connection with auto-reconnect
// ----------------------------------------------
let rcon = null;
let rconIsAuthed = false;
let rconConnecting = false;

function connectRcon() {
  if (!ENABLE_RCON) {
    console.log("ℹ️ RCON disabled (ENABLE_RCON != true). Skipping RCON connect.");
    return;
  }
  if (rconConnecting) return;
  rconConnecting = true;

  if (rcon) {
    try { rcon.disconnect(); } catch (_) {}
    rcon = null;
  }

  rcon = new Rcon(RCON_HOST, RCON_PORT, RCON_PASSWORD);

  rcon.on("auth", () => {
    rconIsAuthed = true;
    rconConnecting = false;
    console.log("✅ RCON authenticated");
  });

  rcon.on("response", (str) => {
    console.log("[RCON]", str);
  });

  rcon.on("error", (err) => {
    console.error("[RCON ERROR]", err);
  });

  rcon.on("end", () => {
    rconIsAuthed = false;
    rconConnecting = false;
    console.warn("⚠️ RCON connection ended. Reconnecting in 3s...");
    setTimeout(connectRcon, 3000);
  });

  try {
    rcon.connect();
  } catch (e) {
    console.error("Failed to start RCON connect:", e);
    rconConnecting = false;
    setTimeout(connectRcon, 3000);
  }
}

async function safeRconSend(command) {
  return new Promise((resolve, reject) => {
    if (!ENABLE_RCON) {
      return reject(new Error("RCON disabled"));
    }
    if (!rcon || !rconIsAuthed) {
      return reject(new Error("RCON not connected"));
    }
    try {
      rcon.send(command);
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}



// ----------------------------------------------
// Discord client
// ----------------------------------------------
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildVoiceStates], partials: [Partials.Channel] });

function onClientReady() {
  console.log(`✅ Logged in as ${client.user.tag}`);
  // Only connect RCON when explicitly enabled
  if (ENABLE_RCON) connectRcon();
}

client.once("ready", onClientReady);
client.once("clientReady", onClientReady);

function formatCoins(amount) {
  return `${amount} coins`;
}

function createShopEmbed() {
  const embed = new EmbedBuilder()
    .setTitle("🔫 SCUM Weapon Shop")
    .setDescription("เลือกอาวุธและอุปกรณ์ที่ต้องการ")
    .setColor(0x00ff00)
    .setTimestamp()
    .setFooter({ text: "SCUM 24HR Weapon Shop Bot" });

  // Add weapon fields
  Object.entries(SHOP_ITEMS).forEach(([key, item]) => {
    embed.addFields({
      name: `${item.name} - ${item.price} coins`,
      value: item.description,
      inline: true
    });
  });

  return embed;
}

function createItemEmbed(itemKey, item) {
  const embed = new EmbedBuilder()
    .setTitle(item.name)
    .setDescription(item.description)
    .setColor(0x00ff00)
    .setImage(item.image)
    .addFields(
      { name: "Value", value: item.price.toString(), inline: true },
      { name: "Copy command", value: `\`!buy ${itemKey}\``, inline: true },
      { name: "Command Channel", value: "# พิมพ์คำสั่ง", inline: true }
    )
    .setTimestamp()
    .setFooter({ text: "SCUM 24HR Weapon Shop Bot" });

  return embed;
}

function createItemButtons(itemKey, item) {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`buy-${itemKey}`)
        .setLabel("Buy Now")
        .setStyle(ButtonStyle.Success), // Green
      new ButtonBuilder()
        .setCustomId(`add-${itemKey}`)
        .setLabel("Add to cart")
        .setStyle(ButtonStyle.Primary), // Blue
      new ButtonBuilder()
        .setCustomId(`checkout-${itemKey}`)
        .setLabel("Checkout")
        .setStyle(ButtonStyle.Secondary) // Gray (closest to purple available)
    );

  return [row];
}

function listShopText() {
  let text = "🔫 **SCUM Weapon Shop**\n\n";
  Object.entries(SHOP_ITEMS).forEach(([key, item]) => {
    text += `**${item.name}** - ${item.price} coins\n`;
    text += `${item.description}\n\n`;
  });
  text += "ใช้คำสั่ง `!buy <item>` เพื่อซื้อสินค้า";
  return text;
}

function createWeaponButtons() {
  const buttons = Object.entries(SHOP_ITEMS).map(([key, item]) => 
    new ButtonBuilder()
      .setCustomId(`buy-${key}`)
      .setLabel(`ซื้อ ${item.name}`)
      .setStyle(ButtonStyle.Primary)
      .setEmoji("💰")
  );

  // Split into rows of 3 buttons each
  const rows = [];
  for (let i = 0; i < buttons.length; i += 3) {
    const row = new ActionRowBuilder().addComponents(buttons.slice(i, i + 3));
    rows.push(row);
  }

  return rows;
}

// Function to send shop embed to a channel
async function sendShopToChannel(channel) {
  try {
    // Send each item individually like in the screenshot
    for (const [itemKey, item] of Object.entries(SHOP_ITEMS)) {
      const embed = createItemEmbed(itemKey, item);
      const buttonRows = createItemButtons(itemKey, item);
      
      await channel.send({ 
        embeds: [embed], 
        components: buttonRows 
      });
      
      // Add a small delay between messages to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`✅ Sent shop items to channel: ${channel.name} (${channel.id})`);
  } catch (e) {
    console.error(`Failed to send shop to channel ${channel.name}:`, e);
  }
}

// Function to check if channel is setup for auto-shop
function isShopChannel(channelId, callback) {
  db.get("SELECT channelId FROM shop_channels WHERE channelId = ?", [channelId], (err, row) => {
    callback(err, !!row);
  });
}

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  const content = (msg.content || "").trim();
  const lower = content.toLowerCase();

  // Echo back any command starting with '!' but allow specific commands to proceed
  if (lower.startsWith("!") && lower !== "!menu" && lower !== "!list" && lower !== "!setup" && lower !== "!unsetup" && lower !== "!link" && lower !== "!balance" && lower !== "!shop" && lower !== "!daily" && lower !== "!welcome" && !lower.startsWith("!buy ")) {
    try {
      await msg.reply(`คุณส่งคำสั่ง: ${content}`);
    } catch (e) {
      console.error("Failed to reply (echo):", e);
      try { await msg.channel.send(`คุณส่งคำสั่ง: ${content}`); } catch (_) {}
    }
    return;
  }

  // Show interactive list menu
  if (lower === "!menu" || lower === "!list" || lower.startsWith("!menu ") || lower.startsWith("!list ")) {
    try {
      // Send each item individually like in the screenshot
      for (const [itemKey, item] of Object.entries(SHOP_ITEMS)) {
        const embed = createItemEmbed(itemKey, item);
        const buttonRows = createItemButtons(itemKey, item);
        
        await msg.channel.send({ 
          embeds: [embed], 
          components: buttonRows 
        });
        
        // Add a small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.error("Failed to send shop menu:", e);
      try { 
        await msg.channel.send({ 
          content: "เลือกสินค้าที่ต้องการ:", 
          components: [new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("choose-select")
              .setPlaceholder("เลือกสินค้า")
              .addOptions(Object.entries(SHOP_ITEMS).map(([key, v]) => ({ 
                label: key, 
                value: key, 
                description: `${v.price} coins` 
              })))
          )]
        }); 
      } catch (_) {}
    }
    return;
  }

  // !link <SteamID>
  if (content.startsWith("!link ")) {
    const parts = content.split(/\s+/);
    const steamId = parts[1];
    if (!steamId) {
      msg.reply("โปรดระบุ SteamID เช่น !link 76561198000000000");
      return;
    }

    ensureUserRow(msg.author.id, (err) => {
      if (err) {
        msg.reply("❌ เกิดข้อผิดพลาดในระบบฐานข้อมูล");
        return;
      }
      db.run("UPDATE users SET steamId = ? WHERE discordId = ?", [steamId, msg.author.id], (updateErr) => {
        if (updateErr) {
          msg.reply("❌ ไม่สามารถบันทึก SteamID ได้");
          return;
        }
        msg.reply(`✅ ผูกบัญชีกับ SteamID: ${steamId} สำเร็จ`);
      });
    });
    return;
  }

  // !balance
  if (content === "!balance") {
    ensureUserRow(msg.author.id, (err) => {
      if (err) {
        msg.reply("❌ ฐานข้อมูลมีปัญหา");
        return;
      }
      db.get("SELECT coins FROM users WHERE discordId = ?", [msg.author.id], (getErr, row) => {
        if (getErr || !row) {
          msg.reply("❌ ไม่พบข้อมูลผู้ใช้");
          return;
        }
        msg.reply(`💰 คุณมี ${formatCoins(row.coins)}`);
      });
    });
    return;
  }

  // !shop
  if (content === "!shop") {
    msg.reply(listShopText());
    return;
  }

  // !daily
  if (content === "!daily") {
    ensureUserRow(msg.author.id, (err) => {
      if (err) {
        msg.reply("❌ ฐานข้อมูลมีปัญหา");
        return;
      }
      db.get("SELECT coins, lastDailyAt FROM users WHERE discordId = ?", [msg.author.id], (getErr, row) => {
        if (getErr || !row) {
          msg.reply("❌ ไม่พบข้อมูลผู้ใช้");
          return;
        }
        const now = Date.now();
        const elapsed = now - (row.lastDailyAt || 0);
        if (elapsed < DAILY_COOLDOWN_MS) {
          const remainingMs = DAILY_COOLDOWN_MS - elapsed;
          const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
          msg.reply(`⏳ รับโบนัสรายวันได้อีกใน ${hours} ชั่วโมง`);
          return;
        }
        db.run("UPDATE users SET coins = coins + ?, lastDailyAt = ? WHERE discordId = ?", [DAILY_BONUS_COINS, now, msg.author.id], (updErr) => {
          if (updErr) {
            msg.reply("❌ ไม่สามารถอัพเดตโบนัสได้");
            return;
          }
          msg.reply(`✅ รับโบนัสรายวัน ${formatCoins(DAILY_BONUS_COINS)} แล้ว!`);
        });
      });
    });
    return;
  }

  // !welcome - Get welcome pack
  if (content === "!welcome") {
    ensureUserRow(msg.author.id, (err) => {
      if (err) {
        msg.reply("❌ ฐานข้อมูลมีปัญหา");
        return;
      }
      
      handleWelcomeCommand(msg, db, safeRconSend)
        .then(welcomeMessage => {
          msg.reply(welcomeMessage);
        })
        .catch(errorMessage => {
          msg.reply(errorMessage);
        });
    });
    return;
  }

  // !buy <item>
  if (content.startsWith("!buy ")) {
    const parts = content.split(/\s+/);
    const itemKey = (parts[1] || "").toLowerCase();
    const item = SHOP_ITEMS[itemKey];
    if (!item) {
      msg.reply("❌ ไม่พบสินค้า ใช้คำสั่ง !shop เพื่อดูรายการ");
      return;
    }

    ensureUserRow(msg.author.id, (err) => {
      if (err) {
        msg.reply("❌ ฐานข้อมูลมีปัญหา");
        return;
      }
      db.get("SELECT coins, steamId FROM users WHERE discordId = ?", [msg.author.id], async (getErr, row) => {
        if (getErr || !row) {
          msg.reply("❌ ไม่พบข้อมูลผู้ใช้");
          return;
        }
        if (!row.steamId) {
          msg.reply("❌ คุณยังไม่ได้ผูก SteamID ใช้คำสั่ง !link <SteamID>");
          return;
        }
        if (row.coins < item.price) {
          msg.reply(`❌ เงินไม่พอ ต้องมีอย่างน้อย ${formatCoins(item.price)}`);
          return;
        }

        // Deduct coins first
        db.run("UPDATE users SET coins = coins - ? WHERE discordId = ?", [item.price, msg.author.id], async (updErr) => {
          if (updErr) {
            msg.reply("❌ ไม่สามารถตัด coins ได้");
            return;
          }

          // Record purchase
          db.run(
            "INSERT INTO purchases (discordId, item, price, createdAt) VALUES (?, ?, ?, ?)",
            [msg.author.id, itemKey, item.price, Date.now()],
            () => {}
          );

          // Send item via RCON
          const command = `${item.spawnCommand} ${row.steamId}`;
          try {
            await safeRconSend(command);
            msg.reply(`✅ ซื้อ ${itemKey} สำเร็จ!`);
          } catch (sendErr) {
            // If RCON send failed, refund coins
            db.run("UPDATE users SET coins = coins + ? WHERE discordId = ?", [item.price, msg.author.id], () => {});
            console.error("RCON send failed:", sendErr);
            msg.reply("❌ ไม่สามารถส่งของผ่าน RCON ได้ โปรดลองอีกครั้ง");
          }
        });
      });
    });
    return;
  }

  // Setup shop channel
  if (lower === "!setup") {
    if (!msg.guild) {
      msg.reply("❌ คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์");
      return;
    }

    db.run(
      "INSERT OR REPLACE INTO shop_channels (channelId, guildId, setupBy, setupAt) VALUES (?, ?, ?, ?)",
      [msg.channel.id, msg.guild.id, msg.author.id, Date.now()],
      async (err) => {
        if (err) {
          msg.reply("❌ ไม่สามารถตั้งค่าช่องได้");
          return;
        }
        
        // Send initial shop embed
        await sendShopToChannel(msg.channel);
        msg.reply("✅ ตั้งค่าช่องนี้เป็น Shop Channel แล้ว! Shop จะแสดงอัตโนมัติเมื่อผู้ใช้เข้ามาในช่อง");
      }
    );
    return;
  }

  // Remove shop channel
  if (lower === "!unsetup") {
    if (!msg.guild) {
      msg.reply("❌ คำสั่งนี้ใช้ได้เฉพาะในเซิร์ฟเวอร์");
      return;
    }

    db.run("DELETE FROM shop_channels WHERE channelId = ?", [msg.channel.id], (err) => {
      if (err) {
        msg.reply("❌ ไม่สามารถยกเลิกการตั้งค่าได้");
        return;
      }
      msg.reply("✅ ยกเลิกการตั้งค่า Shop Channel แล้ว");
    });
    return;
  }
});

// Reply to select menu choice
client.on("interactionCreate", async (interaction) => {
  if (interaction.isStringSelectMenu() && interaction.customId === "choose-select") {
    const itemKey = interaction.values[0];
    await interaction.reply({ content: `คำสั่ง: !buy ${itemKey}`, ephemeral: true });
  }
  
  if (interaction.isButton()) {
    const customId = interaction.customId;
    
    if (customId.startsWith("buy-")) {
      const itemKey = customId.replace("buy-", "");
      const item = SHOP_ITEMS[itemKey];
      
      if (item) {
        await interaction.reply({ 
          content: `คำสั่ง: !buy ${itemKey}\nราคา: ${item.price} coins\nชื่อ: ${item.name}`, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: "❌ ไม่พบสินค้านี้", 
          ephemeral: true 
        });
      }
    } else if (customId.startsWith("add-")) {
      const itemKey = customId.replace("add-", "");
      const item = SHOP_ITEMS[itemKey];
      
      if (item) {
        await interaction.reply({ 
          content: `🛒 เพิ่ม ${item.name} ลงในตะกร้าแล้ว!\nใช้คำสั่ง \`!buy ${itemKey}\` เพื่อซื้อ`, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: "❌ ไม่พบสินค้านี้", 
          ephemeral: true 
        });
      }
    } else if (customId.startsWith("checkout-")) {
      const itemKey = customId.replace("checkout-", "");
      const item = SHOP_ITEMS[itemKey];
      
      if (item) {
        await interaction.reply({ 
          content: `✅ ไปยังหน้าชำระเงินสำหรับ ${item.name}\nราคา: ${item.price} coins\nใช้คำสั่ง \`!buy ${itemKey}\` เพื่อซื้อ`, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: "❌ ไม่พบสินค้านี้", 
          ephemeral: true 
        });
      }
    }
  }
});

// Auto-send shop when bot joins a server
client.on("guildCreate", async (guild) => {
  console.log(`Bot joined server: ${guild.name} (${guild.id})`);
  
  // Find first text channel and setup as shop
  const textChannel = guild.channels.cache.find(ch => ch.type === 0); // 0 = text channel
  if (textChannel) {
    try {
      await sendShopToChannel(textChannel);
      console.log(`Auto-setup shop in: ${textChannel.name}`);
    } catch (e) {
      console.error("Failed to auto-setup shop:", e);
    }
  }
});

// Auto-send shop when someone joins a shop channel (optional - can be spammy)
client.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (!newPresence.guild) return;
  
  // Check if user just joined a voice channel that's in a shop channel's guild
  const guild = newPresence.guild;
  const member = newPresence.member;
  
  if (!member || member.user.bot) return;
  
  // Get all shop channels in this guild
  db.all("SELECT channelId FROM shop_channels WHERE guildId = ?", [guild.id], async (err, rows) => {
    if (err || !rows.length) return;
    
    for (const row of rows) {
      const channel = guild.channels.cache.get(row.channelId);
      if (channel && channel.type === 0) { // text channel
        // Send shop to the channel (optional - can be commented out to avoid spam)
        // await sendShopToChannel(channel);
      }
    }
  });
});

client.login(DISCORD_BOT_TOKEN);
