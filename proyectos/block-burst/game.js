// Block Burst — puzzle de bloques 8x8 (género tipo Block Blast).
// Arrastra las 3 piezas al tablero, completa filas/columnas, encadena combos.
(function () {
  const T = I18N.strings(STRINGS);
  I18N.floating();
  UX.soundButton();
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
  let W, H, dpr, cell, gx, gy, trayY, trayCell, land, trayX, trayW;
  const HEAD = 96; // en horizontal: espacio para el marcador encima de la bandeja
  const TOP = 58;  // franja de arriba para los botones de idioma, trofeos y sonido
  let grid, tray, score, best = +localStorage.getItem('blockburst_best') || 0, combo, sinceClear, revived, over;
  let drag = null, ret = null, popT, clearing = [], shown = 0, overT = -1, trayIn = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    land = W > H * 1.25; // pantalla horizontal (escritorio): tablero a la izquierda, piezas a la derecha
    if (land) {
      cell = Math.floor(Math.min((H - TOP - 16) / N, (W * 0.55) / N, 72));
      trayW = Math.floor(Math.max(cell * N * 0.45, 150));
      gx = Math.round((W - (cell * N + 40 + trayW)) / 2); gy = Math.round(TOP + (H - TOP - 16 - cell * N) / 2);
      trayX = gx + cell * N + 40; trayY = gy + HEAD;
      trayCell = Math.floor(Math.min(cell * 0.55, (cell * N - HEAD) / 3 / 5.2, trayW / 5.4));
    } else {
      cell = Math.floor(Math.min((W - 24) / N, (H * 0.56) / N, 60));
      gx = Math.round((W - cell * N) / 2); gy = Math.round(Math.max(100, H * 0.15));
      trayY = gy + cell * N + Math.max(30, H * 0.04);
      trayCell = Math.floor(cell * 0.55);
    }
  }
  addEventListener('resize', () => { resize(); if (coach) coach.update(); });

  const newPiece = () => { const s = SHAPES[Math.floor(Math.random() * SHAPES.length)]; return { cells: s, color: Math.floor(Math.random() * COLORS.length), w: Math.max(...s.map(c => c[1])) + 1, h: Math.max(...s.map(c => c[0])) + 1 }; };
  const fits = (p, r, c) => p.cells.every(([dr, dc]) => { const R = r + dr, C = c + dc; return R >= 0 && C >= 0 && R < N && C < N && grid[R][C] < 0; });
  const fitsAnywhere = p => { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(p, r, c)) return true; return false; };

  function refill() {
    for (let i = 0; i < 25; i++) { tray = [newPiece(), newPiece(), newPiece()]; if (tray.some(fitsAnywhere)) break; }
    trayIn = 0; // las piezas nuevas entran con un pequeño rebote
  }

  function reset() {
    grid = Array.from({ length: N }, () => Array(N).fill(-1));
    score = 0; shown = 0; combo = 0; sinceClear = 0; revived = false; over = false; overT = -1; clearing = []; ret = null;
    popT = Array.from({ length: N }, () => Array(N).fill(0));
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
    p.cells.forEach(([dr, dc]) => { grid[r + dr][c + dc] = p.color; popT[r + dr][c + dc] = .2; });
    score += p.cells.length;
    tray[idx] = null;
    if (coach && coach.active) coach.done();
    const L = rows.length + cols.length;
    if (L) {
      combo++; sinceClear = 0;
      Trophies.add('lines', L); Trophies.set('combo', combo);
      // Las celdas de las líneas se encogen en ola desde donde cayó la pieza, con chispas de su color.
      const cr = r + p.h / 2, cc = c + p.w / 2, seen = new Set();
      const kill = (i, j) => {
        const k = i * N + j; if (seen.has(k)) return; seen.add(k);
        const delay = Math.hypot(i - cr, j - cc) * .028;
        clearing.push({ r: i, c: j, color: grid[i][j], t: -delay });
        setTimeout(() => UX.burst(gx + (j + .5) * cell, gy + (i + .5) * cell, { colors: [COLORS[grid[i][j]] || '#fff', '#fff'], n: 5, speed: 260, size: cell * .22, life: .6 }), delay * 1000);
      };
      rows.forEach(i => { for (let j = 0; j < N; j++) kill(i, j); });
      cols.forEach(j => { for (let i = 0; i < N; i++) kill(i, j); });
      rows.forEach(i => { for (let j = 0; j < N; j++) grid[i][j] = -1; });
      cols.forEach(j => { for (let i = 0; i < N; i++) grid[i][j] = -1; });
      const pts = 10 * L * L + (combo > 1 ? 10 * combo : 0);
      score += pts;
      const px = gx + cc * cell, py = gy + cr * cell;
      UX.pop(`+${pts}`, px, py, { size: Math.round(cell * .62), sub: combo > 1 ? `${T.combo} x${combo}` : T.great[Math.min(L - 1, 3)] });
      if (grid.every(row => row.every(v => v < 0))) { // tablero limpio
        score += 300;
        setTimeout(() => { UX.pop('+300', gx + cell * N / 2, gy + cell * N / 2, { size: Math.round(cell * .9), color: '#ffe14d', sub: '★ ★ ★', dur: 1.6 }); UX.confetti(); }, 250);
      }
      UX.shake(cv, Math.min(3 + L * 3 + combo, 16));
      UX.sfx('clear', Math.min(combo + L - 1, 5)); Ads.happytime();
    } else {
      if (++sinceClear >= 3) combo = 0;
      UX.sfx('place');
    }
    if (tray.every(x => !x)) refill();
    if (!tray.some(x => x && fitsAnywhere(x))) gameOver();
  }

  async function gameOver() {
    over = true; overT = 0; Ads.gameplayStop(); UX.sfx('over');
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
    setTimeout(() => document.getElementById('mOver').classList.add('show'), 1100);
  }

  document.getElementById('bRevive').onclick = async () => {
    if (!(await Ads.rewarded())) return;
    revived = true; over = false; overT = -1;
    for (let r = 2; r < 6; r++) for (let c = 0; c < N; c++) grid[r][c] = -1; // libera el centro
    tray = [{ cells: [[0, 0]], color: 4, w: 1, h: 1 }, newPiece(), { cells: [[0, 0], [0, 1]], color: 2, w: 2, h: 1 }];
    document.getElementById('mOver').classList.remove('show');
    Ads.gameplayStart();
  };
  document.getElementById('bAgain').onclick = async () => { document.getElementById('mOver').classList.remove('show'); await Ads.interstitial(); reset(); };

  // ---------- Entrada ----------
  // Centro de cada hueco de la bandeja (abajo en vertical, en columna a la derecha en horizontal)
  const slotH = () => (cell * N - HEAD) / 3;
  const slotX = i => land ? trayX + trayW / 2 : W / 6 + i * W / 3;
  const slotY = i => land ? trayY + slotH() * (i + .5) : trayY + trayCell * 2.5;
  // Con el dedo la pieza va por encima para que se vea; con el ratón va centrada en el puntero.
  const lift = mouse => mouse ? 0 : cell * 1.1;
  function dropTarget(px, py) {
    const p = tray[drag.idx];
    const ox = px - p.w * cell / 2, oy = py - (drag.mouse ? p.h * cell / 2 : p.h * cell) - lift(drag.mouse);
    return { r: Math.round((oy - gy) / cell), c: Math.round((ox - gx) / cell), ox, oy };
  }
  // Punto donde soltar la pieza idx para que caiga en (r, c) — lo usan el tutorial y las pruebas.
  function dropPoint(idx, r, c, mouse) {
    const p = tray[idx];
    return [gx + (c + p.w / 2) * cell, gy + r * cell + (mouse ? p.h * cell / 2 : p.h * cell) + lift(mouse)];
  }
  cv.addEventListener('pointerdown', e => {
    if (over) return;
    let i;
    if (land) { if (e.clientX < trayX - 10) return; i = Math.floor((e.clientY - trayY) / slotH()); }
    else { if (e.clientY < trayY - 10) return; i = Math.floor(e.clientX / (W / 3)); }
    i = Math.max(0, Math.min(2, i));
    if (!tray[i]) return;
    drag = { idx: i, x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', s: trayCell / cell };
    ret = null; UX.sfx('pick');
    if (coach) coach.hideHand();
    cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener('pointermove', e => { if (drag) { drag.x = e.clientX; drag.y = e.clientY; } });
  cv.addEventListener('pointerup', () => {
    if (!drag) return;
    const { r, c } = dropTarget(drag.x, drag.y);
    const idx = drag.idx, d = drag; drag = null;
    if (fits(tray[idx], r, c)) place(idx, r, c);
    else { // vuelve a su sitio en la bandeja
      const p = tray[idx], o = dropTarget(d.x, d.y);
      ret = { idx, x: o.ox + p.w * cell / 2, y: o.oy + p.h * cell / 2, t: 0 };
      if (o.oy + p.h * cell > gy && o.oy < gy + cell * N) UX.sfx('error');
    }
  });
  cv.addEventListener('pointercancel', () => { drag = null; });

  // ---------- Dibujo ----------
  const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16); const f = v => Math.max(0, Math.min(255, Math.round(k > 0 ? v + (255 - v) * k : v * (1 + k)))); return `rgb(${f(n >> 16)},${f(n >> 8 & 255)},${f(n & 255)})`; };
  const PAL = COLORS.map(c => [shade(c, .35), c, shade(c, -.3), shade(c, -.5)]);
  const GRAY = ['#8a93b8', '#6b7499', '#4d5577', '#3a4160'];
  function block(x, y, s, color, alpha, scale, flash) {
    const P = color === 'gray' ? GRAY : PAL[color];
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (scale != null && scale !== 1) { const d = s * (1 - scale) / 2; x += d; y += d; s *= scale; }
    if (s < 1) { ctx.globalAlpha = 1; return; }
    const r = s * .2, g = ctx.createLinearGradient(0, y, 0, y + s);
    g.addColorStop(0, P[0]); g.addColorStop(.5, P[1]); g.addColorStop(1, P[2]);
    ctx.fillStyle = P[3]; ctx.beginPath(); ctx.roundRect(x + 1, y + 2, s - 2, s - 2, r); ctx.fill();          // borde inferior
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, s - 2, s - 4, r); ctx.fill();               // cara
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.roundRect(x + s * .16, y + s * .1, s * .68, s * .16, s * .08); ctx.fill(); // brillo
    if (flash) { ctx.globalAlpha = (alpha == null ? 1 : alpha) * flash; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x + 1, y + 1, s - 2, s - 2, r); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
  const easeBack = t => { const c = 1.7; t -= 1; return 1 + (c + 1) * t * t * t + c * t * t; };

  let lastT = performance.now();
  function draw(now) {
    const dt = Math.min(((now || performance.now()) - lastT) / 1000, .05); lastT = now || performance.now();
    ctx.clearRect(0, 0, W, H);
    // Brillo detrás del tablero
    const bg = ctx.createRadialGradient(gx + cell * N / 2, gy + cell * N / 2, cell, gx + cell * N / 2, gy + cell * N / 2, cell * N);
    bg.addColorStop(0, 'rgba(110,140,255,.22)'); bg.addColorStop(1, 'rgba(110,140,255,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Marcador (sube contando)
    shown += (score - shown) * Math.min(1, dt * 10); if (Math.abs(score - shown) < .5) shown = score;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff';
    const sx = land ? trayX + trayW / 2 : W / 2, sy = land ? gy + 62 : gy - 22;
    if (land) { ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.roundRect(trayX, gy, trayW, 82, 16); ctx.fill(); ctx.fillStyle = '#fff'; }
    ctx.font = `600 14px ${UX.FONT}`; ctx.fillStyle = '#ffd84d'; ctx.fillText(`★ ${T.best} ${Math.max(best, score)}`, sx, land ? gy + 24 : sy - 40);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${land ? 40 : 40}px ${UX.FONT}`; ctx.fillText(Math.round(shown), sx, sy);
    // Tablero
    ctx.fillStyle = 'rgba(8,12,40,.55)'; ctx.beginPath(); ctx.roundRect(gx - 8, gy - 8, cell * N + 16, cell * N + 16, 16); ctx.fill();
    ctx.strokeStyle = 'rgba(140,160,255,.25)'; ctx.lineWidth = 2; ctx.stroke();
    const grayRows = overT >= 0 ? Math.floor((overT += dt) / .07) : -1;
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const x = gx + c * cell, y = gy + r * cell;
      ctx.fillStyle = 'rgba(255,255,255,.055)'; ctx.beginPath(); ctx.roundRect(x + 2, y + 2, cell - 4, cell - 4, cell * .16); ctx.fill();
      if (grid[r][c] >= 0) {
        let sc = 1;
        if (popT[r][c] > 0) { popT[r][c] = Math.max(0, popT[r][c] - dt); sc = .7 + .3 * easeBack(1 - popT[r][c] / .2); }
        block(x, y, cell, grayRows > N - 1 - r ? 'gray' : grid[r][c], 1, sc);
      }
    }
    // Líneas que se limpian: destello blanco y se encogen
    clearing = clearing.filter(q => (q.t += dt) < .32);
    clearing.forEach(q => { if (q.t < 0) return block(gx + q.c * cell, gy + q.r * cell, cell, q.color, 1, 1, .6); const k = q.t / .32; block(gx + q.c * cell, gy + q.r * cell, cell, q.color, 1 - k * .5, 1 - k, .8 * (1 - k)); });
    // Vista previa al arrastrar
    if (drag && tray[drag.idx]) {
      const p = tray[drag.idx];
      drag.s += (1 - drag.s) * Math.min(1, dt * 18);
      const { r, c, ox, oy } = dropTarget(drag.x, drag.y);
      if (fits(p, r, c)) {
        const { rows, cols } = linesFor(p, r, c);
        const pulse = .55 + .25 * Math.sin(lastT / 110);
        rows.forEach(i => { for (let j = 0; j < N; j++) if (grid[i][j] >= 0) block(gx + j * cell, gy + i * cell, cell, p.color, 1, 1, pulse * .5); });
        cols.forEach(j => { for (let i = 0; i < N; i++) if (grid[i][j] >= 0) block(gx + j * cell, gy + i * cell, cell, p.color, 1, 1, pulse * .5); });
        p.cells.forEach(([dr, dc]) => block(gx + (c + dc) * cell, gy + (r + dr) * cell, cell, p.color, .35));
      }
      const cx = ox + p.w * cell / 2, cy = oy + p.h * cell / 2, s2 = cell * drag.s;
      ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
      p.cells.forEach(([dr, dc]) => block(cx + (dc - p.w / 2) * s2, cy + (dr - p.h / 2) * s2, s2, p.color));
      ctx.restore();
    }
    // Bandeja
    trayIn = Math.min(1, trayIn + dt / .35);
    tray.forEach((p, i) => {
      if (!p || (drag && drag.idx === i)) return;
      const ok = fitsAnywhere(p) && overT < 0;
      let cx = slotX(i), cy = slotY(i), s2 = trayCell;
      const k = Math.max(0, Math.min(1, trayIn * 1.6 - i * .3)); s2 *= easeBack(k);
      if (ret && ret.idx === i) { // vuelve volando
        ret.t += dt; const q = Math.min(1, ret.t / .22), e = 1 - (1 - q) * (1 - q);
        cx = ret.x + (cx - ret.x) * e; cy = ret.y + (cy - ret.y) * e; s2 = cell + (trayCell - cell) * e;
        if (q >= 1) ret = null;
      }
      if (s2 < 1) return;
      p.cells.forEach(([dr, dc]) => block(cx + (dc - p.w / 2) * s2, cy + (dr - p.h / 2) * s2, s2, ok ? p.color : 'gray', ok ? 1 : .55));
    });
    requestAnimationFrame(draw);
  }

  // Tutorial la primera vez: la mano arrastra una pieza que cabe hasta el tablero.
  function coachPath() {
    if (over || drag) return null;
    for (let i = 0; i < 3; i++) {
      const p = tray[i]; if (!p) continue;
      for (let r = N - p.h; r >= 0; r--) for (let c = 0; c <= N - p.w; c++) if (fits(p, r, c)) return [[slotX(i), slotY(i)], dropPoint(i, r, c, UX.fine)];
    }
    return null;
  }
  let coach = null;
  cv.addEventListener('pointerup', () => { if (coach) coach.update(); });

  window.__bb = { get grid() { return grid; }, get tray() { return tray; }, get score() { return score; }, place, fits, get over() { return over; },
    slot: i => [slotX(i), slotY(i)], dropPoint };
  resize(); reset();
  coach = UX.coach('block-burst', { tip: T.tutorial, path: coachPath, tipY: () => land ? 14 : Math.min(H - 50, trayY + trayCell * 5 + 12) });
  requestAnimationFrame(draw);
})();
