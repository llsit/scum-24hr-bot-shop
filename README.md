# SCUM 24HR Weapon Shop Bot

Discord bot for SCUM server weapon shop with RCON integration.

## Project Structure

```
scum-24hr-bot/
├── index.js          # Main bot file
├── welcomePack.js    # Welcome pack functionality
├── shopItems.js      # Shop items configuration
├── config.js         # Configuration settings
├── package.json      # Dependencies
├── README.md         # Documentation
└── shop.db          # SQLite database
```

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
npm install dotenv
```

### 2. Create Environment File
Create a `.env` file in the root directory with the following content:

```env
# Discord Bot Configuration
# Get your bot token from: https://discord.com/developers/applications
DISCORD_BOT_TOKEN=your_discord_bot_token_here

# RCON Configuration (optional - for SCUM server integration)
RCON_HOST=127.0.0.1
RCON_PORT=12345
RCON_PASSWORD=your_rcon_password_here
ENABLE_RCON=false
```

### 3. Get Discord Bot Token
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Go to 'Bot' section
4. Click 'Add Bot'
5. Copy the token and paste it in your `.env` file

### 4. Invite Bot to Server
1. In Discord Developer Portal, go to 'OAuth2' > 'URL Generator'
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`, `Attach Files`
4. Copy the generated URL and open it in browser to invite bot

### 5. Run the Bot
```bash
node index.js
```

## Available Commands

- `!balance` - Check your coin balance
- `!daily` - Get daily bonus coins
- `!welcome` - Get welcome pack (one-time only)
- `!shop` - Show shop catalog
- `!menu` or `!list` - Show interactive shop menu
- `!buy <item>` - Buy an item (e.g., `!buy ak47`)
- `!link <SteamID>` - Link your Discord account with Steam ID
- `!setup` - Setup current channel as shop channel
- `!unsetup` - Remove shop channel setup

## Available Weapons

1. **AK-47** (1500 coins) - Assault Rifle 7.62x39mm
2. **M4A1** (1800 coins) - Assault Rifle 5.56x45mm
3. **M82A1 Barrett** (2500 coins) - Sniper Rifle .50 BMG
4. **SVD Dragunov** (2200 coins) - Sniper Rifle 7.62x54mmR
5. **MP5** (1200 coins) - Submachine Gun 9x19mm
6. **Desert Eagle** (800 coins) - Pistol .50 AE
7. **TEC01 M9** (600 coins) - Pistol 9x19mm
8. **Machete** (300 coins) - Melee weapon
9. **Crowbar** (250 coins) - Melee weapon
10. **Frag Grenade** (400 coins) - Explosive

## Welcome Pack

สำหรับผู้เล่นใหม่ สามารถรับ Welcome Pack ได้ครั้งเดียวโดยใช้คำสั่ง `!welcome`

**ของใน Welcome Pack:**
- **Bandage** - ผ้าพันแผลสำหรับรักษาบาดแผล
- **Water Bottle** - ขวดน้ำดื่ม
- **Tuna Can** - ปลาทูน่ากระป๋อง อาหารสำเร็จรูป
- **Apple** - แอปเปิ้ล ผลไม้สด
- **Compass** - เข็มทิศสำหรับนำทาง
- **Flashlight** - ไฟฉายสำหรับส่องในที่มืด
- **Matches** - ไม้ขีดไฟสำหรับจุดไฟ
- **Knife** - มีดพกสำหรับใช้งานทั่วไป

## Features

- ✅ Real weapon data from SCUM Wiki
- ✅ High-quality weapon images
- ✅ Interactive Discord embeds with buttons
- ✅ SQLite database for user data
- ✅ RCON integration for SCUM server
- ✅ Daily bonus system
- ✅ Welcome pack system for new players
- ✅ Steam ID linking
- ✅ Purchase history tracking
