// Nut Sort — puzzle de ordenar tuercas por color.
// Niveles generados con semilla (siempre los mismos) y verificados con un solucionador,
// así ningún nivel sale imposible. El mismo solucionador da las pistas.
(function () {
  const T = I18N.strings(STRINGS);
  I18N.button(document.getElementById('bLang'));
  if (window.ADS_NO_DEMO && !window.CrazyGames) T.ad = ''; // portal sin anuncios todavía: los botones dan el premio directo
  Trophies.init({
    game: 'nut-sort', title: 'Nut Sort', color: '#5b2fb8', button: document.getElementById('bTrophy'),
    list: [
      { id: 'lv5', tier: 'bronze', icon: '🔩', stat: 'levels', goal: 5, text: s => s.levels(5) },
      { id: 'days3', tier: 'bronze', icon: '📅', stat: 'days', goal: 3, text: s => s.days(3) },
      { id: 'lv20', tier: 'silver', icon: '⚙️', stat: 'levels', goal: 20, text: s => s.levels(20) },
      { id: 'coins500', tier: 'silver', icon: '🪙', stat: 'coins', goal: 500, text: s => s.coins(500) },
      { id: 'lv50', tier: 'gold', icon: '🏅', stat: 'levels', goal: 50, text: s => s.levels(50) },
      { id: 'days7', tier: 'gold', icon: '🔥', stat: 'days', goal: 7, text: s => s.days(7) },
      { id: 'lv100', tier: 'platinum', icon: '👑', stat: 'levels', goal: 100, text: s => s.levels(100) }
    ]
  });
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });
  document.querySelectorAll('[data-ic]').forEach(el => { el.outerHTML = UX.icon(el.dataset.ic); });
  const coinTxt = t => String(t).replace(/🪙/g, UX.icon('coin'));
  UX.soundButton(document.getElementById('bSound'));
  document.getElementById('boltTxt').textContent = T.ad ? `${T.bolt} · ${T.ad}` : T.bolt;
  document.getElementById('hintTxt').innerHTML = `${T.hint} · 50 ${UX.icon('coin')}`;

  const COLORS = ['#ff4d4d', '#3d7bff', '#ffd23d', '#2ecc71', '#a55eea', '#ff9f1a', '#ff6bcb', '#22d3ee', '#8d5524', '#b8f400', '#f5f5f5', '#1e2a78'];
  const CAP = 4;
  const THEME_PRICES = [0, 300, 600, 1000];
  const FREE_UNDOS = 3;

  const save = JSON.parse(localStorage.getItem('nutsort') || '{}');
  const S = { level: save.level || 1, coins: save.coins || 0, theme: save.theme || 0, owned: save.owned || [0] };
  const persist = () => localStorage.setItem('nutsort', JSON.stringify(S));
  Trophies.set('levels', S.level - 1);

  let bolts = [], history = [], selected = -1, undosLeft = FREE_UNDOS, extraUsed = false, busy = false;

  // ---------- Generación ----------
  function rng(seed) { // mulberry32
    return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function levelSpec(n) {
    const colors = Math.min(3 + Math.floor((n - 1) / 3), COLORS.length);
    return { colors, empty: 2 };
  }
  function generate(n) {
    const { colors, empty } = levelSpec(n);
    for (let attempt = 0; attempt < 50; attempt++) {
      const r = rng(n * 7919 + attempt * 104729);
      const pool = [];
      for (let c = 0; c < colors; c++) for (let i = 0; i < CAP; i++) pool.push(c);
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
      const b = [];
      for (let c = 0; c < colors; c++) b.push(pool.slice(c * CAP, c * CAP + CAP));
      for (let e = 0; e < empty; e++) b.push([]);
      if (b.some(x => x.length === CAP && x.every(v => v === x[0]))) continue; // no regalar tornillos ya resueltos
      if (solve(b, 60000)) return b;
    }
    // Respaldo: casi resuelto, siempre solucionable
    const b = []; for (let c = 0; c < colors; c++) b.push([c, c, c, c]); b.push([], []);
    b[0].pop(); b[colors].push(0);
    return b;
  }

  // ---------- Reglas ----------
  const top = b => b[b.length - 1];
  const runLen = b => { if (!b.length) return 0; let k = 1; while (k < b.length && b[b.length - 1 - k] === top(b)) k++; return k; };
  const isDone = b => b.length === CAP && b.every(v => v === b[0]);
  const canMove = (bs, a, d) => a !== d && bs[a].length && !isDone(bs[a]) && bs[d].length < CAP && (!bs[d].length || top(bs[d]) === top(bs[a]));
  function applyMove(bs, a, d) {
    const k = Math.min(runLen(bs[a]), CAP - bs[d].length);
    for (let i = 0; i < k; i++) bs[d].push(bs[a].pop());
    return k;
  }
  const won = bs => bs.every(b => !b.length || isDone(b));

  // ---------- Solucionador (DFS con memoria) ----------
  function solve(start, limit) {
    const seen = new Set();
    const key = bs => bs.map(b => b.join(',')).sort().join('|');
    let nodes = 0;
    const path = [];
    function dfs(bs) {
      if (won(bs)) return true;
      if (++nodes > limit) return false;
      const k = key(bs); if (seen.has(k)) return false; seen.add(k);
      const moves = [];
      for (let a = 0; a < bs.length; a++) for (let d = 0; d < bs.length; d++) {
        if (!canMove(bs, a, d)) continue;
        if (!bs[d].length && runLen(bs[a]) === bs[a].length) continue; // mover un bloque entero a vacío no sirve
        moves.push([a, d, bs[d].length ? 0 : 1]);
      }
      moves.sort((x, y) => x[2] - y[2]); // primero encima del mismo color
      for (const [a, d] of moves) {
        const next = bs.map(b => b.slice());
        applyMove(next, a, d);
        path.push([a, d]);
        if (dfs(next)) return true;
        path.pop();
      }
      return false;
    }
    return dfs(start.map(b => b.slice())) ? path.slice() : null;
  }

  // ---------- Interfaz ----------
  const $ = id => document.getElementById(id);
  const board = $('board'), wrap = $('bolts');
  let Z = 1, fresh = false, anim = null;
  // Agranda los tornillos hasta llenar el espacio libre (en escritorio se ven grandes, en el móvil caben).
  function fit() {
    const n = bolts.length; if (!n) return;
    const avW = board.clientWidth - 16, avH = board.clientHeight - 16, bw = 70, bh = CAP * 26 + 44, gy = 40;
    let z = .5, per = n;
    for (let t = 2; t >= .5; t -= .05) {
      const fitPer = Math.max(1, Math.floor((avW / t + 8) / bw)), rows = Math.ceil(n / fitPer);
      if ((rows * bh + (rows - 1) * gy + 36) * t <= avH) { z = t; per = Math.ceil(n / rows); break; }
    }
    Z = z; wrap.style.zoom = z; wrap.style.width = (per * bw) + 'px';
  }
  addEventListener('resize', () => { fit(); if (coach) coach.update(); });
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1600); }

  function render() {
    $('lvl').textContent = T.level(S.level);
    $('coins').innerHTML = `${UX.icon('coin')} ${S.coins}`;
    $('undoLeft').textContent = undosLeft > 0 ? `${undosLeft}` : T.ad;
    document.body.className = 'theme-' + S.theme;
    wrap.innerHTML = '';
    bolts.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'bolt' + (isDone(b) ? ' done' : '') + (i === selected ? ' sel' : '') + (fresh ? ' enter' : '');
      if (fresh) el.style.animationDelay = (i * 45) + 'ms';
      el.style.height = (CAP * 26 + 44) + 'px';
      const k = i === selected ? runLen(b) : (anim && anim.fall === i ? anim.k : 0);
      b.forEach((c, j) => {
        const n = document.createElement('div');
        const top = j >= b.length - k;
        n.className = 'nut' + (top && i === selected ? ' up' : '') + (top && anim && anim.rise === i ? ' rise' : '') + (top && anim && anim.fall === i ? ' fall' : '');
        n.style.backgroundColor = COLORS[c];
        el.appendChild(n);
      });
      el.addEventListener('click', () => tap(i));
      wrap.appendChild(el);
    });
    fresh = false; anim = null;
    fit();
    if (coach) coach.update();
  }

  // Tutorial del nivel 1: la mano señala el primer movimiento (toca un tornillo y luego el destino).
  let coach = null, firstMove = null;
  const center = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height * .45]; };
  function coachPath() {
    if (!firstMove || !wrap.children.length) return null;
    const [a, d] = firstMove;
    const A = wrap.children[a], D = wrap.children[d];
    if (!A || !D) return null;
    return selected === a ? [center(D)] : [center(A), center(D)];
  }

  // Las tuercas vuelan en arco del tornillo de origen al de destino (solo es visual: el estado ya cambió).
  function fly(from, to, rects, k, srcTop) {
    const D = wrap.children[to]; if (!D) return;
    const nuts = [...D.querySelectorAll('.nut')].slice(-k), dTop = D.getBoundingClientRect().top;
    const lift = Math.min(srcTop, dTop) - 30 * Z;
    nuts.forEach((n, j) => {
      const r0 = rects[k - 1 - j], r1 = n.getBoundingClientRect();
      if (!r0) return;
      const dx = (r0.left - r1.left) / Z, dy = (r0.top - r1.top) / Z, ly = (lift - r1.top) / Z - j * 4;
      n.classList.add('fly');
      n.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: `translate(${dx}px,${ly}px)`, offset: .28 }, { transform: `translate(0,${ly}px)`, offset: .7 }, { transform: 'translate(0,0)' }],
        { duration: 400, delay: j * 45, easing: 'cubic-bezier(.45,0,.35,1)', fill: 'backwards' });
    });
  }
  function celebrate(i) {
    const el = wrap.children[i]; if (!el) return;
    el.classList.add('pulse');
    const r = el.getBoundingClientRect();
    UX.burst(r.left + r.width / 2, r.top + r.height * .35, { colors: [COLORS[bolts[i][0]], '#fff', '#ffe680'], n: 22, speed: 420, size: 8 * Z, shape: 'star', up: true, life: .9 });
    UX.sfx('complete');
  }

  function tap(i) {
    if (busy) return;
    if (selected < 0) {
      if (!bolts[i].length || isDone(bolts[i])) return;
      selected = i; anim = { rise: i }; UX.sfx('pick'); render(); return;
    }
    if (selected === i) { anim = { fall: i, k: runLen(bolts[i]) }; selected = -1; UX.sfx('tap'); render(); return; }
    if (canMove(bolts, selected, i)) {
      const from = selected, k = Math.min(runLen(bolts[from]), CAP - bolts[i].length);
      const S0 = wrap.children[from], rects = S0 ? [...S0.querySelectorAll('.nut')].slice(-k).map(n => n.getBoundingClientRect()) : [];
      const srcTop = S0 ? S0.getBoundingClientRect().top : 0;
      history.push(bolts.map(b => b.slice()));
      applyMove(bolts, from, i);
      selected = -1;
      if (coach && coach.active) { coach.hideHand(); firstMove = null; }
      const done = isDone(bolts[i]);
      render();
      fly(from, i, rects, k, srcTop);
      setTimeout(() => { if (done) { celebrate(i); Ads.happytime(); } else UX.sfx('place'); }, 380 + k * 45);
      if (won(bolts)) setTimeout(win, 420);
    } else if (bolts[i].length && !isDone(bolts[i])) {
      const prev = selected;
      selected = i; anim = { rise: i }; UX.sfx('pick'); render();
      const el = wrap.children[prev]; if (el) UX.shake(el, 4);
    } else { const el = wrap.children[i]; selected = -1; render(); UX.sfx('error'); if (wrap.children[i]) UX.shake(wrap.children[i], 5); }
  }

  function startLevel() {
    bolts = generate(S.level);
    history = []; selected = -1; undosLeft = FREE_UNDOS; extraUsed = false;
    fresh = true;
    if (S.level === 1 && !coach) {
      const p = solve(bolts, 80000);
      firstMove = p && p[0];
      coach = UX.coach('nut-sort', { tip: T.tutorial, taps: true, path: coachPath, tipY: () => document.querySelector('header').getBoundingClientRect().bottom + 6 });
    } else if (coach && coach.active) coach.done();
    render();
    Ads.gameplayStart();
  }

  let reward = 0;
  function win() {
    Ads.gameplayStop();
    if (coach && coach.active) coach.done();
    reward = 10 + Math.floor(S.level / 5) * 5;
    S.coins += reward; S.level++; persist();
    Trophies.set('levels', S.level - 1); Trophies.add('coins', reward);
    $('winTxt').innerHTML = coinTxt(T.earned(reward));
    UX.confetti(); UX.sfx('win');
    $('bDouble').disabled = false;
    $('mWin').classList.add('show');
    render();
  }

  $('bNext').onclick = async () => {
    $('mWin').classList.remove('show');
    if (S.level > 4) await Ads.interstitial();
    startLevel();
  };
  $('bDouble').onclick = async () => {
    $('bDouble').disabled = true;
    if (await Ads.rewarded()) { S.coins += reward; persist(); Trophies.add('coins', reward); $('winTxt').innerHTML = coinTxt(T.earned(reward * 2)); UX.sfx('coin'); render(); }
  };
  $('bUndo').onclick = async () => {
    if (!history.length) { UX.sfx('error'); return toast(T.noUndo); }
    if (undosLeft <= 0) { if (!(await Ads.rewarded())) return; undosLeft = FREE_UNDOS; }
    bolts = history.pop(); undosLeft--; selected = -1; UX.sfx('drop'); render();
  };
  $('bBolt').onclick = async () => {
    if (extraUsed) return toast(T.oneBolt);
    if (!(await Ads.rewarded())) return;
    extraUsed = true; bolts.push([]); toast(T.boltAdded); UX.sfx('complete'); render();
  };
  $('bHint').onclick = () => {
    if (S.coins < 50) return toast(T.noCoins);
    const p = solve(bolts, 80000);
    if (!p || !p.length) return toast(T.stuck);
    S.coins -= 50; persist();
    const [a, d] = p[0];
    selected = a; anim = { rise: a }; UX.sfx('coin'); render();
    const el = wrap.children[d];
    if (el) { el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 500, iterations: 2 }); }
  };
  $('bRestart').onclick = () => { if (history.length) { bolts = history[0]; history = []; selected = -1; render(); } };

  // Tienda de temas (meta de progresión para gastar monedas)
  function renderShop() {
    const box = $('themes'); box.innerHTML = '';
    THEME_PRICES.forEach((p, i) => {
      const b = document.createElement('button');
      const owned = S.owned.includes(i);
      b.className = i === S.theme ? '' : 'ghost';
      b.innerHTML = `${T.themes[i]}<small>${owned ? T.owned : coinTxt(T.buy(p))}</small>`;
      b.onclick = () => {
        if (!owned) { if (S.coins < p) return toast(T.noCoins); S.coins -= p; S.owned.push(i); }
        S.theme = i; persist(); render(); renderShop();
      };
      box.appendChild(b);
    });
  }
  $('bShop').onclick = () => { renderShop(); $('mShop').classList.add('show'); };
  $('bCloseShop').onclick = () => $('mShop').classList.remove('show');

  // Para pruebas automáticas
  window.__nut = { get bolts() { return bolts; }, solve: () => solve(bolts, 80000), tap, generate, get state() { return S; } };

  startLevel();
})();
