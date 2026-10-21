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
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

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
    const paint = () => { el.textContent = muted ? '🔇' : '🔊'; el.setAttribute('aria-pressed', String(!muted)); };
    el.addEventListener('click', e => { e.stopPropagation(); muted = !muted; put('sound', muted ? '0' : '1'); paint(); });
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

  window.UX = { coach, soundButton, get muted() { return muted; }, fine };
})();
