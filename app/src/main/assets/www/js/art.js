/* Ridiculous Wars - procedural cartoon art (units, monsters, castles, backgrounds, effects) */
(function () {
  'use strict';
  const A = G.art = {};
  const OUT = 'rgba(20,12,8,0.92)';
  const PI = Math.PI, TAU = PI * 2;

  /* ---------- helpers ---------- */
  const shadeCache = new Map();
  function parse(hex) {
    if (hex[0] !== '#') return null;
    let c = hex.slice(1);
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  }
  function shade(hex, amt) {
    const k = hex + amt;
    let v = shadeCache.get(k);
    if (v) return v;
    const p = parse(hex);
    if (!p) return hex;
    let [r, g, b] = p;
    if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
    v = 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
    shadeCache.set(k, v);
    return v;
  }
  function rgba(hex, a) { const p = parse(hex); return p ? 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')' : hex; }
  A.shade = shade; A.rgba = rgba;
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  A.rr = rr;
  function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); }
  function ell(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, TAU); }
  function fs(ctx, fill, stroke) { ctx.fillStyle = fill; ctx.fill(); if (stroke !== false) { ctx.strokeStyle = stroke || OUT; ctx.stroke(); } }
  const lerp = (a, b, t) => a + (b - a) * t;
  function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; }; }
  A.rng = rng;

  /* ---------- look builders for player units by tier ---------- */
  const RAINBOW = ['#ff4a4a', '#ffa03a', '#ffe03a', '#5ad85a', '#4aa0ff', '#a05aff'];
  A.RAINBOW = RAINBOW;
  A.unitLook = function (type, tier) {
    const base = G.UNITS[type].look;
    const L = Object.assign({}, base);
    const ti = tier - 1;
    L.tier = tier;
    L.trim = G.TIER_TRIM[ti];
    L.tierColor = G.TIER_ARMOR[ti];
    L.metal = tier >= 4 ? '#ffe08a' : tier >= 3 ? '#eef4ff' : '#cfd6de';
    L.size = (base.size || 1) * (1 + ti * 0.04);
    if (tier >= 5) { L.aura = 'rgba(255,120,240,0.3)'; L.weaponGlow = '#ffb8ff'; }
    switch (type) {
      case 'intern':
        L.mugSize = [1, 1.25, 1.5, 1.7, 2][ti];
        L.mugColor = ['#ffffff', '#ffffff', '#4a7aff', '#ffc62a', '#ff5ad8'][ti];
        L.tie = ['#e83a3a', '#e83a3a', '#2a5aa0', '#ffc62a', '#ff5ad8'][ti];
        if (tier >= 3) L.lanyard = true;
        if (tier >= 4) L.armor = ['', '', '', '#3a3a5a', '#2a2a2a'][ti];
        if (tier >= 5) L.sunglasses = true;
        break;
      case 'reginald':
        L.armor = G.TIER_ARMOR[ti];
        if (tier >= 3) { L.cape = '#e83a3a'; L.plume = '#ffffff'; }
        if (tier >= 4) { L.plume = '#ff3a6a'; L.bigPlume = true; L.cape = '#7a1aff'; }
        if (tier >= 5) { L.disco = true; L.cape = '#ff3ad8'; }
        break;
      case 'todd':
        L.armor = ['#6a8a3a', '#4a7a5a', '#8a3ab0', '#ffc62a', '#1a1a1a'][ti];
        L.hoodColor = ['#4a9a3a', '#2a7a6a', '#8a3ab0', '#ffc62a', '#1a1a1a'][ti];
        if (tier >= 3) L.head = 'bardhat';
        if (tier >= 5) { L.sunglasses = true; L.cape = '#ff3ad8'; }
        break;
      case 'brenda':
        L.armor = ['#ffffff', '#f0e8d8', '#c8a080', '#ffc62a', '#ff8ad8'][ti];
        L.apron = ['#2a7a4a', '#2a5aa0', '#5a2a1a', '#b07a00', '#7a2aff'][ti];
        if (tier >= 3) L.espresso = true;
        if (tier >= 5) L.foamCrown = true;
        break;
      case 'stabby':
        L.syringeSize = 1 + ti * 0.28;
        L.tierColor = ['#ff4a6a', '#ff4a6a', '#4a8aff', '#ffc62a', '#ff5ad8'][ti];
        if (tier >= 4) L.cape = '#ff6a8a';
        break;
      case 'wizzle':
        L.hatH = 1 + ti * 0.45;
        L.armor = L.robe = ['#6a3ae0', '#3a5ae0', '#e03a8a', '#e0a020', '#1a1a3a'][ti];
        if (tier >= 5) L.stars = true;
        break;
      case 'swarm':
        L.tie = RAINBOW[ti];
        if (tier >= 4) L.lanyard = true;
        if (tier >= 5) L.sunglasses = true;
        break;
    }
    return L;
  };

  /* ---------- humanoid ---------- */
  function leg(ctx, x, ang, col, boot, bones) {
    ctx.save(); ctx.translate(x, -21); ctx.rotate(ang);
    if (bones) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.stroke();
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 2;
      ctx.fillStyle = col; rr(ctx, -2, 16, 8, 4, 2); ctx.fill();
    } else {
      rr(ctx, -3.6, -1, 7.2, 18, 3); fs(ctx, col);
      rr(ctx, -4.2, 15, 10.5, 6, 2.6); fs(ctx, boot);
    }
    ctx.restore();
  }

  function armAngle(L, a) {
    const p = a.atk || 0, w = L.weapon;
    const idle = Math.sin((a.t || 0) * 2.2) * 0.05;
    if (w === 'bow') return -1.5;
    if (w === 'spear' || w === 'lance') return -1.25;
    if (w === 'staff' || w === 'sling' || w === 'staplergun' || w === 'papers') return p > 0 ? -0.5 - Math.sin(p * PI) * 1.5 : -0.45 + idle;
    if (w === 'fist') return p > 0 ? -0.4 - Math.sin(p * PI) * 1.2 : -0.3 + idle;
    if (w === 'pick') { const d = a.dig ? (Math.sin((a.t || 0) * 9) * 0.5 + 0.5) : 0; return p > 0 ? lerp(-2.8, -0.4, p) : -0.4 - d * 2.2 + idle; }
    if (p <= 0) return -0.45 + idle;
    if (p < 0.35) return lerp(-0.45, -3.05, p / 0.35);
    return lerp(-3.05, -0.25, Math.min(1, (p - 0.35) / 0.3));
  }

  function drawWeapon(ctx, L, a, ang) {
    const w = L.weapon, p = a.atk || 0;
    const metal = L.metal || '#d8dee6';
    const glow = L.weaponGlow;
    ctx.lineWidth = 2;
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 10; }
    switch (w) {
      case 'sword':
        rr(ctx, -2.6, 18, 5.2, 28, 1.5); fs(ctx, metal);
        ctx.beginPath(); ctx.moveTo(-2.6, 46); ctx.lineTo(0, 52); ctx.lineTo(2.6, 46); ctx.closePath(); fs(ctx, metal);
        rr(ctx, -7.5, 15.5, 15, 3.6, 1.5); fs(ctx, L.tier >= 4 ? '#e0ad2e' : '#6a4a2a');
        break;
      case 'scimitar':
        ctx.beginPath(); ctx.moveTo(-2, 18); ctx.quadraticCurveTo(-3, 34, 6, 48); ctx.quadraticCurveTo(4, 32, 3, 18); ctx.closePath(); fs(ctx, metal);
        rr(ctx, -6, 15.5, 12, 3.4, 1.5); fs(ctx, '#c8962a');
        break;
      case 'dagger':
        ctx.beginPath(); ctx.moveTo(-2.2, 18); ctx.lineTo(0, 33); ctx.lineTo(2.2, 18); ctx.closePath(); fs(ctx, metal);
        rr(ctx, -5, 16, 10, 3, 1); fs(ctx, '#5a3a22');
        break;
      case 'club':
        ctx.beginPath(); ctx.moveTo(-2.5, 14); ctx.lineTo(-6.5, 44); ctx.quadraticCurveTo(0, 50, 6.5, 44); ctx.lineTo(2.5, 14); ctx.closePath(); fs(ctx, '#8a5a2a');
        circ(ctx, -3, 36, 1.6); fs(ctx, '#ddd', false); circ(ctx, 3, 41, 1.6); fs(ctx, '#ddd', false);
        break;
      case 'axe':
        rr(ctx, -2, 10, 4, 38, 2); fs(ctx, '#7a4a22');
        ctx.beginPath(); ctx.moveTo(1, 34); ctx.quadraticCurveTo(16, 30, 15, 48); ctx.quadraticCurveTo(8, 44, 1, 46); ctx.closePath(); fs(ctx, metal);
        break;
      case 'hammer':
        rr(ctx, -2, 10, 4, 36, 2); fs(ctx, '#6a4a2a');
        rr(ctx, -9, 40, 18, 11, 2.5); fs(ctx, metal);
        rr(ctx, -9, 43.5, 18, 3, 1); fs(ctx, L.trim || '#666', false);
        break;
      case 'scythe':
        rr(ctx, -2, -6, 4, 56, 2); fs(ctx, '#2a2030');
        ctx.beginPath(); ctx.moveTo(0, 48); ctx.quadraticCurveTo(30, 52, 34, 26); ctx.quadraticCurveTo(24, 44, 2, 42); ctx.closePath(); fs(ctx, '#cbbbe8');
        break;
      case 'pick':
        rr(ctx, -2, 10, 4, 28, 2); fs(ctx, '#8a5a2a');
        ctx.beginPath(); ctx.moveTo(-14, 32); ctx.quadraticCurveTo(0, 40, 14, 32); ctx.lineTo(13, 36); ctx.quadraticCurveTo(0, 44, -13, 36); ctx.closePath(); fs(ctx, metal);
        break;
      case 'fist':
        circ(ctx, 0, 17, 6); fs(ctx, L.armor || L.skin);
        break;
      case 'pencil':
        rr(ctx, -2.5, 14, 5, 26, 1); fs(ctx, '#ffd040');
        ctx.beginPath(); ctx.moveTo(-2.5, 40); ctx.lineTo(0, 47); ctx.lineTo(2.5, 40); ctx.closePath(); fs(ctx, '#f0c8a0');
        rr(ctx, -2.5, 10, 5, 5, 1); fs(ctx, '#ff8aa8');
        break;
      case 'calculator':
        rr(ctx, -6, 14, 12, 18, 2); fs(ctx, '#5a5a6a'); ctx.fillStyle = '#b8f0a0'; ctx.fillRect(-4, 16, 8, 4);
        ctx.fillStyle = '#ddd'; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ctx.fillRect(-4 + i * 3, 22 + j * 4, 2, 2);
        break;
      case 'clipboard':
        rr(ctx, -6, 14, 13, 18, 2); fs(ctx, '#a06a3a'); rr(ctx, -4, 17, 9, 13, 1); fs(ctx, '#ffffff', false);
        ctx.fillStyle = '#9aa'; for (let i = 0; i < 3; i++) ctx.fillRect(-3, 19 + i * 3.5, 7, 1);
        rr(ctx, -2, 12.5, 5, 3, 1); fs(ctx, '#ccc');
        break;
      case 'mug':
        rr(ctx, -5, 16, 10, 12, 2); fs(ctx, '#ffffff'); ctx.beginPath(); ctx.arc(6, 22, 3, -PI / 2, PI / 2); ctx.strokeStyle = OUT; ctx.stroke();
        ctx.fillStyle = '#e83a3a'; ctx.fillRect(-3, 20, 6, 3);
        break;
      case 'briefcase': case 'flamecase':
        rr(ctx, -1.5, 12, 3, 8, 1); fs(ctx, '#3a2a1a');
        rr(ctx, -10, 19, 20, 15, 2); fs(ctx, w === 'flamecase' ? '#2a1a1a' : '#7a4a2a');
        ctx.fillStyle = '#ffd040'; ctx.fillRect(-2, 24, 4, 3);
        if (w === 'flamecase') { ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 12; for (let i = 0; i < 4; i++) { const fl = Math.sin((a.t || 0) * 10 + i) * 3; ctx.beginPath(); ctx.moveTo(-9 + i * 6, 34); ctx.quadraticCurveTo(-11 + i * 6, 42 + fl, -6 + i * 6, 48 + fl); ctx.quadraticCurveTo(-3 + i * 6, 40, -3 + i * 6, 34); ctx.closePath(); ctx.fillStyle = i % 2 ? '#ffd040' : '#ff5a1a'; ctx.fill(); } ctx.shadowBlur = 0; }
        break;
      case 'coffeepot':
        rr(ctx, -2, 10, 4, 22, 2); fs(ctx, '#3a2a1a');
        ctx.beginPath(); ctx.moveTo(-8, 30); ctx.lineTo(8, 30); ctx.lineTo(12, 48); ctx.quadraticCurveTo(0, 54, -12, 48); ctx.closePath(); fs(ctx, 'rgba(220,240,255,0.9)');
        ctx.beginPath(); ctx.moveTo(-10, 40); ctx.lineTo(10, 40); ctx.lineTo(12, 48); ctx.quadraticCurveTo(0, 54, -12, 48); ctx.closePath(); ctx.fillStyle = '#5a2a10'; ctx.fill();
        rr(ctx, -9, 27, 18, 5, 2); fs(ctx, '#2a2a2a');
        break;
      case 'syringe': {
        const k = L.syringeSize || 1;
        ctx.save(); ctx.scale(k, k);
        rr(ctx, -1.5, 8, 3, 8, 1); fs(ctx, '#ccc');
        rr(ctx, -6, 6, 12, 3, 1); fs(ctx, '#ddd');
        rr(ctx, -4, 16, 8, 20, 2); fs(ctx, 'rgba(230,250,255,0.9)');
        ctx.fillStyle = L.tierColor || '#ff4a6a'; ctx.fillRect(-3, 24, 6, 11);
        ctx.beginPath(); ctx.moveTo(-0.8, 36); ctx.lineTo(0, 48); ctx.lineTo(0.8, 36); ctx.closePath(); fs(ctx, '#eee');
        ctx.restore();
        break;
      }
      default: {
        // weapons held upright/horizontal regardless of arm angle
        ctx.save(); ctx.translate(0, 16); ctx.rotate(-ang);
        if (w === 'staff') {
          ctx.rotate(p > 0 ? Math.sin(p * PI) * 0.5 : 0.08);
          rr(ctx, -2, -30, 4, 50, 2); fs(ctx, '#6a4a2a');
          ctx.shadowColor = L.orb || '#fff'; ctx.shadowBlur = 14 + (p > 0 ? 10 : 0);
          circ(ctx, 0, -34, 5.5 + (p > 0 ? Math.sin(p * PI) * 2 : 0)); fs(ctx, L.orb || '#fff');
          ctx.shadowBlur = 0;
          ctx.beginPath(); ctx.moveTo(-5, -28); ctx.quadraticCurveTo(0, -24, 5, -28); ctx.strokeStyle = '#c8962a'; ctx.stroke();
        } else if (w === 'bow') {
          const pull = p > 0 && p < 0.7 ? Math.sin(p / 0.7 * PI * 0.5) * 9 : 0;
          ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(12, 0, 0, 20);
          ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.stroke();
          ctx.strokeStyle = L.tier >= 4 ? '#e0ad2e' : '#8a5a2a'; ctx.lineWidth = 3; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(-pull, 0); ctx.lineTo(0, 20); ctx.strokeStyle = '#eee'; ctx.lineWidth = 1; ctx.stroke();
          if (p > 0 && p < 0.7) { ctx.beginPath(); ctx.moveTo(-pull, 0); ctx.lineTo(18, 0); ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2; ctx.stroke(); }
          ctx.lineWidth = 2;
        } else if (w === 'spear' || w === 'lance') {
          const thrust = p > 0 ? Math.sin(p * PI) * 12 : 0;
          ctx.translate(thrust, 0);
          if (w === 'lance') {
            rr(ctx, -16, -2.5, 40, 5, 2); fs(ctx, '#7a4a22');
            ctx.beginPath(); ctx.moveTo(14, -6); ctx.lineTo(54, 0); ctx.lineTo(14, 6); ctx.closePath(); fs(ctx, L.tierColor || metal);
            ctx.beginPath(); ctx.moveTo(-6, -2); ctx.lineTo(-6, -14); ctx.lineTo(8, -8); ctx.closePath(); fs(ctx, L.trim || '#a22');
          } else {
            rr(ctx, -18, -2, 52, 4, 2); fs(ctx, '#7a5a2a');
            ctx.beginPath(); ctx.moveTo(32, -4.5); ctx.lineTo(44, 0); ctx.lineTo(32, 4.5); ctx.closePath(); fs(ctx, metal);
          }
        } else if (w === 'staplergun') {
          rr(ctx, -6, -8, 22, 8, 3); fs(ctx, '#c82a2a'); rr(ctx, -6, -2, 20, 5, 2); fs(ctx, '#3a3a3a');
        } else if (w === 'papers') {
          ctx.rotate(p > 0 ? Math.sin(p * PI) * 0.4 : 0);
          for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-0.2 + i * 0.15); rr(ctx, -6, -16, 12, 16, 1); fs(ctx, '#ffffff'); ctx.fillStyle = '#9aa'; ctx.fillRect(-4, -13, 8, 1); ctx.fillRect(-4, -10, 8, 1); ctx.restore(); }
        } else if (w === 'sling') {
          const sp = (a.t || 0) * 14;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(sp) * 12, -10 + Math.sin(sp) * 6);
          ctx.strokeStyle = '#6a4a2a'; ctx.stroke();
          circ(ctx, Math.cos(sp) * 12, -10 + Math.sin(sp) * 6, 3); fs(ctx, '#999');
        }
        ctx.restore();
      }
    }
    ctx.shadowBlur = 0;
  }

  function drawHead(ctx, L, a) {
    ctx.save(); ctx.translate(0, -59); ctx.scale(1.32, 1.32); ctx.translate(0, 55);
    drawHeadInner(ctx, L, a);
    ctx.restore();
  }
  function drawHeadInner(ctx, L, a) {
    const hy = -55, r = 10.5;
    const skin = L.skin;
    // hair behind
    if (L.hair && L.head !== 'hood' && L.head !== 'messy' && L.head !== 'slick' && L.head !== 'combover') {
      ctx.beginPath(); ctx.moveTo(-9, hy - 6); ctx.quadraticCurveTo(-16, hy + 6, -11, hy + 16); ctx.lineTo(2, hy + 6); ctx.closePath(); fs(ctx, L.hair);
    }
    if (L.head === 'ears' || L.head === 'imphorns') {
      ctx.beginPath(); ctx.moveTo(-6, hy - 3); ctx.lineTo(-21, hy - 9); ctx.lineTo(-7, hy + 4); ctx.closePath(); fs(ctx, skin);
    }
    if (L.head === 'hood') {
      ctx.beginPath(); ctx.moveTo(-14, hy + 10); ctx.quadraticCurveTo(-16, hy - 16, 2, hy - 15); ctx.quadraticCurveTo(14, hy - 12, 12, hy + 4); ctx.lineTo(-14, hy + 10); ctx.closePath(); fs(ctx, L.hoodColor || '#3f7a3a');
    }
    if (L.head === 'fur') { circ(ctx, 0, hy, r + 3); fs(ctx, L.skin); }
    else { circ(ctx, 0, hy, r); fs(ctx, skin); }
    // face
    if (L.bones) {
      circ(ctx, 4.5, hy - 1, 2.8); fs(ctx, '#2a2020', false);
      ctx.fillStyle = '#2a2020'; ctx.fillRect(3, hy + 5, 7, 1.4);
      ctx.strokeStyle = '#2a2020'; ctx.lineWidth = 1; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(4 + i * 2.3, hy + 4); ctx.lineTo(4 + i * 2.3, hy + 8); ctx.stroke(); }
      ctx.lineWidth = 2;
      if (L.glowEyes) { circ(ctx, 4.5, hy - 1, 1.3); fs(ctx, L.glowEyes, false); }
    } else if (L.head === 'fur') {
      ell(ctx, 4, hy + 2, 6.5, 7); fs(ctx, L.face || '#7aa0c8', false);
      circ(ctx, 5.5, hy - 1, 1.6); fs(ctx, '#111', false);
    } else if (L.head === 'wraps') {
      ctx.strokeStyle = shade(L.skin, -0.2); ctx.lineWidth = 1.5;
      for (let i = -8; i < 9; i += 4) { ctx.beginPath(); ctx.moveTo(-10, hy + i); ctx.lineTo(10, hy + i + 2); ctx.stroke(); }
      ctx.lineWidth = 2;
      circ(ctx, 5, hy - 1, 1.8); fs(ctx, '#ffd040', false);
    } else if (L.head === 'mask') {
      rr(ctx, -2, hy - 10, 14, 18, 4); fs(ctx, '#d8c8a0');
      circ(ctx, 6, hy - 3, 1.8); fs(ctx, '#2a1a10', false);
      ctx.fillStyle = '#a02a1a'; ctx.fillRect(2, hy + 3, 9, 2);
    } else {
      if (L.glowEyes) {
        ctx.shadowColor = L.glowEyes; ctx.shadowBlur = 8;
        circ(ctx, 5.2, hy - 1.5, 2.2); fs(ctx, L.glowEyes, false);
        ctx.shadowBlur = 0;
      } else {
        ctx.lineWidth = 1.2;
        ell(ctx, 5.2, hy - 2, 3.4, 4); fs(ctx, '#ffffff');
        circ(ctx, 6.3 + (L.zombie ? -1 : 0), hy - 1.4 + (L.zombie ? 1 : 0), 1.8); fs(ctx, '#1e1410', false);
        ctx.lineWidth = 2;
      }
      if (L.zombie) { ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-6, hy - 6); ctx.lineTo(-2, hy - 2); for (let i = 0; i < 3; i++) { ctx.moveTo(-6 + i * 2, hy - 7 + i * 2); ctx.lineTo(-3 + i * 2, hy - 8 + i * 2); } ctx.stroke(); ctx.lineWidth = 2; }
      if (L.eyebags) { ctx.strokeStyle = '#7a4a8a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(5.2, hy + 1, 3, 0.3, PI - 0.3); ctx.stroke(); ctx.lineWidth = 2; }
      if (!L.beard && !L.glowEyes) { circ(ctx, 4, hy + 4, 2); fs(ctx, 'rgba(255,110,110,0.35)', false); }
      // mouth
      if (!L.beard && !L.mustache) {
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.beginPath();
        if (L.zombie || L.eyebags) { ctx.moveTo(4, hy + 6); ctx.lineTo(9, hy + 5); }
        else ctx.arc(7, hy + 4, 2.6, 0.3, PI - 0.5);
        ctx.stroke(); ctx.lineWidth = 2;
      }
      if (L.fangs) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(5, hy + 5); ctx.lineTo(6, hy + 9); ctx.lineTo(7, hy + 5); ctx.moveTo(8, hy + 5); ctx.lineTo(9, hy + 9); ctx.lineTo(10, hy + 5); ctx.fill(); }
      if (L.head === 'ears' || L.head === 'mohawk' || L.head === 'horns') { // tusks / grin
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(6, hy + 5); ctx.lineTo(8, hy + 1); ctx.lineTo(9, hy + 5); ctx.fill();
      }
    }
    if (L.beard) {
      ctx.beginPath(); ctx.moveTo(-4, hy + 3); ctx.quadraticCurveTo(2, hy + 22, 11, hy + 4); ctx.quadraticCurveTo(4, hy + 8, -4, hy + 3); fs(ctx, L.beard);
    }
    if (L.mustache) {
      ctx.beginPath(); ctx.moveTo(3, hy + 3); ctx.quadraticCurveTo(7, hy + 1, 11, hy + 3); ctx.quadraticCurveTo(15, hy + 3, 15, hy - 1); ctx.quadraticCurveTo(14, hy + 7, 7, hy + 5.5); ctx.quadraticCurveTo(2, hy + 7, -1, hy + 2); ctx.quadraticCurveTo(1, hy + 5, 3, hy + 3); fs(ctx, L.mustache);
    }
    if (L.glasses) { ctx.lineWidth = 1.4; circ(ctx, 5.4, hy - 2, 4.4); ctx.strokeStyle = '#2a1a10'; ctx.stroke(); ctx.beginPath(); ctx.moveTo(1, hy - 2); ctx.lineTo(-8, hy - 4); ctx.stroke(); ctx.lineWidth = 2; }
    if (L.sunglasses) { rr(ctx, 0, hy - 5, 12, 5.5, 2); fs(ctx, '#111'); ctx.beginPath(); ctx.moveTo(0, hy - 3); ctx.lineTo(-9, hy - 5); ctx.strokeStyle = '#111'; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(7, hy - 4, 2, 1.5); }
    // headgear
    switch (L.head) {
      case 'knight': {
        const tr = L.tier || 1;
        if (tr === 1) { // dented bucket
          ctx.beginPath(); ctx.moveTo(-12, hy + 3); ctx.lineTo(-10, hy - 15); ctx.lineTo(11, hy - 15); ctx.lineTo(13, hy + 3); ctx.closePath(); fs(ctx, '#9a7a5a');
          ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-10, hy - 8, 23, 2);
          ctx.beginPath(); ctx.moveTo(-3, hy - 15); ctx.lineTo(-1, hy - 11); ctx.lineTo(2, hy - 15); ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
          ctx.beginPath(); ctx.arc(1, hy - 15, 9, PI, TAU); ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 2;
          rr(ctx, 2, hy - 4, 10, 3, 1); fs(ctx, '#1a1a1a', false);
        } else if (tr === 5) { // disco ball helm
          circ(ctx, 0, hy - 2, r + 3); fs(ctx, '#d8d8e8');
          discoTiles(ctx, -r - 3, hy - r - 5, 2 * r + 6, 2 * r + 6, a.t || 0, true, 0, hy - 2, r + 3);
          rr(ctx, 1, hy - 3, 11, 3.5, 1); fs(ctx, '#1a1a1a', false);
        } else {
          ctx.beginPath(); ctx.arc(0, hy - 1, r + 2, PI, TAU); ctx.lineTo(r + 2, hy + 1); ctx.lineTo(-r - 2, hy + 1); ctx.closePath(); fs(ctx, L.tierColor);
          ctx.save(); ctx.globalAlpha = 0.5; ell(ctx, -4, hy - 8, 4, 2.5, -0.4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
          rr(ctx, 4, hy - 2, 3, 9, 1); fs(ctx, L.tierColor);
        }
        if (L.plume) { plume(ctx, -2, hy - (tr === 1 ? 15 : 12), L.plume); if (L.bigPlume) { plume(ctx, 2, hy - 16, L.plume); plume(ctx, -6, hy - 10, '#ffd040'); } }
        break;
      }
      case 'messy':
        ctx.beginPath(); ctx.moveTo(-11, hy + 2); ctx.lineTo(-13, hy - 8); ctx.lineTo(-8, hy - 7); ctx.lineTo(-7, hy - 15); ctx.lineTo(-2, hy - 10); ctx.lineTo(1, hy - 16); ctx.lineTo(4, hy - 10); ctx.lineTo(9, hy - 13); ctx.lineTo(8, hy - 6); ctx.lineTo(12, hy - 6); ctx.quadraticCurveTo(4, hy - 4, -4, hy - 4); ctx.lineTo(-6, hy + 2); ctx.closePath(); fs(ctx, L.hair || '#5a3a1a');
        break;
      case 'bun':
        ctx.beginPath(); ctx.arc(0, hy - 2, r + 1, PI * 0.9, TAU + 0.1); ctx.closePath(); fs(ctx, L.hair);
        circ(ctx, -4, hy - 15, 6); fs(ctx, L.hair);
        if (L.foamCrown) { ell(ctx, -4, hy - 22, 9, 5); fs(ctx, '#fff8e8'); ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(-4, hy - 22, 3, 0, PI * 1.5); ctx.stroke(); ctx.lineWidth = 2; }
        break;
      case 'nursecap':
        ctx.beginPath(); ctx.arc(0, hy - 1, r + 1, PI * 0.95, TAU + 0.05); ctx.closePath(); fs(ctx, L.hair || '#ff8a3a');
        rr(ctx, -8, hy - 16, 16, 8, 2); fs(ctx, '#ffffff');
        ctx.fillStyle = L.tierColor || '#ff3a5a'; ctx.fillRect(-1.5, hy - 15, 3, 6); ctx.fillRect(-3.5, hy - 13, 7, 2);
        break;
      case 'imphorns':
        horn(ctx, -5, hy - 8, -1); horn(ctx, 3, hy - 9, 1);
        break;
      case 'combover':
        ctx.strokeStyle = L.hair || '#5a5a4a'; ctx.lineWidth = 1.6;
        for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-10, hy - 4 + i); ctx.quadraticCurveTo(-2, hy - 13 + i, 9, hy - 8 + i * 2); ctx.stroke(); }
        ctx.lineWidth = 2;
        break;
      case 'visor':
        ctx.beginPath(); ctx.moveTo(-10, hy - 6); ctx.lineTo(18, hy - 7); ctx.lineTo(10, hy - 3); ctx.lineTo(-9, hy - 3); ctx.closePath(); fs(ctx, 'rgba(60,200,90,0.85)');
        break;
      case 'skullglasses':
        ctx.lineWidth = 1.4; circ(ctx, 4.5, hy - 1, 4.2); ctx.strokeStyle = '#2a1a10'; ctx.stroke(); ctx.lineWidth = 2;
        break;
      case 'slick':
        ctx.beginPath(); ctx.moveTo(-11, hy + 4); ctx.quadraticCurveTo(-13, hy - 14, 2, hy - 12); ctx.lineTo(5, hy - 6); ctx.lineTo(8, hy - 11); ctx.quadraticCurveTo(12, hy - 9, 11, hy - 5); ctx.quadraticCurveTo(0, hy - 8, -6, hy + 4); ctx.closePath(); fs(ctx, L.hair || '#1a1a2a');
        break;
      case 'headband':
        ctx.fillStyle = '#e83a3a'; ctx.fillRect(-10.5, hy - 8, 21, 4); ctx.beginPath(); ctx.moveTo(-10, hy - 6); ctx.lineTo(-17, hy - 2); ctx.lineTo(-16, hy - 9); ctx.closePath(); ctx.fill();
        break;
      case 'karen':
        ctx.beginPath(); ctx.moveTo(-12, hy + 8); ctx.quadraticCurveTo(-16, hy - 16, 2, hy - 14); ctx.lineTo(-8, hy - 22); ctx.lineTo(4, hy - 16); ctx.lineTo(-2, hy - 26); ctx.lineTo(10, hy - 14); ctx.quadraticCurveTo(14, hy - 8, 11, hy - 4); ctx.quadraticCurveTo(0, hy - 10, -5, hy + 8); ctx.closePath(); fs(ctx, L.hair || '#ffe08a');
        break;
      case 'bardhat':
        ell(ctx, 0, hy - 8, 15, 4); fs(ctx, L.hoodColor);
        ctx.beginPath(); ctx.moveTo(-9, hy - 8); ctx.quadraticCurveTo(-6, hy - 20, 6, hy - 18); ctx.quadraticCurveTo(10, hy - 14, 9, hy - 8); ctx.closePath(); fs(ctx, L.hoodColor);
        ctx.beginPath(); ctx.moveTo(-4, hy - 15); ctx.quadraticCurveTo(-20, hy - 34, -26, hy - 26); ctx.quadraticCurveTo(-16, hy - 24, -4, hy - 12); ctx.closePath(); fs(ctx, L.tier >= 4 ? '#ff3a6a' : '#ffffff');
        break;
      case 'magmahead':
        for (let i = 0; i < 5; i++) { const fl = Math.sin((a.t || 0) * 9 + i) * 2; ctx.beginPath(); ctx.moveTo(-10 + i * 5, hy - 6); ctx.quadraticCurveTo(-12 + i * 5, hy - 16 - fl, -7 + i * 5, hy - 22 - fl - (i % 2) * 5); ctx.quadraticCurveTo(-4 + i * 5, hy - 12, -5 + i * 5, hy - 6); ctx.closePath(); ctx.fillStyle = i % 2 ? '#ffd040' : '#ff7a1a'; ctx.fill(); }
        horn(ctx, -6, hy - 7, -1); horn(ctx, 4, hy - 8, 1);
        break;
      case 'helm':
        ctx.beginPath(); ctx.arc(0, hy - 1, r + 1.6, PI, TAU); ctx.lineTo(r + 1.6, hy + 1); ctx.lineTo(-r - 1.6, hy + 1); ctx.closePath(); fs(ctx, L.tierColor || '#aaa');
        rr(ctx, 4, hy - 2, 3, 9, 1); fs(ctx, L.tierColor || '#aaa');
        if (L.plume) plume(ctx, -2, hy - 11, L.plume);
        break;
      case 'greathelm':
        rr(ctx, -r - 1, hy - r - 2, 2 * r + 3, 2 * r + 2, 5); fs(ctx, L.tierColor || '#999');
        ctx.fillStyle = '#1a1a1a'; ctx.fillRect(1, hy - 3, r, 2.6);
        ctx.fillRect(5, hy - 3, 2, 9);
        if (L.plume) plume(ctx, -3, hy - 12, L.plume);
        break;
      case 'hood':
        ctx.beginPath(); ctx.moveTo(-12, hy + 2); ctx.quadraticCurveTo(-12, hy - 14, 2, hy - 13); ctx.quadraticCurveTo(12, hy - 12, 11, hy - 4); ctx.quadraticCurveTo(2, hy - 9, -3, hy + 6); ctx.closePath(); fs(ctx, L.hoodColor || '#3f7a3a');
        if (L.plume) plume(ctx, -8, hy - 10, L.plume);
        break;
      case 'wizard':
        { const k = L.hatH || 1, wob = Math.sin((a.t || 0) * 2) * 3 * k;
        ctx.beginPath(); ctx.moveTo(-15, hy - 5); ctx.lineTo(15, hy - 5); ctx.lineTo(4, hy - 12); ctx.quadraticCurveTo(-2 + wob, hy - 12 - 18 * k, -14 + wob * 1.5, hy - 12 - 26 * k); ctx.quadraticCurveTo(-6, hy - 12 - 12 * k, -8, hy - 12); ctx.closePath(); fs(ctx, L.armor);
        ctx.fillStyle = L.tierColor || '#e0ad2e'; ctx.fillRect(-11, hy - 9, 18, 3);
        ctx.fillStyle = '#ffe040'; for (let i = 0; i < 1 + Math.floor(k * 2); i++) { const sx = -4 + (i % 2) * 4 + wob * (i / 6), sy = hy - 16 - i * 8; ctx.beginPath(); for (let j = 0; j < 5; j++) { const an = j * 1.2566 - PI / 2; ctx.lineTo(sx + Math.cos(an) * 2.6, sy + Math.sin(an) * 2.6); ctx.lineTo(sx + Math.cos(an + 0.63) * 1.1, sy + Math.sin(an + 0.63) * 1.1); } ctx.fill(); } }
        break;
      case 'witch':
        ctx.beginPath(); ctx.moveTo(-17, hy - 5); ctx.lineTo(17, hy - 5); ctx.lineTo(6, hy - 10); ctx.lineTo(-4, hy - 36); ctx.lineTo(-8, hy - 10); ctx.closePath(); fs(ctx, L.armor);
        ctx.fillStyle = L.tierColor || '#9be8ff'; ctx.fillRect(-8, hy - 11, 14, 3);
        break;
      case 'minercap':
        ctx.beginPath(); ctx.arc(0, hy - 2, r + 1.5, PI, TAU); ctx.closePath(); fs(ctx, L.armor || '#c8962a');
        rr(ctx, -r - 3, hy - 3, 2 * r + 9, 3.5, 1.5); fs(ctx, L.armor || '#c8962a');
        ctx.shadowColor = '#fff6a0'; ctx.shadowBlur = 10; circ(ctx, 5, hy - 8, 3); fs(ctx, '#fff6a0'); ctx.shadowBlur = 0;
        break;
      case 'circlet':
        ctx.beginPath(); ctx.moveTo(-10, hy - 6); ctx.quadraticCurveTo(0, hy - 10, 10, hy - 6); ctx.strokeStyle = L.tierColor || '#e0ad2e'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.lineWidth = 2;
        circ(ctx, 3, hy - 9, 2.4); fs(ctx, L.orb || '#7dffb0');
        break;
      case 'horns':
        horn(ctx, -6, hy - 7, -1); horn(ctx, 4, hy - 8, 1);
        break;
      case 'crown': case 'darkcrown': {
        const cc = L.head === 'crown' ? '#f2c230' : '#3a2a4a';
        ctx.beginPath(); ctx.moveTo(-10, hy - 7); ctx.lineTo(-11, hy - 19); ctx.lineTo(-5, hy - 12); ctx.lineTo(0, hy - 21); ctx.lineTo(5, hy - 12); ctx.lineTo(11, hy - 19); ctx.lineTo(10, hy - 7); ctx.closePath(); fs(ctx, cc);
        circ(ctx, 0, hy - 10, 2); fs(ctx, L.head === 'crown' ? '#e02a3a' : '#c06aff', false);
        break;
      }
      case 'turban':
        ell(ctx, -1, hy - 7, 12.5, 7.5); fs(ctx, '#e8dcc0');
        ctx.beginPath(); ctx.moveTo(-10, hy - 2); ctx.quadraticCurveTo(-18, hy + 8, -14, hy + 14); fs(ctx, '#e8dcc0');
        circ(ctx, 6, hy - 10, 2); fs(ctx, '#2a8ad0', false);
        break;
      case 'crest':
        ctx.beginPath(); ctx.moveTo(-10, hy - 2); ctx.lineTo(-14, hy - 14); ctx.lineTo(-6, hy - 9); ctx.lineTo(-4, hy - 18); ctx.lineTo(1, hy - 10); ctx.lineTo(4, hy - 16); ctx.lineTo(6, hy - 8); ctx.closePath(); fs(ctx, '#d8a030');
        break;
      case 'mohawk':
        ctx.beginPath(); ctx.moveTo(-8, hy - 6); ctx.lineTo(-6, hy - 18); ctx.lineTo(-1, hy - 11); ctx.lineTo(1, hy - 20); ctx.lineTo(4, hy - 10); ctx.lineTo(6, hy - 8); ctx.closePath(); fs(ctx, '#c8302a');
        break;
      case 'darkhelm':
        ctx.beginPath(); ctx.arc(0, hy, r + 2, PI * 0.95, TAU + 0.1); ctx.lineTo(r + 2, hy + 8); ctx.lineTo(-r - 2, hy + 8); ctx.closePath(); fs(ctx, '#3a3048');
        ctx.beginPath(); ctx.moveTo(-4, hy - 10); ctx.lineTo(-8, hy - 24); ctx.lineTo(0, hy - 12); ctx.closePath(); fs(ctx, '#3a3048');
        ctx.fillStyle = '#0a0610'; ctx.fillRect(1, hy - 3, 11, 3);
        ctx.shadowColor = L.glowEyes; ctx.shadowBlur = 8; circ(ctx, 7, hy - 1.5, 1.6); fs(ctx, L.glowEyes, false); ctx.shadowBlur = 0;
        break;
      case 'cowl':
        ctx.beginPath(); ctx.moveTo(-13, hy + 12); ctx.quadraticCurveTo(-16, hy - 18, 4, hy - 15); ctx.quadraticCurveTo(14, hy - 10, 12, hy - 2); ctx.quadraticCurveTo(4, hy - 8, -1, hy + 10); ctx.closePath(); fs(ctx, L.armor);
        break;
    }
  }
  function partyHat(ctx, hy) {
    ctx.beginPath(); ctx.moveTo(-8, hy - 8); ctx.lineTo(0, hy - 30); ctx.lineTo(8, hy - 8); ctx.closePath(); fs(ctx, '#ff5ad8');
    ctx.strokeStyle = '#ffe040'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-5, hy - 14); ctx.lineTo(4, hy - 16); ctx.moveTo(-3, hy - 21); ctx.lineTo(3, hy - 22); ctx.stroke();
    circ(ctx, 0, hy - 31, 3); fs(ctx, '#ffe040');
  }
  function discoTiles(ctx, x, y, w, h, t, round, cx, cy, cr) {
    ctx.save();
    ctx.beginPath();
    if (round) ctx.arc(cx, cy, cr - 1, 0, TAU); else ctx.rect(x + 1, y + 1, w - 2, h - 2);
    ctx.clip();
    const cols = ['#ffffff', '#c8d0ff', '#ffc8f0', '#c8fff0', '#fff0a0', '#a0a8c0'];
    const sz = 4;
    for (let i = 0; i * sz < w; i++) for (let j = 0; j * sz < h; j++) {
      ctx.fillStyle = cols[(i * 7 + j * 3 + Math.floor(t * 6)) % cols.length];
      ctx.fillRect(x + i * sz, y + j * sz, sz - 0.6, sz - 0.6);
    }
    ctx.restore();
  }
  A.discoTiles = discoTiles;
  function plume(ctx, x, y, col) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 14, y - 12, x - 18, y + 4); ctx.quadraticCurveTo(x - 8, y - 2, x, y + 2); ctx.closePath(); fs(ctx, col);
  }
  function horn(ctx, x, y, d) {
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + d * 4, y - 14, x + d * 12, y - 16); ctx.quadraticCurveTo(x + d * 6, y - 8, x + d * 6, y + 2); ctx.closePath(); fs(ctx, '#efe6cf');
  }

  A.humanoid = function (ctx, L, a) {
    const s = L.size || 1, bw = L.bulk || 1;
    const mv = a.moving ? 1 : 0, ph = a.walk || 0;
    const swing = Math.sin(ph) * 0.6 * mv;
    const bob = -Math.abs(Math.sin(ph)) * 2.4 * mv;
    ctx.save();
    ctx.scale(s, s);
    ctx.translate(0, bob);
    ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const armor = L.armor || L.shirt || '#888';
    const trim = L.trim || shade(armor, -0.35);
    const legs = L.legs || '#444';
    const boot = shade(legs, -0.35);
    if (L.aura) {
      const g = ctx.createRadialGradient(0, -36, 4, 0, -36, 46);
      g.addColorStop(0, L.aura); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; circ(ctx, 0, -36, 46); ctx.fill();
    }
    if (L.cape) {
      const fl = Math.sin((a.t || 0) * 5 + ph) * 3;
      ctx.beginPath(); ctx.moveTo(-6 * bw, -45); ctx.quadraticCurveTo(-18 * bw - fl, -26, -16 * bw - fl * 1.5, -6); ctx.lineTo(-2, -12); ctx.closePath(); fs(ctx, L.cape);
    }
    if (L.tail) {
      ctx.beginPath(); ctx.moveTo(-6, -24); ctx.quadraticCurveTo(-26, -18, -30 + Math.sin((a.t || 0) * 4) * 3, -4); ctx.quadraticCurveTo(-20, -14, -4, -18); ctx.closePath(); fs(ctx, L.tail);
    }
    if (L.lute) { ctx.save(); ctx.translate(-12, -32); ctx.rotate(-0.6); ell(ctx, 0, 6, 7, 9); fs(ctx, '#c8862a'); circ(ctx, 0, 6, 2.2); fs(ctx, '#3a1a0a', false); rr(ctx, -1.5, -16, 3, 16, 1); fs(ctx, '#7a4a1a'); ctx.restore(); }
    if (L.espresso) { rr(ctx, -20 * bw, -50, 12, 24, 3); fs(ctx, '#9aa4b0'); circ(ctx, -14 * bw, -42, 3); fs(ctx, '#e83a3a'); ctx.fillStyle = 'rgba(255,255,255,0.6)'; circ(ctx, -16 * bw + Math.sin((a.t || 0) * 3) * 2, -58 - ((a.t || 0) * 12 % 10), 3); ctx.fill(); }
    if (!L.noLegs && !L.robe) leg(ctx, -3, swing, shade(legs, -0.18), boot, L.bones);
    // back arm
    ctx.save(); ctx.translate(-4 * bw, -42); ctx.rotate(-0.25 - swing * 0.4);
    rr(ctx, -3.3, -2, 6.6, 15, 3.3); fs(ctx, shade(armor, -0.2));
    if (L.mug) { const ms = L.mugSize || 1; ctx.save(); ctx.translate(0, 15); ctx.rotate(0.25 + swing * 0.4); rr(ctx, -3 * ms, -4 * ms, 6.5 * ms, 8 * ms, 1.5); fs(ctx, L.mugColor || '#fff'); ctx.beginPath(); ctx.arc(3.8 * ms, 0, 2.2 * ms, -PI / 2, PI / 2); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 2; ctx.restore(); }
    ctx.restore();
    // torso / robe
    if (L.robe) {
      ctx.beginPath(); ctx.moveTo(-9 * bw, -46); ctx.lineTo(9 * bw, -46); ctx.lineTo(13 * bw + swing * 2, -2); ctx.lineTo(-13 * bw + swing * 2, -2); ctx.closePath(); fs(ctx, armor);
      ctx.fillStyle = L.tierColor || trim; ctx.fillRect(-12 * bw + swing * 2, -7, 24 * bw, 4);
      ctx.fillStyle = trim; ctx.fillRect(-1.5, -45, 3, 38);
      rr(ctx, -8, -2, 7, 4, 2); fs(ctx, boot); rr(ctx, 2 + swing * 3, -2, 8, 4, 2); fs(ctx, boot);
    } else if (L.bones) {
      ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      rr(ctx, -8 * bw, -46, 16 * bw, 26, 5); fs(ctx, 'rgba(0,0,0,0.25)');
      ctx.strokeStyle = L.skin; ctx.lineWidth = 2.5;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-7, -42 + i * 6); ctx.quadraticCurveTo(0, -39 + i * 6, 7, -42 + i * 6); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(0, -20); ctx.stroke();
      ctx.lineWidth = 2;
      if (L.armor) { rr(ctx, -9, -26, 18, 6, 2); fs(ctx, L.armor); }
    } else {
      rr(ctx, -10.5 * bw, -47, 21 * bw, 29, 7); fs(ctx, armor);
      if (L.disco) discoTiles(ctx, -10.5 * bw, -47, 21 * bw, 29, a.t || 0);
      ctx.save(); ctx.globalAlpha = 0.25; rr(ctx, -6 * bw, -44, 7 * bw, 20, 4); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore();
      if (L.shirt && L.armor && L.armor !== L.shirt) { ctx.beginPath(); ctx.moveTo(-3, -47); ctx.lineTo(9, -47); ctx.lineTo(3, -34); ctx.closePath(); fs(ctx, L.shirt, false); }
      if (L.tie) { ctx.beginPath(); ctx.moveTo(2, -46); ctx.lineTo(5, -46); ctx.lineTo(6, -33); ctx.lineTo(3.5, -30); ctx.lineTo(1, -33); ctx.closePath(); ctx.lineWidth = 1.2; fs(ctx, L.tie); ctx.lineWidth = 2; }
      if (L.apron) { rr(ctx, -2, -40, 13 * bw, 26, 3); fs(ctx, L.apron); rr(ctx, 2, -30, 7, 5, 1); fs(ctx, shade(L.apron, -0.25), false); }
      if (L.lanyard) { ctx.beginPath(); ctx.moveTo(-2, -47); ctx.lineTo(4, -36); ctx.lineTo(9, -47); ctx.strokeStyle = '#3a7aff'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.lineWidth = 2; rr(ctx, 1, -37, 7, 8, 1); fs(ctx, '#ffffff'); }
      if (!L.shirt) { rr(ctx, -10.5 * bw, -24, 21 * bw, 4.5, 2); fs(ctx, trim); }
    }
    if (!L.noLegs && !L.robe) leg(ctx, 3, -swing, legs, boot, L.bones);
    drawHead(ctx, L, a);
    if (L.partyhat) { ctx.save(); ctx.translate(0, -59); ctx.scale(1.32, 1.32); ctx.translate(0, 55); partyHat(ctx, -55); ctx.restore(); }
    // shield
    if (L.shield) {
      ctx.save(); ctx.translate(9 * bw, -31);
      if (L.shield === 'tower') {
        rr(ctx, -6, -18, 15, 34, 4); fs(ctx, L.tierColor || '#888');
        rr(ctx, -2, -14, 7, 26, 2); fs(ctx, L.trim || '#555');
        circ(ctx, 1.5, -1, 3); fs(ctx, '#ffe08a');
      } else if (L.shield === 'dark') {
        ctx.beginPath(); ctx.moveTo(-6, -14); ctx.lineTo(8, -14); ctx.lineTo(8, 4); ctx.lineTo(1, 16); ctx.lineTo(-6, 4); ctx.closePath(); fs(ctx, '#2a2038');
        ctx.beginPath(); ctx.moveTo(1, -10); ctx.lineTo(1, 8); ctx.strokeStyle = '#c06aff'; ctx.stroke();
      } else {
        circ(ctx, 1, 0, 10.5); fs(ctx, L.tierColor || '#a33');
        circ(ctx, 1, 0, 6.5); fs(ctx, L.trim || '#622', false);
        circ(ctx, 1, 0, 2.8); fs(ctx, '#ffe08a', false);
      }
      ctx.restore();
    }
    // weapon arm
    const ang = armAngle(L, a);
    ctx.save(); ctx.translate(5 * bw, -42); ctx.rotate(ang);
    drawWeapon(ctx, L, a, ang);
    rr(ctx, -3.5, -2, 7, 16, 3.5); fs(ctx, L.robe ? armor : shade(armor, 0.05));
    circ(ctx, 0, 16, 3.8); fs(ctx, L.bones ? L.skin : (L.weapon === 'fist' ? (L.armor || L.skin) : L.skin));
    ctx.restore();
    ctx.restore();
  };

  /* ---------- beasts ---------- */
  A.beast = function (ctx, L, a) {
    const s = L.size || 1, c = L.color, t = a.t || 0, ph = a.walk || 0, mv = a.moving ? 1 : 0;
    const p = a.atk || 0;
    ctx.save(); ctx.scale(s, s); ctx.lineWidth = 2; ctx.lineJoin = 'round';
    if (L.type === 'scorpion') {
      // legs
      for (let i = 0; i < 3; i++) {
        const o = Math.sin(ph + i * 2) * 4 * mv;
        ctx.beginPath(); ctx.moveTo(-10 + i * 9, -12); ctx.lineTo(-16 + i * 9 + o, -4); ctx.lineTo(-14 + i * 9 + o, 0); ctx.strokeStyle = OUT; ctx.lineWidth = 4; ctx.stroke(); ctx.strokeStyle = shade(c, -0.3); ctx.lineWidth = 2; ctx.stroke();
      }
      ell(ctx, 0, -14, 20, 9); fs(ctx, c);
      for (let i = -1; i < 2; i++) { ctx.beginPath(); ctx.moveTo(i * 8, -22); ctx.lineTo(i * 8, -6); ctx.strokeStyle = shade(c, -0.25); ctx.stroke(); }
      // claws
      const cl = p > 0 ? Math.sin(p * PI) * 8 : 0;
      ctx.beginPath(); ctx.moveTo(16, -14); ctx.lineTo(28 + cl, -18); ctx.strokeStyle = OUT; ctx.lineWidth = 5; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.stroke(); ctx.lineWidth = 2;
      ell(ctx, 32 + cl, -19, 7, 5); fs(ctx, shade(c, -0.1));
      ctx.beginPath(); ctx.moveTo(34 + cl, -19); ctx.lineTo(40 + cl, -22); ctx.strokeStyle = '#2a1a10'; ctx.stroke();
      // tail
      const ts = p > 0 ? Math.sin(p * PI) : 0;
      let px = -18, py = -16;
      for (let i = 0; i < 5; i++) {
        const ang = -PI * 0.5 - 0.35 + i * 0.45 + ts * 0.5;
        const nx = px + Math.cos(ang) * -9 * -1, ny = py + Math.sin(ang) * 9;
        circ(ctx, nx, ny, 5 - i * 0.5); fs(ctx, shade(c, i * 0.04));
        px = nx; py = ny;
      }
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 10, py + 4); ctx.lineTo(px + 2, py + 6); ctx.closePath(); fs(ctx, '#3a1a10');
      circ(ctx, 18, -17, 1.6); fs(ctx, '#1a0a00', false);
    } else {
      const boar = L.type === 'boar';
      const bodyW = boar ? 24 : 21, bodyH = boar ? 13 : 10;
      const legC = shade(c, -0.2);
      const legs = [[-14, 0], [-8, PI], [10, PI * 0.5], [16, PI * 1.5]];
      legs.forEach(([x, o], i) => {
        const sw = Math.sin(ph * 1.2 + o) * 6 * mv;
        ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x + sw, -1);
        ctx.strokeStyle = OUT; ctx.lineWidth = 7; ctx.stroke(); ctx.strokeStyle = i % 2 ? shade(legC, -0.15) : legC; ctx.lineWidth = 4.5; ctx.stroke();
      });
      ctx.lineWidth = 2;
      // tail
      ctx.beginPath(); ctx.moveTo(-bodyW + 2, -24);
      if (boar) ctx.quadraticCurveTo(-bodyW - 8, -30, -bodyW - 4, -22 + Math.sin(t * 8) * 2);
      else ctx.quadraticCurveTo(-bodyW - 14, -30 + Math.sin(t * 6) * 4, -bodyW - 18, -18);
      ctx.strokeStyle = OUT; ctx.lineWidth = boar ? 3 : 7; ctx.stroke(); ctx.strokeStyle = c; ctx.lineWidth = boar ? 1.5 : 5; ctx.stroke(); ctx.lineWidth = 2;
      ell(ctx, 0, -22, bodyW, bodyH); fs(ctx, c);
      if (boar) { // mane
        ctx.beginPath(); ctx.moveTo(-14, -33); for (let i = 0; i < 6; i++) ctx.lineTo(-12 + i * 5, -38 + (i % 2) * 4); ctx.lineTo(16, -30); ctx.closePath(); fs(ctx, shade(c, -0.35));
        if (L.mountArmor) { rr(ctx, -12, -30, 22, 12, 4); fs(ctx, L.mountArmor); }
      }
      ell(ctx, -2, -17, bodyW * 0.7, bodyH * 0.4); fs(ctx, shade(c, 0.25), false);
      // head
      const hb = p > 0 ? Math.sin(p * PI) * 6 : 0;
      ctx.save(); ctx.translate(bodyW - 2 + hb, -26 + (boar ? 4 : 0));
      if (boar) {
        ell(ctx, 6, 0, 12, 10); fs(ctx, c);
        rr(ctx, 13, -3, 9, 9, 3); fs(ctx, shade(c, 0.2));
        circ(ctx, 19, 0, 1.3); fs(ctx, '#2a1a10', false);
        ctx.beginPath(); ctx.moveTo(14, 5); ctx.quadraticCurveTo(22, 6, 20, -4); ctx.lineTo(18, 3); ctx.closePath(); fs(ctx, '#f6efdc');
        ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(-2, -16); ctx.lineTo(5, -9); ctx.closePath(); fs(ctx, shade(c, -0.2));
        circ(ctx, 8, -3, 1.8); fs(ctx, '#1a0a00', false);
      } else {
        ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(-3, -20); ctx.lineTo(3, -9); ctx.closePath(); fs(ctx, shade(c, -0.2));
        circ(ctx, 2, -2, 9); fs(ctx, c);
        ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(20, -1); ctx.lineTo(18, 4); ctx.lineTo(5, 6); ctx.closePath(); fs(ctx, c);
        circ(ctx, 19, -0.5, 2); fs(ctx, '#111', false);
        ctx.beginPath(); ctx.moveTo(6, -14); ctx.lineTo(4, -22); ctx.lineTo(10, -12); ctx.closePath(); fs(ctx, c);
        circ(ctx, 6, -4, 1.8); fs(ctx, '#ffd040', false);
        if (L.tie) { ctx.beginPath(); ctx.moveTo(-2, 6); ctx.lineTo(3, 6); ctx.lineTo(2, 18); ctx.lineTo(-1, 20); ctx.lineTo(-3, 17); ctx.closePath(); ctx.lineWidth = 1.4; fs(ctx, L.tie); ctx.lineWidth = 2; rr(ctx, 6, 4, 9, 11, 1); fs(ctx, '#ffffff'); }
        if (p > 0) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(12, 8); ctx.lineTo(14, 4); ctx.fill(); }
      }
      ctx.restore();
    }
    ctx.restore();
  };

  A.rider = function (ctx, L, a) {
    const s = L.size || 1;
    ctx.save(); ctx.scale(s, s);
    A.beast(ctx, { type: 'boar', color: L.mount || '#7a4a2a', mountArmor: L.mountArmor }, a);
    ctx.translate(-2, -24 - Math.abs(Math.sin(a.walk || 0)) * 2 * (a.moving ? 1 : 0));
    const rl = Object.assign({}, L, { noLegs: true, size: 0.9, kind: 'humanoid' });
    A.humanoid(ctx, rl, { t: a.t, walk: 0, moving: false, atk: a.atk });
    ctx.restore();
  };

  A.slime = function (ctx, L, a) {
    const s = L.size || 1, t = a.t || 0, sq = Math.sin(t * 6 + (a.walk || 0)) * 0.12;
    const p = a.atk > 0 ? Math.sin(a.atk * PI) * 0.25 : 0;
    ctx.save(); ctx.scale(s * (1 + sq + p), s * (1 - sq - p * 0.5)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-20, 0); ctx.quadraticCurveTo(-22, -30, 0, -32); ctx.quadraticCurveTo(22, -30, 20, 0); ctx.closePath();
    fs(ctx, rgba(L.color, 0.88));
    ell(ctx, -7, -22, 5, 3, -0.5); fs(ctx, 'rgba(255,255,255,0.55)', false);
    circ(ctx, 6, -16, 3.2); fs(ctx, '#fff'); circ(ctx, 7, -16, 1.6); fs(ctx, '#111', false);
    circ(ctx, 13, -15, 2.6); fs(ctx, '#fff'); circ(ctx, 14, -15, 1.3); fs(ctx, '#111', false);
    ctx.restore();
  };

  A.bat = function (ctx, L, a) {
    const s = L.size || 1, t = a.t || 0, f = Math.sin(t * 18);
    ctx.save(); ctx.scale(s, s); ctx.translate(0, -44 + Math.sin(t * 4) * 4); ctx.lineWidth = 2;
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, -2);
      ctx.quadraticCurveTo(d * 12, -14 - f * 10, d * 26, -6 - f * 12);
      ctx.lineTo(d * 20, 0 - f * 4); ctx.lineTo(d * 14, -1); ctx.lineTo(d * 8, 3); ctx.closePath(); fs(ctx, shade(L.color, d > 0 ? 0.1 : -0.15));
    }
    ell(ctx, 0, 0, 8, 9); fs(ctx, L.color);
    ctx.beginPath(); ctx.moveTo(-5, -7); ctx.lineTo(-6, -15); ctx.lineTo(-1, -8); ctx.closePath(); fs(ctx, L.color);
    ctx.beginPath(); ctx.moveTo(5, -7); ctx.lineTo(6, -15); ctx.lineTo(1, -8); ctx.closePath(); fs(ctx, L.color);
    circ(ctx, 3, -2, 1.8); fs(ctx, '#ff4040', false);
    ctx.fillStyle = '#fff'; ctx.fillRect(1, 4, 1.5, 3); ctx.fillRect(4, 4, 1.5, 3);
    ctx.restore();
  };

  A.wraith = function (ctx, L, a) {
    const s = L.size || 1, t = a.t || 0;
    ctx.save(); ctx.scale(s, s); ctx.translate(0, -8 + Math.sin(t * 3) * 4); ctx.lineWidth = 2;
    ctx.globalAlpha = 0.85;
    const g = ctx.createLinearGradient(0, -60, 0, 0);
    g.addColorStop(0, L.color); g.addColorStop(1, 'rgba(60,40,90,0)');
    ctx.beginPath(); ctx.moveTo(-14, -40); ctx.quadraticCurveTo(-4, -70, 12, -52);
    ctx.quadraticCurveTo(18, -30, 14, -10);
    for (let i = 0; i < 5; i++) ctx.lineTo(10 - i * 6, (i % 2 ? -12 : 0) + Math.sin(t * 6 + i) * 3);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(40,20,60,0.6)'; ctx.stroke();
    ctx.globalAlpha = 1;
    ell(ctx, 3, -48, 8, 9); fs(ctx, '#1a1024', false);
    ctx.shadowColor = '#b8f0ff'; ctx.shadowBlur = 10; circ(ctx, 6, -49, 2); fs(ctx, '#b8f0ff', false); ctx.shadowBlur = 0;
    const p = a.atk > 0 ? Math.sin(a.atk * PI) : 0;
    ctx.beginPath(); ctx.moveTo(8, -36); ctx.quadraticCurveTo(20 + p * 10, -36 + p * 6, 26 + p * 12, -26 + p * 4); ctx.strokeStyle = 'rgba(210,200,255,0.9)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  };

  A.golem = function (ctx, L, a) {
    const s = L.size || 1.5, t = a.t || 0, mv = a.moving ? 1 : 0, ph = a.walk || 0;
    const magma = L.type === 'magma';
    const stone = magma ? '#3a2a2a' : (L.metal || '#c8963a');
    const accent = magma ? '#ff7a1a' : (L.trim || '#7a5a2a');
    const p = a.atk || 0;
    ctx.save(); ctx.scale(s, s); ctx.lineWidth = 2;
    if (L.aura) { const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 60); g.addColorStop(0, L.aura); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circ(ctx, 0, -40, 60); ctx.fill(); }
    const sw = Math.sin(ph) * 5 * mv;
    rr(ctx, -14 + sw, -22, 11, 22, 3); fs(ctx, shade(stone, -0.25));
    rr(ctx, 3 - sw, -22, 11, 22, 3); fs(ctx, shade(stone, -0.1));
    // back arm
    rr(ctx, -24, -54, 12, 30, 5); fs(ctx, shade(stone, -0.25));
    // body
    rr(ctx, -20, -62, 40, 42, 9); fs(ctx, stone);
    if (magma) {
      ctx.strokeStyle = accent; ctx.shadowColor = accent; ctx.shadowBlur = 10; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(-12, -56); ctx.lineTo(-4, -44); ctx.lineTo(-10, -34); ctx.moveTo(8, -58); ctx.lineTo(4, -42); ctx.lineTo(12, -30); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 2;
    } else {
      // gear chest
      ctx.save(); ctx.translate(0, -42); ctx.rotate(t * 1.5);
      for (let i = 0; i < 8; i++) { ctx.rotate(PI / 4); ctx.fillStyle = accent; ctx.fillRect(-2, -11, 4, 4); }
      circ(ctx, 0, 0, 8); fs(ctx, accent); circ(ctx, 0, 0, 3); fs(ctx, '#2a1a10', false);
      ctx.restore();
      ctx.fillStyle = shade(stone, -0.3);
      for (const [x, y] of [[-16, -58], [16, -58], [-16, -26], [16, -26]]) { circ(ctx, x, y, 1.6); ctx.fill(); }
      // smoke stack
      rr(ctx, -16, -74, 7, 14, 2); fs(ctx, shade(stone, -0.2));
    }
    if (L.tie) { ctx.beginPath(); ctx.moveTo(-3, -60); ctx.lineTo(3, -60); ctx.lineTo(4, -40); ctx.lineTo(0, -35); ctx.lineTo(-4, -40); ctx.closePath(); fs(ctx, '#2a5aa0'); }
    // head
    rr(ctx, -9, -78, 22, 18, 5); fs(ctx, shade(stone, 0.1));
    ctx.shadowColor = magma ? '#ffb030' : '#7affff'; ctx.shadowBlur = 10;
    rr(ctx, 2, -73, 9, 4, 2); fs(ctx, magma ? '#ffb030' : '#7affff', false); ctx.shadowBlur = 0;
    // front arm with fist
    const ang = p > 0 ? (p < 0.4 ? lerp(-0.3, -2.6, p / 0.4) : lerp(-2.6, -0.1, Math.min(1, (p - 0.4) / 0.3))) : -0.3 + Math.sin(t * 2) * 0.05;
    ctx.save(); ctx.translate(14, -54); ctx.rotate(ang);
    rr(ctx, -6, -4, 12, 30, 5); fs(ctx, shade(stone, 0.05));
    rr(ctx, -9, 22, 18, 16, 5); fs(ctx, magma ? '#5a3a30' : accent);
    ctx.restore();
    ctx.restore();
  };

  A.drake = function (ctx, L, a) {
    const s = L.size || 1, t = a.t || 0, c = L.color, ph = a.walk || 0, mv = a.moving ? 1 : 0;
    const p = a.atk || 0, br = a.breath || 0;
    ctx.save(); ctx.scale(s, s); ctx.lineWidth = 2.5;
    const wf = Math.sin(t * 3);
    // far wing
    ctx.beginPath(); ctx.moveTo(-6, -70); ctx.quadraticCurveTo(-30, -130 - wf * 14, -70, -120 - wf * 20); ctx.lineTo(-50, -96); ctx.lineTo(-40, -80); ctx.closePath(); fs(ctx, shade(c, -0.35));
    // tail
    ctx.beginPath(); ctx.moveTo(-40, -50); ctx.quadraticCurveTo(-90, -40 + Math.sin(t * 2) * 6, -110, -16); ctx.lineTo(-98, -10); ctx.quadraticCurveTo(-80, -30, -40, -36); ctx.closePath(); fs(ctx, c);
    // legs
    for (const [x, o] of [[-30, 0], [24, PI]]) {
      const sw = Math.sin(ph + o) * 6 * mv;
      rr(ctx, x + sw - 7, -34, 15, 34, 6); fs(ctx, shade(c, -0.2));
      ctx.fillStyle = '#efe6cf'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + sw + 6 + i * 2, -2); ctx.lineTo(x + sw + 12 + i * 2, 0); ctx.lineTo(x + sw + 6 + i * 2, 1); ctx.fill(); }
    }
    // body
    ell(ctx, 0, -54, 50, 26); fs(ctx, c);
    ell(ctx, 4, -42, 38, 12); fs(ctx, '#f0a040', false);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-30 + i * 14, -78); ctx.lineTo(-24 + i * 14, -92); ctx.lineTo(-18 + i * 14, -78); fs(ctx, shade(c, -0.3)); }
    // neck & head
    const hx = 62 + (p > 0 ? Math.sin(p * PI) * 10 : 0), hy = -96 + Math.sin(t * 2) * 3;
    ctx.beginPath(); ctx.moveTo(30, -72); ctx.quadraticCurveTo(50, -96, hx - 6, hy + 6); ctx.lineTo(hx + 2, hy + 18); ctx.quadraticCurveTo(52, -70, 40, -50); ctx.closePath(); fs(ctx, c);
    const jaw = (p > 0 ? Math.sin(p * PI) * 0.5 : 0) + br * 0.6;
    ctx.save(); ctx.translate(hx, hy);
    ctx.save(); ctx.rotate(jaw); rr(ctx, 0, 2, 30, 8, 3); fs(ctx, shade(c, -0.1)); ctx.restore();
    rr(ctx, -8, -12, 40, 16, 6); fs(ctx, c);
    horn(ctx, -2, -10, -1);
    ctx.shadowColor = '#ffd040'; ctx.shadowBlur = 8; circ(ctx, 14, -6, 2.6); fs(ctx, '#ffd040', false); ctx.shadowBlur = 0;
    circ(ctx, 28, -6, 1.4); fs(ctx, '#2a0a00', false);
    ctx.restore();
    if (L.paper) {
      for (let i = 0; i < 7; i++) { ctx.save(); ctx.translate(-40 + i * 13, -66 + (i % 3) * 10); ctx.rotate(Math.sin(t * 3 + i) * 0.3 + i); rr(ctx, -6, -8, 12, 15, 1); fs(ctx, '#ffffff'); ctx.fillStyle = '#9aa'; ctx.fillRect(-4, -5, 8, 1); ctx.fillRect(-4, -2, 8, 1); ctx.fillRect(-4, 1, 6, 1); ctx.restore(); }
      ctx.save(); ctx.translate(hx + 6, hy - 18); ctx.rotate(-0.2); rr(ctx, -7, -3, 14, 6, 1); fs(ctx, '#1a1a1a'); ctx.restore();
    }
    // near wing
    ctx.beginPath(); ctx.moveTo(10, -72); ctx.quadraticCurveTo(-10, -150 + wf * 16, -60, -140 + wf * 24); ctx.lineTo(-46, -110); ctx.lineTo(-34, -96); ctx.lineTo(-22, -84); ctx.closePath(); fs(ctx, shade(c, -0.1));
    ctx.beginPath(); ctx.moveTo(10, -72); ctx.lineTo(-46, -110); ctx.moveTo(4, -76); ctx.lineTo(-34, -96); ctx.strokeStyle = shade(c, -0.4); ctx.stroke();
    ctx.restore();
  };

  A.wyrm = function (ctx, L, a) {
    const s = L.size || 1, t = a.t || 0, c = L.color;
    const up = a.burrowed ? 0.15 : 1;
    const p = a.atk || 0;
    ctx.save(); ctx.scale(s, s); ctx.lineWidth = 2.5;
    // sand mound
    ell(ctx, -20, 0, 70, 12); fs(ctx, '#c8a060', 'rgba(90,60,20,0.5)');
    const n = 11;
    for (let i = n - 1; i >= 0; i--) {
      const k = i / (n - 1);
      const x = -80 + k * 100 + (p > 0 && i > n - 4 ? Math.sin(p * PI) * 20 : 0);
      const y = -Math.sin(k * PI * 0.85) * 100 * up + Math.sin(t * 3 + i) * 3 - (i === n - 1 ? 10 * up : 0);
      const r = 16 + Math.sin(k * PI) * 8;
      if (y > 4) continue;
      circ(ctx, x, y, r); fs(ctx, i % 2 ? c : shade(c, -0.12));
      ctx.beginPath(); ctx.arc(x, y, r * 0.7, -0.5, 1.2); ctx.strokeStyle = shade(c, -0.3); ctx.stroke();
      if (i === n - 1 && up > 0.5) {
        // head with mandibles
        const m = (p > 0 ? Math.sin(p * PI) : 0) * 0.6;
        ctx.save(); ctx.translate(x + 10, y);
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(8, d * 6); ctx.quadraticCurveTo(26, d * (12 + m * 16), 30, d * (2 + m * 10)); ctx.lineTo(16, d * 2); ctx.closePath(); fs(ctx, '#efe0c0'); }
        circ(ctx, 12, 0, 6); fs(ctx, '#3a1a10');
        ctx.shadowColor = '#ffe060'; ctx.shadowBlur = 8;
        circ(ctx, -2, -12, 3); fs(ctx, '#ffe060', false); circ(ctx, 6, -10, 2.4); fs(ctx, '#ffe060', false);
        ctx.shadowBlur = 0; ctx.restore();
      }
    }
    ctx.restore();
  };

  A.titan = function (ctx, L, a) {
    const tier = L.tier || 1;
    const metal = ['#c8963a', '#b87a4a', '#9aa6b8', '#f0c040', '#b49cff'][tier - 1];
    const trim = ['#7a5a2a', '#7a3a1a', '#4a5a7a', '#a06a10', '#5a3ad0'][tier - 1];
    A.golem(ctx, { type: 'brass', metal: metal, trim: trim, size: 1.5 * (1 + (tier - 1) * 0.05), aura: tier >= 5 ? 'rgba(190,150,255,0.4)' : null }, a);
  };

  A.binder = function (ctx, L, a) {
    const tier = L.tier || 1, t = a.t || 0, ph = a.walk || 0, mv = a.moving ? 1 : 0, p = a.atk || 0;
    const cover = ['#8a8a9a', '#3a6ad0', '#d03a3a', '#ffc62a', '#ff5ad8'][tier - 1];
    ctx.save(); ctx.scale(1.25, 1.25); ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    if (tier >= 5) { const g = ctx.createRadialGradient(0, -50, 4, 0, -50, 60); g.addColorStop(0, 'rgba(255,120,240,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circ(ctx, 0, -50, 60); ctx.fill(); }
    const sw = Math.sin(ph) * 5 * mv;
    rr(ctx, -14 + sw, -16, 10, 16, 3); fs(ctx, '#2a2a3a');
    rr(ctx, 4 - sw, -16, 10, 16, 3); fs(ctx, '#3a3a4a');
    // back arm
    rr(ctx, -30, -60, 9, 26, 4); fs(ctx, shade(cover, -0.25));
    // pages
    rr(ctx, -20, -86, 42, 72, 3); fs(ctx, '#ffffff');
    ctx.strokeStyle = '#ccd'; ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(18 + (i % 2), -82 + i * 11); ctx.lineTo(21, -82 + i * 11); ctx.stroke(); }
    ctx.lineWidth = 2.2;
    // cover
    rr(ctx, -24, -90, 42, 76, 5); fs(ctx, cover);
    if (tier >= 5) discoTiles(ctx, -24, -90, 42, 76, t);
    rr(ctx, -24, -90, 9, 76, 3); fs(ctx, shade(cover, -0.3));
    for (let i = 0; i < 3; i++) { circ(ctx, -19.5, -78 + i * 22, 3.2); fs(ctx, '#e0e4ea'); }
    // label
    rr(ctx, -10, -60, 24, 12, 2); fs(ctx, '#ffffff');
    ctx.fillStyle = '#2a2a2a'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('POLICY', 2, -52);
    // sticky notes
    const notes = ['#ffe84a', '#ff9ad8', '#9affd8', '#ffb04a', '#b0d0ff'];
    for (let i = 0; i < tier + 1; i++) { ctx.save(); ctx.translate(-8 + (i * 13) % 30, -34 + Math.floor(i / 3) * 9); ctx.rotate((i % 2 ? 0.2 : -0.15)); ctx.fillStyle = notes[i % 5]; ctx.fillRect(-4, -4, 8, 8); ctx.restore(); }
    // googly eyes
    for (const ex of [-6, 9]) {
      circ(ctx, ex, -76, 6); fs(ctx, '#ffffff');
      circ(ctx, ex + 2 + Math.sin(t * 7 + ex) * 1.5, -75 + Math.cos(t * 5 + ex) * 1.5, 2.6); fs(ctx, '#111', false);
    }
    ctx.beginPath(); ctx.moveTo(-3, -66); ctx.lineTo(8, -66); ctx.strokeStyle = OUT; ctx.stroke();
    // front arm with memo
    const ang = p > 0 ? (p < 0.4 ? lerp(-0.4, -2.6, p / 0.4) : lerp(-2.6, -0.2, Math.min(1, (p - 0.4) / 0.3))) : -0.4 + Math.sin(t * 2) * 0.06;
    ctx.save(); ctx.translate(16, -60); ctx.rotate(ang);
    rr(ctx, -4.5, -3, 9, 24, 4); fs(ctx, shade(cover, 0.1));
    ctx.save(); ctx.translate(0, 26); ctx.rotate(0.3); ctx.fillStyle = '#ffe84a'; ctx.fillRect(-7, -7, 14, 14); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.strokeRect(-7, -7, 14, 14); ctx.restore();
    ctx.restore();
    ctx.restore();
  };

  A.unicorn = function (ctx, L, a) {
    const tier = L.tier || 1, t = a.t || 0, ph = a.walk || 0, mv = a.moving ? 1 : 0, p = a.atk || 0;
    const maneCols = tier >= 5 ? RAINBOW : [['#ff8ad8'], ['#8ad0ff'], ['#b08aff'], ['#ffd040']][tier - 1];
    ctx.save(); ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    if (tier >= 5) { const g = ctx.createRadialGradient(0, -40, 4, 0, -40, 60); g.addColorStop(0, 'rgba(255,160,240,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; circ(ctx, 0, -40, 60); ctx.fill(); }
    const legs = [[-18, 0], [-10, PI], [12, PI * 0.5], [19, PI * 1.5]];
    legs.forEach(([x, o], i) => {
      const s2 = Math.sin(ph * 1.2 + o) * 8 * mv;
      ctx.beginPath(); ctx.moveTo(x, -28); ctx.lineTo(x + s2, -4);
      ctx.strokeStyle = OUT; ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = i % 2 ? '#e8e8f0' : '#ffffff'; ctx.lineWidth = 5.5; ctx.stroke();
      rr(ctx, x + s2 - 4, -5, 8, 5, 2); ctx.lineWidth = 2; fs(ctx, tier >= 4 ? '#ffc62a' : '#8a7a9a');
    });
    ctx.lineWidth = 2.2;
    // tail
    maneCols.forEach((c, i) => { ctx.beginPath(); ctx.moveTo(-24, -40); ctx.quadraticCurveTo(-42, -40 + i * 3 + Math.sin(t * 6 + i) * 4, -40 - i, -12 + i * 2); ctx.strokeStyle = c; ctx.lineWidth = 6 - Math.min(3, maneCols.length * 0.4); ctx.stroke(); });
    ctx.lineWidth = 2.2;
    ell(ctx, 0, -36, 26, 13); fs(ctx, '#ffffff');
    if (tier >= 3) { // suit jacket
      ctx.beginPath(); ctx.moveTo(-2, -48); ctx.lineTo(22, -46); ctx.quadraticCurveTo(28, -34, 20, -25); ctx.lineTo(-2, -24); ctx.closePath(); fs(ctx, tier >= 4 ? '#2a2a5a' : '#3a3a4a');
      ctx.beginPath(); ctx.moveTo(14, -47); ctx.lineTo(20, -36); ctx.lineTo(24, -44); ctx.closePath(); fs(ctx, '#ffffff', false);
    }
    if (tier >= 2) { rr(ctx, -16, -40, 13, 10, 2); fs(ctx, '#7a4a2a'); ctx.fillStyle = '#ffd040'; ctx.fillRect(-11, -36, 3, 2); }
    // neck & head
    const hb = p > 0 ? Math.sin(p * PI) * 6 : 0;
    ctx.save(); ctx.translate(hb, 0);
    ctx.beginPath(); ctx.moveTo(14, -44); ctx.lineTo(26, -66); ctx.lineTo(36, -62); ctx.lineTo(26, -36); ctx.closePath(); fs(ctx, '#ffffff');
    ctx.save(); ctx.translate(36, -66); ctx.rotate(0.45);
    ell(ctx, 4, 0, 14, 8); fs(ctx, '#ffffff');
    ell(ctx, 14, 2, 5, 5); fs(ctx, '#ffd8e8', false);
    circ(ctx, 15, 1, 1); fs(ctx, '#7a4a5a', false);
    ctx.restore();
    // horn
    ctx.beginPath(); ctx.moveTo(32, -73); ctx.lineTo(44, -96); ctx.lineTo(38, -72); ctx.closePath(); fs(ctx, tier >= 4 ? '#ffc62a' : '#ffe8a0');
    ctx.strokeStyle = '#c89a3a'; ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(34 + i * 2.5, -77 - i * 5); ctx.lineTo(39 + i * 2, -78 - i * 5); ctx.stroke(); } ctx.lineWidth = 2.2;
    // ear, eye
    ctx.beginPath(); ctx.moveTo(28, -72); ctx.lineTo(27, -82); ctx.lineTo(33, -73); ctx.closePath(); fs(ctx, '#ffffff');
    ell(ctx, 35, -67, 3.4, 4); fs(ctx, '#ffffff'); circ(ctx, 36, -66.5, 1.9); fs(ctx, '#2a1a3a', false);
    ctx.beginPath(); ctx.moveTo(33, -71); ctx.lineTo(31, -73); ctx.moveTo(35, -71.5); ctx.lineTo(34.5, -74); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.stroke(); ctx.lineWidth = 2.2;
    // mane
    maneCols.forEach((c, i) => { ctx.beginPath(); ctx.moveTo(28 - i, -74 + i * 2); ctx.quadraticCurveTo(16 - i * 2, -64, 14 - i * 2 + Math.sin(t * 6 + i) * 2, -46); ctx.strokeStyle = c; ctx.lineWidth = maneCols.length > 1 ? 3 : 6; ctx.stroke(); });
    ctx.lineWidth = 2.2;
    // tie
    ctx.beginPath(); ctx.moveTo(26, -44); ctx.lineTo(31, -45); ctx.lineTo(31, -30); ctx.lineTo(28, -27); ctx.lineTo(25, -31); ctx.closePath(); fs(ctx, '#e83a3a');
    ctx.restore();
    ctx.restore();
  };

  A.chicken = function (ctx, L, a) {
    const tier = L.tier || 1, t = a.t || 0, p = a.atk || 0;
    const wing = ['#c8a070', '#ff8a2a', '#ff3a8a', '#ffc62a', '#ff5a1a'][tier - 1];
    const f = Math.sin(t * 14);
    ctx.save(); ctx.translate(0, -58 + Math.sin(t * 4) * 5); ctx.rotate(p > 0 ? Math.sin(p * PI) * 0.3 : 0); ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    if (tier >= 5) { ctx.shadowColor = '#ff7a1a'; ctx.shadowBlur = 18; }
    const wingShape = (d) => { ctx.beginPath(); ctx.moveTo(-4, -4); ctx.quadraticCurveTo(-14, -28 - f * 12 * d, -34, -24 - f * 16 * d); ctx.lineTo(-26, -16 - f * 8 * d); ctx.lineTo(-30, -10 - f * 6 * d); ctx.lineTo(-20, -6); ctx.lineTo(-22, 0); ctx.closePath(); };
    ctx.save(); ctx.scale(-0.8, 1); ctx.translate(-6, 0); wingShape(1); fs(ctx, shade(wing, -0.2)); ctx.restore();
    // tail
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-12, 0); ctx.quadraticCurveTo(-26, -10 + i * 6, -34 - i * 2, -16 + i * 10); ctx.quadraticCurveTo(-24, -2 + i * 4, -12, 4); ctx.closePath(); fs(ctx, i === 1 ? '#ffd040' : wing); }
    ctx.shadowBlur = 0;
    // legs
    ctx.strokeStyle = '#ff9a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, 12); ctx.lineTo(-4 + Math.sin(t * 5) * 2, 24); ctx.moveTo(4, 12); ctx.lineTo(5 + Math.cos(t * 5) * 2, 24); ctx.stroke(); ctx.lineWidth = 2.2;
    // body (it's a chicken)
    ell(ctx, 0, 0, 17, 15); fs(ctx, '#ffffff');
    // costume zipper
    ctx.beginPath(); ctx.moveTo(6, -10); ctx.lineTo(8, 12); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 1.2; ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(5.5, -8 + i * 4.5); ctx.lineTo(8.5, -8 + i * 4.5); ctx.stroke(); }
    rr(ctx, 5, -12, 4, 4, 1); ctx.fillStyle = '#c8c8c8'; ctx.fill(); ctx.lineWidth = 2.2;
    // head
    circ(ctx, 13, -16, 9); fs(ctx, '#ffffff');
    ctx.beginPath(); ctx.moveTo(8, -24); ctx.quadraticCurveTo(10, -32, 13, -26); ctx.quadraticCurveTo(15, -33, 18, -25); fs(ctx, '#e83a3a');
    // fake phoenix crest (costume)
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(8 - i * 2, -22); ctx.quadraticCurveTo(0 - i * 5, -34 - i * 3, -6 - i * 5, -30 - i * 2); ctx.quadraticCurveTo(0 - i * 4, -26, 7 - i * 2, -19); ctx.closePath(); fs(ctx, i === 1 ? '#ffd040' : wing); }
    ctx.beginPath(); ctx.moveTo(20, -18); ctx.lineTo(29, -15); ctx.lineTo(20, -12); ctx.closePath(); fs(ctx, '#ffb020');
    ctx.beginPath(); ctx.moveTo(20, -11); ctx.quadraticCurveTo(22, -5, 18, -6); fs(ctx, '#e83a3a');
    ell(ctx, 15, -18, 3, 3.6); fs(ctx, '#ffffff'); circ(ctx, 16, -17.5, 1.7); fs(ctx, '#111', false);
    // fake mask strap
    ctx.beginPath(); ctx.moveTo(4, -20); ctx.lineTo(20, -22); ctx.strokeStyle = wing; ctx.lineWidth = 2; ctx.stroke(); ctx.lineWidth = 2.2;
    // front wing
    wingShape(-1); fs(ctx, wing);
    if (tier === 1) { ctx.fillStyle = 'rgba(220,220,200,0.9)'; ctx.fillRect(-20, -12, 10, 4); }
    if (tier === 3) { ctx.fillStyle = '#ffffff'; for (let i = 0; i < 6; i++) { circ(ctx, -8 - i * 4, -10 - (i % 2) * 5 - f * 3, 1.2); ctx.fill(); } }
    if (tier >= 5) { for (let i = 0; i < 6; i++) { const fl = Math.sin(t * 12 + i) * 4; ctx.beginPath(); ctx.moveTo(-30 + i * 6, -14 - f * 8); ctx.quadraticCurveTo(-32 + i * 6, -26 + fl, -27 + i * 6, -32 + fl); ctx.quadraticCurveTo(-24 + i * 6, -22, -24 + i * 6, -14); ctx.closePath(); ctx.fillStyle = i % 2 ? 'rgba(255,220,60,0.85)' : 'rgba(255,90,20,0.85)'; ctx.fill(); } }
    ctx.restore();
  };

  A.printer = function (ctx, L, a) {
    const t = a.t || 0, ph = a.walk || 0, mv = a.moving ? 1 : 0, p = a.atk || 0;
    ctx.save(); ctx.lineWidth = 2.2; ctx.lineJoin = 'round';
    for (let i = 0; i < 4; i++) { const sw = Math.sin(ph * 1.3 + i * 1.6) * 4 * mv; ctx.beginPath(); ctx.moveTo(-18 + i * 12, -14); ctx.lineTo(-20 + i * 12 + sw, 0); ctx.strokeStyle = OUT; ctx.lineWidth = 3.5; ctx.stroke(); }
    ctx.lineWidth = 2.2;
    rr(ctx, -26, -52, 52, 40, 6); fs(ctx, '#d8d8d0');
    rr(ctx, -26, -58, 52, 10, 4); fs(ctx, '#b8b8b0');
    rr(ctx, -18, -30, 40, 6, 2); fs(ctx, '#2a2a2a');
    // paper tongue
    const lick = p > 0 ? Math.sin(p * PI) * 14 : Math.sin(t * 3) * 3;
    ctx.beginPath(); ctx.moveTo(18, -28); ctx.lineTo(30 + lick, -26 + lick * 0.3); ctx.lineTo(28 + lick, -14 + lick * 0.4); ctx.lineTo(16, -25); ctx.closePath(); fs(ctx, '#ffffff');
    // screen face
    rr(ctx, -6, -48, 24, 13, 2); fs(ctx, '#1a2a1a');
    ctx.strokeStyle = '#ff3a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-2, -45); ctx.lineTo(4, -42); ctx.moveTo(14, -45); ctx.lineTo(8, -42); ctx.stroke();
    ctx.fillStyle = '#ff3a3a'; ctx.fillRect(3, -39, 6, 1.5);
    ctx.fillStyle = Math.sin(t * 8) > 0 ? '#ff3a3a' : '#5aff5a'; circ(ctx, -18, -44, 2.4); ctx.fill();
    ctx.fillStyle = '#2a2a2a'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('PC LOAD', -6, -18); 
    ctx.restore();
  };

  A.plane = function (ctx, L, a) {
    const t = a.t || 0;
    ctx.save(); ctx.translate(0, -46 + Math.sin(t * 5) * 5); ctx.rotate(Math.sin(t * 3) * 0.1); ctx.lineWidth = 2; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-22, -14); ctx.lineTo(-12, 0); ctx.closePath(); fs(ctx, '#ffffff');
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-22, 10); ctx.lineTo(-12, 0); ctx.closePath(); fs(ctx, '#e8eef6');
    ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(-16, 4); ctx.lineTo(-12, 0); ctx.closePath(); fs(ctx, '#d0d8e4');
    ctx.fillStyle = '#9aa'; ctx.fillRect(-14, -6, 14, 1); ctx.fillRect(-12, -3, 10, 1);
    ell(ctx, 8, -4, 2.5, 3); fs(ctx, '#ffffff'); circ(ctx, 8.6, -3.6, 1.3); fs(ctx, '#111', false);
    ctx.beginPath(); ctx.moveTo(5, -8); ctx.lineTo(11, -6); ctx.strokeStyle = OUT; ctx.stroke();
    ctx.restore();
  };

  /* Dispatch by look.kind */
  A.drawLook = function (ctx, L, a) {
    switch (L.kind) {
      case 'beast': return A.beast(ctx, L, a);
      case 'rider': return A.rider(ctx, L, a);
      case 'slime': return A.slime(ctx, L, a);
      case 'bat': return A.bat(ctx, L, a);
      case 'wraith': return A.wraith(ctx, L, a);
      case 'golem': return A.golem(ctx, L, a);
      case 'drake': return A.drake(ctx, Object.assign({ size: 1.25 }, L), a);
      case 'wyrm': return A.wyrm(ctx, Object.assign({ size: 1.3 }, L), a);
      case 'titan': return A.titan(ctx, L, a);
      case 'binder': return A.binder(ctx, L, a);
      case 'unicorn': return A.unicorn(ctx, L, a);
      case 'chicken': return A.chicken(ctx, L, a);
      case 'printer': return A.printer(ctx, L, a);
      case 'plane': return A.plane(ctx, L, a);
      default: return A.humanoid(ctx, L, a);
    }
  };

  /* Portraits for UI cards (cached data URLs) */
  const portraitCache = {};
  A.portrait = function (key, look, px, opts) {
    const ck = key + '|' + px;
    if (portraitCache[ck]) return portraitCache[ck];
    const c = document.createElement('canvas');
    c.width = c.height = px;
    const ctx = c.getContext('2d');
    const big = look.kind === 'titan' || look.kind === 'golem' || look.kind === 'drake' || look.kind === 'wyrm' || look.kind === 'binder' || look.kind === 'unicorn';
    const sc = px / (big ? (look.kind === 'unicorn' ? 112 : look.kind === 'binder' ? 128 : 150) : look.kind === 'rider' ? 110 : look.kind === 'chicken' ? 92 : 90) / (look.size && !big ? Math.max(1, look.size * 0.9) : 1);
    ctx.translate(px / 2 - (look.kind === 'drake' ? px * 0.12 : look.kind === 'unicorn' ? px * 0.1 : 0), px * (look.kind === 'bat' ? 0.92 : look.kind === 'chicken' ? 0.98 : 0.94));
    ctx.scale(sc, sc);
    if (opts && opts.flip) ctx.scale(-1, 1);
    A.drawLook(ctx, look, { t: 0.3, walk: 0, moving: false, atk: 0 });
    portraitCache[ck] = c.toDataURL();
    return portraitCache[ck];
  };

  /* ---------- projectiles & effects ---------- */
  A.projectile = function (ctx, p, t) {
    ctx.save(); ctx.translate(p.x, p.y);
    const ang = Math.atan2(p.vy, p.vx);
    switch (p.kind) {
      case 'arrow':
        ctx.rotate(ang); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-14, 0); ctx.lineTo(8, 0); ctx.strokeStyle = '#5a3a1a'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(14, 0); ctx.lineTo(8, 3); ctx.closePath(); ctx.fillStyle = '#ddd'; ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-14, -3, 5, 2); ctx.fillRect(-14, 1, 5, 2);
        break;
      case 'stone':
        circ(ctx, 0, 0, 4); fs(ctx, '#8a8a8a');
        break;
      case 'fireball': case 'meteor': {
        const r = p.kind === 'meteor' ? 22 : 8;
        ctx.rotate(ang);
        const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 2.2);
        g.addColorStop(0, '#fff6c0'); g.addColorStop(0.3, '#ffb030'); g.addColorStop(0.7, 'rgba(255,80,20,0.6)'); g.addColorStop(1, 'rgba(255,40,0,0)');
        ctx.fillStyle = g; ell(ctx, -r * 0.6, 0, r * 2.2, r * 1.4); ctx.fill();
        circ(ctx, 0, 0, r * 0.7); ctx.fillStyle = '#fff3b0'; ctx.fill();
        break;
      }
      case 'frost':
        ctx.rotate(ang + t * 10);
        ctx.shadowColor = '#9be8ff'; ctx.shadowBlur = 12;
        ctx.beginPath(); for (let i = 0; i < 6; i++) { const aa = i * PI / 3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(aa) * 8, Math.sin(aa) * 8); }
        ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 2.5; ctx.stroke();
        break;
      case 'spark':
        ctx.shadowColor = p.color || '#7dffb0'; ctx.shadowBlur = 14;
        circ(ctx, 0, 0, 5); ctx.fillStyle = p.color || '#c8ffd8'; ctx.fill();
        break;
      case 'dark':
        ctx.shadowColor = '#b04aff'; ctx.shadowBlur = 14;
        circ(ctx, 0, 0, 7); ctx.fillStyle = '#5a1a8a'; ctx.fill();
        circ(ctx, 0, 0, 3); ctx.fillStyle = '#e0b0ff'; ctx.fill();
        break;
      case 'staple':
        ctx.rotate(ang); ctx.strokeStyle = '#d0d8e0'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-5, 3); ctx.lineTo(-5, -3); ctx.lineTo(5, -3); ctx.lineTo(5, 3); ctx.stroke();
        break;
      case 'paper':
        ctx.rotate(t * 12); ctx.fillStyle = '#ffffff'; ctx.fillRect(-6, -8, 12, 16); ctx.strokeStyle = OUT; ctx.lineWidth = 1.2; ctx.strokeRect(-6, -8, 12, 16); ctx.fillStyle = '#9aa'; ctx.fillRect(-4, -5, 8, 1); ctx.fillRect(-4, -2, 8, 1); ctx.fillRect(-4, 1, 8, 1);
        break;
      case 'syringe':
        ctx.rotate(ang); ctx.fillStyle = 'rgba(230,250,255,0.95)'; ctx.fillRect(-8, -2.5, 12, 5); ctx.fillStyle = '#ff4a6a'; ctx.fillRect(-6, -1.5, 8, 3); ctx.strokeStyle = '#ccc'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(11, 0); ctx.moveTo(-8, 0); ctx.lineTo(-12, 0); ctx.stroke();
        break;
      case 'egg':
        ctx.rotate(t * 8); ell(ctx, 0, 0, 5, 6.5); ctx.fillStyle = '#fff8e8'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.4; ctx.stroke();
        break;
      case 'wizz': {
        const cols = ['#ff7aff', '#7affff', '#ffff7a', '#7aff7a'];
        const c = cols[Math.floor(t * 10) % 4];
        ctx.shadowColor = c; ctx.shadowBlur = 14;
        ctx.rotate(t * 9); ctx.fillStyle = c; ctx.beginPath(); for (let j = 0; j < 5; j++) { const an = j * 1.2566; ctx.lineTo(Math.cos(an) * 9, Math.sin(an) * 9); ctx.lineTo(Math.cos(an + 0.63) * 4, Math.sin(an + 0.63) * 4); } ctx.closePath(); ctx.fill();
        break;
      }
      case 'tower':
        ctx.rotate(ang); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(8, 0); ctx.strokeStyle = '#3a2a1a'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(8, -3); ctx.lineTo(14, 0); ctx.lineTo(8, 3); ctx.closePath(); ctx.fillStyle = '#ffd040'; ctx.fill();
        break;
    }
    ctx.restore();
  };

  /* ---------- backgrounds ---------- */
  A.renderBackground = function (theme, W, H, seed) {
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const ctx = c.getContext('2d');
    const R = rng(seed || 7);
    const LY = G.LANE_Y;
    const horizon = 300;
    // sky
    const sg = ctx.createLinearGradient(0, 0, 0, horizon);
    sg.addColorStop(0, theme.sky[0]); sg.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, horizon + 10);
    // sun / moon
    const sx = W * 0.72, sy = 105;
    const sunG = ctx.createRadialGradient(sx, sy, 10, sx, sy, 140);
    sunG.addColorStop(0, rgba(theme.sun, 0.8)); sunG.addColorStop(1, rgba(theme.sun, 0));
    ctx.fillStyle = sunG; ctx.fillRect(sx - 140, sy - 140, 280, 280);
    circ(ctx, sx, sy, theme.moon ? 34 : 40); ctx.fillStyle = theme.sun; ctx.fill();
    if (theme.moon) { circ(ctx, sx + 14, sy - 8, 30); ctx.fillStyle = theme.sky[0]; ctx.fill(); for (let i = 0; i < 70; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + R() * 0.6) + ')'; ctx.fillRect(R() * W, R() * 220, 2, 2); } }
    // clouds
    if (theme.deco !== 'rock' && theme.deco !== 'cubicle') {
      for (let i = 0; i < 6; i++) {
        const cx = R() * W, cy = 40 + R() * 120, cw = 60 + R() * 70;
        ctx.fillStyle = theme.fx === 'firefly' ? 'rgba(220,240,220,0.35)' : 'rgba(255,255,255,0.75)';
        for (let k = 0; k < 5; k++) { ell(ctx, cx + (k - 2) * cw * 0.3, cy + Math.sin(k * 1.7) * 6, cw * 0.32, cw * 0.18); ctx.fill(); }
      }
    } else {
      for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(30,20,25,0.25)'; ell(ctx, R() * W, 50 + R() * 140, 90 + R() * 80, 20 + R() * 15); ctx.fill(); }
    }
    // far ridge
    ctx.fillStyle = theme.far;
    ctx.beginPath(); ctx.moveTo(0, horizon);
    let x = 0;
    const peaks = [];
    while (x <= W + 80) {
      const h = theme.deco === 'cactus' ? 40 + R() * 40 : 70 + R() * 110;
      const px = x + 40 + R() * 60;
      ctx.lineTo(px, horizon - h);
      peaks.push([px, horizon - h]);
      x = px + 40 + R() * 70;
      ctx.lineTo(x, horizon - 20 - R() * 30);
    }
    ctx.lineTo(W, horizon); ctx.closePath(); ctx.fill();
    if (theme.deco === 'pine' || theme.deco === 'tree') {
      ctx.fillStyle = theme.deco === 'pine' ? '#ffffff' : 'rgba(255,255,255,0.0)';
      peaks.forEach(([px, py]) => { if (py < horizon - 120 || theme.deco === 'pine') { ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px - 18, py + 22); ctx.lineTo(px - 6, py + 16); ctx.lineTo(px + 4, py + 24); ctx.lineTo(px + 18, py + 22); ctx.closePath(); ctx.fill(); } });
    }
    if (theme.deco === 'rock') { // volcano
      const vx = W * 0.4;
      ctx.fillStyle = shade(theme.far, -0.2); ctx.beginPath(); ctx.moveTo(vx - 260, horizon); ctx.lineTo(vx - 50, 90); ctx.lineTo(vx + 50, 90); ctx.lineTo(vx + 260, horizon); ctx.closePath(); ctx.fill();
      const lg = ctx.createLinearGradient(0, 90, 0, 220); lg.addColorStop(0, '#ffcf40'); lg.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(vx - 50, 90); ctx.lineTo(vx - 20, 200); ctx.lineTo(vx + 4, 140); ctx.lineTo(vx + 30, 230); ctx.lineTo(vx + 50, 90); ctx.closePath(); ctx.fill();
      for (let i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(60,40,40,0.5)'; circ(ctx, vx - 30 + i * 18, 70 - i * 14, 26 + i * 6); ctx.fill(); }
    }
    if (theme.deco === 'cubicle') { // infernal office tower
      const cx = W * 0.55;
      ctx.fillStyle = '#120c1c';
      ctx.fillRect(cx - 70, 60, 140, 240);
      ctx.fillRect(cx - 150, 150, 80, 150); ctx.fillRect(cx + 70, 120, 90, 180);
      ctx.beginPath(); ctx.moveTo(cx - 70, 60); ctx.lineTo(cx, 10); ctx.lineTo(cx + 70, 60); ctx.fill();
      for (let i = 0; i < 70; i++) { ctx.fillStyle = R() < 0.6 ? 'rgba(255,220,120,0.75)' : 'rgba(80,60,100,0.8)'; const wx = cx - 150 + Math.floor(R() * 30) * 10, wy = 70 + Math.floor(R() * 22) * 10; if ((wx > cx - 70 && wx < cx + 64) || (wx < cx - 70 && wy > 155) || (wx > cx + 70 && wy > 125)) ctx.fillRect(wx, wy, 5, 6); }
      ctx.fillStyle = '#ff3a3a'; ctx.font = 'bold 18px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 12; ctx.fillText('NETHER INC.', cx, 54); ctx.shadowBlur = 0;
    }
    // mid hills
    ctx.fillStyle = theme.mid;
    ctx.beginPath(); ctx.moveTo(0, horizon + 20);
    for (let xx = 0; xx <= W; xx += 20) ctx.lineTo(xx, horizon - 10 - Math.sin(xx * 0.008 + seed) * 22 - Math.sin(xx * 0.021) * 10);
    ctx.lineTo(W, horizon + 20); ctx.closePath(); ctx.fill();
    // decorations on hills
    for (let i = 0; i < Math.floor(W / 45); i++) {
      const dx = R() * W;
      if (dx < 330) continue;
      const dy = horizon - 4 - Math.sin(dx * 0.008 + seed) * 22 - Math.sin(dx * 0.021) * 10 + 14 + R() * 6;
      decoration(ctx, theme, dx, dy, 0.6 + R() * 0.4, R);
    }
    // ground
    const gg = ctx.createLinearGradient(0, horizon, 0, H);
    gg.addColorStop(0, theme.ground); gg.addColorStop(1, theme.ground2);
    ctx.fillStyle = gg; ctx.fillRect(0, horizon, W, H - horizon);
    // ground speckles
    for (let i = 0; i < W * 0.35; i++) {
      const px = R() * W, py = horizon + 4 + R() * (H - horizon);
      ctx.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.12)';
      ctx.fillRect(px, py, 2 + R() * 3, 2);
    }
    // region ground features
    if (theme.fx === 'firefly') for (let i = 0; i < 7; i++) { const px = 300 + R() * (W - 300), py = 400 + (i % 2) * 100 + R() * 10; ctx.fillStyle = 'rgba(40,70,60,0.55)'; ell(ctx, px, py, 40 + R() * 40, 8 + R() * 5); ctx.fill(); }
    if (theme.fx === 'ember') for (let i = 0; i < 6; i++) { const px = 250 + R() * (W - 300), py = 395 + (i % 2) * 100; ctx.strokeStyle = 'rgba(255,110,20,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); for (let k = 0; k < 5; k++) ctx.lineTo(px + k * 14, py + (k % 2 ? 4 : -4)); ctx.stroke(); }
    // lanes
    LY.forEach((ly, li) => {
      const top = ly - 38, h = 70;
      const lg = ctx.createLinearGradient(0, top, 0, top + h);
      lg.addColorStop(0, rgba(theme.path, 0)); lg.addColorStop(0.15, rgba(theme.path, 0.95)); lg.addColorStop(0.85, rgba(theme.path, 0.95)); lg.addColorStop(1, rgba(theme.path, 0));
      ctx.fillStyle = lg; ctx.fillRect(110, top, W - 110, h);
      ctx.strokeStyle = rgba('#000000', 0.08); ctx.lineWidth = 3;
      for (const off of [-14, 14]) { ctx.beginPath(); ctx.moveTo(140, ly + off); for (let xx = 140; xx < W; xx += 40) ctx.lineTo(xx, ly + off + Math.sin(xx * 0.05 + li) * 2); ctx.stroke(); }
      for (let i = 0; i < W / 30; i++) { ctx.fillStyle = 'rgba(80,60,40,0.35)'; ell(ctx, 140 + R() * (W - 140), ly - 20 + R() * 40, 2 + R() * 3, 1.5 + R() * 1.5); ctx.fill(); }
    });
    // tufts between lanes
    for (let i = 0; i < W / 18; i++) {
      const px = 170 + R() * (W - 170);
      const band = Math.floor(R() * 4);
      const py = [302, 400, 500, 600][band] + R() * 8;
      tuft(ctx, theme, px, py, R);
    }
    // bottom foreground
    const fg = ctx.createLinearGradient(0, 600, 0, H);
    fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = fg; ctx.fillRect(0, 600, W, H - 600);
    return c;
  };

  function tuft(ctx, theme, x, y, R) {
    const col = theme.deco === 'pine' ? '#ffffff' : theme.deco === 'cactus' ? '#c8a050' : theme.deco === 'rock' ? '#6a4a40' : theme.deco === 'cubicle' ? '#5a4a6a' : shade(theme.ground2, -0.2);
    if (theme.deco === 'pine') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ell(ctx, x, y, 10, 4); ctx.fill(); return; }
    if (theme.deco === 'rock' || theme.deco === 'cubicle') { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 6, y); ctx.lineTo(x - 2, y - 7 - R() * 4); ctx.lineTo(x + 5, y); ctx.closePath(); ctx.fill(); return; }
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x + k * 2, y); ctx.quadraticCurveTo(x + k * 3, y - 6, x + k * 4.5, y - 9 - R() * 4); ctx.stroke(); }
    if (theme.deco === 'house' && R() < 0.15) { circ(ctx, x, y - 10, 2.5); ctx.fillStyle = ['#ff6a8a', '#fff06a', '#ffffff'][Math.floor(R() * 3)]; ctx.fill(); }
  }

  function decoration(ctx, theme, x, y, s, R) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    switch (theme.deco) {
      case 'tree':
        ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-4, -30, 8, 30);
        ctx.fillStyle = shade(theme.mid, 0.1); circ(ctx, 0, -44, 22); ctx.fill(); ctx.stroke();
        ctx.fillStyle = shade(theme.mid, 0.25); circ(ctx, -8, -50, 10); ctx.fill();
        break;
      case 'pine':
        ctx.fillStyle = '#5a3a2a'; ctx.fillRect(-3, -14, 6, 14);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = '#2f5a4a'; ctx.beginPath(); ctx.moveTo(-20 + i * 4, -12 - i * 16); ctx.lineTo(0, -40 - i * 16); ctx.lineTo(20 - i * 4, -12 - i * 16); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-8 + i * 2, -30 - i * 16); ctx.lineTo(0, -40 - i * 16); ctx.lineTo(8 - i * 2, -30 - i * 16); ctx.closePath(); ctx.fill(); }
        break;
      case 'cactus':
        ctx.fillStyle = '#4a8a4a';
        rr(ctx, -6, -46, 12, 46, 6); ctx.fill(); ctx.stroke();
        rr(ctx, -20, -34, 8, 18, 4); ctx.fill(); ctx.stroke(); rr(ctx, -20, -20, 16, 7, 3); ctx.fill();
        rr(ctx, 12, -40, 8, 16, 4); ctx.fill(); ctx.stroke(); rr(ctx, 4, -28, 16, 7, 3); ctx.fill();
        break;
      case 'reed':
        ctx.strokeStyle = '#3a5a2a'; ctx.lineWidth = 3;
        for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 4, 0); ctx.quadraticCurveTo(k * 6, -20, k * 8, -40); ctx.stroke(); }
        ctx.fillStyle = '#6a4a2a'; for (let k = -1; k <= 1; k++) { rr(ctx, k * 8 - 2, -44, 5, 12, 2); ctx.fill(); }
        break;
      case 'rock':
        ctx.fillStyle = '#2a1a1a'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-10, -26); ctx.lineTo(2, -18); ctx.lineTo(10, -34); ctx.lineTo(20, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'cubicle':
        ctx.fillStyle = '#2a2236'; ctx.fillRect(-22, -30, 44, 30); ctx.strokeRect(-22, -30, 44, 30);
        ctx.fillStyle = '#3a3048'; ctx.fillRect(-20, -28, 18, 26); ctx.fillStyle = '#ffd8a0'; ctx.fillRect(6, -22, 10, 7);
        break;
      case 'house': {
        const cols = ['#ffb0c8', '#b0e0ff', '#fff0a0', '#c8ffb0', '#e0c8ff'];
        const c = cols[Math.floor(R() * cols.length)];
        ctx.fillStyle = c; ctx.fillRect(-20, -30, 40, 30); ctx.strokeRect(-20, -30, 40, 30);
        ctx.fillStyle = '#c84a4a'; ctx.beginPath(); ctx.moveTo(-25, -30); ctx.lineTo(0, -50); ctx.lineTo(25, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-5, -16, 10, 16);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(8, -24, 8, 8); ctx.fillRect(-16, -24, 8, 8);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; for (let k = -34; k <= 34; k += 6) { ctx.beginPath(); ctx.moveTo(k, 2); ctx.lineTo(k, -8); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(-34, -4); ctx.lineTo(34, -4); ctx.stroke();
        break;
      }
    }
    ctx.restore();
  }

  /* ---------- castle, mine, fortress ---------- */
  A.castle = function (ctx, t, hpRatio, spawnLane, towerLvl, selected) {
    const LY = G.LANE_Y;
    ctx.save(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT; ctx.lineJoin = 'round';
    const stone = '#b4ada0', dark = '#8a8378';
    // back keep
    rr(ctx, -10, 150, 100, 480, 6); ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
    // main tower
    rr(ctx, 20, 120, 70, 200, 4); ctx.fillStyle = stone; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#8a3ae0'; ctx.beginPath(); ctx.moveTo(10, 124); ctx.lineTo(55, 50); ctx.lineTo(100, 124); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#b06aff'; ctx.beginPath(); ctx.moveTo(55, 50); ctx.lineTo(40, 124); ctx.lineTo(28, 124); ctx.closePath(); ctx.fill();
    // flag
    ctx.beginPath(); ctx.moveTo(55, 52); ctx.lineTo(55, 18); ctx.stroke();
    ctx.fillStyle = '#ffd040'; ctx.beginPath(); ctx.moveTo(55, 18);
    for (let i = 0; i <= 6; i++) ctx.lineTo(55 + i * 6, 22 + Math.sin(t * 5 - i) * 3);
    for (let i = 6; i >= 0; i--) ctx.lineTo(55 + i * 6, 34 + Math.sin(t * 5 - i) * 3);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // window
    rr(ctx, 46, 160, 18, 28, 9); ctx.fillStyle = '#2a2a3a'; ctx.fill(); ctx.stroke();
    // archer on the tower
    if (towerLvl > 0) {
      ctx.save(); ctx.translate(62, 122);
      A.humanoid(ctx, { skin: '#f2c49b', head: 'messy', hair: '#c83a1a', weapon: 'bow', shirt: '#ffe040', legs: '#333', size: 0.7, noLegs: true, sunglasses: true }, { t: t, walk: 0, atk: (t * 0.8) % 1 });
      ctx.restore();
    }
    // front wall with gates per lane
    rr(ctx, 70, 250, 82, 380, 4); ctx.fillStyle = stone; ctx.fill(); ctx.stroke();
    // bricks
    ctx.strokeStyle = 'rgba(60,50,40,0.35)'; ctx.lineWidth = 1.5;
    for (let y = 262; y < 625; y += 18) { ctx.beginPath(); ctx.moveTo(72, y); ctx.lineTo(150, y); ctx.stroke(); for (let x = 72 + ((y / 18) % 2) * 12; x < 150; x += 24) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke(); } }
    ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
    // crenellations
    for (let i = 0; i < 4; i++) { rr(ctx, 70 + i * 22, 234, 16, 20, 2); ctx.fillStyle = stone; ctx.fill(); ctx.stroke(); }
    LY.forEach((ly, i) => {
      ctx.beginPath(); ctx.moveTo(118, ly + 22); ctx.lineTo(118, ly - 12); ctx.arc(134, ly - 12, 16, PI, 0); ctx.lineTo(150, ly + 22); ctx.closePath();
      ctx.fillStyle = '#3a2a1a'; ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,160,90,0.5)'; ctx.lineWidth = 2;
      for (let x = 124; x < 150; x += 7) { ctx.beginPath(); ctx.moveTo(x, ly - 22); ctx.lineTo(x, ly + 22); ctx.stroke(); }
      ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
      if (i === spawnLane) {
        const pulse = 0.6 + Math.sin(t * 6) * 0.25;
        ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = '#ffe060';
        ctx.beginPath(); ctx.moveTo(158, ly - 16); ctx.lineTo(178, ly); ctx.lineTo(158, ly + 16); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    });
    // banners
    for (const by of [300, 500]) {
      ctx.fillStyle = '#ff4a9a'; ctx.beginPath(); ctx.moveTo(82, by); ctx.lineTo(106, by); ctx.lineTo(106, by + 38); ctx.lineTo(94, by + 30); ctx.lineTo(82, by + 38); ctx.closePath(); ctx.fill(); ctx.stroke();
      // royal sandwich emblem
      ctx.lineWidth = 1.2;
      rr(ctx, 87, by + 7, 14, 4, 2); ctx.fillStyle = '#e8b060'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#5ad84a'; ctx.fillRect(86, by + 11, 16, 2.5);
      ctx.fillStyle = '#ff5a3a'; ctx.fillRect(87, by + 13.5, 14, 2);
      rr(ctx, 87, by + 15.5, 14, 4, 2); ctx.fillStyle = '#e8b060'; ctx.fill(); ctx.stroke();
      ctx.lineWidth = 2.5;
    }
    // sign
    ctx.save(); ctx.translate(112, 214); ctx.rotate(-0.06);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-2, 6, 4, 20);
    rr(ctx, -42, -12, 84, 22, 3); ctx.fillStyle = '#c8905a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a1a0a'; ctx.font = 'bold 11px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GLORPIA (pls no)', 0, 3);
    ctx.restore();
    // damage
    if (hpRatio < 0.7) {
      ctx.strokeStyle = 'rgba(30,20,10,0.8)'; ctx.lineWidth = 2;
      const cracks = hpRatio < 0.35 ? 6 : 3;
      for (let i = 0; i < cracks; i++) { const cx = 80 + (i * 37) % 60, cy = 270 + i * 55; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + 8, cy + 10); ctx.lineTo(cx + 2, cy + 20); ctx.lineTo(cx + 12, cy + 30); ctx.stroke(); }
    }
    ctx.restore();
  };

  A.mine = function (ctx, x, y, t) {
    ctx.save(); ctx.translate(x, y); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
    ctx.fillStyle = '#8a7a6a'; ctx.beginPath(); ctx.moveTo(-70, 30); ctx.quadraticCurveTo(-60, -50, 0, -56); ctx.quadraticCurveTo(60, -50, 70, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#9a8a7a'; ctx.beginPath(); ctx.moveTo(-40, -30); ctx.quadraticCurveTo(-20, -52, 10, -48); ctx.quadraticCurveTo(-20, -36, -40, -30); ctx.fill();
    ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.moveTo(-24, 30); ctx.lineTo(-24, -6); ctx.arc(0, -6, 24, PI, 0); ctx.lineTo(24, 30); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5a2a'; ctx.fillRect(-28, -14, 6, 44); ctx.fillRect(22, -14, 6, 44); ctx.fillRect(-30, -20, 60, 7);
    ctx.strokeRect(-28, -14, 6, 44); ctx.strokeRect(22, -14, 6, 44); ctx.strokeRect(-30, -20, 60, 7);
    // crystals
    const cols = ['#5ae0ff', '#ff5ad8', '#ffe05a', '#7aff7a'];
    [[-52, 10, 0], [-40, -22, 1], [44, 6, 2], [36, -28, 3], [54, -6, 0]].forEach(([cx, cy, ci], i) => {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((i - 2) * 0.25);
      ctx.shadowColor = cols[ci]; ctx.shadowBlur = 8 + Math.sin(t * 3 + i) * 5;
      ctx.fillStyle = cols[ci]; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(5, -4); ctx.lineTo(3, 8); ctx.lineTo(-3, 8); ctx.lineTo(-5, -4); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    });
    ctx.save(); ctx.translate(-56, -44); ctx.rotate(-0.12);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-2, 4, 4, 18);
    rr(ctx, -30, -10, 60, 18, 3); ctx.fillStyle = '#c8905a'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#3a1a0a'; ctx.font = 'bold 9px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GEM MINE', 0, -1); ctx.font = '7px sans-serif'; ctx.fillText('no unions', 0, 6);
    ctx.restore(); ctx.lineWidth = 2.5;
    // cart
    rr(ctx, 30, 18, 26, 14, 3); ctx.fillStyle = '#6a4a2a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe05a'; circ(ctx, 38, 17, 4); ctx.fill(); ctx.fillStyle = '#5ae0ff'; circ(ctx, 47, 16, 4); ctx.fill();
    ctx.fillStyle = '#333'; circ(ctx, 36, 33, 4); ctx.fill(); circ(ctx, 51, 33, 4); ctx.fill();
    ctx.restore();
  };

  A.fortress = function (ctx, x, t, hpRatio) {
    const LY = G.LANE_Y;
    ctx.save(); ctx.translate(x, 0); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
    const stone = '#4a4050', dark = '#2e2836';
    rr(ctx, 40, 140, 140, 500, 6); ctx.fillStyle = dark; ctx.fill(); ctx.stroke();
    rr(ctx, 0, 250, 90, 380, 4); ctx.fillStyle = stone; ctx.fill(); ctx.stroke();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = stone; ctx.beginPath(); ctx.moveTo(i * 23, 252); ctx.lineTo(i * 23 + 10, 226); ctx.lineTo(i * 23 + 20, 252); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    rr(ctx, 70, 90, 70, 170, 4); ctx.fillStyle = stone; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#7a1a2a'; ctx.beginPath(); ctx.moveTo(60, 94); ctx.lineTo(105, 30); ctx.lineTo(150, 94); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.shadowColor = '#ff3a3a'; ctx.shadowBlur = 12; ctx.fillStyle = '#ff5a3a';
    rr(ctx, 96, 130, 16, 22, 8); ctx.fill(); ctx.shadowBlur = 0;
    LY.forEach(ly => {
      ctx.beginPath(); ctx.moveTo(0, ly + 22); ctx.lineTo(0, ly - 12); ctx.arc(16, ly - 12, 16, PI, 0); ctx.lineTo(32, ly + 22); ctx.closePath();
      ctx.fillStyle = '#120a14'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,60,60,' + (0.3 + Math.sin(t * 4 + ly) * 0.2) + ')'; circ(ctx, 16, ly - 2, 5); ctx.fill();
    });
    for (const by of [290, 490]) {
      ctx.fillStyle = '#7a1a2a'; ctx.beginPath(); ctx.moveTo(50, by); ctx.lineTo(74, by); ctx.lineTo(74, by + 40); ctx.lineTo(62, by + 30); ctx.lineTo(50, by + 40); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d0d8e0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(58, by + 22); ctx.lineTo(58, by + 8); ctx.arc(62, by + 8, 4, PI, 0); ctx.lineTo(66, by + 20); ctx.arc(63, by + 20, 3, 0, PI); ctx.lineTo(60, by + 10); ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = OUT;
    }
    rr(ctx, -6, 196, 120, 22, 3); ctx.fillStyle = '#1a1a2a'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff5a5a'; ctx.font = 'bold 10px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.fillText('NETHER-BUREAUCRACY', 54, 206); ctx.fillStyle = '#ddd'; ctx.font = '8px sans-serif'; ctx.fillText('Branch Office #666', 54, 215);
    if (hpRatio < 0.6) { for (let i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(40,40,40,0.4)'; circ(ctx, 40 + i * 30, 200 - ((t * 30 + i * 40) % 120), 14 + i * 3); ctx.fill(); } }
    ctx.restore();
  };

  /* ---------- background gags ---------- */
  const VENDOR = { suburbs: 'LEMONADE', frost: 'HOT COCOA', desert: 'WATER $99', swamp: 'SWAMP JUICE', magma: 'LAVA LATTE', cubicle: 'SOULS 2-4-1' };
  A.gags = function (ctx, W, t, regionId, siege) {
    const by = 300;
    // snack vendor
    const vx = W * 0.47;
    ctx.save(); ctx.translate(vx, by); ctx.lineWidth = 2; ctx.strokeStyle = OUT;
    ctx.fillStyle = '#c8905a'; ctx.fillRect(-30, -26, 60, 26); ctx.strokeRect(-30, -26, 60, 26);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? '#ffffff' : '#ff4a6a'; ctx.beginPath(); ctx.moveTo(-34 + i * 11.3, -46); ctx.lineTo(-22.7 + i * 11.3, -46); ctx.lineTo(-22.7 + i * 11.3, -36); ctx.arc(-28.3 + i * 11.3, -36, 5.65, 0, PI); ctx.closePath(); ctx.fill(); }
    ctx.strokeRect(-34, -46, 68, 10);
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-32, -36, 3, 10); ctx.fillRect(29, -36, 3, 10);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(VENDOR[regionId] || 'SNACKS', 0, -12);
    ctx.restore();
    ctx.save(); ctx.translate(vx - 4, by - 22 + Math.abs(Math.sin(t * 3)) * -3); ctx.scale(0.5, 0.5);
    A.humanoid(ctx, { skin: '#ffd2a8', head: 'messy', hair: '#ffd040', shirt: '#ffffff', legs: '#333', weapon: 'mug', noLegs: true, mustache: '#7a4a2a' }, { t: t, walk: 0, atk: (t * 0.4) % 1 < 0.3 ? (t * 0.4) % 1 / 0.3 : 0 });
    ctx.restore();
    // coward hiding behind a bush
    const cx = W * 0.36;
    const peek = Math.max(0, Math.sin(t * 0.9)) * 14;
    ctx.save(); ctx.translate(cx, by - 4 - peek); ctx.scale(0.45, 0.45);
    A.humanoid(ctx, { skin: '#ffd2a8', head: 'knight', tier: 1, weapon: 'sword', armor: '#a0643a', legs: '#444', noLegs: true }, { t: t, walk: 0, atk: 0 });
    ctx.restore();
    ctx.save(); ctx.translate(cx, by); ctx.fillStyle = '#3a9a3a'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    for (const [dx, r] of [[-12, 12], [0, 15], [12, 12]]) { circ(ctx, dx, -8, r); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    if (peek > 10) { ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('nope', cx + 20, by - 46); }
    // sleeping guard
    const sx = W * 0.64;
    ctx.save(); ctx.translate(sx, by - 6); ctx.rotate(-1.35); ctx.scale(0.45, 0.45);
    A.humanoid(ctx, { skin: '#f0c090', head: 'helm', tierColor: '#9aa4b0', weapon: 'spear', armor: '#7a8a9a', legs: '#444' }, { t: 0, walk: 0, atk: 0 });
    ctx.restore();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'left';
    for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; ctx.globalAlpha = 1 - k; ctx.fillText('z', sx + 24 + k * 16, by - 22 - k * 30); }
    ctx.globalAlpha = 1;
    // fans with a sign
    if (!siege) {
      const fx = W * 0.82;
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.translate(fx + i * 18, by - 2 - Math.abs(Math.sin(t * 4 + i)) * 4); ctx.scale(0.38, 0.38);
        A.humanoid(ctx, { skin: ['#ffd2a8', '#c88a5a', '#f0c090'][i], head: 'messy', hair: ['#3a2a1a', '#ff8a3a', '#2a2a2a'][i], shirt: ['#ff5ad8', '#5ad8ff', '#ffe040'][i], legs: '#333', weapon: 'fist', noLegs: true }, { t: t + i, walk: 0, atk: 0 });
        ctx.restore();
      }
      ctx.save(); ctx.translate(fx + 18, by - 44 - Math.abs(Math.sin(t * 4)) * 4);
      ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-1, 0, 2, 14);
      rr(ctx, -24, -14, 48, 15, 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = '#e83a3a'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('GO TEAM??', 0, -4);
      ctx.restore();
    }
    // goose
    const gx = 420 + ((t * 18) % (W - 640));
    ctx.save(); ctx.translate(gx, by - 2); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT;
    ell(ctx, 0, -6, 8, 5); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(5, -8); ctx.quadraticCurveTo(8, -18, 10, -18); ctx.lineTo(11, -15); ctx.quadraticCurveTo(9, -14, 8, -7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ff9a1a'; ctx.beginPath(); ctx.moveTo(11, -17); ctx.lineTo(15, -16); ctx.lineTo(11, -15); ctx.fill();
    ctx.strokeStyle = '#ff9a1a'; ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(-2 + Math.sin(t * 8) * 2, 2); ctx.moveTo(2, -2); ctx.lineTo(2 - Math.sin(t * 8) * 2, 2); ctx.stroke();
    if ((t % 9) < 1.2) { ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('HONK', 8, -24); }
    ctx.restore();
  };

  /* speech bubble */
  A.bubble = function (ctx, x, y, text, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.font = 'bold 15px "Trebuchet MS", sans-serif';
    const w = Math.min(260, ctx.measureText(text).width + 16);
    const lines = [];
    if (ctx.measureText(text).width + 16 > 260) {
      const words = text.split(' '); let cur = '';
      words.forEach(wd => { const tt = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tt).width > 240) { lines.push(cur); cur = wd; } else cur = tt; });
      lines.push(cur);
    } else lines.push(text);
    const h = lines.length * 17 + 10;
    const bx = Math.max(6, Math.min(x - w / 2, (G.battle ? G.battle.W : 1600) - w - 6)), byy = y - h - 10;
    rr(ctx, bx, byy, w, h, 8); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 5, byy + h - 1); ctx.lineTo(x, byy + h + 9); ctx.lineTo(x + 6, byy + h - 1); ctx.closePath(); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 5, byy + h); ctx.lineTo(x, byy + h + 9); ctx.lineTo(x + 6, byy + h); ctx.stroke();
    ctx.fillStyle = '#1a1a1a'; ctx.textAlign = 'center';
    lines.forEach((ln, i) => ctx.fillText(ln, bx + w / 2, byy + 19 + i * 17));
    ctx.restore();
  };

  /* comic impact burst */
  A.pow = function (ctx, x, y, text, k, color) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-0.15);
    ctx.beginPath();
    for (let i = 0; i < 16; i++) { const r = i % 2 ? 22 : 38; const an = i * PI / 8; ctx.lineTo(Math.cos(an) * r * 1.3, Math.sin(an) * r); }
    ctx.closePath(); ctx.fillStyle = color || '#ffe040'; ctx.fill(); ctx.strokeStyle = '#1a1a1a'; ctx.lineWidth = 3; ctx.stroke();
    ctx.font = 'bold 20px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = '#ffffff'; ctx.strokeText(text, 0, 1); ctx.fillStyle = '#e8202a'; ctx.fillText(text, 0, 1);
    ctx.restore();
  };

  A.gem = function (ctx, x, y, t, color) {
    ctx.save(); ctx.translate(x, y + Math.sin(t * 4) * 4); ctx.rotate(Math.sin(t * 2) * 0.2);
    ctx.shadowColor = color; ctx.shadowBlur = 16;
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(11, -4); ctx.lineTo(0, 14); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(-11, -4); ctx.lineTo(-3, -4); ctx.closePath(); ctx.fill();
    ctx.restore();
  };
})();
