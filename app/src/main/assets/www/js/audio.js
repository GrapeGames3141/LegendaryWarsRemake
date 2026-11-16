/* Ridiculous Wars - synthesized sound effects & music (WebAudio, no asset files) */
(function () {
  'use strict';
  const S = G.audio = {};
  let ac = null, master = null, sfxGain = null, musicGain = null, noiseBuf = null;
  let musicTimer = null, musicStep = 0, musicMood = null, nextNoteTime = 0;
  const lastPlayed = {};

  S.init = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxGain = ac.createGain(); sfxGain.connect(master);
    musicGain = ac.createGain(); musicGain.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 0.5, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    S.applySettings();
  };
  S.applySettings = function () {
    if (!ac) return;
    const st = G.save && G.save.data ? G.save.data.settings : { sfx: true, music: true };
    sfxGain.gain.value = st.sfx ? 0.55 : 0;
    musicGain.gain.value = st.music ? 0.16 : 0;
  };
  S.suspend = function () { if (ac && ac.state === 'running') ac.suspend(); };
  S.resume = function () { if (ac && ac.state === 'suspended') ac.resume(); };

  function tone(freq, dur, type, vol, slide, when, dest) {
    const t = (when || ac.currentTime);
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'square';
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, slide), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || sfxGain);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(dur, vol, filterFreq, type, when) {
    const t = when || ac.currentTime;
    const src = ac.createBufferSource(); src.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.value = filterFreq || 1200;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol || 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfxGain);
    src.start(t); src.stop(t + dur);
  }

  const SFX = {
    click: () => tone(660, 0.06, 'square', 0.12),
    summon: () => { tone(392, 0.08, 'square', 0.12); tone(587, 0.12, 'square', 0.12, 0, ac.currentTime + 0.07); },
    coin: () => { tone(988, 0.06, 'square', 0.1); tone(1319, 0.12, 'square', 0.1, 0, ac.currentTime + 0.05); },
    gem: () => { tone(1175, 0.08, 'triangle', 0.18); tone(1568, 0.08, 'triangle', 0.18, 0, ac.currentTime + 0.06); tone(2093, 0.15, 'triangle', 0.15, 0, ac.currentTime + 0.12); },
    hit: () => noise(0.08, 0.25, 1800),
    hitHeavy: () => { noise(0.18, 0.4, 600); tone(110, 0.15, 'sine', 0.3, 50); },
    arrow: () => noise(0.1, 0.12, 3500, 'highpass'),
    fire: () => { noise(0.3, 0.25, 900); tone(220, 0.25, 'sawtooth', 0.06, 80); },
    boom: () => { noise(0.5, 0.5, 400); tone(80, 0.4, 'sine', 0.4, 30); },
    frost: () => { tone(1800, 0.2, 'sine', 0.08, 900); tone(2400, 0.25, 'sine', 0.05, 1200); },
    heal: () => { tone(784, 0.15, 'sine', 0.12); tone(1046, 0.2, 'sine', 0.1, 0, ac.currentTime + 0.08); },
    die: () => tone(300, 0.2, 'square', 0.08, 90),
    special: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.12, 'square', 0.12, 0, ac.currentTime + i * 0.05)); },
    thunder: () => { noise(0.8, 0.6, 300); tone(60, 0.6, 'sawtooth', 0.2, 30); },
    castleHit: () => { noise(0.15, 0.3, 500); tone(140, 0.12, 'triangle', 0.2, 70); },
    deny: () => tone(160, 0.12, 'square', 0.1, 120),
    boss: () => { [196, 185, 175, 165].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.12, 0, ac.currentTime + i * 0.22)); },
    victory: () => { [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.16, 'square', 0.14, 0, ac.currentTime + i * 0.13)); },
    defeat: () => { [392, 349, 311, 262].forEach((f, i) => tone(f, 0.35, 'triangle', 0.18, 0, ac.currentTime + i * 0.28)); },
    upgrade: () => { [523, 784, 1046, 1568].forEach((f, i) => tone(f, 0.1, 'triangle', 0.16, 0, ac.currentTime + i * 0.06)); }
  };
  S.play = function (name) {
    if (!ac || !G.save.data.settings.sfx) return;
    const now = performance.now();
    if (lastPlayed[name] && now - lastPlayed[name] < 45) return; // avoid stacking
    lastPlayed[name] = now;
    try { SFX[name] && SFX[name](); } catch (e) { /* ignore */ }
  };

  /* --- tiny sequencer for background music --- */
  const N = n => 440 * Math.pow(2, (n - 69) / 12);
  const SONGS = {
    menu: { tempo: 0.26, chords: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]], lead: [76, 74, 72, 71, 72, 74, 76, 79, 77, 76, 74, 72, 71, 72, 74, 71] },
    battle: { tempo: 0.18, chords: [[50, 53, 57], [46, 50, 53], [48, 52, 55], [45, 49, 52]], lead: [74, 0, 72, 74, 77, 0, 76, 74, 72, 0, 70, 72, 74, 0, 69, 0] },
    boss: { tempo: 0.16, chords: [[45, 48, 52], [44, 48, 51], [43, 46, 50], [44, 47, 52]], lead: [69, 72, 76, 72, 68, 72, 75, 72, 67, 70, 74, 70, 68, 71, 76, 0] }
  };
  function schedule() {
    if (!ac || !musicMood) return;
    const song = SONGS[musicMood];
    while (nextNoteTime < ac.currentTime + 0.3) {
      const step = musicStep % 16;
      const chord = song.chords[Math.floor(musicStep / 16) % song.chords.length];
      if (step % 4 === 0) tone(N(chord[0] - 12), song.tempo * 3.5, 'triangle', 0.5, 0, nextNoteTime, musicGain);
      if (step % 2 === 0) tone(N(chord[(step / 2) % 3]), song.tempo * 1.6, 'triangle', 0.18, 0, nextNoteTime, musicGain);
      const ln = song.lead[step];
      if (ln && (musicStep % 64) >= 32) tone(N(ln), song.tempo * 1.4, 'square', 0.08, 0, nextNoteTime, musicGain);
      if (musicMood !== 'menu' && step % 4 === 2) {
        const src = ac.createBufferSource(); src.buffer = noiseBuf; const g = ac.createGain(); const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
        g.gain.setValueAtTime(0.25, nextNoteTime); g.gain.exponentialRampToValueAtTime(0.001, nextNoteTime + 0.05);
        src.connect(f); f.connect(g); g.connect(musicGain); src.start(nextNoteTime); src.stop(nextNoteTime + 0.06);
      }
      nextNoteTime += song.tempo;
      musicStep++;
    }
  }
  S.music = function (mood) {
    if (!ac) return;
    if (mood === musicMood) return;
    musicMood = mood;
    musicStep = 0;
    nextNoteTime = ac.currentTime + 0.1;
    if (!musicTimer) musicTimer = setInterval(schedule, 100);
  };
  S.stopMusic = function () { musicMood = null; };
})();
