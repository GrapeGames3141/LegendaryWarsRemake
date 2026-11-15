/* Gemfall Legions - menus, HUD and screens (DOM overlay) */
(function () {
  'use strict';
  const U = G.ui = {};
  const root = () => document.getElementById('ui');
  const A = G.art;
  const fmt = n => n >= 10000 ? (n / 1000).toFixed(1) + 'k' : String(Math.floor(n));
  const KIND_ICON = { defend: '🛡️', siege: '🏰', boss: '💀' };
  const KIND_TEXT = { defend: 'Defend the castle: survive every wave.', siege: 'Siege: destroy the enemy fortress on the right.', boss: 'Boss battle: defeat the champion of this land.' };
  let screen = 'title';
  let mapRegion = 0;
  let barracksSel = 'squire';
  let pending = null; // level config being prepared
  let hud = null;

  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }
  function show(html, name) {
    const r = root();
    r.innerHTML = '';
    const node = el(html);
    r.appendChild(node);
    screen = name;
    return node;
  }
  function on(node, sel, fn) { node.querySelectorAll(sel).forEach(n => n.addEventListener('click', e => { G.audio.init(); G.audio.play('click'); fn(n, e); })); }
  function unitPortrait(id, tier, px) { return A.portrait('u-' + id + '-' + tier, A.unitLook(id, tier), px || 96); }
  function enemyPortrait(id, px) { return A.portrait('e-' + id, G.ENEMIES[id].look, px || 80, { flip: true }); }
  function currencies() {
    const d = G.save.data;
    return '<div class="cur"><span class="coin">🪙 ' + fmt(d.gold) + '</span><span class="shard">💎 ' + d.shards + '</span></div>';
  }
  function modal(html, cls) {
    const m = el('<div class="modal-back"><div class="modal ' + (cls || '') + '">' + html + '</div></div>');
    root().appendChild(m);
    return m;
  }
  U.toast = function (text) {
    const t = el('<div class="toast">' + text + '</div>');
    root().appendChild(t);
    setTimeout(() => t.classList.add('out'), 1600);
    setTimeout(() => t.remove(), 2100);
  };

  /* ---------------- title ---------------- */
  U.title = function () {
    G.setMenuScene(0);
    G.audio.music('menu');
    const d = G.save.data;
    const n = show(
      '<div class="screen title">' +
      '<div class="logo"><div class="gemicon"></div>Gemfall<span>Legions</span></div>' +
      '<div class="menu-col">' +
      '<button class="btn big gold" data-a="play">⚔️ Campaign</button>' +
      '<button class="btn" data-a="endless">♾️ Endless Siege' + (G.save.endlessUnlocked() ? '' : ' <small>🔒 clear Meadowmarch</small>') + '</button>' +
      '<button class="btn" data-a="barracks">🛡️ Barracks</button>' +
      '<button class="btn" data-a="settings">⚙️ Settings</button>' +
      '</div>' +
      '<div class="tagline">Free forever · No ads · No in-app purchases · Everything is earned by playing</div>' +
      '<div class="tapstart">' + (d.stats.played ? '' : 'Tip: dig gold, summon troops, hold three lanes!') + '</div>' +
      '</div>', 'title');
    on(n, '[data-a=play]', () => U.map());
    on(n, '[data-a=endless]', () => { if (G.save.endlessUnlocked()) U.lineup({ mode: 'endless', diff: 0 }); else U.toast('Clear the Meadowmarch boss to unlock Endless Siege'); });
    on(n, '[data-a=barracks]', () => U.barracks('title'));
    on(n, '[data-a=settings]', () => U.settings());
  };

  /* ---------------- world map ---------------- */
  U.map = function () {
    const d = G.save.data;
    let di = G.DIFFICULTIES.findIndex(x => x.id === d.difficulty);
    if (di < 0 || !G.save.isDiffUnlocked(di)) di = 0;
    const diff = G.DIFFICULTIES[di];
    const prog = d.progress[diff.id];
    const maxRegion = Math.min(G.REGIONS.length - 1, Math.floor((prog + 1) / G.LEVELS_PER_REGION));
    if (mapRegion > maxRegion) mapRegion = maxRegion;
    G.setMenuScene(mapRegion);
    G.audio.music('menu');
    let tabs = '';
    G.REGIONS.forEach((r, i) => {
      const locked = i > maxRegion;
      tabs += '<button class="rtab' + (i === mapRegion ? ' on' : '') + (locked ? ' locked' : '') + '" data-r="' + i + '">' + (locked ? '🔒 ' : '') + r.name + '</button>';
    });
    let diffs = '';
    G.DIFFICULTIES.forEach((x, i) => {
      const ok = G.save.isDiffUnlocked(i);
      diffs += '<button class="dtab' + (i === di ? ' on' : '') + (ok ? '' : ' locked') + '" style="--dc:' + x.color + '" data-d="' + i + '">' + (ok ? '' : '🔒 ') + x.name + '</button>';
    });
    let nodes = '';
    for (let s = 0; s < G.LEVELS_PER_REGION; s++) {
      const idx = mapRegion * G.LEVELS_PER_REGION + s;
      const kind = G.LEVEL_KINDS[s];
      const avail = G.save.levelAvailable(diff.id, idx);
      const done = prog >= idx;
      nodes += '<button class="lnode ' + kind + (avail ? '' : ' locked') + (done ? ' done' : '') + (avail && !done ? ' next' : '') + '" data-l="' + idx + '">' +
        '<div class="lnum">' + (mapRegion + 1) + '-' + (s + 1) + '</div>' +
        '<div class="licon">' + (avail ? KIND_ICON[kind] : '🔒') + '</div>' +
        '<div class="lname">' + G.LEVEL_NAMES[mapRegion][s] + '</div>' +
        '<div class="lstar">' + (done ? '★' : '☆') + '</div></button>';
    }
    const n = show(
      '<div class="screen map">' +
      '<div class="topbar"><button class="btn small" data-a="back">◀ Back</button><div class="ttl">' + G.REGIONS[mapRegion].name + '</div>' + currencies() + '</div>' +
      '<div class="dtabs">' + diffs + '</div>' +
      '<div class="rtabs">' + tabs + '</div>' +
      '<div class="lnodes">' + nodes + '</div>' +
      '<div class="bottombar"><button class="btn" data-a="barracks">🛡️ Barracks</button><button class="btn" data-a="armory">🏰 Armory</button>' +
      '<button class="btn" data-a="endless">♾️ Endless</button></div>' +
      '</div>', 'map');
    on(n, '[data-a=back]', () => U.title());
    on(n, '[data-a=barracks]', () => U.barracks('map'));
    on(n, '[data-a=armory]', () => U.armory('map'));
    on(n, '[data-a=endless]', () => { if (G.save.endlessUnlocked()) U.lineup({ mode: 'endless', diff: 0 }); else U.toast('Clear the Meadowmarch boss to unlock Endless Siege'); });
    on(n, '.rtab', b => { const r = +b.dataset.r; if (r <= maxRegion) { mapRegion = r; U.map(); } else U.toast('Defeat the previous region\'s boss first'); });
    on(n, '.dtab', b => { const i = +b.dataset.d; if (G.save.isDiffUnlocked(i)) { d.difficulty = G.DIFFICULTIES[i].id; G.save.write(); U.map(); } else U.toast('Finish the whole campaign on ' + G.DIFFICULTIES[i - 1].name + ' to unlock'); });
    on(n, '.lnode', b => {
      const idx = +b.dataset.l;
      if (!G.save.levelAvailable(diff.id, idx)) { U.toast('Clear the previous level first'); return; }
      const cfg = { mode: 'campaign', idx: idx, diff: di };
      const r = Math.floor(idx / G.LEVELS_PER_REGION);
      if (!d.seenIntro[r]) { d.seenIntro[r] = true; G.save.write(); U.story(G.REGIONS[r].name, G.REGIONS[r].intro, () => U.lineup(cfg)); }
      else U.lineup(cfg);
    });
  };

  U.story = function (title, text, next) {
    const m = modal('<h2>' + title + '</h2><p class="story">' + text + '</p><button class="btn gold" data-a="ok">Onward!</button>', 'storym');
    on(m, '[data-a=ok]', () => { m.remove(); next && next(); });
  };

  /* ---------------- lineup ---------------- */
  U.lineup = function (cfg) {
    pending = cfg;
    const d = G.save.data;
    const unlocked = G.UNIT_ORDER.filter(id => id !== 'digger' && G.save.isUnitUnlocked(id));
    d.lineup = d.lineup.filter(id => unlocked.includes(id));
    if (!d.lineup.length) d.lineup = unlocked.slice(0, 6);
    let title, desc, pool;
    if (cfg.mode === 'endless') {
      title = 'Endless Siege'; desc = 'Waves never stop and grow stronger, marching through every land. Bosses every 10 waves. Earn gold and shards for each wave survived. Best: wave ' + d.endlessBest + '.';
      pool = [].concat.apply([], G.REGIONS.map(r => r.pool)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);
    } else {
      const r = Math.floor(cfg.idx / G.LEVELS_PER_REGION), s = cfg.idx % G.LEVELS_PER_REGION;
      const kind = G.LEVEL_KINDS[s];
      title = (r + 1) + '-' + (s + 1) + ' ' + G.LEVEL_NAMES[r][s] + ' <small style="color:' + G.DIFFICULTIES[cfg.diff].color + '">' + G.DIFFICULTIES[cfg.diff].name + '</small>';
      desc = KIND_ICON[kind] + ' ' + KIND_TEXT[kind];
      const reg = G.REGIONS[r];
      pool = reg.pool.slice(0, s === 0 ? 2 : s === 1 ? 3 : reg.pool.length);
      if (kind === 'boss') pool = pool.concat([reg.boss]);
    }
    let foes = pool.map(id => '<div class="foe"><img src="' + enemyPortrait(id, 72) + '"><span>' + G.ENEMIES[id].name + '</span></div>').join('');
    let cards = '';
    G.UNIT_ORDER.forEach(id => {
      if (id === 'digger') return;
      const ok = unlocked.includes(id);
      const st = d.units[id];
      const on = d.lineup.includes(id);
      cards += '<button class="pick' + (on ? ' on' : '') + (ok ? '' : ' locked') + '" data-u="' + id + '">' +
        (ok ? '<img src="' + unitPortrait(id, st.tier, 96) + '"><div class="pn">' + G.UNITS[id].tiers[st.tier - 1] + '</div><div class="pt">Tier ' + G.TIER_NAMES[st.tier - 1] + ' · Lv ' + st.level + '</div>'
          : '<div class="lockbig">🔒</div><div class="pn">' + G.UNITS[id].name + '</div><div class="pt">Clear level ' + G.UNITS[id].unlock + '</div>') +
        '</button>';
    });
    const n = show(
      '<div class="screen lineup">' +
      '<div class="topbar"><button class="btn small" data-a="back">◀ Back</button><div class="ttl">' + title + '</div>' + currencies() + '</div>' +
      '<div class="lineup-body">' +
      '<div class="brief"><p>' + desc + '</p><h4>Enemies sighted</h4><div class="foes">' + foes + '</div></div>' +
      '<div class="army"><h4>Choose your army <span id="lcount"></span></h4><div class="picks">' + cards + '</div></div>' +
      '</div>' +
      '<div class="bottombar"><button class="btn" data-a="barracks">🛡️ Barracks</button><button class="btn" data-a="armory">🏰 Armory</button><button class="btn big gold" data-a="go">⚔️ To Battle!</button></div>' +
      '</div>', 'lineup');
    const upd = () => { n.querySelector('#lcount').textContent = '(' + d.lineup.length + ' / 6)'; };
    upd();
    on(n, '[data-a=back]', () => U.map());
    on(n, '[data-a=barracks]', () => U.barracks('lineup'));
    on(n, '[data-a=armory]', () => U.armory('lineup'));
    on(n, '.pick', b => {
      const id = b.dataset.u;
      if (!unlocked.includes(id)) { U.toast('Unlocks after clearing ' + G.UNITS[id].unlock + ' campaign levels'); return; }
      const i = d.lineup.indexOf(id);
      if (i >= 0) { d.lineup.splice(i, 1); b.classList.remove('on'); }
      else if (d.lineup.length < 6) { d.lineup.push(id); b.classList.add('on'); }
      else U.toast('Up to 6 unit types per battle');
      G.save.write(); upd();
    });
    on(n, '[data-a=go]', () => {
      if (!d.lineup.length) { U.toast('Pick at least one unit'); return; }
      d.lineup.sort((a, b) => G.UNIT_ORDER.indexOf(a) - G.UNIT_ORDER.indexOf(b));
      G.save.write();
      U.startBattle(Object.assign({}, cfg, { lineup: d.lineup.slice() }));
    });
  };

  /* ---------------- barracks ---------------- */
  U.barracks = function (from) {
    const d = G.save.data;
    const id = barracksSel;
    const def = G.UNITS[id];
    const st = d.units[id];
    const ok = G.save.isUnitUnlocked(id);
    let list = '';
    G.UNIT_ORDER.forEach(u => {
      const unl = G.save.isUnitUnlocked(u);
      list += '<button class="bunit' + (u === id ? ' on' : '') + (unl ? '' : ' locked') + '" data-u="' + u + '"><img src="' + unitPortrait(u, d.units[u].tier, 80) + '"><span>' + (unl ? G.UNITS[u].name : '🔒') + '</span></button>';
    });
    const cap = G.levelCap(st.tier);
    const lvlCost = G.levelCost(st.level);
    const tierCost = st.tier < 5 ? G.TIER_SHARDS[st.tier] : 0;
    let stats = '';
    if (id === 'digger') {
      const y = Math.round(16 * (1 + 0.12 * d.upgrades.yield) * (1 + 0.18 * (st.tier - 1)));
      stats = row('Gold per trip', y) + row('Dig time', (1.8 * (1 - 0.08 * (st.tier - 1))).toFixed(2) + 's') + row('Cost', def.cost) + row('Max diggers', 3 + d.upgrades.miners);
    } else {
      const tm = G.TIER_MULT[st.tier - 1] * (1 + 0.07 * (st.level - 1));
      stats = row('Health', Math.round(def.hp * tm)) + row(def.heal ? 'Heal' : 'Attack', Math.round((def.heal || def.atk) * tm)) +
        row('Range', def.range < 100 ? 'Melee' : def.range + (st.tier - 1) * 8) + row('Armor', Math.round(((def.armor || 0) + (st.tier - 1) * 0.02) * 100) + '%') +
        row('Crit', st.tier >= 3 ? Math.round((0.08 + (st.tier - 3) * 0.04) * 100) + '%' : '—') + row('Cost / cooldown', def.cost + ' / ' + def.cd + 's');
    }
    function row(k, v) { return '<div class="srow"><span>' + k + '</span><b>' + v + '</b></div>'; }
    let tiers = '';
    for (let t = 1; t <= 5; t++) tiers += '<div class="tierp' + (t <= st.tier ? ' have' : '') + (t === st.tier ? ' cur' : '') + '"><img src="' + unitPortrait(id, t, 72) + '"><span>' + G.TIER_NAMES[t - 1] + '</span></div>';
    const lvlUnlocked = id !== 'digger';
    const n = show(
      '<div class="screen barracks">' +
      '<div class="topbar"><button class="btn small" data-a="back">◀ Back</button><div class="ttl">Barracks</div>' + currencies() + '</div>' +
      '<div class="bbody">' +
      '<div class="blist">' + list + '</div>' +
      '<div class="bdetail">' +
      '<div class="bhead"><img class="bigp" src="' + unitPortrait(id, st.tier, 160) + '"><div><h2>' + def.tiers[st.tier - 1] + '</h2><div class="role">' + def.role + ' · Tier ' + G.TIER_NAMES[st.tier - 1] + (lvlUnlocked ? ' · Level ' + st.level + '/' + cap : '') + '</div><p>' + def.desc + '</p>' +
      (def.special ? '<p class="spec">✨ <b>' + def.special.name + '</b> (' + def.special.cost + ' valor): ' + def.special.desc + '</p>' : '') + '</div></div>' +
      '<div class="stats">' + stats + '</div>' +
      '<div class="tiers">' + tiers + '</div>' +
      (ok ? '<div class="bbtns">' +
        (lvlUnlocked ? (st.level < cap ? '<button class="btn" data-a="train">⬆ Train to Lv ' + (st.level + 1) + ' · 🪙 ' + lvlCost + '</button>' : '<button class="btn" disabled>Level cap for this tier</button>') : '') +
        (st.tier < 5 ? '<button class="btn gold" data-a="tier">⭐ Ascend to ' + def.tiers[st.tier] + ' · 💎 ' + tierCost + '</button>' : '<button class="btn" disabled>Max tier reached</button>') +
        '</div>' : '<div class="bbtns"><div class="lockmsg">🔒 Unlocks after clearing ' + def.unlock + ' campaign levels</div></div>') +
      '</div></div></div>', 'barracks');
    n._from = from;
    on(n, '[data-a=back]', () => back(from));
    on(n, '.bunit', b => { barracksSel = b.dataset.u; U.barracks(from); });
    on(n, '[data-a=train]', () => {
      if (d.gold < lvlCost) { U.toast('Not enough gold. Replay levels to earn more!'); return; }
      d.gold -= lvlCost; st.level++; G.save.write(); G.audio.play('upgrade'); U.barracks(from);
    });
    on(n, '[data-a=tier]', () => {
      if (d.shards < tierCost) { U.toast('Not enough star shards. Clear new levels and higher difficulties!'); return; }
      d.shards -= tierCost; st.tier++; G.save.write(); G.audio.play('upgrade'); U.toast(def.tiers[st.tier - 1] + ' unlocked!'); U.barracks(from);
    });
  };

  /* ---------------- armory ---------------- */
  U.armory = function (from) {
    const d = G.save.data;
    let ups = '';
    G.UPGRADES.forEach(u => {
      const l = d.upgrades[u.id];
      const max = l >= u.max;
      const cost = max ? 0 : u.cost(l);
      ups += '<div class="ucard"><div class="uicon">' + u.icon + '</div><div class="uinfo"><b>' + u.name + '</b><small>' + u.desc + '</small><div class="pips">' + '●'.repeat(l) + '<i>' + '○'.repeat(u.max - l) + '</i></div></div>' +
        '<button class="btn small' + (u.cur === 'shards' ? ' gold' : '') + '" data-up="' + u.id + '"' + (max ? ' disabled' : '') + '>' + (max ? 'MAX' : (u.cur === 'gold' ? '🪙 ' : '💎 ') + cost) + '</button></div>';
    });
    let spells = '';
    G.SPELL_ORDER.forEach(id => {
      const s = G.SPELLS[id], l = d.spells[id];
      const unl = G.save.isSpellUnlocked(id);
      let btn;
      if (!unl) btn = '<button class="btn small" disabled>🔒 Lv ' + s.unlock + '</button>';
      else if (l === 0) btn = '<button class="btn small gold" data-sp="' + id + '">Learn 💎 ' + s.learn + '</button>';
      else if (l >= G.SPELL_MAX) btn = '<button class="btn small" disabled>MAX</button>';
      else btn = '<button class="btn small" data-sp="' + id + '">🪙 ' + s.lvlCost(l) + '</button>';
      spells += '<div class="ucard"><div class="uicon">' + s.icon + '</div><div class="uinfo"><b>' + s.name + (l ? ' · Lv ' + l : '') + '</b><small>' + s.desc + ' Cooldown ' + s.cd + 's.</small></div>' + btn + '</div>';
    });
    const n = show(
      '<div class="screen armory">' +
      '<div class="topbar"><button class="btn small" data-a="back">◀ Back</button><div class="ttl">Armory</div>' + currencies() + '</div>' +
      '<div class="abody"><div><h4>Castle upgrades</h4><div class="ugrid">' + ups + '</div></div><div><h4>Spellbook</h4><div class="ugrid one">' + spells + '</div>' +
      '<p class="note">All upgrades are bought with gold and star shards earned in battle. Replay any level, or try Endless Siege, to earn more. There is nothing to buy with real money.</p></div></div>' +
      '</div>', 'armory');
    on(n, '[data-a=back]', () => back(from));
    on(n, '[data-up]', b => {
      const u = G.UPGRADES.find(x => x.id === b.dataset.up);
      const l = d.upgrades[u.id];
      const cost = u.cost(l);
      const have = u.cur === 'gold' ? d.gold : d.shards;
      if (have < cost) { U.toast(u.cur === 'gold' ? 'Not enough gold' : 'Not enough star shards'); return; }
      if (u.cur === 'gold') d.gold -= cost; else d.shards -= cost;
      d.upgrades[u.id]++; G.save.write(); G.audio.play('upgrade'); U.armory(from);
    });
    on(n, '[data-sp]', b => {
      const id = b.dataset.sp, s = G.SPELLS[id], l = d.spells[id];
      if (l === 0) { if (d.shards < s.learn) { U.toast('Not enough star shards'); return; } d.shards -= s.learn; }
      else { const c = s.lvlCost(l); if (d.gold < c) { U.toast('Not enough gold'); return; } d.gold -= c; }
      d.spells[id]++; G.save.write(); G.audio.play('upgrade'); U.armory(from);
    });
  };

  function back(from) {
    if (from === 'lineup' && pending) U.lineup(pending);
    else if (from === 'map') U.map();
    else U.title();
  }

  /* ---------------- settings ---------------- */
  U.settings = function (inBattle) {
    const s = G.save.data.settings;
    const m = modal('<h2>Settings</h2>' +
      '<label class="tog"><input type="checkbox" data-k="sfx"' + (s.sfx ? ' checked' : '') + '> Sound effects</label>' +
      '<label class="tog"><input type="checkbox" data-k="music"' + (s.music ? ' checked' : '') + '> Music</label>' +
      '<label class="tog"><input type="checkbox" data-k="lowfx"' + (s.lowfx ? ' checked' : '') + '> Performance mode (fewer glow effects)</label>' +
      (inBattle ? '' : '<button class="btn small danger" data-a="reset">Reset all progress</button>') +
      '<p class="note">Gemfall Legions is an original, fan-made game inspired by classic lane-battle strategy. Free forever: no ads, no purchases, no timers.</p>' +
      '<button class="btn gold" data-a="ok">Done</button>');
    m.querySelectorAll('input').forEach(i => i.addEventListener('change', () => { s[i.dataset.k] = i.checked; G.save.write(); G.audio.init(); G.audio.applySettings(); G.applyQuality(); }));
    on(m, '[data-a=ok]', () => m.remove());
    on(m, '[data-a=reset]', () => {
      const c = modal('<h2>Reset everything?</h2><p>All progress, gold, shards and upgrades will be erased.</p><div class="row"><button class="btn danger" data-a="yes">Erase</button><button class="btn" data-a="no">Cancel</button></div>');
      on(c, '[data-a=yes]', () => { G.save.reset(); c.remove(); m.remove(); U.title(); U.toast('Progress reset'); });
      on(c, '[data-a=no]', () => c.remove());
    });
  };

  /* ---------------- battle ---------------- */
  U.startBattle = function (cfg) {
    pending = cfg;
    G.audio.init();
    G.save.data.stats.played++;
    G.save.write();
    const b = new G.Battle(cfg);
    G.battle = b;
    G.audio.music('battle');
    buildHud(b);
  };

  function buildHud(b) {
    const d = G.save.data;
    let cards = '';
    b.cards.forEach((c, i) => {
      const def = G.UNITS[c.id];
      const tier = d.units[c.id].tier;
      cards += '<div class="ccol">' +
        (def.special ? '<button class="spbtn" data-sp="' + c.id + '">✨' + def.special.cost + '</button>' : '<div class="spbtn ghost"></div>') +
        '<button class="card" data-c="' + i + '"><img src="' + unitPortrait(c.id, tier, 96) + '"><span class="cost">' + def.cost + '</span><div class="cdo"></div>' + (c.id === 'digger' ? '<span class="dcount"></span>' : '') + '</button></div>';
    });
    let spells = '';
    b.spells.forEach(s => { spells += '<button class="spell" data-s="' + s.id + '"><span>' + G.SPELLS[s.id].icon + '</span><div class="cdo"></div></button>'; });
    let title = b.endless ? 'Endless Siege' : G.LEVEL_NAMES[b.regionIdx][b.sub];
    const n = show(
      '<div id="hud">' +
      '<div class="hud-top">' +
      '<div class="hres"><div class="gold">🪙 <b id="h-gold">0</b></div><div class="valor"><div class="vbar"><i id="h-valor"></i></div><span>✨<b id="h-vt">0</b></span></div></div>' +
      '<div class="hcenter"><div class="hlevel">' + title + ' · <span id="h-wave"></span></div>' +
      '<div class="hbar castle"><i id="h-castle"></i><span>🏰 <b id="h-chp"></b></span></div>' +
      '<div class="hbar enemy hidden" id="h-ebarw"><i id="h-ebar"></i><span id="h-ename"></span></div></div>' +
      '<div class="hbtns"><button class="hb" id="h-speed">1×</button><button class="hb" id="h-pause">⏸</button></div>' +
      '</div>' +
      '<div class="selbar hidden" id="h-sel"><span id="h-seltext"></span><button class="hb small" id="h-seldone">✕</button></div>' +
      '<div class="hud-bottom">' +
      '<div class="cmds"><button class="cmd" data-o="advance">▶<small>Advance</small></button><button class="cmd" data-o="hold">✋<small>Hold</small></button><button class="cmd" data-o="retreat">◀<small>Retreat</small></button><button class="cmd on" id="h-form">⚔<small>Formation</small></button></div>' +
      '<div class="cards">' + cards + '</div>' +
      '<div class="spells">' + spells + '</div>' +
      '</div></div>', 'battle');
    const q = s => n.querySelector(s);
    hud = {
      node: n, gold: q('#h-gold'), valor: q('#h-valor'), vt: q('#h-vt'), wave: q('#h-wave'), castle: q('#h-castle'), chp: q('#h-chp'),
      ebarw: q('#h-ebarw'), ebar: q('#h-ebar'), ename: q('#h-ename'), sel: q('#h-sel'), seltext: q('#h-seltext'),
      cards: [...n.querySelectorAll('.card')], cdos: [...n.querySelectorAll('.card .cdo')], sps: [...n.querySelectorAll('.spbtn[data-sp]')], spells: [...n.querySelectorAll('.spell')], cmds: [...n.querySelectorAll('.cmd[data-o]')],
      dcount: q('.dcount'), speed: q('#h-speed'), last: {}
    };
    const press = (sel, fn) => n.querySelectorAll(sel).forEach(x => x.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); G.audio.init(); fn(x); }));
    press('.card', x => { b.summon(+x.dataset.c); x.classList.add('bump'); setTimeout(() => x.classList.remove('bump'), 120); });
    press('.spbtn[data-sp]', x => b.useSpecial(x.dataset.sp));
    press('.spell', x => {
      const s = b.spells.find(z => z.id === x.dataset.s);
      if (!s || s.cd > 0) { G.audio.play('deny'); return; }
      if (s.id === 'arrows') { b.armedSpell = b.armedSpell === 'arrows' ? null : 'arrows'; G.audio.play('click'); }
      else b.castSpell(s.id);
    });
    press('.cmd[data-o]', x => b.command(x.dataset.o));
    press('#h-form', x => { b.formation = !b.formation; x.classList.toggle('on', b.formation); G.audio.play('click'); U.toast(b.formation ? 'Formation on: ranged units stay behind melee' : 'Formation off'); });
    press('#h-seldone', () => { b.selected = null; });
    press('#h-speed', x => { G.speed = G.speed === 1 ? 2 : 1; x.textContent = G.speed + '×'; });
    press('#h-pause', () => U.pause());
    hud.speed.textContent = G.speed + '×';
  }

  function setText(key, node, v) { if (hud.last[key] !== v) { hud.last[key] = v; node.textContent = v; } }
  function setStyle(key, node, prop, v) { if (hud.last[key] !== v) { hud.last[key] = v; node.style[prop] = v; } }
  function setCls(key, node, cls, v) { if (hud.last[key] !== v) { hud.last[key] = v; node.classList.toggle(cls, v); } }

  U.updateHud = function (b) {
    if (!hud || screen !== 'battle') return;
    setText('gold', hud.gold, fmt(b.gold));
    setStyle('valor', hud.valor, 'width', (b.valor / b.valorMax * 100).toFixed(1) + '%');
    setText('vt', hud.vt, Math.floor(b.valor));
    setStyle('castle', hud.castle, 'width', (Math.max(0, b.castleHp) / b.castleMax * 100).toFixed(1) + '%');
    setText('chp', hud.chp, Math.ceil(Math.max(0, b.castleHp)));
    let wt;
    if (b.kind === 'siege') wt = 'Siege';
    else if (b.endless) wt = 'Wave ' + Math.max(1, b.wave);
    else if (b.kind === 'boss' && b.bossSpawned) wt = 'Boss!';
    else wt = 'Wave ' + Math.max(1, b.wave) + '/' + b.totalWaves;
    setText('wave', hud.wave, wt);
    // enemy bar (fortress or boss)
    let er = null, en = '';
    if (b.kind === 'siege') { er = Math.max(0, b.fortHp) / b.fortMax; en = 'Enemy fortress'; }
    const boss = b.units.find(u => u.boss && !u.dead);
    if (boss) { er = boss.hp / boss.maxHp; en = boss.def.name; }
    setCls('ebarw', hud.ebarw, 'hidden', er === null);
    if (er !== null) { setStyle('ebar', hud.ebar, 'width', (er * 100).toFixed(1) + '%'); setText('ename', hud.ename, en); }
    // cards
    b.cards.forEach((c, i) => {
      const node = hud.cards[i];
      const def = G.UNITS[c.id];
      const frac = c.cd > 0 ? c.cd / (c.cdMax || 1) : 0;
      setStyle('cd' + i, hud.cdos[i], 'height', (frac * 100).toFixed(0) + '%');
      const full = c.id === 'digger' && b.diggers.length >= b.maxDiggers;
      setCls('cg' + i, node, 'poor', b.gold < def.cost || full);
    });
    if (hud.dcount) setText('dc', hud.dcount, b.diggers.length + '/' + b.maxDiggers);
    hud.sps.forEach(x => {
      const id = x.dataset.sp, sp = G.UNITS[id].special;
      const ready = b.valor >= sp.cost && b.units.some(u => u.side === 0 && !u.dead && u.type === id);
      setCls('sp' + id, x, 'ready', ready);
    });
    hud.spells.forEach(x => {
      const s = b.spells.find(z => z.id === x.dataset.s);
      setStyle('sc' + s.id, x.querySelector('.cdo'), 'height', (s.cd > 0 ? s.cd / (s.cdMax || 1) * 100 : 0).toFixed(0) + '%');
      setCls('sa' + s.id, x, 'armed', b.armedSpell === s.id);
    });
    // selection
    const selTxt = b.armedSpell ? 'Arrow Storm: tap a lane to fire!' : b.selected ? G.UNITS[b.selected].name + ' selected. Tap a lane to move them, or use the commands.' : '';
    setCls('selh', hud.sel, 'hidden', !selTxt);
    setText('selt', hud.seltext, selTxt);
  };

  U.pause = function () {
    const b = G.battle;
    if (!b || b.state !== 'play') return;
    b.state = 'paused';
    G.audio.play('click');
    const m = modal('<h2>Paused</h2><div class="col"><button class="btn gold" data-a="resume">▶ Resume</button><button class="btn" data-a="settings">⚙️ Settings</button><button class="btn" data-a="restart">↻ Restart</button><button class="btn danger" data-a="quit">✖ Retreat to map</button></div>');
    const close = () => { m.remove(); if (b.state === 'paused') b.state = 'play'; };
    m._close = close;
    U.pauseModal = m;
    on(m, '[data-a=resume]', close);
    on(m, '[data-a=settings]', () => U.settings(true));
    on(m, '[data-a=restart]', () => { m.remove(); U.pauseModal = null; U.startBattle(pending); });
    on(m, '[data-a=quit]', () => { m.remove(); U.pauseModal = null; G.battle = null; pending && pending.mode === 'endless' ? U.title() : U.map(); });
  };

  /* ---------------- battle end & rewards ---------------- */
  U.onBattleEnd = function (r) {
    const b = G.battle;
    const cfg = b.cfg;
    const d = G.save.data;
    const beforeUnits = G.UNIT_ORDER.filter(id => G.save.isUnitUnlocked(id));
    const beforeSpells = G.SPELL_ORDER.filter(id => G.save.isSpellUnlocked(id));
    let gold = 0, shards = 0, first = false, lines = [];
    d.stats.kills += r.kills;
    if (cfg.mode === 'endless') {
      const waves = Math.max(0, r.wave - 1);
      gold = waves * 45 + Math.floor(r.goldEarned * 0.1);
      shards = Math.floor(waves / 5);
      if (waves > d.endlessBest) { d.endlessBest = waves; lines.push('New best: ' + waves + ' waves!'); }
      lines.push('Waves survived: ' + waves);
    } else {
      const diff = G.DIFFICULTIES[cfg.diff];
      if (r.won) {
        first = d.progress[diff.id] < cfg.idx;
        gold = Math.round((80 + cfg.idx * 25) * diff.reward) + Math.floor(r.goldEarned * 0.1);
        shards = first ? diff.shards : 1;
        if (first) d.progress[diff.id] = cfg.idx;
        d.stars[diff.id + ':' + cfg.idx] = true;
        d.stats.wins++;
        if (first) lines.push('First clear bonus!');
      } else {
        gold = Math.round((20 + cfg.idx * 6) * diff.reward);
        lines.push('Your troops fought bravely. Upgrade in the Barracks and try again!');
      }
    }
    d.gold += gold; d.shards += shards;
    const newUnits = G.UNIT_ORDER.filter(id => G.save.isUnitUnlocked(id) && !beforeUnits.includes(id));
    const newSpells = G.SPELL_ORDER.filter(id => G.save.isSpellUnlocked(id) && !beforeSpells.includes(id));
    newUnits.forEach(id => { lines.push('🎉 New unit: <b>' + G.UNITS[id].name + '</b>'); if (d.lineup.length < 6 && !d.lineup.includes(id)) d.lineup.push(id); });
    newSpells.forEach(id => lines.push('📜 New spell available in the Armory: <b>' + G.SPELLS[id].name + '</b>'));
    if (cfg.mode !== 'endless' && r.won && first && cfg.idx === 5) lines.push('♾️ Endless Siege unlocked!');
    const finalWin = cfg.mode !== 'endless' && r.won && first && cfg.idx === G.LEVEL_COUNT - 1;
    if (finalWin && cfg.diff < G.DIFFICULTIES.length - 1) lines.push('🔓 ' + G.DIFFICULTIES[cfg.diff + 1].name + ' difficulty unlocked!');
    G.save.write();
    const hasNext = cfg.mode !== 'endless' && r.won && cfg.idx < G.LEVEL_COUNT - 1;
    const won = r.won || cfg.mode === 'endless';
    const m = modal('<h2 class="' + (r.won ? 'win' : 'lose') + '">' + (cfg.mode === 'endless' ? 'Siege Over' : r.won ? 'Victory!' : 'Defeat') + '</h2>' +
      '<div class="rewards"><div>🪙 +' + gold + '</div>' + (shards ? '<div>💎 +' + shards + '</div>' : '') + '<div>⚔️ ' + r.kills + ' foes</div></div>' +
      lines.map(l => '<p>' + l + '</p>').join('') +
      '<div class="row">' + (hasNext ? '<button class="btn gold" data-a="next">Next level ▶</button>' : '') +
      '<button class="btn" data-a="retry">↻ ' + (won ? 'Replay' : 'Retry') + '</button><button class="btn" data-a="map">' + (cfg.mode === 'endless' ? 'Menu' : 'Map') + '</button><button class="btn" data-a="barracks">🛡️ Barracks</button></div>', 'result');
    G.audio.music('menu');
    const leave = () => { m.remove(); G.battle = null; };
    on(m, '[data-a=next]', () => {
      leave();
      const nidx = cfg.idx + 1;
      const r2 = Math.floor(nidx / G.LEVELS_PER_REGION);
      mapRegion = r2;
      const ncfg = { mode: 'campaign', idx: nidx, diff: cfg.diff };
      if (!d.seenIntro[r2]) { d.seenIntro[r2] = true; G.save.write(); U.story(G.REGIONS[r2].name, G.REGIONS[r2].intro, () => U.lineup(ncfg)); }
      else U.lineup(ncfg);
    });
    on(m, '[data-a=retry]', () => { leave(); U.lineup(cfg); });
    on(m, '[data-a=map]', () => { leave(); cfg.mode === 'endless' ? U.title() : U.map(); });
    on(m, '[data-a=barracks]', () => { leave(); pending = cfg; U.barracks('lineup'); });
    if (finalWin && cfg.diff === 0) {
      U.story('The Hollow King Falls', 'The Hollow Throne crumbles, and the stolen starlight scatters back across the land. Gems glitter in every village mine again, free for all to dig. Your legend is written, Warden... but whispers speak of Heroic foes who would test you further.', null);
    }
  };

  /* Android back button. Returns true if handled. */
  U.back = function () {
    const modals = root().querySelectorAll('.modal-back');
    if (modals.length) {
      const top = modals[modals.length - 1];
      if (top === U.pauseModal) { U.pauseModal._close(); U.pauseModal = null; }
      else if (!top.querySelector('.result')) top.remove();
      return true;
    }
    if (screen === 'battle') { U.pause(); return true; }
    if (screen === 'title') return false;
    if (screen === 'map') { U.title(); return true; }
    if (screen === 'lineup') { pending && pending.mode === 'endless' ? U.title() : U.map(); return true; }
    const s = root().querySelector('.screen');
    back(s && s._from);
    return true;
  };
  U.screen = () => screen;
})();
