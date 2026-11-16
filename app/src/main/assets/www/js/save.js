/* Ridiculous Wars - local save (no accounts, no cloud, no purchases) */
(function () {
  'use strict';
  const KEY = 'ridiculous_wars_save_v1';
  const S = G.save = {};

  function fresh() {
    const units = {};
    G.UNIT_ORDER.forEach(id => { units[id] = { tier: 1, level: 1 }; });
    const upgrades = {};
    G.UPGRADES.forEach(u => { upgrades[u.id] = 0; });
    return {
      version: 1,
      gold: 0,
      shards: 0,
      units: units,
      upgrades: upgrades,
      spells: { arrows: 0, frostnova: 0, thunder: 0 },
      progress: { normal: -1, heroic: -1, mythic: -1 }, // highest cleared level index
      stars: {},          // "diff:idx" -> true
      lineup: ['reginald', 'todd'],
      settings: { sfx: true, music: true, speed2: false, serious: false, lowfx: false },
      achievements: {},
      seenIntro: {},
      endlessBest: 0,
      stats: { kills: 0, wins: 0, played: 0, interns: 0, rebirths: 0, chickens: 0, forms: 0, refused: 0, specials: 0 },
      difficulty: 'normal'
    };
  }

  S.load = function () {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) { d = null; }
    const f = fresh();
    if (!d || d.version !== 1) d = f;
    // merge new fields
    for (const k in f) if (d[k] === undefined) d[k] = f[k];
    G.UNIT_ORDER.forEach(id => { if (!d.units[id]) d.units[id] = { tier: 1, level: 1 }; });
    G.UPGRADES.forEach(u => { if (d.upgrades[u.id] === undefined) d.upgrades[u.id] = 0; });
    S.data = d;
    return d;
  };
  G.achieve = function (id) {
    const d = S.data;
    if (!d || d.achievements[id]) return false;
    const a = G.ACHIEVEMENTS.find(x => x.id === id);
    if (!a) return false;
    d.achievements[id] = Date.now();
    S.write();
    if (G.ui && G.ui.toast) G.ui.toast('🏆 Achievement: <b>' + a.name + '</b>');
    if (G.audio) G.audio.play('upgrade');
    return true;
  };
  S.write = function () {
    try { localStorage.setItem(KEY, JSON.stringify(S.data)); } catch (e) { /* storage full or blocked */ }
  };
  S.reset = function () { S.data = fresh(); S.write(); };

  S.isUnitUnlocked = function (id) {
    return S.data.progress.normal + 1 >= G.UNITS[id].unlock;
  };
  S.isSpellUnlocked = function (id) { return S.data.progress.normal + 1 >= G.SPELLS[id].unlock; };
  S.isDiffUnlocked = function (di) {
    if (di === 0) return true;
    return S.data.progress[G.DIFFICULTIES[di - 1].id] >= G.LEVEL_COUNT - 1;
  };
  S.levelAvailable = function (diffId, idx) { return S.data.progress[diffId] + 1 >= idx; };
  S.endlessUnlocked = function () { return S.data.progress.normal >= 5; };
})();
