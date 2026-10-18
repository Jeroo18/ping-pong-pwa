// Merge Planets — suelta planetas, dos iguales se fusionan en el siguiente. Meta: crear el Sol.
// Física Verlet propia (sin librerías) para que pese poco y cargue rápido en portales web.
(function () {
  const T = I18N.strings(STRINGS);
  I18N.floating();

  const PLANETS = [
    ['#d9d9e0', '#8a8a99'], ['#c9a27e', '#7a5a3e'], ['#ff6a3d', '#9c2a10'], ['#ffd27a', '#c98a2a'], ['#3db4ff', '#1b6e3a'],
    ['#4a6cff', '#1b2a8a'], ['#7ff0ff', '#2a9cb0'], ['#f5d58a', '#b08a3a'], ['#ffb27a', '#b0603a'], ['#fff27a', '#ff9a1a']
  ];
  const POINTS = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  const MAX = PLANETS.length - 1;

  const cv = document.getElementById('c'), ctx = cv.getContext('2d');
  let W, H, dpr, box, r0;
  let bodies, score, best = +localStorage.getItem('merge_best') || 0, cur, nxt, aimX, cooldown, over, revived, dangerT, fx;
  const stars = Array.from({ length: 80 }, () => [Math.random(), Math.random(), Math.random() * 1.5 + .3]);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const oldW = box ? box.w : 0;
    W = innerWidth; H = innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = Math.min(W * .94, H * .62, 520);
    const h = Math.min(H * .74, w * 1.6);
    box = { x: (W - w) / 2, y: H - h - 24, w, h, danger: H - h - 24 + h * .1 };
    r0 = w * .042;
    if (oldW && bodies) bodies.forEach(b => { b.r = rad(b.l); });
    aimX = aimX == null ? W / 2 : aimX;
  }
  addEventListener('resize', resize);
  const rad = l => r0 * Math.pow(1.24, l);
  const randLevel = () => Math.floor(Math.random() * 5);

  function reset() {
    bodies = []; score = 0; cur = randLevel(); nxt = randLevel(); cooldown = 0; over = false; revived = false; dangerT = 0; fx = [];
    document.getElementById('mOver').classList.remove('show');
    Ads.gameplayStart();
  }

  function drop() {
    if (over || cooldown > 0) return;
    const r = rad(cur);
    const x = Math.max(box.x + r, Math.min(box.x + box.w - r, aimX));
    const y = box.y - r - 4;
    bodies.push({ x, y, px: x, py: y, r, l: cur, age: 0 });
    cur = nxt; nxt = randLevel(); cooldown = .45;
    tone(260, .05);
  }

  function step(dt) {
    const sub = 8, g = 1400 * (box.h / 700);
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
          score += 1000; fx.push({ text: T.supernova, x: mx, y: my, t: 0, big: true }); tone(150, .6);
        } else {
          const l = a.l + 1, r = rad(l);
          bodies.push({ x: mx, y: my, px: mx, py: my + 1, r, l, age: 2 });
          score += POINTS[l];
          fx.push({ text: `+${POINTS[l]}`, x: mx, y: my, t: 0 });
          tone(330 + l * 70, .12);
          if (l >= 6) Ads.happytime();
        }
        break;
      }
    }
    bodies = bodies.filter(b => !used.has(b));
  }

  function checkDanger(dt) {
    const high = bodies.some(b => b.age > 1.5 && b.y - b.r < box.danger);
    dangerT = high ? dangerT + dt : 0;
    if (dangerT > 2 && !over) gameOver();
  }

  function gameOver() {
    over = true; Ads.gameplayStop();
    const isBest = score > best;
    if (isBest) { best = score; localStorage.setItem('merge_best', best); }
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
    revived = true; over = false; dangerT = 0;
    bodies = bodies.filter(b => b.l >= 4).sort((a, b) => b.y - a.y).slice(0, Math.ceil(bodies.length / 3)); // quita los pequeños y los de arriba
    document.getElementById('mOver').classList.remove('show'); Ads.gameplayStart();
  };
  document.getElementById('bAgain').onclick = async () => { document.getElementById('mOver').classList.remove('show'); await Ads.interstitial(); reset(); };

  function tone(f, d) {
    try {
      const a = tone.ctx || (tone.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = a.createOscillator(), gn = a.createGain(); o.type = 'sine';
      o.frequency.value = f; gn.gain.setValueAtTime(.08, a.currentTime); gn.gain.exponentialRampToValueAtTime(.001, a.currentTime + d);
      o.connect(gn).connect(a.destination); o.start(); o.stop(a.currentTime + d);
    } catch (e) {}
  }

  // Entrada: mover para apuntar, soltar para dejar caer
  let down = false;
  cv.addEventListener('pointerdown', e => { down = true; aimX = e.clientX; });
  cv.addEventListener('pointermove', e => { aimX = e.clientX; });
  cv.addEventListener('pointerup', () => { if (down) drop(); down = false; });
  addEventListener('keydown', e => { if (e.code === 'Space') drop(); if (e.code === 'ArrowLeft') aimX -= 20; if (e.code === 'ArrowRight') aimX += 20; });

  function planet(x, y, r, l, alpha) {
    const [c1, c2] = PLANETS[l];
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    if (l === MAX) { ctx.fillStyle = 'rgba(255,200,50,.25)'; ctx.beginPath(); ctx.arc(x, y, r * 1.25, 0, 7); ctx.fill(); }
    const g = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (l === 0 || l === 1) { ctx.fillStyle = 'rgba(0,0,0,.15)'; [[.3, .2, .2], [-.3, .3, .15], [.1, -.4, .12]].forEach(([a, b, s]) => { ctx.beginPath(); ctx.arc(x + a * r, y + b * r, s * r, 0, 7); ctx.fill(); }); }
    if (l === 4) { ctx.fillStyle = 'rgba(40,160,70,.8)'; ctx.beginPath(); ctx.ellipse(x - r * .2, y - r * .1, r * .35, r * .25, .5, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(x + r * .35, y + r * .35, r * .2, r * .15, -.3, 0, 7); ctx.fill(); }
    if (l === 8) { ctx.strokeStyle = 'rgba(150,70,30,.35)'; ctx.lineWidth = r * .12; [-.4, 0, .35].forEach(k => { ctx.beginPath(); ctx.moveTo(x - r * Math.sqrt(1 - k * k), y + k * r); ctx.lineTo(x + r * Math.sqrt(1 - k * k), y + k * r); ctx.stroke(); }); }
    if (l === 7) { ctx.strokeStyle = 'rgba(255,240,200,.8)'; ctx.lineWidth = r * .1; ctx.beginPath(); ctx.ellipse(x, y, r * 1.35, r * .35, -.3, 0, 7); ctx.stroke(); }
    // carita
    ctx.fillStyle = 'rgba(0,0,0,.55)';
    ctx.beginPath(); ctx.arc(x - r * .28, y - r * .05, r * .08, 0, 7); ctx.arc(x + r * .28, y - r * .05, r * .08, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = Math.max(1.5, r * .06);
    ctx.beginPath(); ctx.arc(x, y + r * .12, r * .18, .2, Math.PI - .2); ctx.stroke();
    ctx.globalAlpha = 1;
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 1 / 30); last = now;
    if (!over) { step(dt); checkDanger(dt); cooldown -= dt; }
    ctx.clearRect(0, 0, W, H);
    stars.forEach(([sx, sy, s]) => { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(sx * W, sy * H, s, s); });
    // HUD
    ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.font = '800 34px system-ui'; ctx.fillText(score, W / 2, 46);
    ctx.font = '600 13px system-ui'; ctx.globalAlpha = .7; ctx.fillText(`${T.best} ${best}`, W / 2, 66); ctx.globalAlpha = 1;
    ctx.textAlign = 'right'; ctx.font = '600 12px system-ui'; ctx.fillText(T.next, W - 16, 30);
    planet(W - 36, 56, Math.min(rad(nxt), 18), nxt);
    // Caja
    ctx.fillStyle = 'rgba(255,255,255,.05)'; ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(box.x, box.y - 10); ctx.lineTo(box.x, box.y + box.h); ctx.lineTo(box.x + box.w, box.y + box.h); ctx.lineTo(box.x + box.w, box.y - 10); ctx.stroke();
    ctx.setLineDash([8, 8]); ctx.strokeStyle = dangerT > 0 ? `rgba(255,60,60,${.5 + .5 * Math.sin(now / 80)})` : 'rgba(255,90,90,.35)';
    ctx.beginPath(); ctx.moveTo(box.x, box.danger); ctx.lineTo(box.x + box.w, box.danger); ctx.stroke(); ctx.setLineDash([]);
    // Pieza actual + guía
    if (!over) {
      const r = rad(cur), x = Math.max(box.x + r, Math.min(box.x + box.w - r, aimX));
      ctx.strokeStyle = 'rgba(255,255,255,.15)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, box.y - r); ctx.lineTo(x, box.y + box.h); ctx.stroke();
      planet(x, box.y - r - 4, r, cur, cooldown > 0 ? .4 : 1);
    }
    bodies.forEach(b => planet(b.x, b.y, b.r, b.l));
    // Escalera de evolución
    const sx = box.x, sy = box.y + box.h + 14, sw = box.w / PLANETS.length;
    for (let i = 0; i < PLANETS.length; i++) planet(sx + sw * (i + .5), sy, Math.min(sw * .38, 8), i, .8);
    fx = fx.filter(f => (f.t += dt) < 1);
    fx.forEach(f => { ctx.globalAlpha = 1 - f.t; ctx.textAlign = 'center'; ctx.fillStyle = f.big ? '#ffe14d' : '#fff'; ctx.font = `800 ${f.big ? 36 : 22}px system-ui`; ctx.fillText(f.text, f.x, f.y - f.t * 40); });
    ctx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }

  window.__mp = { get bodies() { return bodies; }, drop, setAim: x => { aimX = x; }, get score() { return score; }, get over() { return over; }, step };
  resize(); reset(); requestAnimationFrame(frame);
})();
