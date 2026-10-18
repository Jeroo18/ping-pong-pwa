// Nut Sort — puzzle de ordenar tuercas por color.
// Niveles generados con semilla (siempre los mismos) y verificados con un solucionador,
// así ningún nivel sale imposible. El mismo solucionador da las pistas.
(function () {
  const T = I18N.strings(STRINGS);
  I18N.button(document.getElementById('bLang'));
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });

  const COLORS = ['#ff4d4d', '#3d7bff', '#ffd23d', '#2ecc71', '#a55eea', '#ff9f1a', '#ff6bcb', '#22d3ee', '#8d5524', '#b8f400', '#f5f5f5', '#1e2a78'];
  const CAP = 4;
  const THEME_PRICES = [0, 300, 600, 1000];
  const FREE_UNDOS = 3;

  const save = JSON.parse(localStorage.getItem('nutsort') || '{}');
  const S = { level: save.level || 1, coins: save.coins || 0, theme: save.theme || 0, owned: save.owned || [0] };
  const persist = () => localStorage.setItem('nutsort', JSON.stringify(S));

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
  const board = $('board');
  function toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1600); }

  function render() {
    $('lvl').textContent = T.level(S.level);
    $('coins').textContent = `🪙 ${S.coins}`;
    $('undoLeft').textContent = undosLeft > 0 ? `${undosLeft}` : T.ad;
    document.body.className = 'theme-' + S.theme;
    board.innerHTML = '';
    bolts.forEach((b, i) => {
      const el = document.createElement('div');
      el.className = 'bolt' + (isDone(b) ? ' done' : '') + (i === selected ? ' sel' : '');
      el.style.height = (CAP * 26 + 44) + 'px';
      const k = i === selected ? runLen(b) : 0;
      b.forEach((c, j) => {
        const n = document.createElement('div');
        n.className = 'nut' + (j >= b.length - k ? ' up' : '');
        n.style.background = COLORS[c];
        el.appendChild(n);
      });
      el.addEventListener('click', () => tap(i));
      board.appendChild(el);
    });
  }

  function beep(f, d) {
    try {
      const a = beep.ctx || (beep.ctx = new (window.AudioContext || window.webkitAudioContext)());
      const o = a.createOscillator(), g = a.createGain();
      o.frequency.value = f; g.gain.setValueAtTime(.08, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d);
      o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + d);
    } catch (e) {}
  }

  function tap(i) {
    if (busy) return;
    if (selected < 0) {
      if (!bolts[i].length || isDone(bolts[i])) return;
      selected = i; beep(520, .06); render(); return;
    }
    if (selected === i) { selected = -1; render(); return; }
    if (canMove(bolts, selected, i)) {
      history.push(bolts.map(b => b.slice()));
      applyMove(bolts, selected, i);
      selected = -1;
      beep(isDone(bolts[i]) ? 880 : 660, .08);
      if (isDone(bolts[i])) Ads.happytime();
      render();
      if (won(bolts)) setTimeout(win, 350);
    } else if (bolts[i].length && !isDone(bolts[i])) {
      selected = i; beep(520, .06); render();
    } else { selected = -1; render(); }
  }

  function startLevel() {
    bolts = generate(S.level);
    history = []; selected = -1; undosLeft = FREE_UNDOS; extraUsed = false;
    render();
    Ads.gameplayStart();
  }

  let reward = 0;
  function win() {
    Ads.gameplayStop();
    reward = 10 + Math.floor(S.level / 5) * 5;
    S.coins += reward; S.level++; persist();
    $('winTxt').textContent = T.earned(reward);
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
    if (await Ads.rewarded()) { S.coins += reward; persist(); $('winTxt').textContent = T.earned(reward * 2); render(); }
  };
  $('bUndo').onclick = async () => {
    if (!history.length) return toast(T.noUndo);
    if (undosLeft <= 0) { if (!(await Ads.rewarded())) return; undosLeft = FREE_UNDOS; }
    bolts = history.pop(); undosLeft--; selected = -1; render();
  };
  $('bBolt').onclick = async () => {
    if (extraUsed) return toast(T.oneBolt);
    if (!(await Ads.rewarded())) return;
    extraUsed = true; bolts.push([]); toast(T.boltAdded); render();
  };
  $('bHint').onclick = () => {
    if (S.coins < 50) return toast(T.noCoins);
    const p = solve(bolts, 80000);
    if (!p || !p.length) return toast(T.stuck);
    S.coins -= 50; persist();
    const [a, d] = p[0];
    selected = a; render();
    const el = board.children[d];
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
      b.innerHTML = `${T.themes[i]}<small>${owned ? T.owned : T.buy(p)}</small>`;
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
