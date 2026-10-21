// Merge Planets — suelta planetas, dos iguales se fusionan en el siguiente. Meta: crear el Sol.
// Gráficos con PixiJS (WebGL): los planetas son esferas 3D con su superficie real que giran y ruedan.
// Física Verlet propia a paso fijo. Cada planeta tiene su ficha educativa (Viewer): se abre tocando
// la fila de abajo, el "Siguiente", el botón de planetas o manteniendo pulsado un planeta de la caja.
(async function () {
  const T = I18N.strings(STRINGS);
  const U = Object.assign({}, PLANETS.UI.en, PLANETS.UI[I18N.lang]);
  I18N.floating();
  UX.soundButton();
  if (window.ADS_NO_DEMO && !window.CrazyGames) T.ad = ''; // portal sin anuncios todavía: los botones dan el premio directo
  Trophies.init({
    game: 'merge-drop', title: 'Merge Planets', color: '#3a2f8f', floating: true,
    list: [
      { id: 'earth', tier: 'bronze', icon: '🌍', stat: 'planet', goal: 4, text: s => s.make(T.names[4]) },
      { id: 'score1000', tier: 'bronze', icon: '⭐', stat: 'score', goal: 1000, text: s => s.score(1000) },
      { id: 'plays10', tier: 'bronze', icon: '🎮', stat: 'plays', goal: 10, text: s => s.plays(10) },
      { id: 'days3', tier: 'bronze', icon: '📅', stat: 'days', goal: 3, text: s => s.days(3) },
      { id: 'saturn', tier: 'silver', icon: '🪐', stat: 'planet', goal: 7, text: s => s.make(T.names[7]) },
      { id: 'score3000', tier: 'silver', icon: '🌠', stat: 'score', goal: 3000, text: s => s.score(3000) },
      { id: 'sun', tier: 'gold', icon: '☀️', stat: 'planet', goal: 9, text: s => s.make(T.names[9]) },
      { id: 'supernova', tier: 'platinum', icon: '💫', stat: 'supernova', goal: 1, text: () => T.trophySupernova }
    ]
  });

  // Colores para partículas y textos (los planetas se dibujan con su textura real)
  const COLORS = ['#d9d9e0', '#b8b0a8', '#e0663a', '#f0c878', '#3d8bff', '#4a6cff', '#9fe8f0', '#f0d898', '#e8b888', '#ffd23d'];
  const POINTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  const MAX = COLORS.length - 1;
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

  // ---------- PixiJS ----------
  const app = new PIXI.Application();
  try {
    await app.init({ preference: 'webgl', backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, width: innerWidth, height: innerHeight, autoStart: false });
    await Sphere.load();
  } catch (e) {
    document.getElementById('noGL').style.display = 'flex';
    console.error(e); return;
  }
  const cv = app.canvas; cv.id = 'c';
  document.body.prepend(cv);
  const RES = app.renderer.resolution;
  const L = { bg: new PIXI.Container(), box: new PIXI.Graphics(), guide: new PIXI.Graphics(), planets: new PIXI.Container(), front: new PIXI.Graphics(), hud: new PIXI.Container() };
  Object.values(L).forEach(c => app.stage.addChild(c));

  // Estrellas: tres capas que titilan a ritmos distintos
  const starLayers = [0, 1, 2].map(() => L.bg.addChild(new PIXI.Graphics()));
  function drawStars() {
    starLayers.forEach((g, k) => {
      g.clear();
      for (let i = 0; i < 45; i++) g.circle(Math.random() * W, Math.random() * H, Math.random() * (k + 1) * .5 + .3).fill({ color: 0xffffff });
    });
  }

  // Planetas reutilizables por nivel (evita crear y destruir objetos WebGL a cada fusión)
  const pool = COLORS.map(() => []);
  function take(l, layer) { const m = pool[l].pop() || Sphere.mesh(l); m.visible = true; m.alpha = 1; (layer || L.planets).addChild(m); return m; }
  function give(m) { m.visible = false; m.parent && m.parent.removeChild(m); pool[m.level].push(m); }

  let W, H, box, r0, land = false;
  let bodies = [], score = 0, best = +get('merge_best') || 0, cur, nxt, aimX, cooldown, over, revived, dangerT, paused = false;
  const hudScore = document.getElementById('score'), hudBest = document.getElementById('best'), nextBox = document.getElementById('nextBox');
  const ladder = document.getElementById('ladder'), danger = document.getElementById('danger'), toast = document.getElementById('toast');
  document.getElementById('nextLbl').textContent = T.next;
  const ladderMeshes = COLORS.map((_, i) => take(i, L.hud));
  ladder.innerHTML = COLORS.map((_, i) => `<button data-p="${i}" aria-label="${T.names[i]}" title="${T.names[i]}"></button>`).join('');
  ladder.title = U.hold;
  let curMesh = null, nextMesh = null;

  function resize() {
    W = innerWidth; H = innerHeight;
    app.renderer.resize(W, H);
    const w = Math.min(W * .94, H * .6, 520);
    const h = Math.min(H * .7, w * 1.6);
    box = { x: (W - w) / 2, y: H - h - 46, w, h, danger: H - h - 46 + h * .1 };
    r0 = w * .042;
    bodies.forEach(b => { b.r = rad(b.l); });
    aimX = aimX == null ? W / 2 : aimX;
    land = W - box.w > 300; // horizontal (escritorio): marcador y "siguiente" a los lados de la caja
    document.body.classList.toggle('land', land);
    // Marcador y "Siguiente" (HTML encima del canvas)
    const hud = document.getElementById('hud');
    if (land) {
      const lx = box.x / 2, rx = box.x + box.w + (W - box.x - box.w) / 2;
      Object.assign(hud.style, { left: lx - 80 + 'px', top: box.y + 'px', width: '160px' });
      Object.assign(nextBox.style, { left: rx - 60 + 'px', top: box.y + 'px', width: '120px', height: '110px' });
      Object.assign(toast.style, { left: lx + 'px', top: box.y + 110 + 'px', maxWidth: Math.max(140, box.x - 24) + 'px' });
    } else {
      Object.assign(hud.style, { left: W / 2 - 60 + 'px', top: '14px', width: '120px' });
      Object.assign(nextBox.style, { left: W - 74 + 'px', top: '12px', width: '62px', height: '76px' });
      Object.assign(toast.style, { left: '', top: '', maxWidth: '' });
    }
    // Fila de evolución (botones transparentes encima de cada planeta)
    const sw = box.w / COLORS.length, sy = box.y + box.h + 22;
    Object.assign(ladder.style, { left: box.x + 'px', top: sy - sw / 2 + 'px', width: box.w + 'px', height: sw + 'px' });
    ladderMeshes.forEach((m, i) => { m.x = box.x + sw * (i + .5); m.y = sy; m.update({ radius: Math.min(sw * .36, 12) / (m.extent > 1.5 ? 1.45 : 1), res: RES, pitch: .3, roll: 0 }); });
    drawStars();
  }
  addEventListener('resize', resize);
  const clampAim = () => { aimX = Math.max(box.x, Math.min(box.x + box.w, aimX)); };
  const rad = l => r0 * Math.pow(1.24, l);
  const randLevel = () => Math.floor(Math.random() * 5);

  function setNext() {
    if (curMesh) give(curMesh); if (nextMesh) give(nextMesh);
    curMesh = take(cur, L.planets); nextMesh = take(nxt, L.hud);
    const nb = nextBox.getBoundingClientRect();
    nextMesh.x = nb.left + nb.width / 2; nextMesh.y = nb.top + nb.height * .6;
    nextMesh.update({ radius: Math.min(rad(nxt), land ? 30 : 20) / (nextMesh.extent > 1.5 ? 1.6 : 1), res: RES });
  }

  function reset() {
    bodies.forEach(b => give(b.mesh));
    bodies = []; score = 0; shown = -1; acc = 0; cur = randLevel(); nxt = randLevel(); cooldown = 0; over = false; revived = false; dangerT = 0;
    setNext();
    document.getElementById('mOver').classList.remove('show');
    Ads.gameplayStart();
  }

  function addBody(x, y, l, extra) {
    const b = Object.assign({ x, y, px: x, py: y, r: rad(l), l, age: 0, ang: 0, seed: Math.random() * 6.28, mesh: take(l) }, extra);
    bodies.push(b); return b;
  }
  function drop() {
    if (over || paused || cooldown > 0) return;
    const r = rad(cur);
    const x = Math.max(box.x + r, Math.min(box.x + box.w - r, aimX));
    addBody(x, box.y - r - 4, cur);
    seen(cur);
    cur = nxt; nxt = randLevel(); cooldown = .45;
    setNext();
    UX.sfx('drop');
    if (coach && coach.active && ++drops >= 8) coach.done(); // por si no hubo fusión todavía
  }

  function step(dt) {
    const sub = 4, g = 1400 * (box.h / 700);
    const h = dt / sub;
    for (let s = 0; s < sub; s++) {
      for (const b of bodies) {
        const vx = (b.x - b.px) * .995, vy = (b.y - b.py) * .995;
        b.px = b.x; b.py = b.y;
        b.x += vx; b.y += vy + g * h * h;
      }
      // Colisiones y fusiones
      const merged = new Set();
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i];
        for (let j = i + 1; j < bodies.length; j++) {
          const b = bodies[j];
          const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r;
          const d2 = dx * dx + dy * dy;
          if (d2 >= rr * rr) continue;
          const d = Math.sqrt(d2) || .001;
          if (a.l === b.l && !merged.has(a) && !merged.has(b)) { merged.add(a); merged.add(b); continue; }
          const ov = (rr - d), nx = dx / d, ny = dy / d;
          const ma = a.r * a.r, mb = b.r * b.r, t = ma + mb;
          a.x -= nx * ov * mb / t; a.y -= ny * ov * mb / t;
          b.x += nx * ov * ma / t; b.y += ny * ov * ma / t;
        }
      }
      if (merged.size) doMerges(merged);
      for (const b of bodies) {
        if (b.x - b.r < box.x) { b.x = box.x + b.r; b.px = b.x + (b.x - b.px) * .3; }
        if (b.x + b.r > box.x + box.w) { b.x = box.x + box.w - b.r; b.px = b.x + (b.x - b.px) * .3; }
        if (b.y + b.r > box.y + box.h) { b.y = box.y + box.h - b.r; b.py = b.y + (b.y - b.py) * .2; b.px = b.x - (b.x - b.px) * .92; }
        b.ang += (b.x - b.px) / b.r; // rueda según lo que avanza de lado
      }
    }
    bodies.forEach(b => b.age += dt);
  }

  function doMerges(set) {
    const list = [...set];
    const used = new Set();
    for (let i = 0; i < list.length; i++) {
      const a = list[i]; if (used.has(a)) continue;
      for (let j = i + 1; j < list.length; j++) {
        const b = list[j]; if (used.has(b) || b.l !== a.l) continue;
        const dx = b.x - a.x, dy = b.y - a.y; if (dx * dx + dy * dy > (a.r + b.r + 1) ** 2) continue;
        used.add(a); used.add(b);
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        if (a.l === MAX) {
          score += 1000; UX.pop(T.supernova, mx, my, { size: 40, color: '#ffe14d', dur: 1.8 }); UX.confetti(); UX.shake(cv, 18); UX.sfx('win');
          Trophies.add('supernova');
        } else {
          const l = a.l + 1, r = rad(l);
          addBody(mx, my, l, { py: my + 1, age: 2, born: 0, ang: (a.ang + b.ang) / 2 });
          score += POINTS[l];
          Trophies.set('planet', l);
          if (coach && coach.active) coach.done();
          UX.pop(`+${POINTS[l]}`, mx, my - r * .3, { size: Math.round(18 + l * 2.2), sub: l >= 5 ? T.names[l] : '' });
          UX.burst(mx, my, { colors: [COLORS[l], '#fff', COLORS[a.l]], n: 10 + l * 3, speed: 200 + r * 5, size: 4 + l * .6, life: .7, shape: 'circle', gravity: 300 });
          UX.sfx('merge', l);
          if (l >= 5) UX.shake(cv, 3 + l);
          if (l >= 6) Ads.happytime();
          if (seen(l)) discover(l);
        }
        break;
      }
    }
    if (used.size) { bodies = bodies.filter(b => { if (used.has(b)) { give(b.mesh); return false; } return true; }); }
  }

  // Planetas que el jugador ya ha visto: el primero de cada tipo creado al fusionar muestra "¡Nuevo! Ver ficha"
  let seenMask = +get('mp_seen') || 0;
  function seen(l) { if (seenMask & (1 << l)) return false; seenMask |= 1 << l; put('mp_seen', seenMask); return true; }
  let toastT = 0;
  function discover(l) {
    toast.innerHTML = `<b>${U.found}</b> ${T.names[l]} <span>· ${U.view} ›</span>`;
    toast.dataset.l = l; toast.classList.add('show'); toastT = 6;
  }
  toast.onclick = e => { e.stopPropagation(); toast.classList.remove('show'); openInfo(+toast.dataset.l); };

  function checkDanger(dt) {
    const high = bodies.some(b => b.age > 1.5 && b.y - b.r < box.danger);
    dangerT = high ? dangerT + dt : 0;
    if (dangerT > 2 && !over) gameOver();
  }

  function gameOver() {
    over = true; Ads.gameplayStop(); UX.sfx('over'); UX.shake(cv, 10);
    Trophies.set('score', score); Trophies.add('plays');
    const isBest = score > best;
    if (isBest) { best = score; put('merge_best', best); }
    document.getElementById('tOver').textContent = isBest ? T.newBest : T.over;
    document.getElementById('finalScore').textContent = score;
    document.getElementById('bestTxt').textContent = T.bestTxt(best);
    const rv = document.getElementById('bRevive');
    rv.style.display = revived ? 'none' : ''; rv.innerHTML = `${T.revive}<small>${T.ad}</small>`;
    document.getElementById('bAgain').textContent = T.again;
    setTimeout(() => document.getElementById('mOver').classList.add('show'), 400);
  }
  document.getElementById('bRevive').onclick = async () => {
    if (!(await Ads.rewarded())) return;
    revived = true; over = false; dangerT = 0; acc = 0;
    const keep = new Set(bodies.filter(b => b.l >= 4).sort((a, b) => b.y - a.y).slice(0, Math.ceil(bodies.length / 3))); // quita los pequeños y los de arriba
    bodies = bodies.filter(b => { if (keep.has(b)) return true; give(b.mesh); return false; });
    document.getElementById('mOver').classList.remove('show'); Ads.gameplayStart();
  };
  document.getElementById('bAgain').onclick = async () => { document.getElementById('mOver').classList.remove('show'); await Ads.interstitial(); reset(); };

  // ---------- Ficha educativa ----------
  function openInfo(l) {
    if (Viewer.isOpen) return;
    const wasPlaying = !over; paused = true; down = false; hold = null;
    if (wasPlaying) Ads.gameplayStop();
    if (coach) coach.hideHand();
    UX.sfx('tap');
    Viewer.open(l, { onClose: () => { paused = false; last = performance.now(); if (wasPlaying && !over) Ads.gameplayStart(); } });
  }
  ladder.addEventListener('click', e => { const b = e.target.closest('button[data-p]'); if (b) openInfo(+b.dataset.p); });
  nextBox.addEventListener('click', () => openInfo(nxt));
  const infoBtn = document.getElementById('bInfo');
  infoBtn.innerHTML = `<svg class="ux-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="6" fill="currentColor"/><ellipse cx="12" cy="12" rx="11" ry="3.6" transform="rotate(-20 12 12)" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>`;
  infoBtn.title = U.info; infoBtn.setAttribute('aria-label', U.info);
  infoBtn.onclick = e => { e.stopPropagation(); openInfo(bodies.length ? Math.max(...bodies.map(b => b.l)) : cur); };

  // ---------- Entrada ----------
  // Mover para apuntar, soltar para dejar caer. Mantener pulsado un planeta de la caja (sin moverse) abre su ficha.
  // Clic derecho sobre un planeta también la abre.
  let down = false, hold = null;
  const hitBody = (x, y) => { for (let i = bodies.length - 1; i >= 0; i--) { const b = bodies[i]; if ((b.x - x) ** 2 + (b.y - y) ** 2 < b.r * b.r) return b; } return null; };
  cv.addEventListener('contextmenu', e => { e.preventDefault(); const b = hitBody(e.clientX, e.clientY); if (b) openInfo(b.l); });
  cv.addEventListener('pointerdown', e => {
    if (paused || e.button === 2) return;
    down = true; aimX = e.clientX; if (coach) coach.hideHand();
    const b = !over && hitBody(e.clientX, e.clientY);
    hold = b ? { b, x: e.clientX, y: e.clientY, t: 0 } : null;
  });
  cv.addEventListener('pointermove', e => {
    if (paused) return;
    aimX = e.clientX;
    if (hold && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 12) hold = null;
  });
  cv.addEventListener('pointerup', () => { if (down && !paused) drop(); down = false; hold = null; });
  cv.addEventListener('pointercancel', () => { down = false; hold = null; });
  // Teclado: se usa e.code (posición física), así A/D funciona igual en AZERTY (Q/D). Sin Escape ni Ctrl.
  // preventDefault evita que las flechas o el espacio muevan la página donde está incrustado el juego.
  const keys = {};
  addEventListener('keydown', e => {
    const c = e.code;
    if (['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyA', 'KeyD', 'KeyI'].includes(c)) e.preventDefault();
    if (paused) return;
    if ((c === 'Space' || c === 'Enter' || c === 'ArrowDown') && !e.repeat) { drop(); if (coach) coach.hideHand(); }
    if (c === 'KeyI' && !e.repeat) openInfo(cur);
    keys[c] = true;
  });
  addEventListener('keyup', e => { keys[e.code] = false; });
  addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  function steer(dt) {
    const dir = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0);
    if (dir) { aimX += dir * box.w * 1.1 * dt; clampAim(); }
  }

  // ---------- Dibujo ----------
  function dashed(g, x1, y1, x2, y2, on, off) {
    const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
    for (let d = 0; d < len; d += on + off) { const e = Math.min(d + on, len); g.moveTo(x1 + ux * d, y1 + uy * d).lineTo(x1 + ux * e, y1 + uy * e); }
  }
  function drawBox(now) {
    const g = L.box; g.clear();
    const { x, y, w, h } = box;
    // cristal con un leve degradado (bandas)
    for (let i = 0; i < 6; i++) g.rect(x, y + h * i / 6, w, h / 6).fill({ color: 0x7868ff, alpha: .03 + i * .022 });
    g.moveTo(x, y - 10).lineTo(x, y + h - 14).quadraticCurveTo(x, y + h, x + 14, y + h).lineTo(x + w - 14, y + h).quadraticCurveTo(x + w, y + h, x + w, y + h - 14).lineTo(x + w, y - 10)
      .stroke({ width: 4, color: 0xc8c8ff, alpha: .45, cap: 'round', join: 'round' });
    dashed(g, x, box.danger, x + w, box.danger, 8, 8);
    g.stroke({ width: 2, color: 0xff4a4a, alpha: dangerT > 0 ? .5 + .5 * Math.sin(now / 80) : .35 });
  }

  let last = performance.now(), acc = 0, shown = -1, time = 0;
  const STEP = 1 / 120; // física a paso fijo: igual en pantallas de 60, 144 o 165 Hz
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (!paused) {
      time += dt;
      if (!over) {
        steer(dt);
        acc = Math.min(acc + dt, .1);
        while (acc >= STEP) { step(STEP); acc -= STEP; }
        checkDanger(dt); cooldown -= dt;
      }
      bodies.forEach(b => { if (b.born != null) { b.born += dt; if (b.born > .3) b.born = null; } });
      if (hold && down) { hold.t += dt; if (hold.t > .5 && bodies.includes(hold.b)) { const l = hold.b.l; hold = null; down = false; openInfo(l); } }
    }
    if (toastT > 0 && (toastT -= dt) <= 0) toast.classList.remove('show');
    // Marcador
    const target = score; if (shown < 0) shown = target;
    shown += (target - shown) * Math.min(1, dt * 10); if (Math.abs(target - shown) < .5) shown = target;
    hudScore.textContent = Math.round(shown); hudBest.textContent = `★ ${T.best} ${Math.max(best, score)}`;
    danger.style.opacity = dangerT > 0 ? ((.55 + .4 * Math.sin(now / 90)) * Math.min(1, dangerT * 2)).toFixed(3) : '0';
    starLayers.forEach((g, k) => { g.alpha = .45 + .35 * Math.sin(now / (900 + k * 400) + k * 2); });

    drawBox(now);
    // Guía y planeta por soltar
    const gd = L.guide; gd.clear();
    if (!over) {
      const r = rad(cur), x = Math.max(box.x + r, Math.min(box.x + box.w - r, aimX));
      for (let i = 0; i < 8; i++) { const y1 = box.y + box.h * i / 8; dashed(gd, x, y1, x, y1 + box.h / 8, 4, 6); gd.stroke({ width: 2, color: 0xffffff, alpha: .3 * (1 - i / 8) }); }
      curMesh.visible = true; curMesh.x = x; curMesh.y = box.y - r - 4 + Math.sin(now / 300) * 2;
      curMesh.update({ radius: r * (cooldown > 0 ? .85 : 1), res: RES, alpha: cooldown > 0 ? .5 : 1, spin: time * .6, roll: 0, time });
    } else curMesh.visible = false;
    for (const b of bodies) {
      let r = b.r;
      if (b.born != null) { const t = b.born / .3; r *= 1 + Math.sin(t * Math.PI) * .22 - (1 - t) * .25; }
      b.mesh.x = b.x; b.mesh.y = b.y;
      b.mesh.update({ radius: r, res: RES, spin: b.seed + time * Sphere.LOOK[b.l].spin, roll: -b.ang, time });
    }
    // Aviso de "mantener pulsado": un anillo que se llena sobre el planeta
    const fr = L.front; fr.clear();
    if (hold && down && hold.t > .12) {
      const b = hold.b, k = Math.min(1, (hold.t - .12) / .38);
      fr.arc(b.x, b.y, b.r + 6, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2).stroke({ width: 4, color: 0xffcc33, alpha: .95, cap: 'round' });
    }
    nextMesh.update({ spin: time * .8, time });
    ladderMeshes.forEach((m, i) => m.update({ spin: time * .5 + i, time, alpha: seenMask & (1 << i) ? 1 : .45 }));
    if (coach) coach.update();
    app.render();
    requestAnimationFrame(frame);
  }

  // Tutorial la primera vez: la mano apunta moviéndose de lado a lado y suelta; en escritorio también se ven las teclas.
  let coach = null, drops = 0;
  window.__mp = { get bodies() { return bodies; }, drop, setAim: x => { aimX = x; }, get score() { return score; }, get over() { return over; }, step, openInfo, get paused() { return paused; } };
  resize(); reset();
  coach = UX.coach('merge-drop', {
    tip: T.tutorial, keys: `<kbd>A</kbd><kbd>D</kbd> <kbd>←</kbd><kbd>→</kbd> / 🖱️ ${T.aim} &nbsp;·&nbsp; <kbd>Space</kbd> / 🖱️ ${T.drop}`,
    path: () => [[box.x + box.w * .25, box.y - 30], [box.x + box.w * .7, box.y - 30]],
    tipY: () => box.y + box.h * .3
  });
  window.__mpReady = true;
  requestAnimationFrame(frame);
})();
