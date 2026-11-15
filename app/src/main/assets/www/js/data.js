/* Gemfall Legions - game data (units, enemies, regions, upgrades) */
window.G = window.G || {};
(function () {
  'use strict';

  G.TITLE = 'Gemfall Legions';
  G.H = 720;
  G.LANE_Y = [350, 450, 550];
  G.CASTLE_X = 150;

  // Armor palette per tier (leather, iron, steel, gold, starforged)
  G.TIER_ARMOR = ['#8a5a2b', '#98a2ad', '#5f86c4', '#e0ad2e', '#b48cff'];
  G.TIER_TRIM = ['#5b3a1c', '#5e6670', '#2f4f80', '#9a6d10', '#6a3fd1'];
  G.TIER_NAMES = ['I', 'II', 'III', 'IV', 'V'];
  G.TIER_MULT = [1, 1.4, 1.9, 2.5, 3.2];
  G.TIER_SHARDS = [0, 3, 6, 10, 15];

  /* Player units. look = how the art module draws them. */
  G.UNITS = {
    digger: {
      name: 'Digger', role: 'Gatherer', cost: 50, cd: 2.5, unlock: 0,
      desc: 'Walks to the crystal mine, digs gold and hauls it home. Higher tiers dig faster and carry more.',
      tiers: ['Digger', 'Prospector', 'Foreman', 'Gem Baron', 'Golden Delver'],
      look: { kind: 'humanoid', skin: '#f2c49b', head: 'minercap', weapon: 'pick', legs: '#4b3b2a', size: 0.85 }
    },
    squire: {
      name: 'Squire', role: 'Melee', cost: 60, cd: 3, unlock: 0,
      hp: 130, atk: 14, rate: 0.9, range: 40, speed: 58, armor: 0.05,
      special: { id: 'charge', name: 'Valiant Charge', cost: 30, desc: 'Every Squire dashes forward, striking all foes in the way for triple damage.' },
      desc: 'Sturdy sword-bearer that holds the line.',
      tiers: ['Squire', 'Man-at-Arms', 'Knight Captain', 'Paladin', 'Dawn Champion'],
      look: { kind: 'humanoid', skin: '#f2c49b', head: 'helm', weapon: 'sword', shield: true, legs: '#3c3c4a' }
    },
    ranger: {
      name: 'Ranger', role: 'Ranged', cost: 75, cd: 3.5, unlock: 0,
      hp: 75, atk: 12, rate: 1.1, range: 270, speed: 52, armor: 0, proj: 'arrow',
      special: { id: 'volley', name: 'Hail Volley', cost: 35, desc: 'Every Ranger looses a fan of five arrows for double damage.' },
      desc: 'Long-range archer. Stays behind the front line in Formation.',
      tiers: ['Ranger', 'Sharpshooter', 'Warden', 'Hawkeye', 'Starbow'],
      look: { kind: 'humanoid', skin: '#e9b98c', head: 'hood', weapon: 'bow', legs: '#2f4a2a', hoodColor: '#3f7a3a' }
    },
    bulwark: {
      name: 'Bulwark', role: 'Tank', cost: 110, cd: 6, unlock: 2,
      hp: 330, atk: 9, rate: 1.3, range: 36, speed: 36, armor: 0.25,
      special: { id: 'wall', name: 'Shield Wall', cost: 40, desc: 'Bulwarks become invulnerable for 4s and recover 30% health.' },
      desc: 'Heavily armored wall of steel. Slow but nearly unbreakable.',
      tiers: ['Bulwark', 'Ironwall', 'Bastion', 'Aegis', 'Mountainheart'],
      look: { kind: 'humanoid', skin: '#d9a77c', head: 'greathelm', weapon: 'hammer', shield: 'tower', legs: '#3a3a3a', bulk: 1.35, beard: '#7a4b22' }
    },
    mender: {
      name: 'Mender', role: 'Support', cost: 100, cd: 6, unlock: 4,
      hp: 80, atk: 5, rate: 1.4, range: 190, speed: 46, armor: 0, heal: 14, proj: 'spark',
      special: { id: 'sanctuary', name: 'Sanctuary', cost: 45, desc: 'Heals every ally on the field by 50% and repairs the castle a little.' },
      desc: 'Heals the most wounded ally in her lane.',
      tiers: ['Mender', 'Cleric', 'Lightweaver', 'High Priestess', 'Dawnsaint'],
      look: { kind: 'humanoid', skin: '#f5cfa8', head: 'circlet', weapon: 'staff', orb: '#7dffb0', legs: '#e8e2d0', robe: '#f3efe2', hair: '#e8b04a' }
    },
    pyro: {
      name: 'Pyromancer', role: 'Mage', cost: 140, cd: 7, unlock: 7,
      hp: 70, atk: 22, rate: 1.9, range: 230, speed: 42, armor: 0, proj: 'fireball', splash: 60,
      special: { id: 'meteor', name: 'Meteor', cost: 55, desc: 'Each Pyromancer calls a meteor onto the thickest group of enemies in their lane.' },
      desc: 'Hurls exploding fireballs that hit groups.',
      tiers: ['Pyromancer', 'Flamecaller', 'Emberlord', 'Infernal Sage', 'Sunfire Archmage'],
      look: { kind: 'humanoid', skin: '#f0c090', head: 'wizard', weapon: 'staff', orb: '#ff8a2a', legs: '#5a1f1f', robe: '#b0302a', beard: '#dddddd' }
    },
    boar: {
      name: 'Boar Rider', role: 'Cavalry', cost: 150, cd: 7, unlock: 10,
      hp: 190, atk: 24, rate: 1.0, range: 42, speed: 95, armor: 0.1,
      special: { id: 'stampede', name: 'Stampede', cost: 45, desc: 'Riders thunder forward, trampling and knocking back everything in their path.' },
      desc: 'Fast, hard-hitting raider with a lance.',
      tiers: ['Boar Rider', 'Tusk Lancer', 'War Rider', 'Thunderhoof', 'Storm Marshal'],
      look: { kind: 'rider', skin: '#e2ae80', head: 'helm', weapon: 'lance', legs: '#3a2a1a', mount: '#7a4a2a' }
    },
    frost: {
      name: 'Frost Witch', role: 'Control', cost: 130, cd: 7, unlock: 14,
      hp: 80, atk: 10, rate: 1.3, range: 240, speed: 44, armor: 0, proj: 'frost', slow: 0.45,
      special: { id: 'blizzard', name: 'Blizzard', cost: 50, desc: 'Freezes every enemy in the Witches\' lanes for 3 seconds and chills them hard.' },
      desc: 'Ice bolts slow enemies to a crawl.',
      tiers: ['Frost Witch', 'Rime Sister', 'Glacier Seer', 'Winter Matron', 'Queen of Hoarfrost'],
      look: { kind: 'humanoid', skin: '#dbe8f5', head: 'witch', weapon: 'staff', orb: '#9be8ff', legs: '#2a3c66', robe: '#3e64b0', hair: '#eef6ff' }
    },
    titan: {
      name: 'Clockwork Titan', role: 'Siege', cost: 300, cd: 18, unlock: 20,
      hp: 900, atk: 45, rate: 2.2, range: 60, speed: 26, armor: 0.3, splash: 70,
      special: { id: 'quake', name: 'Earthquake', cost: 70, desc: 'The Titan slams the ground, stunning and crushing all nearby foes in every lane.' },
      desc: 'A towering brass machine. Crushes groups and buildings.',
      tiers: ['Clockwork Titan', 'Brass Juggernaut', 'Steam Colossus', 'Gearlord', 'Aether Titan'],
      look: { kind: 'titan' }
    }
  };
  G.UNIT_ORDER = ['digger', 'squire', 'ranger', 'bulwark', 'mender', 'pyro', 'boar', 'frost', 'titan'];

  /* Enemies. cost = wave budget points. */
  const H = (skin, o) => Object.assign({ kind: 'humanoid', skin: skin }, o);
  G.ENEMIES = {
    goblin:   { name: 'Goblin', cost: 1, hp: 55, atk: 8, rate: 0.9, range: 34, speed: 62, valor: 4, gold: 3, look: H('#7cbf3a', { head: 'ears', weapon: 'dagger', legs: '#5a3a22', armor: '#7a5230', size: 0.82 }) },
    slinger:  { name: 'Goblin Slinger', cost: 1.5, hp: 40, atk: 9, rate: 1.4, range: 210, speed: 55, valor: 4, gold: 3, proj: 'stone', look: H('#7cbf3a', { head: 'ears', weapon: 'sling', legs: '#5a3a22', armor: '#9a7a40', size: 0.8 }) },
    wolf:     { name: 'Dire Wolf', cost: 1.5, hp: 60, atk: 10, rate: 0.8, range: 34, speed: 105, valor: 5, gold: 3, look: { kind: 'beast', type: 'wolf', color: '#6d6a72' } },
    brute:    { name: 'Orc Brute', cost: 4, hp: 260, atk: 22, rate: 1.4, range: 40, speed: 40, armor: 0.15, valor: 10, gold: 8, look: H('#5f8f3a', { head: 'horns', weapon: 'club', legs: '#3d2a1a', armor: '#6b4a2a', bulk: 1.4, size: 1.15 }) },

    skeleton: { name: 'Skeleton', cost: 1.2, hp: 70, atk: 11, rate: 1.0, range: 36, speed: 52, valor: 4, gold: 3, look: H('#efe9d8', { head: 'skull', weapon: 'sword', legs: '#efe9d8', armor: '#c9c2ad', bones: true }) },
    skelArcher:{ name: 'Bone Archer', cost: 1.8, hp: 50, atk: 11, rate: 1.4, range: 240, speed: 48, valor: 5, gold: 4, proj: 'arrow', look: H('#efe9d8', { head: 'skull', weapon: 'bow', legs: '#efe9d8', armor: '#a49c86', bones: true }) },
    iceImp:   { name: 'Ice Imp', cost: 1.5, hp: 60, atk: 10, rate: 1.2, range: 200, speed: 60, valor: 5, gold: 3, proj: 'frost', look: H('#8fd3ff', { head: 'horns', weapon: 'staff', orb: '#d0f4ff', legs: '#4a7ab0', armor: '#5d9ad6', size: 0.75 }) },
    yeti:     { name: 'Yeti', cost: 5, hp: 380, atk: 26, rate: 1.5, range: 42, speed: 38, armor: 0.1, valor: 12, gold: 9, look: H('#f4f8ff', { head: 'fur', weapon: 'fist', legs: '#dfe8f5', armor: '#e9f0fa', bulk: 1.6, size: 1.25, face: '#7aa0c8' }) },

    scorpion: { name: 'Giant Scorpion', cost: 2, hp: 110, atk: 13, rate: 1.0, range: 40, speed: 70, armor: 0.2, valor: 6, gold: 4, look: { kind: 'beast', type: 'scorpion', color: '#c47a2c' } },
    bandit:   { name: 'Dune Bandit', cost: 1.5, hp: 85, atk: 13, rate: 0.9, range: 36, speed: 64, valor: 5, gold: 5, look: H('#c99062', { head: 'turban', weapon: 'scimitar', legs: '#6b4a2a', armor: '#d9c7a0' }) },
    nomadArcher:{ name: 'Nomad Archer', cost: 2, hp: 60, atk: 13, rate: 1.3, range: 250, speed: 54, valor: 5, gold: 5, proj: 'arrow', look: H('#c99062', { head: 'turban', weapon: 'bow', legs: '#6b4a2a', armor: '#b88a50' }) },
    mummy:    { name: 'Sand Mummy', cost: 4, hp: 320, atk: 18, rate: 1.3, range: 38, speed: 34, armor: 0.1, valor: 10, gold: 8, look: H('#e2d6b0', { head: 'wraps', weapon: 'fist', legs: '#d8cba2', armor: '#cfc093', bulk: 1.2, size: 1.05 }) },

    slime:    { name: 'Bog Slime', cost: 1.2, hp: 90, atk: 9, rate: 1.1, range: 32, speed: 40, valor: 4, gold: 3, look: { kind: 'slime', color: '#6fbf4a' } },
    bat:      { name: 'Fen Bat', cost: 1.2, hp: 40, atk: 8, rate: 0.7, range: 30, speed: 110, valor: 4, gold: 2, look: { kind: 'bat', color: '#4a3a5a' } },
    lizard:   { name: 'Lizardfolk', cost: 2.5, hp: 150, atk: 16, rate: 1.0, range: 46, speed: 56, armor: 0.1, valor: 7, gold: 5, look: H('#4f9a6a', { head: 'crest', weapon: 'spear', legs: '#3c7a52', armor: '#6b5a3a', tail: '#4f9a6a' }) },
    shaman:   { name: 'Bog Shaman', cost: 3, hp: 90, atk: 8, rate: 1.6, range: 180, speed: 46, valor: 8, gold: 6, healer: 18, proj: 'spark', look: H('#7aa04a', { head: 'mask', weapon: 'staff', orb: '#c6ff5a', legs: '#4a3a22', armor: '#6a5a2a' }) },

    fireImp:  { name: 'Fire Imp', cost: 1.5, hp: 65, atk: 12, rate: 1.2, range: 200, speed: 66, valor: 5, gold: 4, proj: 'fireball', look: H('#e8502a', { head: 'horns', weapon: 'staff', orb: '#ffd25a', legs: '#7a1f12', armor: '#b03a1a', size: 0.75 }) },
    berserker:{ name: 'Orc Berserker', cost: 3, hp: 200, atk: 26, rate: 0.8, range: 40, speed: 70, valor: 8, gold: 6, look: H('#6f9a3a', { head: 'mohawk', weapon: 'axe', legs: '#3d2a1a', armor: '#7a2a1a', bulk: 1.25, size: 1.08 }) },
    magmaGolem:{ name: 'Magma Golem', cost: 6, hp: 600, atk: 30, rate: 1.8, range: 50, speed: 28, armor: 0.25, valor: 15, gold: 12, splash: 50, look: { kind: 'golem', type: 'magma' } },

    darkKnight:{ name: 'Hollow Knight', cost: 4, hp: 320, atk: 24, rate: 1.0, range: 42, speed: 48, armor: 0.3, valor: 10, gold: 8, look: H('#5a4a6a', { head: 'darkhelm', weapon: 'sword', shield: 'dark', legs: '#2a2233', armor: '#3a3048', glowEyes: '#ff3a5a' }) },
    wraith:   { name: 'Wraith', cost: 2.5, hp: 110, atk: 18, rate: 1.0, range: 40, speed: 80, valor: 7, gold: 5, look: { kind: 'wraith', color: '#9a8acb' } },
    necro:    { name: 'Necromancer', cost: 4, hp: 120, atk: 16, rate: 1.8, range: 220, speed: 42, valor: 10, gold: 8, proj: 'dark', summons: 'skeleton', look: H('#c8c0d8', { head: 'cowl', weapon: 'staff', orb: '#b04aff', legs: '#221a2a', armor: '#3a2a4a', robe: '#3a2a4a' }) },

    // Bosses
    goblinKing:{ name: 'Goblin Warlord Grubnak', boss: true, cost: 0, hp: 2400, atk: 34, rate: 1.4, range: 52, speed: 34, armor: 0.15, valor: 80, gold: 80,
      ability: { kind: 'summon', what: 'goblin', n: 4, every: 9 }, look: H('#6faf2a', { head: 'crown', weapon: 'club', legs: '#5a3a22', armor: '#8a5a2a', bulk: 1.5, size: 1.9, cape: '#8a1a1a' }) },
    frostGiant:{ name: 'Frost Giant Hrimvald', boss: true, cost: 0, hp: 4200, atk: 50, rate: 1.8, range: 60, speed: 28, armor: 0.2, valor: 100, gold: 100,
      ability: { kind: 'stomp', radius: 260, every: 8 }, look: H('#9ec9ee', { head: 'horns', weapon: 'axe', legs: '#5a7aa0', armor: '#c8dcef', bulk: 1.5, size: 2.1, beard: '#ffffff' }) },
    sandWyrm: { name: 'The Sand Wyrm', boss: true, cost: 0, hp: 6000, atk: 60, rate: 2.0, range: 70, speed: 30, armor: 0.25, valor: 120, gold: 120,
      ability: { kind: 'burrow', every: 10 }, look: { kind: 'wyrm', color: '#d0a050' } },
    bogHag:   { name: 'Old Mother Murk', boss: true, cost: 0, hp: 7000, atk: 46, rate: 1.6, range: 220, speed: 26, armor: 0.1, valor: 140, gold: 140, proj: 'dark',
      ability: { kind: 'summon', what: 'slime', n: 4, every: 8 }, look: H('#7a9a4a', { head: 'witch', weapon: 'staff', orb: '#c6ff5a', legs: '#2a3a1a', armor: '#3a4a2a', robe: '#3a4a2a', size: 1.8, hair: '#c8c8b8' }) },
    magmaDrake:{ name: 'Cindermaw the Drake', boss: true, cost: 0, hp: 10000, atk: 70, rate: 2.0, range: 160, speed: 30, armor: 0.25, valor: 160, gold: 160,
      ability: { kind: 'breath', every: 7 }, look: { kind: 'drake', color: '#b8321a' } },
    hollowKing:{ name: 'The Hollow King', boss: true, cost: 0, hp: 15000, atk: 85, rate: 1.5, range: 64, speed: 26, armor: 0.3, valor: 200, gold: 200,
      ability: { kind: 'summon', what: 'darkKnight', n: 2, every: 10, also: 'stomp', radius: 300 }, look: H('#bdb0d8', { head: 'darkcrown', weapon: 'scythe', legs: '#1a1422', armor: '#2a2038', bulk: 1.4, size: 2.1, cape: '#4a1a6a', glowEyes: '#c06aff', aura: 'rgba(160,80,255,0.35)' }) }
  };

  /* Regions & campaign */
  G.REGIONS = [
    { id: 'meadow', name: 'Meadowmarch', boss: 'goblinKing', pool: ['goblin', 'slinger', 'wolf', 'brute'],
      theme: { sky: ['#64b5ef', '#cdeeff'], far: '#7aa9cf', mid: '#5c9e4a', ground: '#78c255', ground2: '#5aa53f', path: '#d0ad72', deco: 'tree', fx: 'petal', sun: '#fff6b0' },
      intro: 'The night the stars fell, crystal gems rained across the land. Now goblin warbands pour out of the Thornwood to claim the Meadowmarch mines. Raise your banner, Warden. Dig, summon, and hold the line!' },
    { id: 'frost', name: 'Frostveil', boss: 'frostGiant', pool: ['skeleton', 'skelArcher', 'wolf', 'iceImp', 'yeti'],
      theme: { sky: ['#8fb4d8', '#eaf4ff'], far: '#a9c4e0', mid: '#cfe0f0', ground: '#e8f1fb', ground2: '#cfdeee', path: '#b9c9da', deco: 'pine', fx: 'snow', sun: '#ffffff' },
      intro: 'The goblins were only scouts. In the frozen north, old bones stir under the ice, and a giant wakes in his glacier hall. Bring warm cloaks and sharper steel.' },
    { id: 'dunes', name: 'Ember Dunes', boss: 'sandWyrm', pool: ['bandit', 'nomadArcher', 'scorpion', 'mummy'],
      theme: { sky: ['#f0a54a', '#ffe7b0'], far: '#e0a868', mid: '#e7bf74', ground: '#f0cf86', ground2: '#ddb46a', path: '#c99a55', deco: 'cactus', fx: 'sand', sun: '#fff1c0' },
      intro: 'Beyond the mountains lie the Ember Dunes, where bandit lords bargain with a wyrm that swims through sand. They stole our caravans of gems. We will take them back.' },
    { id: 'fen', name: 'Gloomfen', boss: 'bogHag', pool: ['slime', 'bat', 'lizard', 'shaman'],
      theme: { sky: ['#4f6a5a', '#a9c2a0'], far: '#5d7a66', mid: '#3f5e45', ground: '#5c7d47', ground2: '#4a6a3a', path: '#7a6a45', deco: 'reed', fx: 'firefly', sun: '#e0ffd0' },
      intro: 'The trail of stolen gems leads into the Gloomfen, where an ancient bog-witch brews armies out of mud. Mind your step, and keep your healers close.' },
    { id: 'cinder', name: 'Cinderpeak', boss: 'magmaDrake', pool: ['fireImp', 'berserker', 'bat', 'magmaGolem'],
      theme: { sky: ['#3a1a1a', '#c0502a'], far: '#5a2a22', mid: '#3a2420', ground: '#5a4038', ground2: '#46302a', path: '#7a5a4a', deco: 'rock', fx: 'ember', sun: '#ffb050' },
      intro: 'The volcano Cinderpeak glows with stolen starlight. A drake hoards the largest gems inside, and orc berserkers guard every pass. It will be hot work.' },
    { id: 'hollow', name: 'Hollow Throne', boss: 'hollowKing', pool: ['darkKnight', 'wraith', 'skelArcher', 'necro', 'berserker'],
      theme: { sky: ['#140f24', '#4a2a6a'], far: '#2a1f40', mid: '#1f1830', ground: '#3a3248', ground2: '#2c2638', path: '#5a5068', deco: 'spire', fx: 'ash', sun: '#d8c8ff', moon: true },
      intro: 'At last: the Hollow Throne, seat of the king who called the stars down. Every monster we fought served him. End this, Warden, and the gems will belong to everyone again.' }
  ];
  G.LEVELS_PER_REGION = 6;
  G.LEVEL_COUNT = G.REGIONS.length * G.LEVELS_PER_REGION;
  // Level types inside each region (index 0..5)
  G.LEVEL_KINDS = ['defend', 'defend', 'siege', 'defend', 'siege', 'boss'];
  G.LEVEL_NAMES = [
    ['Mine Road', 'Thornwood Edge', 'Goblin Stockade', 'Wolf Moon', 'Raider Camp', 'Warlord\'s Hill'],
    ['Frozen Pass', 'Boneyard', 'Ice Fort', 'Whiteout', 'Rime Keep', 'Glacier Hall'],
    ['Oasis Gate', 'Scorpion Flats', 'Bandit Bastion', 'Sandstorm', 'Tomb of Kings', 'Wyrm Sea'],
    ['Murkwater', 'Reed Maze', 'Lizard Hold', 'Bat Caves', 'Hag\'s Hut', 'Heart of the Fen'],
    ['Ash Road', 'Smolder Gorge', 'Berserker Forge', 'Lava Falls', 'Obsidian Gate', 'Drake\'s Hoard'],
    ['Twilight Steps', 'Haunted Field', 'Bone Citadel', 'Wraith Walk', 'Black Bastion', 'The Hollow Throne']
  ];

  G.DIFFICULTIES = [
    { id: 'normal', name: 'Normal', hp: 1, atk: 1, reward: 1, shards: 3, color: '#7fd06a' },
    { id: 'heroic', name: 'Heroic', hp: 1.7, atk: 1.45, reward: 2, shards: 5, color: '#ffb340' },
    { id: 'mythic', name: 'Mythic', hp: 2.6, atk: 2.0, reward: 3.5, shards: 8, color: '#d070ff' }
  ];

  /* Castle-wide upgrades bought in the Armory */
  G.UPGRADES = [
    { id: 'castle', name: 'Castle Walls', icon: '🏰', desc: '+15% castle health', max: 10, cur: 'gold', cost: l => 150 * (l + 1) },
    { id: 'yield', name: 'Rich Veins', icon: '⛏️', desc: '+12% gold per digger trip', max: 10, cur: 'gold', cost: l => 120 * (l + 1) },
    { id: 'startGold', name: 'War Chest', icon: '💰', desc: '+30 starting gold', max: 8, cur: 'gold', cost: l => 100 * (l + 1) },
    { id: 'drill', name: 'Drill Sergeant', icon: '📯', desc: '-6% summon cooldowns', max: 5, cur: 'gold', cost: l => 250 * (l + 1) },
    { id: 'miners', name: 'Mine Shafts', icon: '🕳️', desc: '+1 maximum diggers', max: 4, cur: 'shards', cost: l => 2 + l * 2 },
    { id: 'valor', name: 'Battle Hymns', icon: '🎺', desc: '+12% valor from kills', max: 5, cur: 'shards', cost: l => 2 + l },
    { id: 'tower', name: 'Archer Tower', icon: '🏹', desc: 'Castle tower shoots enemies. More damage each level.', max: 6, cur: 'shards', cost: l => 3 + l * 2 }
  ];

  G.SPELLS = {
    arrows: { name: 'Arrow Storm', icon: '🏹', unlock: 3, learn: 3, cd: 26, desc: 'A rain of arrows on the chosen lane.', lvlCost: l => 200 * l },
    frostnova: { name: 'Frost Nova', icon: '❄️', unlock: 9, learn: 5, cd: 40, desc: 'Freeze every enemy on the field for a few seconds.', lvlCost: l => 300 * l },
    thunder: { name: 'Thunder Wrath', icon: '⚡', unlock: 16, learn: 8, cd: 45, desc: 'Lightning strikes the strongest enemies.', lvlCost: l => 400 * l }
  };
  G.SPELL_ORDER = ['arrows', 'frostnova', 'thunder'];
  G.SPELL_MAX = 5;

  G.levelCost = l => Math.round(40 * Math.pow(l, 1.35));
  G.levelCap = tier => tier * 4; // tier 1 -> lvl 4, tier 5 -> lvl 20

  G.levelRef = idx => ({ idx: idx, region: Math.floor(idx / G.LEVELS_PER_REGION), sub: idx % G.LEVELS_PER_REGION });
})();
