// Ficha de cada planeta: el planeta en 3D (se gira arrastrando), datos de la NASA, historia, avances
// y una foto real pedida en vivo a la API abierta NASA Image and Video Library.
// Uso: Viewer.open(nivel, { onClose })
(function () {
  const lang = I18N.lang;
  const U = Object.assign({}, PLANETS.UI.en, PLANETS.UI[lang]);
  const TX = PLANETS.TEXT[lang] || PLANETS.TEXT.en;
  const F = PLANETS.FACTS;
  const names = () => window.STRINGS ? I18N.strings(STRINGS).names : F.map(f => f.en);
  const nf = (n, d) => new Intl.NumberFormat(I18N.locale, { maximumFractionDigits: d == null ? 1 : d }).format(n);
  const sig = (n, s) => new Intl.NumberFormat(I18N.locale, { maximumSignificantDigits: s || 3 }).format(n);
  const km = n => new Intl.NumberFormat(I18N.locale, { notation: 'compact', maximumSignificantDigits: 3 }).format(n) + ' km';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const css = `.pv{position:fixed;inset:0;z-index:20;background:rgba(4,4,20,.82);backdrop-filter:blur(4px);display:none;align-items:center;justify-content:center;padding:max(10px,env(safe-area-inset-top)) 10px 10px}
.pv.show{display:flex}.pv.show .pv-card{animation:pvIn .35s cubic-bezier(.2,1.3,.4,1)}@keyframes pvIn{from{transform:scale(.85);opacity:0}}
.pv-card{width:min(980px,100%);height:min(640px,100%);background:linear-gradient(160deg,#1d1852,#0d0b2a);border:1px solid rgba(160,150,255,.25);border-radius:22px;box-shadow:0 20px 60px #000a;display:flex;flex-direction:column;overflow:hidden;color:#fff}
.pv-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.08)}
.pv-head h2{margin:0;font-size:22px;line-height:1.1}.pv-type{font-size:13px;opacity:.75;margin-top:2px}
.pv-head .t{flex:1;min-width:0;text-align:center}
.pv button{font:inherit}.pv-nav{width:40px;height:40px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:#fff;font-size:22px;font-weight:700;cursor:pointer;padding:0;box-shadow:none}
.pv-body{flex:1;display:flex;min-height:0}
.pv-3d{position:relative;flex:0 0 44%;background:radial-gradient(circle at 50% 45%,#221c5e 0,#0a0820 70%);touch-action:none;cursor:grab;overflow:hidden}
.pv-3d:active{cursor:grabbing}.pv-3d canvas{position:absolute;inset:0;width:100%!important;height:100%!important}
.pv-hint{position:absolute;left:0;right:0;bottom:10px;text-align:center;font-size:13px;opacity:.7;pointer-events:none}
.pv-info{flex:1;display:flex;flex-direction:column;min-width:0}
.pv-tabs{display:flex;gap:6px;padding:10px 12px 0;overflow-x:auto;scrollbar-width:none}
.pv-tabs button{border:0;border-radius:12px 12px 0 0;padding:9px 12px;background:rgba(255,255,255,.07);color:#cfcaff;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;box-shadow:none}
.pv-tabs button.on{background:rgba(255,255,255,.16);color:#fff}
.pv-sec{flex:1;overflow-y:auto;padding:14px 16px 18px;background:rgba(255,255,255,.05);font-size:15px;line-height:1.45;user-select:text;-webkit-user-select:text}
.pv-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.pv-f{background:rgba(255,255,255,.07);border-radius:12px;padding:8px 10px}.pv-f b{display:block;font-size:17px}.pv-f span{font-size:12px;opacity:.75}
.pv-big{margin:12px 0 4px;padding:10px 12px;border-radius:12px;background:rgba(255,204,51,.14);color:#ffe9a6;font-weight:600}
.pv-src{font-size:12px;opacity:.6;margin-top:10px}
.pv-tl{list-style:none;margin:0;padding:0}.pv-tl li{display:flex;gap:10px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.07)}
.pv-tl li b{flex:0 0 46px;color:#ffcc33}
.pv-fun{margin:12px 0 0;padding-left:20px}.pv-fun li{margin:4px 0}
.pv-ph img{width:100%;max-height:300px;object-fit:contain;border-radius:12px;background:#000}
.pv-ph h3{margin:8px 0 2px;font-size:16px}.pv-ph p{font-size:13px;opacity:.85;margin:6px 0}
.pv-ph .row{margin-top:10px}.pv-ph button{border:0;border-radius:12px;padding:9px 14px;background:#ffcc33;color:#211c55;font-weight:700;cursor:pointer}
.pv-note{font-size:12px;opacity:.6;margin-bottom:8px}
@media (orientation:portrait),(max-width:640px){.pv-body{flex-direction:column}.pv-3d{flex:0 0 36%}.pv-card{height:100%}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const el = document.createElement('div'); el.className = 'pv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<div class="pv-card"><div class="pv-head"><button class="pv-nav" data-a="prev" aria-label="‹">‹</button>
<div class="t"><h2 id="pvName"></h2><div class="pv-type" id="pvType"></div></div>
<button class="pv-nav" data-a="next" aria-label="›">›</button><button class="pv-nav" data-a="close" aria-label="${esc(U.close)}" title="${esc(U.close)}">✕</button></div>
<div class="pv-body"><div class="pv-3d" id="pv3d"><div class="pv-hint">${esc(U.drag)}</div></div>
<div class="pv-info"><div class="pv-tabs" role="tablist">${['facts', 'story', 'steps', 'photo'].map(k => `<button role="tab" data-t="${k}">${esc(U[k])}</button>`).join('')}</div>
<div class="pv-sec" id="pvSec"></div></div></div></div>`;
  document.body.appendChild(el);
  const $ = id => document.getElementById(id);

  let idx = 0, tab = 'facts', onClose = null, app = null, mesh = null, meshes = {}, ready = null;
  let spin = 0, pitch = .3, vSpin = 0, drag = null, t = 0;

  async function init() {
    if (ready) return ready;
    ready = (async () => {
      app = new PIXI.Application();
      await app.init({ preference: 'webgl', backgroundAlpha: 0, antialias: true, resolution: Math.min(devicePixelRatio || 1, 2), autoDensity: true, width: 300, height: 300 });
      $('pv3d').prepend(app.canvas);
      app.ticker.add(tk => {
        const dt = Math.min(tk.deltaMS / 1000, .05); t += dt;
        if (!drag) { spin += (vSpin + .35 * Math.sign(Sphere.LOOK[idx].spin || 1)) * dt; vSpin *= Math.pow(.05, dt); pitch += (.3 - pitch) * Math.min(1, dt * .6); }
        if (mesh) mesh.update({ spin, pitch, time: t });
      });
      app.ticker.stop();
    })();
    return ready;
  }
  function layout() {
    if (!app) return;
    const box = $('pv3d').getBoundingClientRect(), w = Math.max(1, box.width), h = Math.max(1, box.height);
    app.renderer.resize(w, h);
    if (mesh) { mesh.x = w / 2; mesh.y = h / 2 - 8; mesh.update({ radius: Math.min(w, h) * .44 / mesh.extent, res: app.renderer.resolution }); }
  }
  function setPlanet(i) {
    idx = (i + F.length) % F.length;
    if (mesh) mesh.visible = false;
    mesh = meshes[idx] || (meshes[idx] = app.stage.addChild(Sphere.mesh(idx)));
    mesh.visible = true; spin = 0; pitch = .3; vSpin = 0;
    $('pvName').textContent = names()[idx];
    $('pvType').textContent = TX[idx].type;
    layout(); render();
  }

  function facts() {
    const f = F[idx], a = [];
    const add = (v, k) => a.push(`<div class="pv-f"><b>${v}</b><span>${esc(k)}</span></div>`);
    add(`${nf(f.d, 0)} km`, U.diam);
    if (idx !== 4) add(esc(U.massU(f.m >= 100 ? nf(f.m, 0) : nf(f.m, f.m < .1 ? 4 : 2))), U.mass);
    add(`${nf(f.g)} m/s²`, U.grav);
    add(f.day < 48 ? `${nf(f.day)} ${U.hours}` : `${nf(f.day / 24, 1)} ${U.days}`, U.day);
    if (f.year) add(`${nf(f.year, f.year < 1000 ? 1 : 0)} ${U.days}`, f.orbitsEarth ? U.yearMoon : U.year);
    if (f.orbitsEarth) add(`${nf(f.dist * 1e6, 0)} km`, U.distMoon); else if (f.dist) add(km(f.dist * 1e6), U.dist);
    add(`${nf(f.t, 0)} °C`, f.star ? U.tempSun : U.temp);
    if (f.star) add('8', U.planets); else add(nf(f.moons, 0), U.moons);
    if (!f.star) add(f.rings ? U.yes : U.no, U.rings);
    const ratio = Math.pow(f.d / F[4].d, 3);
    const big = idx === 4 ? '' : ratio > 1.5 ? U.fits(sig(ratio)) : U.fitsIn(sig(1 / ratio, 2));
    return `<div class="pv-grid">${a.join('')}</div>${big ? `<div class="pv-big">${esc(big)}</div>` : ''}<div class="pv-src">${esc(U.src)} · ${esc(U.sizeOrder)}</div><div class="pv-src">3D: Solar System Scope (CC BY 4.0) · PixiJS (MIT)</div>`;
  }
  const note = () => (PLANETS.TEXT[lang] ? '' : `<div class="pv-note">${esc(U.textIn)}</div>`);
  function story() {
    const x = TX[idx];
    return `${note()}<p style="margin-top:0">${esc(x.story)}</p><b>${esc(U.fun)}</b><ul class="pv-fun">${x.fun.map(s => `<li>${esc(s)}</li>`).join('')}</ul>`;
  }
  function steps() { return `${note()}<ul class="pv-tl">${TX[idx].steps.map(([y, s]) => `<li><b>${y}</b><span>${esc(s)}</span></li>`).join('')}</ul>`; }

  // ---------- Foto en vivo desde la API de la NASA ----------
  const cache = {};
  const API = 'https://images-api.nasa.gov/search?media_type=image&';
  const strip = h => { const d = new DOMParser().parseFromString(String(h || ''), 'text/html'); return (d.body.textContent || '').replace(/\s+/g, ' ').trim(); };
  function pick(item) {
    const d = item.data[0], link = (item.links || []).find(l => l.render === 'image') || {};
    return { title: d.title, date: (d.date_created || '').slice(0, 4), desc: strip(d.description).slice(0, 420), credit: d.secondary_creator || d.photographer || d.center || 'NASA', img: link.href, id: d.nasa_id };
  }
  async function nasa(i, random) {
    const key = i + (random ? 'r' : '');
    if (!random && cache[key]) return cache[key];
    if (random) {
      const pool = cache[i + 'pool'] || (cache[i + 'pool'] = await fetch(`${API}keywords=${encodeURIComponent(F[i].en)}&q=${encodeURIComponent(F[i].en)}`).then(r => r.json()).then(j => j.collection.items.filter(it => it.links && it.data && it.data[0])));
      if (!pool.length) throw new Error('empty');
      return pick(pool[Math.floor(Math.random() * pool.length)]);
    }
    const j = await fetch(`${API}nasa_id=${encodeURIComponent(F[i].nasa)}`).then(r => r.json());
    if (!j.collection.items.length) throw new Error('empty');
    return (cache[key] = pick(j.collection.items[0]));
  }
  async function photo(random) {
    const want = idx, sec = $('pvSec');
    sec.innerHTML = `<div class="pv-ph"><p>${esc(U.loading)}</p></div>`;
    try {
      const p = await nasa(want, random);
      if (want !== idx || tab !== 'photo') return;
      const en = lang === 'en' ? '' : `<div class="pv-note">${esc(U.nasaEn || U.textIn)}</div>`;
      sec.innerHTML = `<div class="pv-ph">${en}<img alt="${esc(p.title)}" src="${esc(p.img)}"><h3>${esc(p.title)}</h3>
<p>${esc(p.desc)}${p.desc.length >= 420 ? '…' : ''}</p><div class="pv-src">${esc(p.credit)} · ${esc(p.date)} · NASA Image and Video Library (${esc(p.id)})</div>
<div class="row"><button id="pvMore">${esc(U.another)}</button></div></div>`;
      sec.querySelector('img').onerror = function () { this.remove(); };
      $('pvMore').onclick = () => photo(true);
    } catch (e) {
      if (want === idx && tab === 'photo') sec.innerHTML = `<div class="pv-ph"><p>${esc(U.offline)}</p><div class="row"><button id="pvMore">↻</button></div></div>`, $('pvMore').onclick = () => photo(random);
    }
  }

  function render() {
    el.querySelectorAll('.pv-tabs button').forEach(b => { b.classList.toggle('on', b.dataset.t === tab); b.setAttribute('aria-selected', String(b.dataset.t === tab)); });
    const sec = $('pvSec'); sec.scrollTop = 0;
    if (tab === 'photo') return photo(false);
    sec.innerHTML = tab === 'facts' ? facts() : tab === 'story' ? story() : steps();
  }

  el.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) { if (e.target === el) close(); return; }
    if (b.dataset.t) { tab = b.dataset.t; render(); UX.sfx('tap'); }
    else if (b.dataset.a === 'prev') { setPlanet(idx - 1); UX.sfx('tap'); }
    else if (b.dataset.a === 'next') { setPlanet(idx + 1); UX.sfx('tap'); }
    else if (b.dataset.a === 'close') close();
  });
  addEventListener('keydown', e => {
    if (!el.classList.contains('show')) return;
    // Sin Escape: CrazyGames lo reserva para salir de pantalla completa
    if (e.code === 'ArrowLeft') { e.preventDefault(); setPlanet(idx - 1); }
    else if (e.code === 'ArrowRight') { e.preventDefault(); setPlanet(idx + 1); }
    e.stopImmediatePropagation();
  }, true);
  addEventListener('resize', () => { if (el.classList.contains('show')) requestAnimationFrame(layout); });

  // Arrastrar para girar en 3D: horizontal gira sobre su eje, vertical inclina para ver los polos
  const v3 = $('pv3d');
  v3.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, t: performance.now() }; vSpin = 0; v3.setPointerCapture(e.pointerId); });
  v3.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, now = performance.now(), dt = Math.max(1, now - drag.t) / 1000;
    spin += dx * .012; pitch = Math.max(-1.35, Math.min(1.35, pitch + dy * .01));
    vSpin = dx * .012 / dt; drag = { x: e.clientX, y: e.clientY, t: now };
  });
  const end = () => { drag = null; vSpin = Math.max(-8, Math.min(8, vSpin)); };
  v3.addEventListener('pointerup', end); v3.addEventListener('pointercancel', end);

  async function open(i, o) {
    o = o || {}; onClose = o.onClose || null; tab = o.tab || tab;
    el.classList.add('show');
    await init();
    app.ticker.start();
    setPlanet(i);
    requestAnimationFrame(layout);
  }
  function close() {
    if (!el.classList.contains('show')) return;
    el.classList.remove('show'); if (app) app.ticker.stop();
    UX.sfx('tap');
    const cb = onClose; onClose = null; if (cb) cb();
  }
  window.Viewer = { open, close, get isOpen() { return el.classList.contains('show'); }, get index() { return idx; } };
})();
