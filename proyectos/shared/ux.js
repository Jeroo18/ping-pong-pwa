// Tutorial dentro del juego (mano animada + frase corta) y botón de sonido, compartidos por los 3 juegos.
// Sigue las pautas de calidad de CrazyGames: se aprende jugando, con imágenes y poco texto,
// no bloquea nada (se puede ignorar) y solo sale la primera vez.
(function () {
  const css = `.ux-hand{position:fixed;left:0;top:0;z-index:6;font-size:46px;line-height:1;pointer-events:none;filter:drop-shadow(0 4px 6px #0009)}
.ux-tip{position:fixed;left:50%;transform:translateX(-50%);z-index:6;background:rgba(0,0,0,.72);color:#fff;border-radius:14px;padding:8px 14px;font:700 15px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;pointer-events:none;text-align:center;width:max-content;max-width:88vw;box-shadow:0 6px 20px #0006;animation:ux-in .4s}
.ux-tip .k{display:block;margin-top:6px;font-weight:600;font-size:13px;opacity:.9}
.ux-tip kbd{display:inline-block;min-width:22px;padding:1px 6px;margin:0 2px;border-radius:6px;background:#fff;color:#222;font:700 12px system-ui;box-shadow:0 2px 0 #999}
@keyframes ux-in{from{opacity:0;transform:translate(-50%,8px)}}
.ux-snd{width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:19px;line-height:40px;box-shadow:none;cursor:pointer}
.ux-snd.fab{position:fixed;top:calc(env(safe-area-inset-top) + 10px);left:106px;z-index:4}`;
  const FONT = "Fredoka,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";
  const st = document.createElement('style');
  st.textContent = `@font-face{font-family:Fredoka;src:url(fredoka.woff2) format('woff2');font-weight:300 700;font-display:swap}
.ux-fx{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:7}
.ux-ico{width:1.15em;height:1.15em;vertical-align:-.2em;display:inline-block}
.ux-snd .ux-ico,.tz-fab .ux-ico{width:20px;height:20px;vertical-align:middle}` + css.replace(/system-ui,-apple-system,Segoe UI,Roboto,sans-serif/g, FONT);
  document.head.appendChild(st);
  if (document.fonts && document.fonts.load) document.fonts.load('600 20px Fredoka').catch(() => {});

  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  const fine = !!(window.matchMedia && matchMedia('(pointer:fine)').matches);

  // ---------- Sonido ----------
  const SOUND = { en: 'Sound', es: 'Sonido', pt: 'Som', fr: 'Son', de: 'Ton', it: 'Audio', ru: 'Звук', tr: 'Ses', id: 'Suara', hi: 'ध्वनि', ar: 'الصوت', ja: 'サウンド', ko: '소리', zh: '声音' };
  let muted = get('sound') === '0';
  function soundButton(el) {
    if (!el) { el = document.createElement('button'); el.className = 'ux-snd fab'; document.body.appendChild(el); }
    const lang = (window.I18N && I18N.lang) || 'en';
    el.setAttribute('aria-label', SOUND[lang] || SOUND.en); el.title = SOUND[lang] || SOUND.en;
    const paint = () => { el.innerHTML = icon(muted ? 'mute' : 'sound'); el.setAttribute('aria-pressed', String(!muted)); };
    el.addEventListener('click', e => { e.stopPropagation(); muted = !muted; put('sound', muted ? '0' : '1'); paint(); if (!muted) sfx('tap'); });
    paint();
    return el;
  }

  // ---------- Tutorial ----------
  // coach('nut-sort', { tip, keys, tipY: () => y, path: () => [[x, y], ...] })
  // path: 1 punto = toque; 2+ puntos = arrastrar del primero al último. Devuelve { update, hideHand, done, active }.
  function coach(key, o) {
    const id = 'tut_' + key;
    const off = { active: false, update() {}, hideHand() {}, done() {} };
    if (get(id) === '1') return off;
    let hand = null, tip = null, anim = null, lastPath = '';
    tip = document.createElement('div'); tip.className = 'ux-tip';
    tip.textContent = o.tip;
    if (o.keys && fine) { const k = document.createElement('span'); k.className = 'k'; k.innerHTML = o.keys; tip.appendChild(k); }
    document.body.appendChild(tip);
    hand = document.createElement('div'); hand.className = 'ux-hand'; hand.textContent = '👆';
    document.body.appendChild(hand);

    function place() {
      if (tip) tip.style.top = Math.max(8, o.tipY()) + 'px';
      if (!hand) return;
      const p = o.path();
      if (!p || !p.length) { hand.style.visibility = 'hidden'; return; }
      hand.style.visibility = 'visible';
      const sig = JSON.stringify(p.map(q => q.map(Math.round)));
      if (sig === lastPath) return;
      lastPath = sig;
      if (anim) anim.cancel();
      // La punta del dedo del emoji queda arriba al centro.
      const at = (x, y, s) => `translate(${x - 18}px,${y - 4}px) scale(${s})`;
      const [a, b] = [p[0], p[p.length - 1]];
      const frames = p.length === 1
        ? [{ transform: at(a[0], a[1] + 30, 1), opacity: 0 }, { transform: at(a[0], a[1], 1), opacity: 1, offset: .3 }, { transform: at(a[0], a[1], .82), offset: .45 }, { transform: at(a[0], a[1], 1), offset: .6 }, { transform: at(a[0], a[1], 1), opacity: 0 }]
        : o.taps
          ? [{ transform: at(a[0], a[1], 1), opacity: 0 }, { transform: at(a[0], a[1], 1), opacity: 1, offset: .12 }, { transform: at(a[0], a[1], .82), offset: .22 }, { transform: at(a[0], a[1], 1), offset: .32 },
             { transform: at(b[0], b[1], 1), offset: .62 }, { transform: at(b[0], b[1], .82), offset: .72 }, { transform: at(b[0], b[1], 1), opacity: 1, offset: .85 }, { transform: at(b[0], b[1], 1), opacity: 0 }]
          : [{ transform: at(a[0], a[1], 1), opacity: 0 }, { transform: at(a[0], a[1], 1), opacity: 1, offset: .12 }, { transform: at(a[0], a[1], .82), offset: .25 },
             { transform: at(b[0], b[1], .82), offset: .7 }, { transform: at(b[0], b[1], 1), opacity: 1, offset: .8 }, { transform: at(b[0], b[1], 1), opacity: 0 }];
      anim = hand.animate(frames, { duration: p.length === 1 ? 1300 : 2200, iterations: Infinity, easing: 'ease-in-out' });
    }
    function hideHand() { if (anim) anim.cancel(); if (hand) hand.remove(); hand = null; }
    function done() { hideHand(); if (tip) tip.remove(); tip = null; put(id, '1'); api.active = false; removeEventListener('resize', onResize); }
    const onResize = () => { lastPath = ''; requestAnimationFrame(place); };
    addEventListener('resize', onResize);
    const api = { active: true, update: () => { if (api.active) place(); }, hideHand, done };
    requestAnimationFrame(place);
    return api;
  }

  // ---------- Íconos (SVG propios: se ven igual en todos los sistemas, a diferencia de los emojis) ----------
  const P = {
    sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>',
    mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5M21.5 9.5l-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    undo: '<path d="M9 5L4 10l5 5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M4.5 10H14a5 5 0 0 1 0 10h-3" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    bolt: '<rect x="3" y="3" width="11" height="3.6" rx="1.2" fill="currentColor"/><path d="M6.8 6.6h3.4V18l-1.7 3-1.7-3z" fill="currentColor"/><path d="M6.8 10l3.4-1.2M6.8 13l3.4-1.2M6.8 16l3.4-1.2" stroke="#0007" stroke-width="1"/><path d="M18 9v8M14 13h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    hint: '<path d="M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" fill="currentColor"/><rect x="9" y="17.5" width="6" height="2" rx="1" fill="currentColor"/><rect x="10" y="20.5" width="4" height="1.6" rx=".8" fill="currentColor"/>',
    restart: '<path d="M19 12a7 7 0 1 1-2.05-4.95" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M19.5 3.5v5h-5" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
    palette: '<path d="M12 3a9 9 0 0 0 0 18c1.4 0 1.9-1 1.4-2.1-.6-1.3.2-2.4 1.6-2.4H17a4 4 0 0 0 4-4c0-5.2-4-9.5-9-9.5z" fill="currentColor"/><circle cx="7.5" cy="11" r="1.5" fill="#0006"/><circle cx="10" cy="7" r="1.5" fill="#0006"/><circle cx="14.5" cy="7" r="1.5" fill="#0006"/>',
    trophy: '<path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="11" y="12" width="2" height="5" fill="currentColor"/><rect x="7.5" y="17" width="9" height="3" rx="1" fill="currentColor"/>',
    globe: '<circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3.5 12h17M12 3.5c-3 3.2-3 13.8 0 17M12 3.5c3 3.2 3 13.8 0 17" stroke="currentColor" stroke-width="1.6" fill="none"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="#f5b400"/><circle cx="12" cy="12" r="6.6" fill="#ffd84d" stroke="#e09a00" stroke-width="1.2"/><path d="M12 8.2v7.6" stroke="#c98500" stroke-width="2" stroke-linecap="round"/>',
    play: '<path d="M8 5l11 7-11 7z" fill="currentColor"/>'
  };
  const icon = n => `<svg class="ux-ico" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  // ---------- Sonido sintetizado (sin archivos) ----------
  let ac = null;
  const audio = () => { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; };
  addEventListener('pointerdown', () => { if (!muted) audio(); }, { once: true, capture: true });
  function note(f, t, d, type, vol, to) {
    const a = ac, o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, a.currentTime + t);
    if (to) o.frequency.exponentialRampToValueAtTime(to, a.currentTime + t + d);
    g.gain.setValueAtTime(0, a.currentTime + t); g.gain.linearRampToValueAtTime(vol || .08, a.currentTime + t + .008);
    g.gain.exponentialRampToValueAtTime(.0008, a.currentTime + t + d);
    o.connect(g).connect(a.destination); o.start(a.currentTime + t); o.stop(a.currentTime + t + d + .02);
  }
  function noise(t, d, vol, freq) {
    const a = ac, n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq || 1200; g.gain.value = vol || .1;
    s.connect(f).connect(g).connect(a.destination); s.start(a.currentTime + t);
  }
  const SCALE = [523.3, 587.3, 659.3, 784, 880, 1046.5, 1174.7, 1318.5, 1568, 1760];
  function sfx(name, k) {
    if (muted || !audio()) return;
    k = k || 0;
    try {
      switch (name) {
        case 'tap': note(880, 0, .05, 'triangle', .05); break;
        case 'pick': note(520, 0, .08, 'triangle', .06, 780); break;
        case 'place': note(180, 0, .12, 'sine', .14, 90); noise(0, .05, .06, 900); break;
        case 'drop': note(420, 0, .1, 'sine', .07, 260); break;
        case 'error': note(150, 0, .14, 'square', .03); note(140, .07, .14, 'square', .03); break;
        case 'clear': { const n = Math.min(2 + k, 6); for (let i = 0; i < n; i++) note(SCALE[i + Math.min(k, 3)], i * .055, .22, 'triangle', .07); noise(0, .18, .05, 3000); break; }
        case 'merge': { const f = 220 * Math.pow(1.122, k); note(f, 0, .16, 'sine', .11, f * 1.6); note(f * 2, .03, .12, 'triangle', .04); break; }
        case 'complete': [0, 2, 4].forEach((i, j) => note(SCALE[i + 2], j * .07, .25, 'triangle', .07)); break;
        case 'win': [0, 2, 4, 5, 7].forEach((i, j) => note(SCALE[i], j * .09, j === 4 ? .6 : .25, 'triangle', .08)); break;
        case 'over': [4, 2, 0].forEach((i, j) => note(SCALE[i] / 2, j * .16, .35, 'sine', .09)); break;
        case 'coin': note(988, 0, .08, 'square', .03); note(1319, .07, .2, 'square', .03); break;
      }
    } catch (e) {}
  }

  // ---------- Partículas y textos flotantes (un canvas transparente encima del juego) ----------
  // Todo va por tiempo real (dt), así se ve igual a 60, 144 o 165 Hz.
  let fc = null, fx2 = null, parts = [], pops = [], running = false, lastT = 0, fdpr = 1;
  function ensure() {
    if (fc) return;
    fc = document.createElement('canvas'); fc.className = 'ux-fx'; document.body.appendChild(fc); fx2 = fc.getContext('2d');
    const size = () => { fdpr = Math.min(devicePixelRatio || 1, 2); fc.width = innerWidth * fdpr; fc.height = innerHeight * fdpr; };
    size(); addEventListener('resize', size);
  }
  function kick() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(tick); } }
  // burst(x, y, { colors, n, speed, size, gravity, life, shape: 'rect'|'circle'|'star', up })
  function burst(x, y, o) {
    ensure(); o = o || {};
    const n = o.n || 16, cols = o.colors || ['#fff'];
    for (let i = 0; i < n; i++) {
      const a = o.up ? -Math.PI / 2 + (Math.random() - .5) * 2.2 : Math.random() * Math.PI * 2, sp = (o.speed || 380) * (.35 + Math.random() * .75);
      const life = (o.life || .8) * (.7 + Math.random() * .5);
      parts.push({ x: x + (Math.random() - .5) * (o.spread || 0), y: y + (Math.random() - .5) * (o.spread || 0), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.gravity == null ? 900 : o.gravity,
        s: (o.size || 7) * (.6 + Math.random() * .8), c: cols[i % cols.length], life, max: life, rot: Math.random() * 6, vr: (Math.random() - .5) * 12, shape: o.shape || 'rect' });
    }
    kick();
  }
  function confetti() {
    const cols = ['#ff4d6d', '#ffd23d', '#3dd6ff', '#7cf29a', '#b26bff', '#ff9f1a'];
    for (let i = 0; i < 2; i++) burst(innerWidth * (i ? .85 : .15), innerHeight * .55, { n: 60, colors: cols, speed: 900, size: 9, gravity: 1000, life: 1.8, up: true });
  }
  // pop(text, x, y, { color, size, sub, subColor })
  function pop(text, x, y, o) { ensure(); o = o || {}; pops.push({ text, x, y, t: 0, size: o.size || 28, color: o.color || '#fff', sub: o.sub, subColor: o.subColor || '#ffe14d', dur: o.dur || 1.1 }); kick(); }
  function star(c, s) { c.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? s * .45 : s, a = i * Math.PI / 5 - Math.PI / 2; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
  function tick(now) {
    const dt = Math.min((now - lastT) / 1000, .05); lastT = now;
    const c = fx2; c.setTransform(fdpr, 0, 0, fdpr, 0, 0); c.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(p => (p.life -= dt) > 0);
    for (const p of parts) {
      p.vx *= Math.pow(.25, dt); p.vy = p.vy * Math.pow(.25, dt) + p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      c.globalAlpha = Math.min(1, p.life / p.max * 1.6); c.fillStyle = p.c;
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
      const s = p.s * (.5 + .5 * p.life / p.max);
      if (p.shape === 'circle') { c.beginPath(); c.arc(0, 0, s / 2, 0, 7); c.fill(); }
      else if (p.shape === 'star') star(c, s);
      else c.fillRect(-s / 2, -s / 3, s, s * .66);
      c.restore();
    }
    pops = pops.filter(p => (p.t += dt) < p.dur);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    for (const p of pops) {
      const k = p.t / p.dur, sc = p.t < .18 ? .4 + 1.0 * (p.t / .18) - .25 * Math.sin(p.t / .18 * Math.PI) : 1;
      c.globalAlpha = k > .7 ? (1 - k) / .3 : 1;
      c.save(); c.translate(p.x, p.y - k * 46); c.scale(sc, sc);
      c.font = `700 ${p.size}px ${FONT}`; c.lineWidth = p.size * .22; c.strokeStyle = 'rgba(0,0,0,.45)'; c.strokeText(p.text, 0, 0); c.fillStyle = p.color; c.fillText(p.text, 0, 0);
      if (p.sub) { const z = p.size * .66; c.font = `700 ${z}px ${FONT}`; c.lineWidth = z * .22; c.strokeText(p.sub, 0, p.size * .95); c.fillStyle = p.subColor; c.fillText(p.sub, 0, p.size * .95); }
      c.restore();
    }
    c.globalAlpha = 1;
    if (parts.length || pops.length) requestAnimationFrame(tick); else running = false;
  }
  function shake(el, mag) {
    if (!el || !el.animate) return;
    const m = mag || 6, f = [];
    for (let i = 0; i < 6; i++) { const d = m * (1 - i / 6); f.push({ transform: `translate(${(Math.random() - .5) * 2 * d}px,${(Math.random() - .5) * 2 * d}px)` }); }
    f.push({ transform: 'translate(0,0)' });
    el.animate(f, { duration: 320, easing: 'ease-out' });
  }

  window.UX = { coach, soundButton, get muted() { return muted; }, fine, icon, sfx, burst, confetti, pop, shake, FONT };
})();
