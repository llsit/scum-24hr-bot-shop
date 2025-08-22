// Shop Items Configuration
// ----------------------------------------------

// Shop catalog with images and descriptions
export const SHOP_ITEMS = {
  ak47: { 
    price: 1500, 
    spawnCommand: "#SpawnItem BP_AK47",
    name: "AK-47 Assault Rifle",
    description: "ปืนไรเฟิลอัตโนมัติ AK-47 ความเสียหายสูง ใช้กระสุน 7.62x39mm",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/f/f8/AK-47.png/revision/latest?cb=20200404202546"
  },
  m16: { 
    price: 1800, 
    spawnCommand: "#SpawnItem BP_M16",
    name: "M16 Assault Rifle", 
    description: "ปืนไรเฟิล M16 แม่นยำและเสถียร ใช้กระสุน 5.56x45mm",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/e/ea/M16.png/revision/latest?cb=20200404202605"
  },
  m82a1: { 
    price: 2500, 
    spawnCommand: "#SpawnItem BP_Weapon_M82A1",
    name: "M82A1 Barrett",
    description: "ปืนไรเฟิลสไนเปอร์ .50 BMG สำหรับยิงระยะไกลและทำลายยานพาหนะ",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/2/27/M82A1.png/revision/latest?cb=20220813052625"
  },
  svd: { 
    price: 2200, 
    spawnCommand: "#SpawnItem BP_Weapon_SVD",
    name: "SVD Dragunov",
    description: "ปืนไรเฟิลสไนเปอร์ SVD ใช้กระสุน 7.62x54mmR แม่นยำสูง",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/8/8d/SVD.png/revision/latest?cb=20220813052625"
  },
  mp5: { 
    price: 1200, 
    spawnCommand: "#SpawnItem BP_Weapon_MP5",
    name: "MP5 Submachine Gun",
    description: "ปืนกลมือ MP5 ใช้กระสุน 9x19mm เหมาะสำหรับการต่อสู้ระยะกลาง",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/4/4b/MP5.png/revision/latest?cb=20220813052625"
  },
  desert_eagle: { 
    price: 800, 
    spawnCommand: "#SpawnItem BP_Weapon_DesertEagle",
    name: "Desert Eagle",
    description: "ปืนพก Desert Eagle ใช้กระสุน .50 AE พลังทำลายสูง",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/2/24/Desert_Eagle.png/revision/latest?cb=20220813051814"
  },
  m9: { 
    price: 600, 
    spawnCommand: "#SpawnItem BP_Weapon_M9",
    name: "TEC01 M9",
    description: "ปืนพก M9 ใช้กระสุน 9x19mm อาวุธประจำตัวที่เชื่อถือได้",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/f/f8/TEC01_M9.png/revision/latest?cb=20220813051814"
  },
  machete: { 
    price: 300, 
    spawnCommand: "#SpawnItem BP_Machete",
    name: "Machete",
    description: "มีดดาบสำหรับต่อสู้ระยะประชิด ความเสียหายสูงต่อผู้เล่น",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/8/8d/Machete.png/revision/latest?cb=20220810200158"
  },
  crowbar: { 
    price: 250, 
    spawnCommand: "#SpawnItem BP_Crowbar",
    name: "Crowbar",
    description: "ชะแลงเหล็ก อาวุธทื่อที่มีโอกาสทำให้ผู้เล่นสลบสูง",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/c/c0/Crowbar.png/revision/latest?cb=20220810200134"
  },
  grenade: { 
    price: 400, 
    spawnCommand: "#SpawnItem BP_Grenade",
    name: "Frag Grenade",
    description: "ระเบิดมือสำหรับทำลายกลุ่มศัตรูและทำลายฐาน",
    image: "https://static.wikia.nocookie.net/scum_gamepedia_en/images/4/4b/Grenade.png/revision/latest?cb=20220813052625"
  },
};

// Function to get shop items info
export function getShopItemsInfo() {
  return {
    items: SHOP_ITEMS,
    count: Object.keys(SHOP_ITEMS).length,
    categories: {
      rifles: ['ak47', 'm16', 'm82a1', 'svd'],
      pistols: ['desert_eagle', 'm9'],
      smg: ['mp5'],
      melee: ['machete', 'crowbar'],
      explosives: ['grenade']
    }
  };
}
