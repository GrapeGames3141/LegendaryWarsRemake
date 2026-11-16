/* Ridiculous Wars - bootstrap, render loop, input */
(function () {
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  G.speed = 1;
  let scale = 1, offX = 0, offY = 0, viewW = 1280;
  let menuScene = null;

  function computeViewW() {
    const ar = window.innerWidth / Math.max(1, window.innerHeight);
    return Math.round(Math.max(960, Math.min(1800, 720 * ar)));
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = window.innerWidth, ch = window.innerHeight;
    // cap the backing store so big phones stay fast
    const k = Math.min(dpr, 1100 / ch);
    canvas.width = Math.round(cw * k);
    canvas.height = Math.round(ch * k);
    canvas.style.width = cw + 'px';
    canvas.style.height = ch + 'px';
    G.viewW = viewW = computeViewW();
    const worldW = G.battle ? G.battle.W : (menuScene ? menuScene.W : viewW);
    scale = Math.min(canvas.width / worldW, canvas.height / G.H);
    offX = (canvas.width - worldW * scale) / 2;
    offY = (canvas.height - G.H * scale) / 2;
    document.documentElement.style.setProperty('--u', (ch / 100) + 'px');
    if (menuScene && menuScene.W !== viewW) G.setMenuScene(menuScene.region, true);
  }

  /* Menu backdrop: region scenery with a little parade of troops vs monsters */
  G.setMenuScene = function (region, force) {
    if (menuScene && menuScene.region === region && !force) return;
    const W = computeViewW();
    const r = G.REGIONS[region];
    menuScene = {
      region: region, W: W, t: 0,
      bg: G.art.renderBackground(r.theme, W, G.H, 101 + region * 13),
      walkers: []
    };
    const ally = ['reginald', 'todd', 'brenda', 'wizzle', 'kevin', 'stabby', 'golem', 'phoenix'];
    for (let i = 0; i < 8; i++) {
      const id = ally[i % ally.length];
      menuScene.walkers.push({ look: G.art.unitLook(id, 1 + (i % 5)), x: 190 + i * 70, y: G.LANE_Y[i % 3] + 10, dir: 1, walk: i, sp: 30 + (i % 3) * 8 });
    }
    r.pool.forEach((id, i) => menuScene.walkers.push({ look: G.ENEMIES[id].look, x: W - 120 - i * 80, y: G.LANE_Y[(i + 1) % 3] + 6, dir: -1, walk: i, sp: 26 }));
    resize();
  };

  function drawMenu(dt) {
    const m = menuScene;
    if (!m) return;
    m.t += dt;
    ctx.drawImage(m.bg, 0, 0);
    G.art.mine(ctx, 300, 262, m.t);
    G.art.gags(ctx, m.W, m.t, G.REGIONS[m.region].id, false);
    G.art.castle(ctx, m.t, 1, -1, 0, false);
    const list = m.walkers.slice().sort((a, b) => a.y - b.y);
    for (const w of list) {
      w.walk += dt * 8;
      w.x += w.dir * w.sp * dt;
      if (w.dir > 0 && w.x > m.W + 40) w.x = 140;
      if (w.dir < 0 && w.x < 140) w.x = m.W + 40;
      ctx.save(); ctx.translate(w.x, w.y);
      ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (w.dir < 0) ctx.scale(-1, 1);
      G.art.drawLook(ctx, w.look, { t: m.t + w.walk, walk: w.walk, moving: true, atk: 0 });
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(10,8,20,0.35)';
    ctx.fillRect(0, 0, m.W, G.H);
  }

  /* Performance mode disables shadowBlur glows on the main canvas */
  G.applyQuality = function () {
    const low = G.save.data.settings.lowfx;
    if (low && !ctx.__lowfx) {
      Object.defineProperty(ctx, 'shadowBlur', { configurable: true, get: () => 0, set: () => { } });
      ctx.__lowfx = true;
    } else if (!low && ctx.__lowfx) {
      delete ctx.shadowBlur;
      ctx.__lowfx = false;
    }
  };

  let last = performance.now(), acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#0d0a14';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const b = G.battle;
    const worldW = b ? b.W : menuScene ? menuScene.W : viewW;
    const sc = Math.min(canvas.width / worldW, canvas.height / G.H);
    if (sc !== scale) resize();
    ctx.setTransform(scale, 0, 0, scale, offX, offY);
    if (b) {
      acc += dt * G.speed;
      let n = 0;
      while (acc >= STEP && n < 8) { b.update(STEP); acc -= STEP; n++; }
      if (n >= 8) acc = 0;
      b.render(ctx);
      G.ui.updateHud(b);
    } else {
      drawMenu(dt);
    }
    requestAnimationFrame(frame);
  }

  function toWorld(e) {
    const r = canvas.getBoundingClientRect();
    const k = canvas.width / r.width;
    return { x: ((e.clientX - r.left) * k - offX) / scale, y: ((e.clientY - r.top) * k - offY) / scale };
  }
  canvas.addEventListener('pointerdown', e => {
    G.audio.init();
    if (!G.battle) return;
    const p = toWorld(e);
    G.battle.tap(p.x, p.y);
  });

  // Android hooks
  window.onBack = function () { return G.ui.back(); };
  window.onAppPause = function () { G.audio.suspend(); if (G.battle && G.battle.state === 'play') G.ui.pause(); };
  window.onAppResume = function () { G.audio.resume(); };
  document.addEventListener('visibilitychange', () => { if (document.hidden) window.onAppPause(); else window.onAppResume(); });
  // keyboard (desktop / controller-ish)
  window.addEventListener('keydown', e => {
    const b = G.battle;
    if (e.key === 'Escape') { G.ui.back(); return; }
    if (!b || b.state !== 'play') return;
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 9) b.summon(n - 1);
    if (e.key === 'ArrowUp') b.spawnLane = Math.max(0, b.spawnLane - 1);
    if (e.key === 'ArrowDown') b.spawnLane = Math.min(2, b.spawnLane + 1);
    if (e.key === 'a') b.command('advance');
    if (e.key === 'h') b.command('hold');
    if (e.key === 'r') b.command('retreat');
  });
  document.addEventListener('contextmenu', e => e.preventDefault());

  window.addEventListener('resize', resize);
  G.save.load();
  G.applyQuality();
  G.setMenuScene(0);
  resize();
  G.ui.title();
  requestAnimationFrame(frame);
})();
