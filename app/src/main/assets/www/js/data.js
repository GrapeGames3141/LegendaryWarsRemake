/* Ridiculous Wars - game data (units, enemies, regions, writing) */
window.G = window.G || {};
(function () {
  'use strict';

  G.TITLE = 'Ridiculous Wars';
  G.SUBTITLE = 'Totally Serious Business';
  G.H = 720;
  G.LANE_Y = [350, 450, 550];
  G.CASTLE_X = 150;

  // Tier palette: rusty, polished, parade, gold, disco
  G.TIER_ARMOR = ['#a0643a', '#b9c4d0', '#4a8cff', '#ffc62a', '#ff5ad8'];
  G.TIER_TRIM = ['#6a3a1a', '#6a7480', '#1a4ab0', '#b07a00', '#7a2aff'];
  G.TIER_NAMES = ['I', 'II', 'III', 'IV', 'V'];
  G.TIER_MULT = [1, 1.4, 1.9, 2.5, 3.2];
  G.TIER_SHARDS = [0, 3, 6, 10, 15];

  G.CUR = { gold: 'Gems', goldIcon: '💎', shards: 'Gold Stars', shardIcon: '⭐', valor: 'Synergy', valorIcon: '✨' };

  /* Player units */
  G.UNITS = {
    intern: {
      name: 'Intern', role: 'Gatherer', cost: 50, cd: 2.5, unlock: 0,
      desc: 'Overworked, under-caffeinated, unpaid. Digs gems from the mine and hauls them home. "I\'ll just put this on the company card."',
      tiers: ['Unpaid Intern', 'Paid Intern (barely)', 'Junior Associate', 'Gem Baron', 'Intern of the Month'],
      look: { kind: 'humanoid', skin: '#ffd2a8', head: 'messy', hair: '#7a4a2a', weapon: 'pick', legs: '#3a4a6a', shirt: '#ffffff', tie: '#e83a3a', size: 0.85, mug: true },
      quips: { summon: ['Is this paid?', 'Where\'s the coffee?', 'Day one, let\'s go!', 'I have a degree in this'] }
    },
    reginald: {
      name: 'Sir Reginald', role: 'Melee', cost: 60, cd: 3, unlock: 0,
      hp: 130, atk: 14, rate: 0.9, range: 40, speed: 60, armor: 0.05,
      special: { id: 'charge', name: 'Full-Title Charge', cost: 30, desc: 'Every Reginald charges forward while yelling his entire title, hitting everything in the way for triple damage.' },
      desc: 'Tiny knight. Massive ego. Has never lost a fight he remembers.',
      tiers: ['Sir Reginald (Bucket Edition)', 'Sir Reginald the Polished', 'Sir Reginald of the Parade', 'Sir Reginald the Gilded', 'Sir Reginald, Disco Paladin'],
      look: { kind: 'humanoid', skin: '#ffcfa0', head: 'knight', weapon: 'sword', shield: true, legs: '#4a4a5a', size: 0.9, mustache: '#8a5a2a' },
      quips: {
        summon: ['Fear not! Reginald is here!', 'Kneel, peasants!', 'I was born for this. Literally.', 'Behold my glorious... everything'],
        special: ['SIR REGINALD THE BRAVE, BOLD, BEAUTIFUL, AND—', 'BY ORDER OF ME!', 'TALLY-HO, MORONS!'],
        kill: ['Too easy!', 'Another for the memoirs!', 'Did everyone see that?'],
        refuse: ['A knight does not "retreat". He "strategically sashays".', 'I\'ll go, but under protest.']
      }
    },
    todd: {
      name: 'Todd', role: 'Ranged', cost: 75, cd: 3.5, unlock: 0,
      hp: 75, atk: 12, rate: 1.1, range: 270, speed: 52, armor: 0, proj: 'arrow',
      special: { id: 'volley', name: 'Apology Volley', cost: 35, desc: 'Every Todd looses five arrows for double damage, then apologizes to each of them.' },
      desc: 'The Reluctant Ranger. Excellent aim. Would genuinely rather be home playing the lute.',
      tiers: ['Todd', 'Todd, Mildly Committed', 'Todd the Wandering Bard', 'Todd of the Golden Lute', 'TODD: World Tour'],
      look: { kind: 'humanoid', skin: '#f0c090', head: 'hood', weapon: 'bow', legs: '#3a5a2a', hoodColor: '#4a9a3a', lute: true },
      quips: {
        summon: ['Do I have to?', 'I left my lute on...', 'Okay. Fine. Okay.'],
        shot: ['Sorry!', 'Oh gosh, sorry!', 'My bad!', 'Apologies!', 'Sorry about that!'],
        special: ['SORRY SORRY SORRY SORRY SORRY'],
        refuse: ['Can someone else do it?', 'Ugh. Fine. Sorry.']
      }
    },
    brenda: {
      name: 'Brenda', role: 'Heavy', cost: 130, cd: 6, unlock: 2,
      hp: 270, atk: 30, rate: 1.6, range: 44, speed: 40, armor: 0.15, splash: 55,
      special: { id: 'slam', name: 'Tip Jar Slam', cost: 45, desc: 'Brenda slams the ground so hard that every foe nearby flies backwards, takes huge damage and is briefly stunned.' },
      desc: 'Brenda the Boulder. An extremely strong barista who got lost on her way to work. Hits groups. Complains about tips.',
      tiers: ['Brenda the Barista', 'Brenda, Shift Lead', 'Brenda the Espresso Engine', 'Brenda of the Golden Apron', 'Brenda, Supreme Latte Overlord'],
      look: { kind: 'humanoid', skin: '#c88a5a', head: 'bun', hair: '#3a2a1a', weapon: 'coffeepot', legs: '#2a2a2a', apron: '#2a7a4a', bulk: 1.45, size: 1.1 },
      quips: {
        summon: ['Who ordered the violence?', 'I\'m on break in five.', 'Large beating, extra shot.'],
        special: ['NO TIP?!', 'THAT\'S FOR THE OAT MILK!'],
        kill: ['Next customer.', 'Name on the cup: LOSER.']
      }
    },
    stabby: {
      name: 'Nurse Stabby', role: 'Support', cost: 100, cd: 6, unlock: 4,
      hp: 85, atk: 6, rate: 1.3, range: 180, speed: 48, armor: 0, heal: 14, proj: 'syringe',
      special: { id: 'encourage', name: 'Aggressive Encouragement', cost: 45, desc: 'Heals every ally by 50% and yells at them until they attack 50% faster for 6 seconds.' },
      desc: 'Overly enthusiastic combat medic. Heals the most wounded ally in her lane, whether they like it or not.',
      tiers: ['Nurse Stabby', 'Head Nurse Stabby', 'Dr. Stabby (online degree)', 'Chief of Stabbing', 'Stabby, Angel of Mandatory Wellness'],
      look: { kind: 'humanoid', skin: '#ffd8b8', head: 'nursecap', hair: '#ff8a3a', weapon: 'syringe', legs: '#ffffff', robe: '#f4f8ff' },
      quips: {
        summon: ['Who needs a shot?!', 'Everyone needs a shot!', 'Roll up your sleeves!'],
        heal: ['WALK IT OFF!', 'You\'re FINE!', 'Little pinch!', 'Stop crying, you\'re healed!'],
        special: ['GET UP AND FIGHT, SWEETIES!']
      }
    },
    golem: {
      name: 'Golem of HR', role: 'Tank', cost: 120, cd: 7, unlock: 6,
      hp: 380, atk: 9, rate: 1.4, range: 38, speed: 32, armor: 0.3, stunChance: 0.2,
      special: { id: 'memo', name: 'Passive-Aggressive Memo', cost: 45, desc: 'Becomes invulnerable for 3s and stuns every enemy within 400px in its lane with a strongly worded memo. Its normal hits sometimes stun too.' },
      desc: 'An animated binder full of workplace policies. Absorbs punishment. Files complaints. Its hits can stun.',
      tiers: ['Golem of HR', 'Golem of Compliance', 'Golem of Mandatory Training', 'Golem of Executive Policy', 'The Golem of Infinite Bylaws'],
      look: { kind: 'binder' },
      quips: {
        summon: ['Per my last email...', 'This has been noted.', 'Let\'s keep it professional.'],
        special: ['PER MY LAST EMAIL.', 'THIS IS A WRITTEN WARNING.', 'See attached.'],
        refuse: ['That request requires form 27-B.', 'I will need that in writing.']
      }
    },
    wizzle: {
      name: 'Prof. Wizzle', role: 'Mage', cost: 140, cd: 7, unlock: 8,
      hp: 70, atk: 22, rate: 1.9, range: 230, speed: 42, armor: 0, proj: 'wizz', splash: 60,
      special: { id: 'wild', name: 'Wait, Which Spell Was It?', cost: 50, desc: 'Each Wizzle casts a random spell: meteor, freeze, healing, a lightning storm, a pile of gems, or turning enemies into chickens.' },
      desc: 'Elderly wizard. Exploding magic, hits groups. Forgets what spell he\'s casting halfway through.',
      tiers: ['Professor Wizzle', 'Professor Emeritus Wizzle', 'Archmage Wizzle (retired)', 'Grand Wizzle the Gilded', 'Wizzle the Absurdly Tall-Hatted'],
      look: { kind: 'humanoid', skin: '#ffd0a8', head: 'wizard', weapon: 'staff', orb: '#ff7aff', legs: '#3a1a6a', robe: '#6a3ae0', beard: '#ffffff', glasses: true },
      quips: {
        summon: ['Where am I?', 'Is it Tuesday?', 'Ah yes, the war. Which one?'],
        special: ['Abra... cadabra... something?', 'I remember this one! Probably.', 'Hocus... pocus... lunch?'],
        refuse: ['Retreat? I just got here! Did I?']
      }
    },
    kevin: {
      name: 'Kevin', role: 'Fast', cost: 150, cd: 7, unlock: 11,
      hp: 180, atk: 24, rate: 1.0, range: 42, speed: 105, armor: 0.1,
      special: { id: 'stampede', name: 'Let\'s Circle Back', cost: 45, desc: 'Kevin gallops through the lane trampling everything, then circles back to where he started.' },
      desc: 'Kevin the Unicorn. Deeply corporate. Very fast. Will absolutely schedule a follow-up.',
      tiers: ['Kevin the Unicorn', 'Kevin, Senior Unicorn', 'Kevin, VP of Galloping', 'Kevin, Chief Horn Officer', 'Kevin, Rainbow Synergy Visionary'],
      look: { kind: 'unicorn' },
      quips: {
        summon: ['Let\'s touch base.', 'Quick sync?', 'Synergy incoming.'],
        special: ['LET\'S CIRCLE BACK ON THAT!', 'Taking this offline!', 'Moving the needle!'],
        refuse: ['Can we put a pin in that?', 'Let me loop in my manager.']
      }
    },
    phoenix: {
      name: 'Phoenix', role: 'Flying', cost: 170, cd: 9, unlock: 15,
      hp: 170, atk: 20, rate: 1.1, range: 140, speed: 70, armor: 0.05, proj: 'egg', splash: 45, flying: true,
      special: { id: 'rebirth', name: 'Dramatic Rebirth', cost: 55, desc: 'Every Phoenix bursts into flames, scorching nearby foes and fully healing. Each Phoenix also comes back to life once when it falls.' },
      desc: 'The Phoenix of Questionable Origin. Clearly a chicken in a costume. Flies and drops explosive eggs. Comes back to life once, somehow.',
      tiers: ['Phoenix (Cardboard Wings)', 'Phoenix (Painted Wings)', 'Phoenix (Sequinned)', 'Phoenix (Gold Leaf)', 'Phoenix (Actually On Fire)'],
      look: { kind: 'chicken' },
      quips: {
        summon: ['I AM THE PHOENIX!', 'Bawk. I mean: SCREE!', 'Behold my majestic... plumage.'],
        special: ['FROM THE ASHES! (and feathers)', 'BAWK OF FLAME!'],
        rebirth: ['I\'M BACK! Nobody look at the zipper.', 'Rebirth complete. Mostly.']
      }
    },
    swarm: {
      name: 'Intern Swarm', role: 'Swarm', cost: 160, cd: 10, unlock: 20,
      hp: 40, atk: 7, rate: 0.8, range: 32, speed: 78, armor: 0,
      special: { id: 'grievance', name: 'Mass Grievance', cost: 55, desc: 'Every swarm intern files a complaint against the nearest enemy, dealing heavy damage and slowing it.' },
      desc: 'Dozens of tiny interns. Each summon brings a whole crowd (more at higher tiers). Overwhelms through pure numbers and complaints.',
      tiers: ['Intern Swarm (3 interns)', 'Intern Horde (4 interns)', 'Intern Stampede (5 interns)', 'Intern Avalanche (6 interns)', 'Intern Singularity (7 interns)'],
      look: { kind: 'humanoid', skin: '#ffd2a8', head: 'messy', hair: '#3a2a1a', weapon: 'clipboard', legs: '#3a4a6a', shirt: '#ffffff', tie: '#3a7aff', size: 0.55 },
      quips: {
        summon: ['WE WANT LUNCH BREAKS!', 'Is there pizza?', 'UNION! UNION!'],
        special: ['WE\'D LIKE TO SPEAK TO A MANAGER!', 'THIS IS A HOSTILE WORKPLACE!']
      }
    }
  };
  G.UNIT_ORDER = ['intern', 'reginald', 'todd', 'brenda', 'stabby', 'golem', 'wizzle', 'kevin', 'phoenix', 'swarm'];
  G.MINER = 'intern';
  G.MAX_LINEUP = 6;

  /* Enemies: the Nether-Bureaucracy */
  const H = (skin, o) => Object.assign({ kind: 'humanoid', skin: skin }, o);
  G.ENEMIES = {
    imp:        { name: 'Imp Paper-Pusher', cost: 1, hp: 55, atk: 8, rate: 0.9, range: 34, speed: 64, valor: 4, gold: 3, look: H('#ff6a4a', { head: 'imphorns', weapon: 'pencil', legs: '#5a1a1a', shirt: '#ffffff', tie: '#2a2a2a', size: 0.75 }) },
    stapler:    { name: 'Imp Stapler Sniper', cost: 1.5, hp: 40, atk: 9, rate: 1.4, range: 210, speed: 55, valor: 4, gold: 3, proj: 'staple', look: H('#ff6a4a', { head: 'imphorns', weapon: 'staplergun', legs: '#5a1a1a', shirt: '#ffe0a0', tie: '#2a2a2a', size: 0.72 }) },
    reviewer:   { name: 'Werewolf Performance Reviewer', cost: 1.5, hp: 60, atk: 10, rate: 0.8, range: 34, speed: 105, valor: 5, gold: 3, look: { kind: 'beast', type: 'wolf', color: '#8a7a9a', tie: '#e83a3a' } },
    manager:    { name: 'Zombie Middle Manager', cost: 4, hp: 270, atk: 22, rate: 1.4, range: 40, speed: 36, armor: 0.15, valor: 10, gold: 8, look: H('#9ad08a', { head: 'combover', hair: '#5a5a4a', weapon: 'mug', legs: '#3a3a4a', shirt: '#d8e0ff', tie: '#7a2a2a', bulk: 1.35, size: 1.12, zombie: true }) },

    accountant: { name: 'Skeleton Accountant', cost: 1.2, hp: 70, atk: 11, rate: 1.0, range: 36, speed: 52, valor: 4, gold: 3, look: H('#f5f0e0', { head: 'visor', weapon: 'calculator', legs: '#f5f0e0', armor: '#4a5a7a', bones: true }) },
    auditor:    { name: 'Skeleton Auditor', cost: 1.8, hp: 50, atk: 11, rate: 1.4, range: 240, speed: 48, valor: 5, gold: 4, proj: 'paper', look: H('#f5f0e0', { head: 'skullglasses', weapon: 'papers', legs: '#f5f0e0', armor: '#7a5a3a', bones: true }) },
    yeti:       { name: 'Abominable Team-Builder', cost: 5, hp: 380, atk: 26, rate: 1.5, range: 42, speed: 38, armor: 0.1, valor: 12, gold: 9, look: H('#f4f8ff', { head: 'fur', weapon: 'fist', legs: '#dfe8f5', armor: '#e9f0fa', bulk: 1.6, size: 1.25, face: '#7aa0c8', lanyard: true }) },
    iceClerk:   { name: 'Frost Clerk', cost: 1.5, hp: 60, atk: 10, rate: 1.2, range: 200, speed: 60, valor: 5, gold: 3, proj: 'frost', look: H('#8fd3ff', { head: 'imphorns', weapon: 'staff', orb: '#d0f4ff', legs: '#4a7ab0', shirt: '#cfefff', tie: '#2a5aa0', size: 0.75 }) },

    printer:    { name: 'Possessed Printer', cost: 2, hp: 120, atk: 12, rate: 1.3, range: 190, speed: 44, armor: 0.25, valor: 6, gold: 4, proj: 'paper', look: { kind: 'printer' } },
    vampire:    { name: 'Vampire HR Representative', cost: 3, hp: 100, atk: 9, rate: 1.6, range: 180, speed: 46, valor: 8, gold: 6, healer: 18, proj: 'dark', look: H('#d8d8f0', { head: 'slick', hair: '#1a1a2a', weapon: 'clipboard', legs: '#1a1a2a', shirt: '#ffffff', tie: '#a01a2a', cape: '#5a0a1a', fangs: true }) },
    mummy:      { name: 'Mummified Consultant', cost: 4, hp: 320, atk: 18, rate: 1.3, range: 38, speed: 34, armor: 0.1, valor: 10, gold: 8, look: H('#e2d6b0', { head: 'wraps', weapon: 'briefcase', legs: '#d8cba2', armor: '#cfc093', bulk: 1.2, size: 1.05, tie: '#2a5aa0' }) },
    memo:       { name: 'Paper Airplane Memo', cost: 1.2, hp: 40, atk: 8, rate: 0.7, range: 30, speed: 115, valor: 4, gold: 2, look: { kind: 'plane' } },

    slime:      { name: 'Unresolved Issue', cost: 1.2, hp: 90, atk: 9, rate: 1.1, range: 32, speed: 40, valor: 4, gold: 3, look: { kind: 'slime', color: '#7adf4a' } },
    lawyer:     { name: 'Lizard Lawyer', cost: 2.5, hp: 150, atk: 16, rate: 1.0, range: 46, speed: 56, armor: 0.1, valor: 7, gold: 5, look: H('#4fba6a', { head: 'crest', weapon: 'briefcase', legs: '#2a2a3a', shirt: '#ffffff', tie: '#ffd040', armor: '#2a2a3a', tail: '#4fba6a' }) },
    consultant: { name: 'Lava Consultant', cost: 6, hp: 600, atk: 30, rate: 1.8, range: 50, speed: 28, armor: 0.25, valor: 15, gold: 12, splash: 50, look: { kind: 'golem', type: 'magma', tie: true } },
    fireImp:    { name: 'Hot-Desk Imp', cost: 1.5, hp: 65, atk: 12, rate: 1.2, range: 200, speed: 66, valor: 5, gold: 4, proj: 'fireball', look: H('#ff4a2a', { head: 'imphorns', weapon: 'staff', orb: '#ffd25a', legs: '#7a1f12', shirt: '#ffb080', tie: '#2a2a2a', size: 0.75 }) },
    berserker:  { name: 'Overtime Berserker', cost: 3, hp: 200, atk: 26, rate: 0.8, range: 40, speed: 70, valor: 8, gold: 6, look: H('#7ab04a', { head: 'headband', weapon: 'axe', legs: '#3d2a1a', shirt: '#ffffff', tie: '#e83a3a', bulk: 1.25, size: 1.08, eyebags: true }) },

    compliance: { name: 'Compliance Knight', cost: 4, hp: 320, atk: 24, rate: 1.0, range: 42, speed: 48, armor: 0.3, valor: 10, gold: 8, look: H('#5a4a6a', { head: 'darkhelm', weapon: 'sword', shield: 'tape', legs: '#2a2233', armor: '#3a3048', glowEyes: '#ff3a5a' }) },
    wraith:     { name: 'Ghost of Meetings Past', cost: 2.5, hp: 110, atk: 18, rate: 1.0, range: 40, speed: 80, valor: 7, gold: 5, look: { kind: 'wraith', color: '#9a8acb' } },
    recruiter:  { name: 'Necro-Recruiter', cost: 4, hp: 120, atk: 16, rate: 1.8, range: 220, speed: 42, valor: 10, gold: 8, proj: 'dark', summons: 'accountant', look: H('#c8c0d8', { head: 'cowl', weapon: 'staff', orb: '#b04aff', legs: '#221a2a', armor: '#3a2a4a', robe: '#3a2a4a', lanyard: true }) },

    // Bosses
    hoa: { name: 'Karenthia, Queen of the HOA', boss: true, cost: 0, hp: 1900, atk: 34, rate: 1.4, range: 52, speed: 34, armor: 0.15, valor: 80, gold: 80,
      abilities: [{ kind: 'summon', what: 'imp', n: 4, every: 9, line: 'I WANT TO SPEAK TO YOUR MANAGER!' }, { kind: 'form', every: 21 }],
      look: H('#ffd0b0', { head: 'karen', hair: '#ffe08a', weapon: 'clipboard', legs: '#3a3a4a', armor: '#ff7ab0', bulk: 1.4, size: 1.9, sunglasses: true }) },
    yetiBoss: { name: 'Chilldred, Chief Morale Officer', boss: true, cost: 0, hp: 4200, atk: 50, rate: 1.8, range: 60, speed: 28, armor: 0.2, valor: 100, gold: 100,
      abilities: [{ kind: 'stomp', radius: 260, every: 8, line: 'MANDATORY TRUST FALL!' }, { kind: 'slides', every: 17 }],
      look: H('#f4f8ff', { head: 'fur', weapon: 'fist', legs: '#dfe8f5', armor: '#e9f0fa', bulk: 1.7, size: 2.1, face: '#7aa0c8', lanyard: true, partyhat: true }) },
    wyrm: { name: 'Wyrm of Endless Meetings', boss: true, cost: 0, hp: 6000, atk: 60, rate: 2.0, range: 70, speed: 30, armor: 0.25, valor: 120, gold: 120,
      abilities: [{ kind: 'burrow', every: 10, line: 'This could have been an email...' }, { kind: 'slides', every: 19 }],
      look: { kind: 'wyrm', color: '#d0a050' } },
    bogHag: { name: 'Bog Witch of Backlogs', boss: true, cost: 0, hp: 7000, atk: 46, rate: 1.6, range: 220, speed: 26, armor: 0.1, valor: 140, gold: 140, proj: 'dark',
      abilities: [{ kind: 'summon', what: 'slime', n: 4, every: 8, line: 'Let\'s add these to the backlog!' }, { kind: 'form', every: 18 }],
      look: H('#8aba4a', { head: 'witch', weapon: 'staff', orb: '#c6ff5a', legs: '#2a3a1a', armor: '#3a4a2a', robe: '#3a4a2a', size: 1.8, hair: '#c8c8b8', glasses: true }) },
    paperDragon: { name: 'Dragon of Excessive Paperwork', boss: true, cost: 0, hp: 10000, atk: 70, rate: 2.0, range: 160, speed: 30, armor: 0.25, valor: 160, gold: 160,
      abilities: [{ kind: 'breath', every: 7, line: 'TPS REPORTS! ALL OF THEM!' }, { kind: 'form', every: 16 }, { kind: 'slides', every: 23 }],
      look: { kind: 'drake', color: '#e85a2a', paper: true } },
    lordMagma: { name: 'Lord Magma, Director of Infernal Operations', boss: true, cost: 0, hp: 15000, atk: 85, rate: 1.5, range: 64, speed: 26, armor: 0.3, valor: 200, gold: 200,
      abilities: [{ kind: 'summon', what: 'compliance', n: 2, every: 10, line: 'Security! Escort them out!' }, { kind: 'stomp', radius: 300, every: 13, line: 'You\'re ALL fired!' }, { kind: 'slides', every: 15 }, { kind: 'form', every: 20 }],
      look: H('#d8401a', { head: 'magmahead', weapon: 'flamecase', legs: '#1a1a2a', armor: '#2a2a3a', shirt: '#ffffff', tie: '#ffd040', bulk: 1.55, size: 2.15, glowEyes: '#ffd040', aura: 'rgba(255,90,20,0.35)', cape: '#8a1a0a' }) }
  };

  /* Regions & campaign */
  G.REGIONS = [
    { id: 'suburbs', name: 'The Gilded Suburbs', boss: 'hoa', pool: ['imp', 'stapler', 'reviewer', 'manager'],
      theme: { sky: ['#4ab0ff', '#c8f0ff'], far: '#7ab0e0', mid: '#5ac04a', ground: '#7ad85a', ground2: '#4ab03a', path: '#e8c07a', deco: 'house', fx: 'petal', sun: '#fff6a0' },
      intro: 'MEMO\nFROM: The Crown (dictated, not read)\nTO: Supreme Lane Commander (that\'s you, nobody else applied)\nRE: War\n\nThe Nether-Bureaucracy has declared war on Glorpia over a disputed parking ticket and one (1) stolen royal sandwich. Their paper-pushers are invading the Gilded Suburbs. Please defend the kingdom. Dental is included.' },
    { id: 'frost', name: 'Frostburn Corporate Retreat', boss: 'yetiBoss', pool: ['accountant', 'auditor', 'reviewer', 'iceClerk', 'yeti'],
      theme: { sky: ['#7ab8f0', '#f0f8ff'], far: '#a9c8f0', mid: '#d8e8f8', ground: '#f0f6ff', ground2: '#d0e0f4', path: '#b0c8e0', deco: 'pine', fx: 'snow', sun: '#ffffff' },
      intro: 'MEMO\nRE: Team-Building Weekend (MANDATORY)\n\nThe enemy has booked the Frostburn Corporate Retreat for "synergy activities". Skeleton accountants are auditing the ski lodge. Bring a coat. Bring a sword. Bring a positive attitude, it\'s on your evaluation.' },
    { id: 'desert', name: 'Desert Oasis All-Hands', boss: 'wyrm', pool: ['printer', 'memo', 'mummy', 'stapler', 'reviewer'],
      theme: { sky: ['#ffa040', '#fff0b0'], far: '#f0b070', mid: '#f0c878', ground: '#ffe08a', ground2: '#f0c060', path: '#d8a050', deco: 'cactus', fx: 'sand', sun: '#fff8d0' },
      intro: 'MEMO\nRE: All-Hands Meeting (3 hrs, no snacks)\n\nThe Bureaucracy has called an All-Hands Meeting in the middle of the desert. Nobody knows why. A giant wyrm is presenting. Attendance is mandatory. Escape is encouraged.' },
    { id: 'swamp', name: 'Mystic Swamp of Unresolved Issues', boss: 'bogHag', pool: ['slime', 'memo', 'lawyer', 'vampire'],
      theme: { sky: ['#5a8a6a', '#c0e0b0'], far: '#6a9a7a', mid: '#4a7a4a', ground: '#6a9a4a', ground2: '#4a7a3a', path: '#8a7a4a', deco: 'reed', fx: 'firefly', sun: '#e8ffd0' },
      intro: 'MEMO\nRE: Your Ticket Has Been Escalated\n\nEvery unresolved issue in the kingdom has oozed into this swamp, and they are VERY upset about being ignored. Also there are lawyers. Lizard lawyers. Do not sign anything.' },
    { id: 'magma', name: 'Magma Mountain Headquarters', boss: 'paperDragon', pool: ['fireImp', 'berserker', 'memo', 'consultant', 'printer'],
      theme: { sky: ['#4a1a2a', '#ff6a3a'], far: '#6a2a2a', mid: '#4a2420', ground: '#6a4a40', ground2: '#4a302a', path: '#8a6a5a', deco: 'rock', fx: 'ember', sun: '#ffc060' },
      intro: 'MEMO\nRE: Site Visit\n\nWe have located enemy headquarters inside an actual volcano. It has an open-plan office and a dragon made of excessive paperwork. HR says the volcano is "a vibe". Proceed.' },
    { id: 'cubicle', name: 'The Nether-Cubicle', boss: 'lordMagma', pool: ['compliance', 'wraith', 'auditor', 'recruiter', 'berserker'],
      theme: { sky: ['#1a1030', '#6a2a8a'], far: '#2a1f4a', mid: '#1f1838', ground: '#4a4060', ground2: '#2c2642', path: '#6a6080', deco: 'cubicle', fx: 'ash', sun: '#ffd8a0', moon: true },
      intro: 'MEMO\nRE: Final Performance Review\n\nThis is it: the Nether-Cubicle, office of Lord Magma, Director of Infernal Operations. He wears a tiny tie. He carries a flaming briefcase. He has your sandwich. End this war, Commander. Then please file your timesheet.' }
  ];
  G.LEVELS_PER_REGION = 6;
  G.LEVEL_COUNT = G.REGIONS.length * G.LEVELS_PER_REGION;
  G.LEVEL_KINDS = ['defend', 'defend', 'siege', 'defend', 'siege', 'boss'];
  G.LEVEL_NAMES = [
    ['Cul-de-Sac Showdown', 'Lawn Ordinance 7B', 'The Gated Community', 'Block Party Panic', 'HOA Clubhouse', 'Karenthia\'s Driveway'],
    ['Ski Lift Ambush', 'Icebreaker Session', 'The Lodge (Hostile)', 'Snowball Sprint Planning', 'Hot Tub Fortress', 'Mandatory Fun'],
    ['Oasis Parking Lot', 'Agenda Item #1', 'Tent of Slideshows', 'Any Other Business', 'Breakout Room B', 'The Endless Meeting'],
    ['Swamp of Tickets', 'Won\'t Fix', 'Legal Department', 'Works On My Machine', 'The Backlog Hut', 'Heart of the Backlog'],
    ['Lobby (On Fire)', 'Open-Plan Inferno', 'Break Room Forge', 'Copy Room of Doom', 'Executive Elevator', 'The Paperwork Dragon'],
    ['Cubicle Maze', 'Haunted Water Cooler', 'Compliance Citadel', 'The Corner Office Path', 'Boardroom Bastion', 'Lord Magma\'s Office']
  ];
  G.BRIEFINGS = [
    ['Imps are pushing paper onto our lawns. Push back.', 'Code violation: your grass is "too heroic". Defend it anyway.', 'Destroy their gatehouse. Leave the decorative gnomes.', 'The block party has been hijacked by werewolves in ties. Again.', 'Storm the HOA clubhouse. Do not use the good chairs.', 'Karenthia demands to speak to your manager. You ARE the manager. Good luck.'],
    ['Skeletons are auditing the ski lift. They found nothing. They are angry.', 'Icebreaker: share one fun fact while being attacked.', 'The lodge is occupied. Siege it. Mind the fondue.', 'Sprint planning in a blizzard. Estimate: pain.', 'They have turned the hot tub into a fortress. It is still warm. Disgusting.', 'Chilldred insists that you have FUN. It is not optional.'],
    ['Find parking. Then fight. Parking is harder.', 'Item #1 on the agenda: your destruction. Item #2: snacks (cancelled).', 'Burn down the slideshow tent. Save the projector, it\'s a rental.', '"Any other business?" Yes. War.', 'Breakout Room B is where hope goes to die. Retake it.', 'The meeting has lasted four centuries. Make it stop.'],
    ['Thousands of tickets, zero solutions. Just like real life.', 'These issues have been marked "Won\'t Fix". They took it personally.', 'Siege the Legal Department. Do not read the terms and conditions.', 'Our bugs fight perfectly on our machine. Let\'s see yours.', 'The backlog hut contains every task you said you\'d "get to later".', 'The Bog Witch is adding YOU to the backlog. Resolve her. Permanently.'],
    ['The lobby is on fire. The receptionist says this is normal.', 'Open-plan office, open-plan flames. Nowhere to hide.', 'Siege the break room. Someone microwaved fish. This is personal.', 'The copier is jammed. With demons.', 'Take the executive elevator. Requires a keycard. Use a Brenda.', 'The Dragon of Excessive Paperwork demands TPS reports. In triplicate. In fire.'],
    ['Every cubicle looks the same. That\'s the trap.', 'Ghosts gather at the water cooler to gossip about you.', 'Siege the Compliance Citadel. Remember: safety first, then violence.', 'The path to the corner office is paved with interns. Walk carefully.', 'Breach the boardroom. They are discussing "rightsizing" you.', 'Lord Magma awaits. Tiny tie. Flaming briefcase. Your sandwich. FINISH IT.']
  ];

  G.DIFFICULTIES = [
    { id: 'normal', name: 'Regular Shift', hp: 1, atk: 1, reward: 1, shards: 3, color: '#7fe06a' },
    { id: 'heroic', name: 'Performance Improvement Plan', hp: 1.7, atk: 1.45, reward: 2, shards: 5, color: '#ffb340' },
    { id: 'mythic', name: 'Mandatory Overtime', hp: 2.6, atk: 2.0, reward: 3.5, shards: 8, color: '#e070ff' }
  ];

  /* Castle upgrades ("Procurement") */
  G.UPGRADES = [
    { id: 'castle', name: 'Load-Bearing Walls', icon: '🏰', desc: '+15% castle health. "As foretold, the walls shall be slightly thicker. Please see attached invoice."', max: 10, cur: 'gold', cost: l => 150 * (l + 1) },
    { id: 'yield', name: 'Unpaid Overtime', icon: '⛏️', desc: '+12% gems per intern trip. "Thank you for volunteering to stay late." (They did not volunteer.)', max: 10, cur: 'gold', cost: l => 120 * (l + 1) },
    { id: 'startGold', name: 'Petty Cash', icon: '💰', desc: '+30 starting gems. Found in the couch of destiny.', max: 8, cur: 'gold', cost: l => 100 * (l + 1) },
    { id: 'drill', name: 'Motivational Posters', icon: '🖼️', desc: '-6% summon cooldowns. HANG IN THERE, says the cat.', max: 5, cur: 'gold', cost: l => 250 * (l + 1) },
    { id: 'miners', name: 'Open More Intern Positions', icon: '🧑‍💼', desc: '+1 maximum interns. The prophecy speaks of "competitive exposure".', max: 4, cur: 'shards', cost: l => 2 + l * 2 },
    { id: 'valor', name: 'Synergy Seminars', icon: '📈', desc: '+12% synergy from kills. Leverage your core competencies. Violently.', max: 5, cur: 'shards', cost: l => 2 + l },
    { id: 'tower', name: 'Guy On The Roof', icon: '🏹', desc: 'A guy on the castle roof shoots enemies. Nobody knows who he is. More damage per level.', max: 6, cur: 'shards', cost: l => 3 + l * 2 }
  ];

  G.SPELLS = {
    arrows: { name: 'Reply-All Arrow Storm', icon: '🏹', unlock: 3, learn: 3, cd: 26, desc: 'A rain of arrows on a lane of your choice. Everyone gets one.', lvlCost: l => 200 * l },
    frostnova: { name: 'Thermostat War', icon: '❄️', unlock: 9, learn: 5, cd: 40, desc: 'Someone set the AC to arctic. Freezes every enemy for a few seconds.', lvlCost: l => 300 * l },
    thunder: { name: 'Lightning Round', icon: '⚡', unlock: 16, learn: 8, cd: 45, desc: 'Quick! Lightning strikes the strongest enemies!', lvlCost: l => 400 * l }
  };
  G.SPELL_ORDER = ['arrows', 'frostnova', 'thunder'];
  G.SPELL_MAX = 5;

  G.levelCost = l => Math.round(40 * Math.pow(l, 1.35));
  G.levelCap = tier => tier * 4;
  G.levelRef = idx => ({ idx: idx, region: Math.floor(idx / G.LEVELS_PER_REGION), sub: idx % G.LEVELS_PER_REGION });

  /* Sarcastic commentary */
  G.WIN_LINES = [
    'Victory! HR has been notified. They do not care.',
    'You won! Please collect your participation trophy at the front desk.',
    'Glorious triumph. The enemy has been asked to "pursue other opportunities".',
    'Win confirmed. Sir Reginald will be insufferable about this for weeks.',
    'Success! Todd would like to go home now. Todd may not go home.',
    'The enemy has been defeated and also cc\'d on your victory email.',
    'A flawless win, assuming nobody looks too closely.',
    'Congratulations! Your reward is more work.'
  ];
  G.LOSE_LINES = [
    'Defeat. Let\'s call it a "learning opportunity".',
    'The castle fell. On the bright side, the paperwork is their problem now.',
    'You lost. Kevin has scheduled a post-mortem. It\'s three hours long.',
    'Defeat! Have you tried summoning more Brendas? Always more Brendas.',
    'The castle is gone. The dental plan, mercifully, remains.',
    'Mission failed. We\'ll get \'em next quarter.',
    'That went poorly. Nurse Stabby is "on her way". Run.'
  ];
  G.SERIOUS_LINES = ['Serious Mode victory. Nobody laughed. As requested.', 'Mission complete. Efficient. Joyless. Beige.'];

  /* Achievements */
  G.ACHIEVEMENTS = [
    { id: 'first', name: 'Onboarding Complete', desc: 'Win your first battle.' },
    { id: 'region1', name: 'Neighborhood Watch', desc: 'Defeat Karenthia, Queen of the HOA.' },
    { id: 'region3', name: 'This Could Have Been An Email', desc: 'Survive the Wyrm of Endless Meetings.' },
    { id: 'final', name: 'Sandwich Recovered', desc: 'Defeat Lord Magma and get the royal sandwich back.' },
    { id: 'heroic', name: 'Survived the PIP', desc: 'Beat any level on Performance Improvement Plan.' },
    { id: 'mythic', name: 'No Work-Life Balance', desc: 'Beat any level on Mandatory Overtime.' },
    { id: 'kills500', name: 'Aggressive Downsizing', desc: 'Defeat 500 enemies in total.' },
    { id: 'interns', name: 'Exploitation Speedrun', desc: 'Hire 100 interns.' },
    { id: 'rebirth', name: 'It\'s Just a Chicken', desc: 'Watch a Phoenix come back to life.' },
    { id: 'chicken', name: 'Poultry Geist', desc: 'Have Professor Wizzle turn an enemy into a chicken.' },
    { id: 'forms', name: 'Paperwork Prodigy', desc: 'Fill out 5 boss forms in time.' },
    { id: 'flawless', name: 'Not a Scratch (on the Castle)', desc: 'Win a level without the castle taking damage.' },
    { id: 'serious', name: 'Wow. Okay.', desc: 'Turn on Serious Mode. We\'re not mad. Just disappointed.' },
    { id: 'tier5', name: 'Disco Inferno', desc: 'Ascend any unit to Tier V.' },
    { id: 'endless10', name: 'Overtime Enthusiast', desc: 'Survive 10 waves of Endless Overtime.' },
    { id: 'refused', name: 'Insubordination Tolerated', desc: 'Be ignored by your own troops 10 times.' }
  ];
})();
