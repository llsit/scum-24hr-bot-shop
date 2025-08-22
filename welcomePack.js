// Welcome Pack Configuration and Functions
// ----------------------------------------------

// Welcome pack items configuration
export const WELCOME_PACK_ITEMS = [
  { spawnCommand: "#SpawnItem BP_Bandage", name: "Bandage", description: "ผ้าพันแผลสำหรับรักษาบาดแผล" },
  { spawnCommand: "#SpawnItem BP_WaterBottle", name: "Water Bottle", description: "ขวดน้ำดื่ม" },
  { spawnCommand: "#SpawnItem BP_TunaCan", name: "Tuna Can", description: "ปลาทูน่ากระป๋อง อาหารสำเร็จรูป" },
  { spawnCommand: "#SpawnItem BP_Apple", name: "Apple", description: "แอปเปิ้ล ผลไม้สด" },
  { spawnCommand: "#SpawnItem BP_Compass", name: "Compass", description: "เข็มทิศสำหรับนำทาง" },
  { spawnCommand: "#SpawnItem BP_Flashlight", name: "Flashlight", description: "ไฟฉายสำหรับส่องในที่มืด" },
  { spawnCommand: "#SpawnItem BP_Matches", name: "Matches", description: "ไม้ขีดไฟสำหรับจุดไฟ" },
  { spawnCommand: "#SpawnItem BP_Knife", name: "Knife", description: "มีดพกสำหรับใช้งานทั่วไป" }
];

// Function to send welcome pack to a player
export async function sendWelcomePack(steamId, discordId, db, safeRconSend) {
  try {
    // Check if user already received welcome pack
    return new Promise((resolve, reject) => {
      db.get("SELECT welcomePackReceived FROM users WHERE discordId = ?", [discordId], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (row && row.welcomePackReceived) {
          reject(new Error("User already received welcome pack"));
          return;
        }
        
        // Send all welcome pack items
        for (const item of WELCOME_PACK_ITEMS) {
          const command = `${item.spawnCommand} ${steamId}`;
          try {
            await safeRconSend(command);
            // Add small delay between items
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (e) {
            console.error(`Failed to send ${item.name}:`, e);
          }
        }
        
        // Mark as received
        db.run("UPDATE users SET welcomePackReceived = 1 WHERE discordId = ?", [discordId], (updateErr) => {
          if (updateErr) {
            console.error("Failed to update welcome pack status:", updateErr);
          }
        });
        
        resolve();
      });
    });
  } catch (e) {
    throw e;
  }
}

// Function to handle welcome pack command
export async function handleWelcomeCommand(msg, db, safeRconSend) {
  return new Promise((resolve, reject) => {
    db.get("SELECT steamId, welcomePackReceived FROM users WHERE discordId = ?", [msg.author.id], async (getErr, row) => {
      if (getErr || !row) {
        reject("❌ ไม่พบข้อมูลผู้ใช้");
        return;
      }
      if (!row.steamId) {
        reject("❌ คุณยังไม่ได้ผูก SteamID ใช้คำสั่ง !link <SteamID>");
        return;
      }
      if (row.welcomePackReceived) {
        reject("❌ คุณได้รับ Welcome Pack ไปแล้ว!");
        return;
      }
      
      try {
        await sendWelcomePack(row.steamId, msg.author.id, db, safeRconSend);
        const welcomeMessage = "🎁 **Welcome Pack ส่งสำเร็จ!**\n\n**ของที่ได้รับ:**\n" + 
          WELCOME_PACK_ITEMS.map(item => `• ${item.name} - ${item.description}`).join('\n') +
          "\n\n**ขอบคุณที่เลือกเล่นเซิร์ฟเวอร์ของเรา!** 🎉";
        resolve(welcomeMessage);
      } catch (sendErr) {
        console.error("Welcome pack send failed:", sendErr);
        if (sendErr.message === "User already received welcome pack") {
          reject("❌ คุณได้รับ Welcome Pack ไปแล้ว!");
        } else {
          reject("❌ ไม่สามารถส่ง Welcome Pack ได้ โปรดลองอีกครั้ง");
        }
      }
    });
  });
}

// Function to get welcome pack info
export function getWelcomePackInfo() {
  return {
    items: WELCOME_PACK_ITEMS,
    description: "สำหรับผู้เล่นใหม่ สามารถรับ Welcome Pack ได้ครั้งเดียวโดยใช้คำสั่ง `!welcome`",
    itemList: WELCOME_PACK_ITEMS.map(item => `• **${item.name}** - ${item.description}`).join('\n')
  };
}
