/* Ridiculous Wars - battle simulation & rendering */
(function () {
  'use strict';
  const A = G.art;
  const LY = G.LANE_Y;
  const CX = G.CASTLE_X;
  const MINE = { x: 300, y: 262 };
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  let UID = 1;
  const ENEMY_QUIPS = ['Per my last email!', 'Let\'s take this offline!', 'Synergy!', 'You\'re on my calendar now.', 'Who approved this?', 'I\'ll need that in triplicate.', 'Circle back THIS!', 'New policy: you lose.', 'Is this billable?', 'Reply-all to DEATH!'];
  const POWS = ['BONK!', 'WHAM!', 'POW!', 'SMACK!', 'THWACK!', 'KAPOW!'];
  const SLIDES = [
    ['Q3 SYNERGY ROADMAP', ['Leverage evil', 'Circle back to doom', 'Pizza Friday (cancelled)']],
    ['WHY YOU WILL LOSE', ['Slide 1 of 94', 'Our values: paperwork', 'Clip art of a dragon']],
    ['TEAM-BUILDING AGENDA', ['Icebreaker: despair', 'Trust fall (no catching)', 'Mandatory fun']],
    ['ORG CHART (UPDATED)', ['You report to us now', 'Kevin is on there for some reason', 'Questions? No.']]
  ];
  const CHICKEN_LOOK = { kind: 'chicken', tier: 1 };
  const WIZZLE_SPELLS = ['meteor', 'freeze', 'heal', 'lightning', 'gems', 'chickens'];

  function heightOf(look) {
    const s = look.size || 1;
    switch (look.kind) {
      case 'rider': return 100 * s;
      case 'titan': return 125 * (look.tier ? 1 + (look.tier - 1) * 0.05 : 1);
      case 'golem': return 120 * s;
      case 'bat': return 70;
      case 'slime': return 40;
      case 'beast': return 48;
      case 'wraith': return 72;
      case 'drake': return 140;
      case 'wyrm': return 150;
      case 'binder': return 118;
      case 'unicorn': return 98;
      case 'chicken': return 90;
      case 'printer': return 60;
      case 'plane': return 62;
      default: return 72 * s;
    }
  }

  class Battle {
    constructor(cfg) {
      const sd = G.save.data;
      this.cfg = cfg;
      this.W = G.viewW;
      this.time = 0;
      this.units = []; this.projs = []; this.parts = []; this.texts = []; this.gems = []; this.diggers = []; this.ambient = [];
      this.diff = G.DIFFICULTIES[cfg.diff || 0];
      this.endless = cfg.mode === 'endless';
      this.idx = this.endless ? 0 : cfg.idx;
      this.regionIdx = this.endless ? (cfg.region || 0) : Math.floor(cfg.idx / G.LEVELS_PER_REGION);
      this.sub = this.endless ? 0 : cfg.idx % G.LEVELS_PER_REGION;
      this.kind = this.endless ? 'endless' : G.LEVEL_KINDS[this.sub];
      this.setRegion(this.regionIdx);
      // economy & castle
      const up = sd.upgrades;
      this.castleMax = Math.round(1000 * (1 + 0.15 * up.castle));
      this.castleHp = this.castleMax;
      this.gold = 150 + 30 * up.startGold;
      this.valor = 0; this.valorMax = 250;
      this.valorMult = 1 + 0.12 * up.valor;
      this.maxDiggers = 3 + up.miners;
      this.armyCap = 40;
      this.serious = !!G.save.data.settings.serious;
      this.quipCd = 0; this.pows = []; this.castleHit = false;
      this.towerLvl = up.tower;
      this.towerCd = 2;
      this.cdMult = 1 - 0.06 * up.drill;
      this.progressScale = 1 + Math.max(0, sd.progress.normal) * 0.09;
      this.spawnLane = 1;
      this.selected = null;
      this.formation = true;
      this.orders = {}; this.holdLine = {};
      this.armedSpell = null;
      this.shake = 0;
      this.kills = 0; this.goldEarned = 0;
      this.state = 'play';
      this.endTimer = 0;
      this.banner = null;
      this.gemTimer = 6;
      this.passiveTimer = 0;
      // cards
      this.cards = [G.MINER].concat(cfg.lineup.filter(id => id !== G.MINER)).map(id => ({ id: id, cd: 0 }));
      this.spells = G.SPELL_ORDER.filter(id => sd.spells[id] > 0).map(id => ({ id: id, cd: 6, level: sd.spells[id] }));
      // enemy scaling
      if (this.endless) { this.hpM = 1; this.atkM = 1; }
      else {
        this.hpM = (1 + this.idx * 0.11) * this.diff.hp;
        this.atkM = (1 + this.idx * 0.075) * this.diff.atk;
      }
      // fortress (siege)
      this.fortX = this.W - 120;
      if (this.kind === 'siege') {
        this.fortMax = Math.round((1200 + this.idx * 380) * this.diff.hp * (this.idx < 6 ? 0.75 : 1));
        this.fortHp = this.fortMax;
      }
      this.setupDirector();
      // a free digger to start
      this.spawnDigger();
    }

    setRegion(ri) {
      this.regionIdx = ri;
      this.region = G.REGIONS[ri];
      this.theme = this.region.theme;
      this.bg = A.renderBackground(this.theme, this.W, G.H, 11 + ri * 31 + (this.idx || 0) * 7);
      this.ambient = [];
    }

    /* ---------------- wave director ---------------- */
    setupDirector() {
      const pool = this.region.pool;
      this.queue = []; // pending spawns {type, lane, at}
      this.wave = 0;
      this.waveTimer = 0;
      this.nextWaveAt = 7;
      if (this.kind === 'defend' || this.kind === 'boss') {
        const r = this.regionIdx;
        this.totalWaves = this.kind === 'boss' ? 3 : 3 + Math.floor(this.sub / 2) + Math.floor(r / 2);
      } else if (this.kind === 'siege') {
        this.totalWaves = Infinity;
        this.siegeTimer = 6;
      } else this.totalWaves = Infinity;
      const avail = this.endless ? pool.length : this.sub === 0 ? 2 : this.sub === 1 ? 3 : pool.length;
      this.pool = pool.slice(0, avail);
    }

    makeGroupList(budget, startAt) {
      const list = [];
      let b = budget, at = startAt;
      const costs = this.pool.map(t => G.ENEMIES[t].cost);
      const minCost = Math.min.apply(null, costs);
      while (b >= minCost * 0.75) {
        const options = this.pool.filter(t => G.ENEMIES[t].cost <= b + 0.3);
        const type = options.length ? pick(options) : this.pool[costs.indexOf(minCost)];
        const n = G.ENEMIES[type].cost >= 3 ? 1 : 1 + Math.floor(Math.random() * 3);
        const lane = Math.floor(Math.random() * 3);
        for (let i = 0; i < n && b > 0; i++) {
          list.push({ type: type, lane: lane, at: at });
          at += rand(0.5, 0.9);
          b -= G.ENEMIES[type].cost;
        }
        at += rand(1.0, 2.2);
      }
      return list;
    }

    startWave() {
      this.wave++;
      let budget;
      if (this.endless) {
        const w = this.wave;
        const newRegion = Math.floor((w - 1) / 5) % G.REGIONS.length;
        if (newRegion !== this.regionIdx) { this.setRegion(newRegion); this.pool = this.region.pool.slice(); }
        this.hpM = 1 + (w - 1) * 0.14;
        this.atkM = 1 + (w - 1) * 0.085;
        budget = 6 + w * 2.6;
        if (w % 10 === 0) {
          this.queue.push({ type: this.region.boss, lane: 1, at: this.time + 3, boss: true });
          this.showBanner(G.ENEMIES[this.region.boss].name.split(',')[0] + ' approaches!', '#ff6a5a');
          G.audio.play('boss'); G.audio.music('boss');
        }
      } else {
        budget = (5 + this.idx * 1.1) * (1 + (this.wave - 1) * 0.28) * (this.idx < 6 ? 0.85 : 1);
      }
      this.queue = this.queue.concat(this.makeGroupList(budget, this.time + 1));
      this.waveStart = this.time;
      if (!this.endless || this.wave % 10 !== 0) this.showBanner('Wave ' + this.wave + (isFinite(this.totalWaves) ? ' / ' + this.totalWaves : ''), '#ffe27a');
    }

    updateDirector(dt) {
      // spawn queued
      for (let i = this.queue.length - 1; i >= 0; i--) {
        const q = this.queue[i];
        if (this.time >= q.at) { this.spawnEnemy(q.type, q.lane); this.queue.splice(i, 1); }
      }
      const alive = this.units.reduce((n, u) => n + (u.side === 1 && !u.dead ? 1 : 0), 0);
      if (this.kind === 'siege') {
        this.siegeTimer -= dt;
        if (this.siegeTimer <= 0) {
          const elapsed = this.time / 90;
          this.queue = this.queue.concat(this.makeGroupList((2.2 + this.idx * 0.42) * (1 + elapsed * 0.6), this.time));
          this.siegeTimer = Math.max(5.5, 9 - this.idx * 0.06);
          if (this.wave === 0) { this.wave = 1; this.showBanner('Demolish the Branch Office!', '#ffe27a'); }
        }
        return;
      }
      if (this.wave < this.totalWaves) {
        if (this.wave === 0) { if (this.time >= this.nextWaveAt) this.startWave(); }
        else if (this.queue.length === 0 && (alive <= 1 || this.time - this.waveStart > 26)) {
          if (this.waveGap == null) this.waveGap = 4;
          this.waveGap -= dt;
          if (this.waveGap <= 0) { this.waveGap = null; this.startWave(); }
        }
      } else if (this.kind === 'boss' && !this.bossSpawned && this.queue.length === 0 && alive <= 2) {
        this.bossSpawned = true;
        const boss = this.spawnEnemy(this.region.boss, 1);
        this.boss = boss;
        this.showBanner(boss.def.name.split(',')[0] + ' has joined the meeting!', '#ff6a5a');
        if (boss.def.abilities && boss.def.abilities[0].line) this.say(boss, boss.def.abilities[0].line, 3, true);
        G.audio.play('boss'); G.audio.music('boss');
        this.escortTimer = 14;
      }
      if (this.boss && !this.boss.dead && this.kind === 'boss') {
        this.escortTimer -= dt;
        if (this.escortTimer <= 0) { this.escortTimer = 16; this.queue = this.queue.concat(this.makeGroupList(3 + this.idx * 0.3, this.time)); }
      }
    }

    /* ---------------- spawning ---------------- */
    spawnEnemy(type, lane) {
      const def = G.ENEMIES[type];
      const bossMult = def.boss ? this.diff.hp * (this.endless ? 0.6 + this.wave * 0.06 : 1) : this.hpM;
      const hp = def.hp * (def.boss ? bossMult : this.hpM);
      const look = def.look;
      const x = this.kind === 'siege' ? this.fortX + 20 : this.W + 30;
      const u = {
        id: UID++, side: 1, type: type, def: def, look: look, lane: lane, x: x, y: LY[lane], yOff: rand(-10, 10),
        hp: hp, maxHp: hp, atk: def.atk * (def.boss ? (this.endless ? this.atkM : this.diff.atk * (1 + this.idx * 0.03)) : this.atkM),
        rate: def.rate, range: def.range, speed: def.speed * rand(0.92, 1.08), armor: def.armor || 0,
        proj: def.proj, splash: def.splash, healer: def.healer, slowAmt: def.proj === 'frost' ? 0.3 : 0,
        rad: def.boss ? 40 : 12, h: heightOf(look), cd: rand(0.2, 0.8), atkT: 0, walk: rand(0, 6),
        abT: def.abilities ? def.abilities.map(ab => ab.every * 0.6) : null, summonT: def.summons ? 6 : 0,
        valor: def.valor, gold: def.gold, boss: !!def.boss
      };
      u.y = LY[lane] + u.yOff;
      this.units.push(u);
      if (!def.boss && Math.random() < 0.06) this.say(u, pick(ENEMY_QUIPS), 2);
      return u;
    }

    unitStats(type) {
      const def = G.UNITS[type], st = G.save.data.units[type];
      const tier = st.tier, lvl = st.level;
      const m = G.TIER_MULT[tier - 1] * (1 + 0.07 * (lvl - 1));
      return {
        tier: tier, hp: def.hp * m, atk: def.atk * m,
        rate: def.rate * (1 - 0.04 * (tier - 1)),
        range: def.range + (def.range > 100 ? (tier - 1) * 8 : 0),
        speed: def.speed * (1 + 0.03 * (tier - 1)),
        armor: (def.armor || 0) + (tier - 1) * 0.02,
        crit: tier >= 3 ? 0.08 + (tier - 3) * 0.04 : 0,
        heal: def.heal ? def.heal * m : 0
      };
    }

    spawnPlayer(type, lane) {
      const def = G.UNITS[type];
      const s = this.unitStats(type);
      const look = A.unitLook(type, s.tier);
      const u = {
        id: UID++, side: 0, type: type, def: def, look: look, lane: lane, x: CX - 6, y: LY[lane], yOff: rand(-12, 12),
        hp: s.hp, maxHp: s.hp, atk: s.atk, rate: s.rate, range: s.range, speed: s.speed * rand(0.95, 1.05), armor: s.armor, crit: s.crit,
        heal: s.heal, proj: def.proj, splash: def.splash, slowAmt: def.slow || 0, tier: s.tier,
        rad: type === 'titan' ? 30 : 12, h: heightOf(look), cd: 0.2, atkT: 0, walk: rand(0, 6),
        order: this.orders[type] || 'advance', holdX: this.holdLine[type] || null, melee: def.range < 100
      };
      u.y = LY[lane] + u.yOff;
      this.units.push(u);
      this.puff(u.x + 10, u.y - 20, '#fff6c0', 10);
      return u;
    }

    spawnDigger() {
      const tier = G.save.data.units[G.MINER].tier;
      this.diggers.push({ x: CX - 20, y: 300, state: 'out', t: 0, walk: rand(0, 6), tier: tier, look: A.unitLook(G.MINER, tier), carry: false });
      if (!this.serious && Math.random() < 0.35) this.diggers[this.diggers.length - 1].bubble = { text: pick(G.UNITS[G.MINER].quips.summon), t: 2 };
      G.save.data.stats.interns = (G.save.data.stats.interns || 0) + 1;
      if (G.save.data.stats.interns >= 100) G.achieve('interns');
    }

    /* ---------------- player actions ---------------- */
    summon(cardIdx) {
      const c = this.cards[cardIdx];
      if (!c || this.state !== 'play') return false;
      const id = c.id, def = G.UNITS[id];
      if (c.cd > 0) { G.audio.play('deny'); return false; }
      if (id === G.MINER && this.diggers.length >= this.maxDiggers) { this.floatText(CX + 60, 280, 'No more desks!', '#ffd0a0'); G.audio.play('deny'); return false; }
      if (id !== G.MINER && this.armySize() >= this.armyCap) { this.floatText(CX + 60, 280, 'Headcount freeze!', '#ffd0a0'); G.audio.play('deny'); return false; }
      if (this.gold < def.cost) { this.floatText(CX + 60, 280, 'Not enough gems!', '#ffd0a0'); G.audio.play('deny'); return false; }
      this.gold -= def.cost;
      c.cd = def.cd * this.cdMult;
      c.cdMax = c.cd;
      if (id === G.MINER) this.spawnDigger();
      else if (id === 'swarm') {
        const n = 2 + G.save.data.units.swarm.tier;
        for (let i = 0; i < n; i++) { const u = this.spawnPlayer(id, this.spawnLane); u.x -= i * 9; u.yOff = rand(-22, 22); if (i === 0) this.maybeSay(u, 'summon', 0.5); }
      } else { const u = this.spawnPlayer(id, this.spawnLane); this.maybeSay(u, 'summon', 0.45); }
      G.audio.play('summon');
      return true;
    }

    armySize() { let n = 0; for (const u of this.units) if (u.side === 0 && !u.dead) n++; return n; }

    useSpecial(type) {
      const sp = G.UNITS[type].special;
      if (!sp || this.state !== 'play') return false;
      const mine = this.units.filter(u => u.side === 0 && !u.dead && u.type === type);
      if (!mine.length || this.valor < sp.cost) { G.audio.play('deny'); return false; }
      this.valor -= sp.cost;
      G.audio.play('special');
      const lead = mine[Math.floor(Math.random() * mine.length)];
      const q = G.UNITS[type].quips;
      if (q && q.special) this.say(lead, pick(q.special), 2.4, true);
      G.save.data.stats.specials = (G.save.data.stats.specials || 0) + 1;
      const power = 1 + 0.15 * (G.save.data.units[type].tier - 1);
      mine.forEach(u => this.doSpecial(u, sp.id, power));
      return true;
    }

    doSpecial(u, id, power) {
      u.invuln = Math.max(u.invuln || 0, 0.8);
      u.flash = 0.6;
      switch (id) {
        case 'charge':
          u.special = { kind: 'charge', t: 0.7, speed: 330, mult: 3 * power, hit: new Set(), knock: 20 };
          break;
        case 'stampede':
          u.special = { kind: 'charge', t: 1.2, speed: 380, mult: 2.5 * power, hit: new Set(), knock: 70, stun: 0.8, back: u.x };
          break;
        case 'volley': {
          const targets = this.units.filter(e => e.side === 1 && !e.dead && e.lane === u.lane && e.x > u.x).sort((a, b) => a.x - b.x).slice(0, 5);
          for (let i = 0; i < 5; i++) {
            const tg = targets[i % Math.max(1, targets.length)];
            const tx = tg ? tg.x : u.x + 200 + i * 40, ty = tg ? tg.y - 25 : u.y - 30;
            this.fire(u, tg, 'arrow', u.atk * 2 * power, { tx: tx, ty: ty, delay: i * 0.06 });
          }
          u.atkT = 0.01;
          break;
        }
        case 'slam':
          this.shake = 12;
          this.units.forEach(e => { if (e.side === 1 && !e.dead && e.lane === u.lane && Math.abs(e.x - u.x) < 170) { this.damage(e, u.atk * 3 * power, u); if (!e.boss) { e.x += 90; e.stun = Math.max(e.stun || 0, 1); } } });
          this.ring(u.x, u.y, '#a06a3a', 170);
          this.pow(u.x + 40, u.y - 60, 'NO TIP?!', 1.2);
          G.audio.play('hitHeavy');
          u.atkT = 0.01;
          break;
        case 'encourage':
          this.units.forEach(a => { if (a.side === 0 && !a.dead) { a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.5 * power); a.haste = 6; this.sparkle(a.x, a.y - 30, '#ff9ab0', 6); } });
          this.castleHp = Math.min(this.castleMax, this.castleHp + this.castleMax * 0.03 * power);
          this.ring(u.x, u.y - 30, '#ff9ab0', 160);
          G.audio.play('heal');
          break;
        case 'memo':
          u.invuln = 3;
          this.units.forEach(e => { if (e.side === 1 && !e.dead && e.lane === u.lane && e.x > u.x - 40 && e.x - u.x < 400) { e.stun = Math.max(e.stun || 0, 2.5 * (e.boss ? 0.4 : 1)); this.parts.push({ x: e.x, y: e.y - e.h - 6, vx: 0, vy: -20, life: 1.2, max: 1.2, color: '#ffe84a', size: 6, kind: 'dot' }); } });
          this.pow(u.x + 60, u.y - 90, 'SEE ATTACHED.', 1, '#ffe84a');
          G.audio.play('special');
          break;
        case 'wild': {
          const sp = pick(WIZZLE_SPELLS);
          u.atkT = 0.01;
          const lane = u.lane;
          if (sp === 'meteor') {
            const en = this.units.filter(e => e.side === 1 && !e.dead && e.lane === lane);
            let best = null, bestN = -1;
            en.forEach(e => { const n = en.filter(o => Math.abs(o.x - e.x) < 110).length; if (n > bestN) { bestN = n; best = e; } });
            const tx = best ? best.x : u.x + 250;
            this.projs.push({ kind: 'meteor', x: tx - 160, y: -60, tx: tx, ty: LY[lane] - 10, vx: 0, vy: 0, speed: 700, dmg: u.atk * 6 * power, splash: 130, side: 0, lane: lane, src: u, ground: true });
            this.say(u, 'METEOR! I meant to do that.', 2.2, true);
          } else if (sp === 'freeze') {
            this.units.forEach(e => { if (e.side === 1 && !e.dead && e.lane === lane) { e.frozen = Math.max(e.frozen || 0, 3 * (e.boss ? 0.4 : 1)); this.damage(e, u.atk * 2 * power, u); } });
            for (let i = 0; i < 40; i++) this.parts.push({ x: rand(CX, this.W), y: LY[lane] - rand(0, 120), vx: rand(-60, -20), vy: rand(40, 120), life: 1.2, max: 1.2, color: '#e8fbff', size: rand(2, 5), kind: 'dot' });
            this.say(u, 'Brr! Was that me?', 2.2, true);
            G.audio.play('frost');
          } else if (sp === 'heal') {
            this.units.forEach(a => { if (a.side === 0 && !a.dead) { a.hp = Math.min(a.maxHp, a.hp + a.maxHp * 0.4 * power); this.sparkle(a.x, a.y - 30, '#9dffc0', 5); } });
            this.say(u, 'Healing! ...wait, no, yes. Healing!', 2.2, true);
            G.audio.play('heal');
          } else if (sp === 'lightning') {
            const en = this.units.filter(e => e.side === 1 && !e.dead).sort((a, b) => b.hp - a.hp).slice(0, 3);
            this.bolts = this.bolts || [];
            en.forEach(e => { this.bolts.push({ x: e.x, y: e.y, t: 0.35 }); this.damage(e, u.atk * 5 * power, u); });
            this.shake = 8;
            this.say(u, 'ZAP! Ha! Still got it!', 2.2, true);
            G.audio.play('thunder');
          } else if (sp === 'gems') {
            const g = Math.round(60 * power);
            this.gold += g; this.goldEarned += g;
            this.floatText(u.x, u.y - u.h - 20, '+' + g + ' gems', '#ffe27a', 1.4);
            this.sparkle(u.x, u.y - 40, '#5ae0ff', 20);
            this.say(u, 'Oops! Money! Don\'t tell accounting.', 2.4, true);
            G.audio.play('gem');
          } else {
            let n = 0;
            this.units.forEach(e => { if (e.side === 1 && !e.dead && !e.boss && e.lane === lane) { e.chicken = 5; n++; this.puff(e.x, e.y - 20, '#ffffff', 8); } });
            if (n) { G.save.data.stats.chickens = (G.save.data.stats.chickens || 0) + n; G.achieve('chicken'); }
            this.say(u, 'Chickens! Everyone\'s a chicken!', 2.4, true);
            G.audio.play('special');
          }
          break;
        }
        case 'rebirth':
          u.hp = u.maxHp;
          this.units.forEach(e => { if (e.side === 1 && !e.dead && e.lane === u.lane && Math.abs(e.x - u.x) < 150) this.damage(e, u.atk * 4 * power, u); });
          for (let i = 0; i < 30; i++) this.parts.push({ x: u.x, y: u.y - 55, vx: rand(-1, 1) * 220, vy: rand(-1, 0.4) * 200, life: 0.6, max: 0.6, color: pick(['#ffd040', '#ff8a2a', '#ff4a1a', '#ffffff']), size: rand(4, 10), kind: 'fire' });
          this.ring(u.x, u.y - 30, '#ff8a2a', 150);
          G.audio.play('fire');
          break;
        case 'grievance': {
          const t = this.units.filter(e => e.side === 1 && !e.dead && e.lane === u.lane && e.x > u.x - 20).sort((a, b) => a.x - b.x)[0];
          if (t) { this.damage(t, u.atk * 4 * power, u); t.slowT = 3; t.slowAmtIn = 0.5; this.parts.push({ x: t.x, y: t.y - t.h, vx: rand(-20, 20), vy: -40, life: 1, max: 1, color: '#ffffff', size: 5, kind: 'dot' }); }
          u.atkT = 0.01;
          break;
        }
      }
    }

    command(order) {
      const types = this.selected ? [this.selected] : G.UNIT_ORDER;
      const pool = this.units.filter(u => u.side === 0 && !u.dead && types.includes(u.type) && u.def.quips && u.def.quips.refuse);
      if (pool.length && Math.random() < 0.18 && !this.serious) {
        const u = pick(pool);
        this.say(u, pick(u.def.quips.refuse), 2.4, true);
        u.stun = Math.max(u.stun || 0, 0.8);
        const st = G.save.data.stats; st.refused = (st.refused || 0) + 1; if (st.refused >= 10) G.achieve('refused');
      }
      types.forEach(t => {
        this.orders[t] = order;
        if (order === 'hold') {
          const us = this.units.filter(u => u.side === 0 && !u.dead && u.type === t);
          const front = us.length ? Math.max.apply(null, us.map(u => u.x)) : CX + 80;
          this.holdLine[t] = Math.max(CX + 40, front);
        } else this.holdLine[t] = null;
      });
      this.units.forEach(u => {
        if (u.side !== 0 || u.dead || (this.selected && u.type !== this.selected)) return;
        u.order = order;
        u.holdX = order === 'hold' ? u.x : null;
      });
      G.audio.play('click');
    }

    moveSelectedToLane(lane) {
      let n = 0;
      this.units.forEach(u => { if (u.side === 0 && !u.dead && u.type === this.selected) { u.lane = lane; n++; } });
      if (n) { G.audio.play('click'); this.ring(this.W * 0.5, LY[lane], '#ffffff', 40, 0.4); }
    }

    castSpell(id, lane) {
      const s = this.spells.find(x => x.id === id);
      if (!s || s.cd > 0) return;
      const lvl = s.level;
      const dmgScale = this.progressScale * this.diff.atk;
      s.cd = G.SPELLS[id].cd; s.cdMax = s.cd;
      this.armedSpell = null;
      if (id === 'arrows') {
        const n = 26 + lvl * 4;
        for (let i = 0; i < n; i++) {
          const tx = rand(CX + 60, this.W - 20);
          this.projs.push({ kind: 'arrow', x: tx - 120, y: -40 - rand(0, 300), tx: tx, ty: LY[lane] + rand(-20, 20), speed: 650, dmg: (14 + 6 * lvl) * dmgScale, splash: 34, side: 0, lane: lane, ground: true, vx: 0, vy: 0 });
        }
        G.audio.play('arrow');
      } else if (id === 'frostnova') {
        this.units.forEach(e => { if (e.side === 1 && !e.dead) { e.frozen = Math.max(e.frozen || 0, (2 + 0.5 * lvl) * (e.boss ? 0.5 : 1)); this.damage(e, (10 + 6 * lvl) * dmgScale, null); } });
        for (let i = 0; i < 70; i++) this.parts.push({ x: rand(CX, this.W), y: rand(280, 620), vx: rand(-30, 30), vy: rand(-30, 30), life: 1, max: 1, color: '#d8f8ff', size: rand(2, 6), kind: 'dot' });
        this.flashScreen = { c: 'rgba(180,240,255,', t: 0.5 };
        G.audio.play('frost');
      } else if (id === 'thunder') {
        const en = this.units.filter(e => e.side === 1 && !e.dead).sort((a, b) => b.hp - a.hp).slice(0, 3 + lvl);
        en.forEach((e, i) => {
          this.bolts = this.bolts || [];
          this.bolts.push({ x: e.x, y: e.y, t: 0.35 + i * 0.05 });
          this.damage(e, (80 + 40 * lvl) * dmgScale, null);
          this.ring(e.x, e.y - 20, '#fff7a0', 50);
        });
        this.shake = 10;
        this.flashScreen = { c: 'rgba(255,255,220,', t: 0.3 };
        G.audio.play('thunder');
      }
    }

    /* ---------------- input ---------------- */
    laneAt(y) {
      let best = -1, bd = 1e9;
      LY.forEach((ly, i) => { const d = Math.abs(y - ly); if (d < bd) { bd = d; best = i; } });
      return bd < 70 ? best : -1;
    }
    tap(x, y) {
      if (this.state !== 'play') return;
      const lane = this.laneAt(y);
      if (this.armedSpell) {
        if (lane >= 0) this.castSpell(this.armedSpell, lane);
        else this.armedSpell = null;
        return;
      }
      // gems
      for (let i = 0; i < this.gems.length; i++) {
        const g = this.gems[i];
        if (Math.hypot(g.x - x, g.y - y) < 46) { this.collectGem(i); return; }
      }
      // castle taps choose spawn lane
      if (x < CX + 30 && lane >= 0) { this.spawnLane = lane; this.selected = null; G.audio.play('click'); return; }
      // units
      let hit = null, hd = 1e9;
      this.units.forEach(u => {
        if (u.side !== 0 || u.dead) return;
        const cy = u.y - u.h * 0.45;
        const d = Math.hypot((u.x - x) * 1.2, cy - y);
        if (Math.abs(u.x - x) < 34 && y > u.y - u.h - 10 && y < u.y + 14 && d < hd) { hd = d; hit = u; }
      });
      if (hit) { this.selected = this.selected === hit.type ? null : hit.type; G.audio.play('click'); return; }
      if (lane >= 0) {
        if (this.selected) this.moveSelectedToLane(lane);
        else { this.spawnLane = lane; G.audio.play('click'); }
      }
    }
    collectGem(i) {
      const g = this.gems[i];
      this.gems.splice(i, 1);
      const v = Math.round(25 * (1 + 0.1 * G.save.data.upgrades.yield));
      this.gold += v; this.goldEarned += v;
      this.valor = Math.min(this.valorMax, this.valor + 5);
      this.floatText(g.x, g.y - 20, '+' + v, '#ffe27a');
      this.sparkle(g.x, g.y, g.color, 12);
      G.audio.play('gem');
    }

    /* ---------------- simulation ---------------- */
    update(dt) {
      if (this.state === 'paused') return;
      if (this.form && this.state === 'play') {
        this.form.t -= dt / Math.max(1, G.speed);
        if (this.form.t <= 0) this.formFail();
        return;
      }
      if (this.slides) { this.slides.t -= dt; if (this.slides.t <= 0) this.slides = null; }
      if (this.quipCd > 0) this.quipCd -= dt;
      for (let i = this.pows.length - 1; i >= 0; i--) { this.pows[i].t -= dt; if (this.pows[i].t <= 0) this.pows.splice(i, 1); }
      for (const d of this.diggers) if (d.bubble) { d.bubble.t -= dt; if (d.bubble.t <= 0) d.bubble = null; }
      this.time += dt;
      if (this.state !== 'play') {
        this.endTimer -= dt;
        this.updateFx(dt);
        this.units.forEach(u => { u.walk += dt * 4; if (u.atkT > 0) { u.atkT += dt / 0.45; if (u.atkT >= 1) u.atkT = 0; } });
        if (this.endTimer <= 0 && !this.endFired) { this.endFired = true; G.ui.onBattleEnd(this.result); }
        return;
      }
      this.updateDirector(dt);
      // economy
      this.passiveTimer += dt;
      if (this.passiveTimer >= 1) { this.passiveTimer -= 1; this.gold += 2; }
      this.cards.forEach(c => { if (c.cd > 0) c.cd = Math.max(0, c.cd - dt); });
      this.spells.forEach(s => { if (s.cd > 0) s.cd = Math.max(0, s.cd - dt); });
      this.updateDiggers(dt);
      // gems
      this.gemTimer -= dt;
      if (this.gemTimer <= 0) {
        this.gemTimer = rand(8, 13);
        const ln = Math.floor(Math.random() * 3);
        this.gems.push({ x: rand(CX + 120, this.W * 0.6), y: LY[ln] - 60, life: 9, t: 0, color: pick(['#5ae0ff', '#ff5ad8', '#ffe05a', '#7aff7a']) });
      }
      for (let i = this.gems.length - 1; i >= 0; i--) { const g = this.gems[i]; g.t += dt; g.life -= dt; if (g.life <= 0) this.gems.splice(i, 1); }
      // tower
      if (this.towerLvl > 0) {
        this.towerCd -= dt;
        if (this.towerCd <= 0) {
          let best = null;
          this.units.forEach(e => { if (e.side === 1 && !e.dead && e.x < CX + 560 && (!best || e.x < best.x)) best = e; });
          if (best) {
            this.towerCd = 1.5;
            this.projs.push({ kind: 'tower', x: 62, y: 110, target: best, tx: best.x, ty: best.y - 25, speed: 640, dmg: 9 * (1 + 0.5 * this.towerLvl) * this.progressScale, side: 0, lane: best.lane, vx: 0, vy: 0 });
          } else this.towerCd = 0.3;
        }
      }
      // units (bucket by side & lane for fast targeting)
      const bl = this.byLane = [[[], [], []], [[], [], []]];
      for (const u of this.units) if (!u.dead && !u.burrowed) bl[u.side][u.lane].push(u);
      for (const u of this.units) {
        if (u.dead) { u.deathT -= dt; continue; }
        if (u.side === 0) this.updatePlayer(u, dt); else this.updateEnemy(u, dt);
      }
      this.units = this.units.filter(u => !u.dead || u.deathT > 0);
      this.updateProjectiles(dt);
      this.updateFx(dt);
      this.checkEnd();
    }

    updateDiggers(dt) {
      const yieldBase = 16 * (1 + 0.12 * G.save.data.upgrades.yield);
      for (const d of this.diggers) {
        const sp = 85 * (1 + 0.08 * (d.tier - 1));
        d.walk += dt * 9;
        if (d.state === 'out' || d.state === 'back') {
          const tx = d.state === 'out' ? MINE.x - 8 : CX - 10, ty = d.state === 'out' ? MINE.y + 32 : 300;
          const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
          if (dist < 4) {
            if (d.state === 'out') { d.state = 'dig'; d.t = 1.8 * (1 - 0.08 * (d.tier - 1)); }
            else {
              const v = Math.round(yieldBase * (1 + 0.18 * (d.tier - 1)));
              this.gold += v; this.goldEarned += v;
              this.floatText(CX - 10, 280, '+' + v, '#ffe27a', 0.8);
              G.audio.play('coin');
              d.state = 'out'; d.carry = false;
            }
          } else { d.x += dx / dist * sp * dt; d.y += dy / dist * sp * dt; }
          d.face = dx >= 0 ? 1 : -1;
        } else if (d.state === 'dig') {
          d.t -= dt;
          if (Math.random() < dt * 6) this.parts.push({ x: MINE.x - 4 + rand(-6, 6), y: MINE.y + 18, vx: rand(-40, 40), vy: rand(-90, -40), g: 260, life: 0.5, max: 0.5, color: pick(['#5ae0ff', '#ffe05a', '#9a8a7a']), size: 2.5, kind: 'dot' });
          if (d.t <= 0) { d.state = 'back'; d.carry = true; }
        }
      }
    }

    findTarget(u) {
      const dir = u.side === 0 ? 1 : -1;
      let best = null, bd = 1e9;
      const foes = this.byLane ? this.byLane[1 - u.side][u.lane] : this.units;
      for (const e of foes) {
        if (e.side === u.side || e.dead || e.lane !== u.lane || e.burrowed) continue;
        if (Math.abs(e.y - (LY[e.lane] + e.yOff)) > 14) continue; // still switching lanes
        const dx = dir * (e.x - u.x);
        if (dx < -18 || dx > u.range + e.rad) continue;
        if (dx < bd) { bd = dx; best = e; }
      }
      return best;
    }

    startAttack(u, target, onHit) {
      u.cd = u.rate;
      u.atkT = 0.001;
      u.pending = { target: target, fn: onHit };
    }
    tickAttack(u, dt) {
      if (u.atkT > 0) {
        const before = u.atkT;
        u.atkT += dt / 0.45;
        if (before < 0.42 && u.atkT >= 0.42 && u.pending) { const p = u.pending; u.pending = null; p.fn(p.target); }
        if (u.atkT >= 1) u.atkT = 0;
      }
    }

    hitWith(u, target) {
      if (u.proj) {
        if (target === 'castle') this.fire(u, null, u.proj, u.atk, { tx: CX - 10, ty: u.y - 40, castle: true });
        else if (target === 'fort') this.fire(u, null, u.proj, u.atk, { tx: this.fortX + 20, ty: u.y - 40, fort: true });
        else this.fire(u, target, u.proj, u.atk);
        if (u.type === 'todd') this.maybeSay(u, 'shot', 0.1);
        G.audio.play(u.proj === 'fireball' ? 'fire' : u.proj === 'frost' ? 'frost' : 'arrow');
      } else {
        if (target === 'castle') this.hitCastle(u.atk);
        else if (target === 'fort') this.hitFort(u.atk * (u.type === 'titan' ? 2 : 1));
        else if (target && !target.dead) {
          if (u.splash) {
            this.units.forEach(e => { if (e.side !== u.side && !e.dead && e.lane === u.lane && Math.abs(e.x - target.x) < u.splash) this.damage(e, u.atk, u); });
            this.ring(target.x, target.y - 10, '#d8b080', u.splash, 0.3);
          } else this.damage(target, u.atk, u);
          if (u.def.stunChance && Math.random() < u.def.stunChance && !target.dead) { target.stun = Math.max(target.stun || 0, 0.8); this.parts.push({ x: target.x, y: target.y - target.h - 4, vx: 0, vy: -30, life: 0.9, max: 0.9, color: '#ffe84a', size: 5, kind: 'dot' }); }
          if (u.side === 0 && (u.atk > 26 || Math.random() < 0.06) && Math.random() < 0.35) this.pow(target.x, target.y - target.h * 0.6, pick(POWS), 0.7);
          if (u.side === 0 && u.type === 'reginald' && target.dead) this.maybeSay(u, 'kill', 0.35);
          if (u.side === 0 && u.type === 'brenda' && target.dead) this.maybeSay(u, 'kill', 0.3);
          G.audio.play(u.atk > 30 ? 'hitHeavy' : 'hit');
        }
      }
    }

    fire(u, target, kind, dmg, o) {
      o = o || {};
      const sx = u.x + (u.side === 0 ? 16 : -16), sy = u.y - u.h * 0.6;
      const p = {
        kind: kind, x: sx, y: sy, target: target, tx: o.tx != null ? o.tx : target.x, ty: o.ty != null ? o.ty : target.y - target.h * 0.4,
        speed: kind === 'arrow' ? 620 : kind === 'fireball' ? 420 : kind === 'dark' ? 380 : 480, dmg: dmg, side: u.side, lane: u.lane,
        splash: u.splash || 0, slow: u.slowAmt || 0, src: u, castle: o.castle, fort: o.fort, delay: o.delay || 0, vx: 0, vy: 0
      };
      this.projs.push(p);
    }

    updatePlayer(u, dt) {
      this.unitTimers(u, dt);
      u.walk += dt * (u.moving ? 9 : 0);
      this.laneMove(u, dt);
      this.tickAttack(u, dt);
      if (u.stun > 0 || u.frozen > 0) { u.moving = false; return; }
      if (u.special && u.special.kind === 'charge') {
        const s = u.special;
        s.t -= dt;
        u.moving = true; u.walk += dt * 10;
        u.x = Math.min(this.W - 60, u.x + s.speed * dt);
        this.units.forEach(e => {
          if (e.side === 1 && !e.dead && e.lane === u.lane && !s.hit.has(e.id) && Math.abs(e.x - u.x) < 34 + e.rad) {
            s.hit.add(e.id);
            this.damage(e, u.atk * s.mult, u);
            if (!e.boss) e.x += s.knock;
            if (s.stun && !e.boss) e.stun = Math.max(e.stun || 0, s.stun);
            this.ring(e.x, e.y - 20, '#fff', 20, 0.25);
          }
        });
        if (Math.random() < dt * 20) this.parts.push({ x: u.x - 10, y: u.y, vx: rand(-80, -20), vy: rand(-40, 0), life: 0.4, max: 0.4, color: 'rgba(200,180,140,0.7)', size: 5, kind: 'smoke' });
        if (s.t <= 0) u.special = s.back != null ? { kind: 'return', x: s.back } : null;
        return;
      }
      if (u.special && u.special.kind === 'return') {
        u.moving = true; u.facing = -1; u.walk += dt * 8;
        u.x -= 320 * dt;
        if (u.x <= u.special.x) { u.x = u.special.x; u.special = null; u.facing = 1; }
        return;
      }
      if (u.cd > 0) u.cd -= dt * (u.haste > 0 ? 1.5 : 1);
      // healing
      if (u.heal && u.cd <= 0) {
        let best = null, br = 0.98;
        this.units.forEach(a => {
          if (a.side === 0 && !a.dead && a.lane === u.lane && Math.abs(a.x - u.x) < u.range && a.hp / a.maxHp < br) { br = a.hp / a.maxHp; best = a; }
        });
        if (best) {
          const tgt = best;
          if (Math.random() < 0.12) this.maybeSay(u, 'heal', 1);
          this.startAttack(u, tgt, t => { if (!t.dead) { t.hp = Math.min(t.maxHp, t.hp + u.heal); this.sparkle(t.x, t.y - t.h * 0.5, '#9dffc0', 5); this.floatText(t.x, t.y - t.h - 6, '+' + Math.round(u.heal), '#9dffc0', 0.6); } });
          u.moving = false;
          G.audio.play('heal');
          return;
        }
      }
      const onLane = Math.abs(u.y - (LY[u.lane] + u.yOff)) < 14;
      const target = onLane ? this.findTarget(u) : null;
      if (target) {
        u.moving = false;
        if (u.cd <= 0) this.startAttack(u, target, t => this.hitWith(u, t));
        return;
      }
      if (this.kind === 'siege' && this.fortHp > 0 && onLane && this.fortX - u.x <= u.range + 4) {
        u.moving = false;
        if (u.cd <= 0) this.startAttack(u, 'fort', t => this.hitWith(u, t));
        return;
      }
      // movement by order
      let goal;
      if (u.order === 'retreat') goal = CX + 34;
      else if (u.order === 'hold' && u.holdX != null) goal = u.holdX;
      else {
        const ahead = this.byLane && this.byLane[1][u.lane].some(e => !e.dead && e.x > u.x && e.x < this.W - 20);
        goal = this.kind === 'siege' ? this.fortX - u.range + 2 : (ahead ? this.W - 40 : this.W - 150);
        if (this.formation && !u.melee) {
          let front = -1;
          this.units.forEach(a => { if (a.side === 0 && !a.dead && a.melee && a.lane === u.lane && a.x > front) front = a.x; });
          if (front > 0) goal = Math.min(goal, Math.max(CX + 40, front - 60));
        }
      }
      const dx = goal - u.x;
      if (Math.abs(dx) > 3) {
        u.moving = true;
        const sp = u.speed * (u.slowT > 0 ? 0.5 : 1);
        u.x += Math.sign(dx) * Math.min(Math.abs(dx), sp * dt);
        u.facing = dx < 0 ? -1 : 1;
      } else {
        u.moving = false; u.facing = 1;
        if (u.order === 'retreat' && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + u.maxHp * 0.04 * dt);
      }
    }

    updateEnemy(e, dt) {
      this.unitTimers(e, dt);
      e.walk += dt * (e.moving ? 9 : 0);
      this.laneMove(e, dt);
      this.tickAttack(e, dt);
      if (e.stun > 0 || e.frozen > 0) { e.moving = false; return; }
      if (e.chicken > 0) { e.moving = true; e.x += Math.sin(this.time * 3 + e.id) * 30 * dt; return; }
      if (e.def.abilities) this.bossAbility(e, dt);
      if (e.burrowed) {
        e.burrowT -= dt;
        e.moving = true;
        if (e.burrowT <= 0) {
          e.burrowed = false;
          this.shake = 10;
          this.units.forEach(p => { if (p.side === 0 && !p.dead && p.lane === e.lane && Math.abs(p.x - e.x) < 150) { this.damage(p, e.atk * 1.2, e); p.stun = 1; } });
          this.puff(e.x, e.y, '#d0a050', 30);
          G.audio.play('boom');
        }
        return;
      }
      if (e.def.summons) {
        e.summonT -= dt;
        if (e.summonT <= 0) {
          e.summonT = 9;
          for (let i = 0; i < 2; i++) { const s = this.spawnEnemy(e.def.summons, e.lane); s.x = e.x + 20 + i * 20; this.puff(s.x, s.y - 20, '#b04aff', 10); }
        }
      }
      if (e.cd > 0) e.cd -= dt;
      if (e.healer && e.cd <= 0) {
        let best = null, br = 0.9;
        this.units.forEach(a => { if (a.side === 1 && !a.dead && a !== e && a.lane === e.lane && Math.abs(a.x - e.x) < e.range && a.hp / a.maxHp < br) { br = a.hp / a.maxHp; best = a; } });
        if (best) {
          this.startAttack(e, best, t => { if (!t.dead) { t.hp = Math.min(t.maxHp, t.hp + e.healer * this.hpM); this.sparkle(t.x, t.y - 30, '#c6ff5a', 5); } });
          e.moving = false;
          return;
        }
      }
      const onLane = Math.abs(e.y - (LY[e.lane] + e.yOff)) < 14;
      const target = onLane && e.x < this.W - 60 ? this.findTarget(e) : null;
      if (target) {
        e.moving = false;
        if (e.cd <= 0) this.startAttack(e, target, t => this.hitWith(e, t));
        return;
      }
      if (e.x - CX <= e.range + 6) {
        e.moving = false;
        if (e.cd <= 0) this.startAttack(e, 'castle', t => this.hitWith(e, t));
        return;
      }
      e.moving = true;
      const sp = e.speed * (e.slowT > 0 ? (1 - (e.slowAmtIn || 0.4)) : 1);
      e.x -= sp * dt;
    }

    bossAbility(e, dt) {
      e.def.abilities.forEach((ab, i) => {
        e.abT[i] -= dt;
        if (e.abT[i] > 0) return;
        e.abT[i] = ab.every;
        if (this.form || this.slides) { e.abT[i] = 3; return; }
        if (ab.line) this.say(e, ab.line, 2.5, true);
        const k = ab.kind;
        if (k === 'summon') {
          for (let j = 0; j < ab.n; j++) { const s = this.spawnEnemy(ab.what, j % 3); s.x = Math.min(this.W + 20, e.x + 30 + j * 15); this.puff(s.x, s.y - 20, '#ff9a5a', 8); }
        } else if (k === 'stomp') {
          const r = ab.radius || 260;
          this.shake = 12;
          this.units.forEach(p => { if (p.side === 0 && !p.dead && Math.abs(p.x - e.x) < r) { this.damage(p, e.atk * 0.6, e); p.stun = Math.max(p.stun || 0, 1.3); } });
          this.ring(e.x, e.y, '#c8e8ff', r);
          G.audio.play('hitHeavy');
        } else if (k === 'burrow') {
          e.burrowed = true; e.burrowT = 2.5;
          e.lane = (e.lane + 1 + Math.floor(Math.random() * 2)) % 3;
          this.puff(e.x, e.y, '#d0a050', 20);
        } else if (k === 'breath') {
          e.breathT = 1.2;
          G.audio.play('fire');
          this.units.forEach(p => { if (p.side === 0 && !p.dead && p.lane === e.lane && e.x - p.x < 380 && e.x - p.x > -20) this.damage(p, e.atk * 1.1, e); });
          for (let j = 0; j < 50; j++) { const d = rand(0, 380); this.parts.push({ x: e.x - 70 - d * 0.2, y: e.y - 110, vx: -rand(300, 520), vy: rand(30, 140), life: 0.8, max: 0.8, color: pick(['#ffd040', '#ff8a2a', '#ff4a1a', '#ffffff']), size: rand(5, 12), kind: 'fire' }); }
        } else if (k === 'slides') {
          const sl = pick(SLIDES);
          this.slides = { t: 3.6, title: sl[0], bullets: sl[1], boss: e };
          this.units.forEach(p => { if (p.side === 0 && !p.dead) { p.stun = Math.max(p.stun || 0, 2.5); p.sleepy = 2.5; } });
          e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.04);
          this.say(e, pick(['Let me share my screen...', 'Can everyone see my slides?', 'Next slide please.']), 2.5, true);
          G.audio.play('boss');
        } else if (k === 'form') {
          if (this.serious) return;
          this.form = { t: 5.5, max: 5.5, boxes: [0, 1, 2].map(i => ({ x: rand(0, 1), y: i / 2, done: false })), boss: e };
          this.say(e, 'Fill out this form! You have 5 seconds!', 3, true);
          G.audio.play('deny');
        }
      });
    }

    formTick(i) {
      const f = this.form;
      if (!f || f.boxes[i].done) return;
      f.boxes[i].done = true;
      G.audio.play('coin');
      if (f.boxes.every(b => b.done)) {
        this.form = null;
        const e = f.boss;
        if (!e.dead) { e.stun = 3; this.damage(e, e.maxHp * 0.08, null); this.pow(e.x, e.y - e.h - 20, 'APPROVED!', 1.3, '#7aff7a'); }
        this.showBanner('Form approved!', '#7aff7a');
        const st = G.save.data.stats; st.forms = (st.forms || 0) + 1; if (st.forms >= 5) G.achieve('forms');
        G.audio.play('upgrade');
      }
    }
    formFail() {
      this.form = null;
      this.hitCastle(this.castleMax * 0.1);
      this.showBanner(pick(['Form rejected: wrong pen color', 'Form rejected: missing initials', 'Form rejected: font too fun']), '#ff7a6a');
    }

    say(u, text, dur, force) {
      if (this.serious || !text) return;
      if (!force && this.quipCd > 0) return;
      u.bubble = { text: text, t: dur || 2, max: dur || 2 };
      if (!force) this.quipCd = 1.4;
    }
    maybeSay(u, key, chance) {
      const q = u.def && u.def.quips && u.def.quips[key];
      if (q && Math.random() < chance) this.say(u, pick(q), 2);
    }
    pow(x, y, text, k, color) { if (this.serious) return; this.pows.push({ x: x, y: y, text: text, k: k || 1, color: color, t: 0.6 }); }

    unitTimers(u, dt) {
      if (u.invuln > 0) u.invuln -= dt;
      if (u.stun > 0) u.stun -= dt;
      if (u.frozen > 0) u.frozen -= dt;
      if (u.slowT > 0) u.slowT -= dt;
      if (u.hurt > 0) u.hurt -= dt;
      if (u.flash > 0) u.flash -= dt;
      if (u.haste > 0) u.haste -= dt;
      if (u.sleepy > 0) u.sleepy -= dt;
      if (u.chicken > 0) u.chicken -= dt;
      if (u.bubble) { u.bubble.t -= dt; if (u.bubble.t <= 0) u.bubble = null; }
      if (u.breathT > 0) u.breathT -= dt;
    }
    laneMove(u, dt) {
      const ty = LY[u.lane] + u.yOff;
      const dy = ty - u.y;
      const s = 170 * dt;
      u.y += clamp(dy, -s, s);
    }

    damage(t, amt, src) {
      if (t.dead || t.invuln > 0 || t.burrowed) return;
      let d = amt * (1 - (t.armor || 0)) * rand(0.9, 1.1);
      let crit = false;
      if (src && src.crit && Math.random() < src.crit) { d *= 2; crit = true; }
      t.hp -= d;
      t.hurt = 0.12;
      if (crit) this.floatText(t.x, t.y - t.h - 8, Math.round(d) + '!', '#ffd040', 0.7);
      else if (t.side === 1 && d > 40) this.floatText(t.x, t.y - t.h - 8, Math.round(d), '#ffffff', 0.5);
      if (t.hp <= 0) this.kill(t, src);
    }
    kill(t) {
      if (t.side === 0 && t.type === 'phoenix' && !t.reborn) {
        t.reborn = true; t.hp = t.maxHp * 0.5; t.invuln = 1.5;
        this.ring(t.x, t.y - 40, '#ff8a2a', 90);
        for (let i = 0; i < 24; i++) this.parts.push({ x: t.x, y: t.y - 55, vx: rand(-1, 1) * 160, vy: rand(-1, 0.2) * 180, life: 0.6, max: 0.6, color: pick(['#ffd040', '#ff8a2a', '#ffffff']), size: rand(3, 8), kind: 'fire' });
        this.maybeSay(t, 'rebirth', 1);
        const st = G.save.data.stats; st.rebirths = (st.rebirths || 0) + 1; G.achieve('rebirth');
        G.audio.play('fire');
        return;
      }
      t.dead = true; t.deathT = 0.5; t.hp = 0;
      this.puff(t.x, t.y - t.h * 0.4, t.side === 1 ? '#e8e0d0' : '#ffffff', t.boss ? 40 : 10);
      if (t.side === 1) {
        this.kills++;
        this.valor = Math.min(this.valorMax, this.valor + t.valor * this.valorMult);
        const g = Math.round(t.gold * (this.endless ? 1 : 1));
        this.gold += g; this.goldEarned += g;
        this.floatText(t.x, t.y - t.h, '+' + g, '#ffe27a', 0.6);
        if (Math.random() < 0.04) this.gems.push({ x: t.x, y: t.y - 50, life: 8, t: 0, color: '#ffe05a' });
        G.audio.play('die');
        if (t.boss) { this.shake = 18; G.audio.play('boom'); }
      }
    }
    hitCastle(dmg) {
      this.castleHp -= dmg;
      this.castleHit = true;
      this.shake = Math.max(this.shake, 4);
      G.audio.play('castleHit');
      this.puff(CX + rand(-10, 10), rand(300, 560), '#b4ada0', 4);
    }
    hitFort(dmg) {
      if (this.fortHp <= 0) return;
      this.fortHp -= dmg;
      this.puff(this.fortX + rand(0, 30), rand(300, 560), '#4a4050', 4);
      G.audio.play('hit');
    }

    updateProjectiles(dt) {
      for (let i = this.projs.length - 1; i >= 0; i--) {
        const p = this.projs[i];
        if (p.delay > 0) { p.delay -= dt; continue; }
        if (p.target && !p.target.dead && !p.ground) { p.tx = p.target.x; p.ty = p.target.y - p.target.h * 0.4; }
        const dx = p.tx - p.x, dy = p.ty - p.y, dist = Math.hypot(dx, dy);
        const step = p.speed * dt;
        if (dist <= step + 2) {
          this.projs.splice(i, 1);
          this.impact(p);
          continue;
        }
        p.vx = dx / dist * p.speed; p.vy = dy / dist * p.speed;
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'fireball' || p.kind === 'meteor') { if (Math.random() < 0.6) this.parts.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-30, 10), life: 0.35, max: 0.35, color: pick(['#ffb030', '#ff6a1a']), size: p.kind === 'meteor' ? 9 : 4, kind: 'fire' }); }
        if (p.kind === 'spark' || p.kind === 'dark') { if (Math.random() < 0.4) this.parts.push({ x: p.x, y: p.y, vx: 0, vy: 0, life: 0.3, max: 0.3, color: p.kind === 'dark' ? '#b04aff' : '#c8ffd8', size: 3, kind: 'dot' }); }
      }
    }
    impact(p) {
      if (p.castle) { this.hitCastle(p.dmg); return; }
      if (p.fort) { this.hitFort(p.dmg); return; }
      const foes = this.units.filter(e => e.side !== p.side && !e.dead && e.lane === p.lane);
      if (p.splash) {
        foes.forEach(e => { if (Math.abs(e.x - p.tx) < p.splash + e.rad) this.damage(e, p.dmg, p.src); });
        if (p.kind === 'fireball' || p.kind === 'meteor') {
          const big = p.kind === 'meteor';
          for (let k = 0; k < (big ? 40 : 12); k++) this.parts.push({ x: p.tx, y: p.ty, vx: rand(-1, 1) * (big ? 260 : 120), vy: rand(-1, 0.3) * (big ? 260 : 120), life: 0.5, max: 0.5, color: pick(['#ffd040', '#ff8a2a', '#ff4a1a', '#fff6c0']), size: rand(3, big ? 12 : 6), kind: 'fire' });
          this.ring(p.tx, p.ty, '#ffb030', p.splash, 0.3);
          if (big) { this.shake = 10; G.audio.play('boom'); }
          if (big && this.kind === 'siege' && p.tx > this.fortX - 120) this.hitFort(p.dmg * 0.5);
        }
      } else if (p.target && !p.target.dead) {
        this.damage(p.target, p.dmg, p.src);
        if (p.slow) { p.target.slowT = 2; p.target.slowAmtIn = p.slow; }
      } else if (p.ground) {
        foes.forEach(e => { if (Math.abs(e.x - p.tx) < 30) this.damage(e, p.dmg, p.src); });
      }
      if (p.kind === 'frost') this.sparkle(p.tx, p.ty, '#d8f8ff', 5);
      else if (p.kind === 'dark') this.sparkle(p.tx, p.ty, '#b04aff', 5);
    }

    checkEnd() {
      if (this.castleHp <= 0) {
        this.castleHp = 0;
        return this.finish(false);
      }
      if (this.kind === 'siege' && this.fortHp <= 0) return this.finish(true);
      if (this.kind === 'boss' && this.boss && this.boss.dead) return this.finish(true);
      if (this.kind === 'defend' && this.wave >= this.totalWaves && this.queue.length === 0 && !this.units.some(u => u.side === 1 && !u.dead)) return this.finish(true);
    }

    finish(won) {
      if (this.state !== 'play') return;
      this.state = won ? 'won' : 'lost';
      this.endTimer = 2.2;
      this.armedSpell = null;
      if (won) {
        this.units.forEach(u => { if (u.side === 1 && !u.dead) this.kill(u); });
        if (this.kind === 'siege') { this.shake = 20; for (let i = 0; i < 12; i++) this.puff(this.fortX + rand(0, 120), rand(150, 600), '#ffb030', 12); G.audio.play('boom'); }
        this.showBanner(this.serious ? 'Victory.' : pick(['VICTORY!', 'NAILED IT!', 'WE WON?!', 'SYNERGY!']), '#ffe27a');
        G.audio.play('victory');
      } else {
        this.showBanner(this.serious ? 'Defeat.' : pick(['CASTLE CLOSED', 'YOU\'RE FIRED', 'WELL, THAT HAPPENED']), '#ff6a5a');
        G.audio.play('defeat');
      }
      this.result = { castleHit: this.castleHit, won: won, kills: this.kills, goldEarned: this.goldEarned, wave: this.wave, endless: this.endless, castleRatio: this.castleHp / this.castleMax };
    }

    /* ---------------- effects ---------------- */
    showBanner(text, color) { this.banner = { text: text, color: color, t: 2.4 }; }
    floatText(x, y, text, color, life) { this.texts.push({ x: x, y: y, text: String(text), color: color, life: life || 1, max: life || 1 }); }
    puff(x, y, color, n) { for (let i = 0; i < n; i++) this.parts.push({ x: x, y: y, vx: rand(-90, 90), vy: rand(-110, 30), g: 120, life: rand(0.35, 0.7), max: 0.7, color: color, size: rand(3, 7), kind: 'smoke' }); }
    sparkle(x, y, color, n) { for (let i = 0; i < n; i++) this.parts.push({ x: x + rand(-12, 12), y: y + rand(-12, 12), vx: rand(-30, 30), vy: rand(-80, -20), life: 0.6, max: 0.6, color: color, size: rand(2, 4), kind: 'spark' }); }
    ring(x, y, color, r, life) { this.parts.push({ x: x, y: y, r: r, life: life || 0.45, max: life || 0.45, color: color, kind: 'ring' }); }

    updateFx(dt) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i];
        p.life -= dt;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        if (p.vx !== undefined) { p.x += p.vx * dt; p.y += p.vy * dt; if (p.g) p.vy += p.g * dt; }
      }
      if (this.parts.length > 600) this.parts.splice(0, this.parts.length - 600);
      for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y -= 34 * dt; if (t.life <= 0) this.texts.splice(i, 1); }
      if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
      if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 30);
      if (this.flashScreen) { this.flashScreen.t -= dt; if (this.flashScreen.t <= 0) this.flashScreen = null; }
      if (this.bolts) { this.bolts.forEach(b => b.t -= dt); this.bolts = this.bolts.filter(b => b.t > 0); }
      // ambient weather
      const fx = this.theme.fx;
      if (this.ambient.length < 45 && Math.random() < dt * 20) {
        const W = this.W;
        const a = { x: rand(0, W), y: rand(-10, 300), life: 6, t: rand(0, 6) };
        if (fx === 'snow') Object.assign(a, { vx: rand(-20, -5), vy: rand(30, 60), size: rand(1.5, 3.5), color: '#ffffff' });
        else if (fx === 'petal') Object.assign(a, { vx: rand(-40, -15), vy: rand(15, 35), size: rand(2, 3.5), color: pick(['#ffc0d8', '#ffffff', '#ffe8a0']) });
        else if (fx === 'sand') Object.assign(a, { x: W + 10, y: rand(260, 640), vx: rand(-260, -160), vy: rand(-5, 5), size: 1.5, color: 'rgba(240,210,150,0.7)', streak: true });
        else if (fx === 'firefly') Object.assign(a, { y: rand(280, 640), vx: rand(-10, 10), vy: rand(-10, 10), size: 2.5, color: '#e6ff8a', glow: true });
        else if (fx === 'ember') Object.assign(a, { y: rand(400, 720), vx: rand(-10, 10), vy: rand(-60, -25), size: rand(1.5, 3), color: pick(['#ffb030', '#ff6a1a']), glow: true });
        else Object.assign(a, { vx: rand(-15, 5), vy: rand(15, 30), size: rand(1.5, 3), color: 'rgba(190,180,210,0.7)' });
        this.ambient.push(a);
      }
      for (let i = this.ambient.length - 1; i >= 0; i--) {
        const a = this.ambient[i];
        a.t += dt; a.life -= dt;
        a.x += (a.vx + Math.sin(a.t * 2) * 12) * dt; a.y += a.vy * dt;
        if (a.life <= 0 || a.y > 730 || a.x < -20) this.ambient.splice(i, 1);
      }
    }

    /* ---------------- rendering ---------------- */
    render(ctx) {
      const t = this.time;
      ctx.save();
      if (this.shake > 0) ctx.translate(rand(-1, 1) * this.shake, rand(-1, 1) * this.shake * 0.6);
      ctx.drawImage(this.bg, 0, 0);
      // lane highlight
      if (this.state === 'play') {
        const hl = this.armedSpell ? null : (this.selected ? null : this.spawnLane);
        if (hl != null) { ctx.fillStyle = 'rgba(255,240,150,0.07)'; ctx.fillRect(CX, LY[hl] - 36, this.W - CX, 72); }
        if (this.armedSpell || this.selected) {
          const pulse = 0.08 + Math.sin(t * 6) * 0.04;
          LY.forEach(ly => { ctx.fillStyle = this.armedSpell ? 'rgba(255,120,80,' + pulse + ')' : 'rgba(150,220,255,' + pulse + ')'; ctx.fillRect(CX, ly - 36, this.W - CX, 72); });
        }
      }
      A.gags(ctx, this.W, t, this.region.id, this.kind === 'siege');
      A.mine(ctx, MINE.x, MINE.y, t);
      if (this.kind === 'siege') A.fortress(ctx, this.fortX, t, Math.max(0, this.fortHp) / this.fortMax);
      A.castle(ctx, t, this.castleHp / this.castleMax, this.spawnLane, this.towerLvl, false);
      // diggers behind units
      for (const d of this.diggers) {
        ctx.save(); ctx.translate(d.x, d.y);
        ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        if (d.face < 0) ctx.scale(-1, 1);
        A.humanoid(ctx, d.look, { t: t, walk: d.walk, moving: d.state !== 'dig', atk: 0, dig: d.state === 'dig' });
        if (d.bubble) { ctx.restore(); A.bubble(ctx, d.x, d.y - 80, d.bubble.text, Math.min(1, d.bubble.t * 3)); ctx.save(); ctx.translate(d.x, d.y); }
        if (d.carry) { ctx.fillStyle = '#c8a060'; ctx.strokeStyle = 'rgba(28,18,10,0.85)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-10, -46, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe05a'; ctx.fillRect(-12, -54, 4, 4); }
        ctx.restore();
      }
      // units sorted by y
      const list = this.units.slice().sort((a, b) => a.y - b.y);
      for (const u of list) this.drawUnit(ctx, u, t);
      // projectiles
      for (const p of this.projs) if (!(p.delay > 0)) A.projectile(ctx, p, t);
      // particles
      for (const p of this.parts) {
        const a = Math.max(0, p.life / p.max);
        if (p.kind === 'ring') {
          ctx.globalAlpha = a; ctx.strokeStyle = p.color; ctx.lineWidth = 4 * a + 1;
          ctx.beginPath(); ctx.ellipse(p.x, p.y, p.r * (1.1 - a * 0.6), p.r * (1.1 - a * 0.6) * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
        } else {
          ctx.globalAlpha = p.kind === 'smoke' ? a * 0.7 : a;
          ctx.fillStyle = p.color;
          const sz = p.kind === 'fire' ? p.size * (0.4 + a) : p.size;
          ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      // lightning
      if (this.bolts) for (const b of this.bolts) {
        ctx.strokeStyle = '#fffbd0'; ctx.lineWidth = 4; ctx.shadowColor = '#fff7a0'; ctx.shadowBlur = 16;
        ctx.beginPath(); let x = b.x + rand(-30, 30), y = 0; ctx.moveTo(x, y);
        while (y < b.y - 20) { y += rand(30, 60); x += rand(-25, 25); ctx.lineTo(x, Math.min(y, b.y - 20)); }
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      // gems
      for (const g of this.gems) { ctx.globalAlpha = g.life < 2 ? (Math.sin(g.t * 20) > 0 ? 1 : 0.4) : 1; A.gem(ctx, g.x, g.y, g.t, g.color); }
      ctx.globalAlpha = 1;
      // ambient
      for (const a of this.ambient) {
        ctx.fillStyle = a.color;
        if (a.streak) ctx.fillRect(a.x, a.y, 14, a.size);
        else if (a.glow) { ctx.globalAlpha = 0.5 + Math.sin(a.t * 5) * 0.5; ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
        else { ctx.beginPath(); ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2); ctx.fill(); }
      }
      // impact words
      for (const pw of this.pows) A.pow(ctx, pw.x, pw.y, pw.text, pw.k * (0.8 + Math.min(0.4, (0.6 - pw.t) * 3)), pw.color);
      // speech bubbles
      for (const u of this.units) if (u.bubble && !u.dead) A.bubble(ctx, u.x, u.y - u.h - 12, u.bubble.text, Math.min(1, u.bubble.t * 3));
      for (const u of this.units) if (u.sleepy > 0 && u.stun > 0 && !u.dead) { ctx.fillStyle = '#fff'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('z Z', u.x + 12, u.y - u.h - 4 - (t * 20 % 12)); }
      // floating text
      ctx.textAlign = 'center'; ctx.font = 'bold 22px "Trebuchet MS", sans-serif'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      for (const tx of this.texts) {
        ctx.globalAlpha = Math.min(1, tx.life / tx.max * 2);
        ctx.strokeText(tx.text, tx.x, tx.y); ctx.fillStyle = tx.color; ctx.fillText(tx.text, tx.x, tx.y);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      if (this.flashScreen) { ctx.fillStyle = this.flashScreen.c + (this.flashScreen.t) + ')'; ctx.fillRect(0, 0, this.W, G.H); }
      if (this.slides) this.drawSlides(ctx, this.slides);
      if (this.form) { ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, this.W, G.H); }
      // banner
      if (this.banner) {
        const b = this.banner, a = Math.min(1, b.t * 2, (2.4 - b.t) * 4);
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
        ctx.font = 'bold 64px "Trebuchet MS", sans-serif';
        ctx.lineWidth = 10; ctx.strokeStyle = 'rgba(20,10,0,0.8)'; ctx.strokeText(b.text, this.W / 2, 220);
        ctx.fillStyle = b.color; ctx.fillText(b.text, this.W / 2, 220);
        ctx.restore();
      }
    }

    drawSlides(ctx, s) {
      const a = Math.min(1, s.t * 3, (3.6 - s.t) * 4);
      const w = 520, h = 300, x = this.W / 2 - w / 2, y = 120;
      ctx.save(); ctx.globalAlpha = a;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 10, y + 12, w, h);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = '#2a4ab0'; ctx.fillRect(x, y, w, 56);
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 30px "Trebuchet MS", sans-serif'; ctx.textAlign = 'left'; ctx.fillText(s.title, x + 20, y + 39);
      ctx.fillStyle = '#1a1a1a'; ctx.font = '22px "Trebuchet MS", sans-serif';
      s.bullets.forEach((b, i) => ctx.fillText('• ' + b, x + 24, y + 100 + i * 38));
      const bars = [40, 70, 55, 120];
      bars.forEach((bh, i) => { ctx.fillStyle = ['#e83a3a', '#ffc62a', '#5ad85a', '#4a8aff'][i]; ctx.fillRect(x + 360 + i * 32, y + 260 - bh, 24, bh); });
      ctx.fillStyle = '#888'; ctx.font = '14px sans-serif'; ctx.fillText('Slide ' + (2 + Math.floor((3.6 - s.t) * 3)) + ' of 247', x + 20, y + h - 14);
      ctx.restore();
    }

    drawUnit(ctx, u, t) {
      ctx.save();
      ctx.translate(u.x + (u.hurt > 0 ? rand(-1.5, 1.5) : 0), u.y);
      if (u.dead) ctx.globalAlpha = Math.max(0, u.deathT / 0.5);
      const big = u.boss ? 2.4 : u.type === 'titan' ? 1.8 : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(0, 0, 18 * big, 5 * big, 0, 0, Math.PI * 2); ctx.fill();
      if (u.side === 0 && this.selected === u.type && !u.dead) {
        ctx.strokeStyle = '#7fe0ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, 22 * big, 7 * big, 0, 0, Math.PI * 2); ctx.stroke();
      }
      if (u.burrowed) {
        ctx.fillStyle = '#c8a060'; ctx.beginPath(); ctx.ellipse(0, 0, 50, 10 + Math.sin(t * 20) * 3, 0, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); return;
      }
      const flip = u.side === 1 ? -1 : (u.facing || 1);
      if (flip < 0) ctx.scale(-1, 1);
      if (u.invuln > 0 && !u.dead) {
        ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(t * 12) * 0.15; ctx.fillStyle = '#ffe9a0';
        ctx.beginPath(); ctx.ellipse(0, -u.h * 0.45, 28 * big, u.h * 0.6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      const frozen = u.frozen > 0;
      A.drawLook(ctx, u.chicken > 0 ? CHICKEN_LOOK : u.look, { t: frozen ? 0 : t + u.id, walk: u.walk, moving: u.moving && !frozen, atk: u.atkT, breath: u.breathT > 0 ? 1 : 0, burrowed: u.burrowed });
      if (frozen) {
        ctx.fillStyle = 'rgba(170,230,255,0.45)'; ctx.strokeStyle = 'rgba(230,250,255,0.9)'; ctx.lineWidth = 2;
        A.rr(ctx, -20 * big, -u.h, 40 * big, u.h + 4, 6); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
      if (u.dead) return;
      if (u.stun > 0) {
        for (let i = 0; i < 3; i++) { const a = t * 6 + i * 2.1; ctx.fillStyle = '#ffe040'; ctx.beginPath(); ctx.arc(u.x + Math.cos(a) * 14, u.y - u.h - 8 + Math.sin(a) * 4, 3, 0, Math.PI * 2); ctx.fill(); }
      }
      // health bar
      if (u.hp < u.maxHp || (u.side === 0 && this.selected === u.type)) {
        const w = u.boss ? 0 : (u.type === 'titan' ? 56 : 38);
        if (w) {
          const x = u.x - w / 2, y = u.y - u.h - 14;
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 1, y - 1, w + 2, 7);
          ctx.fillStyle = u.side === 0 ? '#5ee05a' : '#ff5a4a'; ctx.fillRect(x, y, w * Math.max(0, u.hp / u.maxHp), 5);
          if (u.side === 0 && u.tier > 1) { ctx.fillStyle = G.TIER_ARMOR[u.tier - 1]; for (let i = 0; i < u.tier; i++) ctx.fillRect(x + i * 6, y - 6, 4, 4); }
        }
      }
    }
  }

  G.Battle = Battle;
})();
