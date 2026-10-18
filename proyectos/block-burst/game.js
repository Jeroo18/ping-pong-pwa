// Block Burst — puzzle de bloques 8x8 (género tipo Block Blast).
// Arrastra las 3 piezas al tablero, completa filas/columnas, encadena combos.
(function () {
  const T = I18N.strings(STRINGS);
  I18N.floating();
  if (window.ADS_NO_DEMO && !window.CrazyGames) T.ad = ''; // portal sin anuncios todavía: los botones dan el premio directo
  Trophies.init({
    game: 'block-burst', title: 'Block Burst', color: '#2b3b8f', floating: true,
    list: [
      { id: 'score500', tier: 'bronze', icon: '🟦', stat: 'score', goal: 500, text: s => s.score(500) },
      { id: 'plays10', tier: 'bronze', icon: '🎮', stat: 'plays', goal: 10, text: s => s.plays(10) },
      { id: 'days3', tier: 'bronze', icon: '📅', stat: 'days', goal: 3, text: s => s.days(3) },
      { id: 'combo3', tier: 'silver', icon: '⚡', stat: 'combo', goal: 3, text: s => s.combo(3) },
      { id: 'score2000', tier: 'silver', icon: '⭐', stat: 'score', goal: 2000, text: s => s.score(2000) },
      { id: 'lines100', tier: 'silver', icon: '🧹', stat: 'lines', goal: 100, text: s => s.lines(100) },
      { id: 'combo6', tier: 'gold', icon: '💥', stat: 'combo', goal: 6, text: s => s.combo(6) },
      { id: 'score5000', tier: 'gold', icon: '🏅', stat: 'score', goal: 5000, text: s => s.score(5000) },
      { id: 'score10000', tier: 'platinum', icon: '👑', stat: 'score', goal: 10000, text: s => s.score(10000) }
    ]
  });

  const N = 8;
  const COLORS = ['#ff5c5c', '#ffb030', '#ffe14d', '#4cd964', '#33c3ff', '#5b7bff', '#b45bff', '#ff6bc1'];
  const SHAPES = [
    [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [1, 0]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [2, 0]],
    [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [1, 0], [2, 0], [3, 0]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]],
    [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0], [2, 1]],
    [[0, 0], [1, 0], [1, 1]], [[0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 0]], [[0, 0], [0, 1], [1, 1]],
    [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 1], [1, 1], [2, 1], [2, 0]], [[0, 0], [0, 1], [1, 0], [2, 0]], [[0, 0], [0, 1], [1, 1], [2, 1]],
    [[0, 0], [0, 1], [0, 2], [1, 1]], [[1, 0], [1, 1], [1, 2], [0, 1]], [[0, 0], [1, 0], [2, 0], [1, 1]], [[0, 1], [1, 1], [2, 1], [1, 0]],
    [[0, 0], [0, 1], [1, 1], [1, 2]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [0, 1], [0, 2]], [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]
  ];

  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  let W, H, dpr, cell, gx, gy, trayY, trayCell;
  let grid, tray, score, best = +localStorage.getItem('blockburst_best') || 0, combo, sinceClear, revived, over;
  let drag = null, fx = [], parts = [];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.floor(Math.min((W - 24) / N, (H * 0.56) / N, 60));
    gx = Math.round((W - cell * N) / 2); gy = Math.round(Math.max(90, H * 0.14));
    trayY = gy + cell * N + Math.max(30, H * 0.04);
    trayCell = Math.floor(cell * 0.55);
  }
  addEventListener('resize', resize);

  const newPiece = () => { const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { cells: s, color: Math.floor(Math.random() * COLORS.length), w: Math.max(...s.map(c => c[1])) + 1, h: Math.max(...s.map(c => c[0])) + 1 }; };
  const fits = (p, r, c) => p.cells.every(([dr, dc]) => { const R = r + dr, C = c + dc; return R >= 0 && C >= 0 && R < N && C < N && grid[R][C] < 0; });
  const fitsAnywhere = p => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(p, r, c)) return true; return false; };

  function refill() {
    for (let i = 0; i < 25; i++) { tray = [newPiece(), newPiece(), newPiece()]; if (tray.some(fitsAnywhere)) break; }
  }

  function reset() {
    grid = Array.from({ length: N }, () => Array(N).fill(-1));
    score = 0; combo = 0; sinceClear = 0; revived = false; over = false; fx = []; parts = [];
    refill();
    document.getElementById('mOver').classList.remove('show');
    Ads.gameplayStart();
  }

  function linesFor(p, r, c) { // filas/columnas que se completarían
    const g = grid.map(row => row.slice());
    p.cells.forEach(([dr, dc]) => { g[r + dr][c + dc] = 1; });
    const rows = [], cols = [];
    for (let i = 0; i < N; i++) { if (g[i].every(v => v >= 0)) rows.push(i); if (g.every(row => row[i] >= 0)) cols.push(i); }
    return { rows, cols };
  }

  function place(idx, r, c) {
    const p = tray[idx];
    const { rows, cols } = linesFor(p, r, c);
    p.cells.forEach(([dr, dc]) => { grid[r + dr][c + dc] = p.color; });
    score += p.cells.length;
    tray[idx] = null;
    const L = rows.length + cols.length;
    if (L) {
      combo++; sinceClear = 0;
      Trophies.add('lines', L); Trophies.set('combo', combo);
      rows.forEach(i => { for (let j = 0; j < N; j++) burst(i, j, grid[i][j]); });
      cols.forEach(j => { for (let i = 0; i < N; i++) burst(i, j, grid[i][j]); });
      rows.forEach(i => { for (let j = 0; j < N; j++) grid[i][j] = -1; });
      cols.forEach(j => { for (let i = 0; i < N; i++) grid[i][j] = -1; });
      const pts = 10 * L * L + (combo > 1 ? 10 * combo : 0);
      score += pts;
      if (grid.every(row => row.every(v => v < 0))) score += 300; // tablero limpio
      fx.push({ text: `+${pts}`, sub: combo > 1 ? `${T.combo} x${combo}` : T.great[Math.min(L - 1, 3)], x: gx + (c + p.w / 2) * cell, y: gy + (r + p.h / 2) * cell, t: 0 });
      tone(440 + 110 * Math.min(combo, 6), .15); Ads.happytime();
    } else {
      if (++sinceClear >= 3) combo = 0;
      tone(300, .05);
    }
    if (tray.every(x => !x)) refill();
    if (!tray.some(x => x && fitsAnywhere(x))) gameOver();
  }

  function burst(i, j, color) {
    for (let k = 0; k < 4; k++) parts.push({ x: gx + (j + .5) * cell, y: gy + (i + .5) * cell, vx: (Math.random() - .5) * 6, vy: -Math.random() * 6, life: 1, color: COLORS[color] || '#fff' });
  }

  function tone(f, d) {
    try {
      const a = tone.ctx || (tone.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = a.createOscillator(), g = a.createGain(); o.type = 'triangle';
      o.frequency.value = f; g.gain.setValueAtTime(.07, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d);
      o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d);
    } catch (e) {}
  }

  async function gameOver() {
    over = true; Ads.gameplayStop();
    Trophies.set('score', score); Trophies.add('plays');
    const isBest = score > best;
    if (isBest) { best = score; localStorage.setItem('blockburst_best', best); }
    document.getElementById('tOver').textContent = isBest ? T.newBest : T.over;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('bestTxt').textContent = T.bestTxt(best);
    const rv = document.getElementById('bRevive');
    rv.style.display = revived ? 'none' : '';
    rv.innerHTML = `${T.revive}<small>${T.ad}</small>`;
    document.getElementById('bAgain').textContent = T.again;
    setTimeout(() => document.getElementById('mOver').classList.add('show'), 500);
  }

  document.getElementById('bRevive').onclick = async () => {
    if (!(await Ads.rewarded())) return;
    revived = true; over = false;
    for (let r = 2; r < 6; r++) for (let c = 0; c < N; c++) grid[r][c] = -1; // libera el centro
    tray = [{ cells: [[0, 0]], color: 4, w: 1, h: 1 }, newPiece(), { cells: [[0, 0], [0, 1]], color: 2, w: 2, h: 1 }];
    document.getElementById('mOver').classList.remove('show');
    Ads.gameplayStart();
  };
  document.getElementById('bAgain').onclick = async () => { document.getElementById('mOver').classList.remove('show'); await Ads.interstitial(); reset(); };

  // ---------- Entrada ----------
  const slotX = i => W / 6 + i * W / 3;
  const slotCY = () => trayY + trayCell * 2.5;
  function dropTarget(px, py) {
    const p = tray[drag.idx];
    const ox = px - p.w * cell / 2, oy = py - p.h * cell - cell * 1.1;
    return { r: Math.round((oy - gy) / cell), c: Math.round((ox - gx) / cell), ox, oy };
  }
  cv.addEventListener('pointerdown', e => {
    if (over) return;
    if (e.clientY < trayY - 10) return;
    const i = Math.max(0, Math.min(2, Math.floor(e.clientX / (W / 3))));
    if (!tray[i]) return;
    drag = { idx: i, x: e.clientX, y: e.clientY };
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => { if (drag) { drag.x = e.clientX; drag.y = e.clientY; } });
  cv.addEventListener('pointerup', () => {
    if (!drag) return;
    const { r, c } = dropTarget(drag.x, drag.y);
    const idx = drag.idx; drag = null;
    if (fits(tray[idx], r, c)) place(idx, r, c);
  });
  cv.addEventListener('pointercancel', () => { drag = null; });

  // ---------- Dibujo ----------
  function block(x, y, s, color, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    const r = s * .18;
    ctx.fillStyle = color; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, s - 2, s - 2, r); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, s - 6, s * .3, r * .7); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + 3, y + s * .78, s - 6, s * .16);
    ctx.globalAlpha = 1;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // Marcador
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.font = '700 14px system-ui'; ctx.globalAlpha = .7; ctx.fillText(`${T.best} ${best}`, W / 2, gy - 58); ctx.globalAlpha = 1;
    ctx.font = '800 38px system-ui'; ctx.fillText(score, W / 2, gy - 18);
    // Tablero
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.roundRect(gx - 6, gy - 6, cell * N + 12, cell * N + 12, 12); ctx.fill();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      if (grid[r][c] >= 0) block(gx + c * cell, gy + r * cell, cell, COLORS[grid[r][c]]);
      else { ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.roundRect(gx + c * cell + 1, gy + r * cell + 1, cell - 2, cell - 2, 4); ctx.fill(); }
    }
    // Vista previa al arrastrar
    if (drag && tray[drag.idx]) {
      const p = tray[drag.idx];
      const { r, c, ox, oy } = dropTarget(drag.x, drag.y);
      if (fits(p, r, c)) {
        const { rows, cols } = linesFor(p, r, c);
        ctx.fillStyle = 'rgba(255,255,255,.18)';
        rows.forEach(i => ctx.fillRect(gx, gy + i * cell, cell * N, cell));
        cols.forEach(j => ctx.fillRect(gx + j * cell, gy, cell, cell * N));
        p.cells.forEach(([dr, dc]) => block(gx + (c + dc) * cell, gy + (r + dr) * cell, cell, COLORS[p.color], .4));
      }
      p.cells.forEach(([dr, dc]) => block(ox + dc * cell, oy + dr * cell, cell, COLORS[p.color]));
    }
    // Bandeja
    tray.forEach((p, i) => {
      if (!p || (drag && drag.idx === i)) return;
      const ok = fitsAnywhere(p);
      const x0 = slotX(i) - p.w * trayCell / 2, y0 = slotCY() - p.h * trayCell / 2;
      p.cells.forEach(([dr, dc]) => block(x0 + dc * trayCell, y0 + dr * trayCell, trayCell, COLORS[p.color], ok ? 1 : .3));
    });
    // Partículas y textos
    parts = parts.filter(p => (p.life -= .03) > 0);
    parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .3; ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x - 4, p.y - 4, 8, 8); });
    ctx.globalAlpha = 1;
    fx = fx.filter(f => (f.t += 1 / 60) < 1.2);
    fx.forEach(f => {
      ctx.globalAlpha = Math.max(0, 1 - f.t / 1.2);
      ctx.fillStyle = '#fff'; ctx.font = '800 30px system-ui'; ctx.fillText(f.text, f.x, f.y - f.t * 50);
      ctx.fillStyle = '#ffe14d'; ctx.font = '800 20px system-ui'; ctx.fillText(f.sub, f.x, f.y - f.t * 50 + 26);
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.__bb = { get grid() { return grid; }, get tray() { return tray; }, get score() { return score; }, place, fits, get over() { return over; } };
  resize(); reset(); draw();
})();
