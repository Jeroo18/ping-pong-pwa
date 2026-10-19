// Mi Mascota — historial de salud de mascotas con recordatorios en el calendario del teléfono (.ics).
// Sin servidor: los datos viven en el teléfono. PRO con pago en Lemon Squeezy y clave de licencia (../shared/license.js).
(function () {
  // Enlaces de pago de Lemon Squeezy (uno por variante). El botón tras pagar lleva a ?pro=1,
  // que abre la caja para pegar la clave de licencia.
  const CHECKOUT = { yearly: '', lifetime: '' };
  const STORE_ID = '502156'; // ID numérico de la tienda en Lemon Squeezy: así solo valen claves de tu tienda
  const FREE_PETS = 1;

  const T = I18N.strings(STRINGS);
  document.title = `${T.app} — ${T.tagline}`;

  const D = Object.assign({ pro: false, pets: [] }, JSON.parse(localStorage.getItem('mimascota') || '{}'));
  const save = () => localStorage.setItem('mimascota', JSON.stringify(D));
  const lic = LICENSE.create({ app: 'mimascota', product: 'Mi Mascota PRO', storeId: STORE_ID, onChange: pro => { D.pro = pro; save(); render(); } });
  D.pro = lic.pro; save();
  const askKey = new URLSearchParams(location.search).get('pro') === '1';
  if (askKey) history.replaceState(null, '', location.pathname);

  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10);
  const ICON = { dog: '🐶', cat: '🐱', other: '🐾', vaccine: '💉', med: '💊', visit: '🩺', weight: '⚖️' };
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmtD = s => s ? parse(s).toLocaleDateString(I18N.locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const daysUntil = s => Math.round((parse(s) - parse(todayStr())) / 86400000);
  const nextOf = r => r.type === 'vaccine' ? r.next : r.type === 'med' && r.every ? addDays(r.date, +r.every) : null;
  const age = b => { if (!b) return ''; const d = parse(b), n = new Date(); let y = n.getFullYear() - d.getFullYear(); if (n < new Date(n.getFullYear(), d.getMonth(), d.getDate())) y--; return T.years(y); };

  let route = { pet: null, tab: 'up' };

  function status(next) {
    const n = daysUntil(next);
    if (n < 0) return `<span class="tag bad">${T.overdue(-n)}</span>`;
    if (n === 0) return `<span class="tag bad">${T.today}</span>`;
    return `<span class="tag ${n <= 14 ? 'soon' : 'ok'}">${T.inDays(n)}</span>`;
  }
  function upcomingFor(pets) {
    const out = [];
    pets.forEach(p => p.records.forEach(r => { const n = nextOf(r); if (n) out.push({ p, r, next: n }); }));
    return out.sort((a, b) => a.next.localeCompare(b.next));
  }
  const avatar = p => `<div class="avatar" style="${p.photo ? `background-image:url(${p.photo})` : ''}">${p.photo ? '' : ICON[p.species] || '🐾'}</div>`;

  // ---------- Vistas ----------
  function render() { route.pet ? renderPet() : renderHome(); }

  function renderHome() {
    $('fab').hidden = true;
    const up = upcomingFor(D.pets).filter(x => daysUntil(x.next) <= 30);
    $('view').innerHTML = `
      <header><h1>🐾 ${T.app}</h1><button class="lang" id="bChat" aria-label="${T.app}">💬</button><button class="lang" id="bLang"></button><button class="pro" id="bPro">${D.pro ? 'PRO ✓' : 'PRO'}</button></header>
      <div class="pets">
        ${D.pets.map(p => `<div class="card pet" data-pet="${p.id}">${avatar(p)}<b>${esc(p.name)}</b><small>${esc(p.breed || T[p.species] || '')}${p.birth ? ' · ' + age(p.birth) : ''}</small></div>`).join('')}
        <button class="card pet add" id="bAddPet"><div class="avatar">+</div>${T.addPet}</button>
      </div>
      <div class="card"><h3>${T.upcoming}</h3>
        ${up.length ? up.map(x => itemRow(x.r, x.p, true)).join('') : `<div class="empty">${T.noUpcoming}</div>`}
      </div>
      <div class="card"><h3>${T.backup}</h3><div class="row"><button id="bExport">${T.export}</button><button id="bImport">${T.import}</button></div></div>`;
    document.querySelectorAll('[data-pet]').forEach(el => el.onclick = () => { route = { pet: el.dataset.pet, tab: 'up' }; render(); });
    $('bAddPet').onclick = () => (!D.pro && D.pets.length >= FREE_PETS) ? openPro() : petForm();
    $('bPro').onclick = openPro;
    I18N.button($('bLang'));
    $('bChat').onclick = () => window.Chat && Chat.open();
    $('bExport').onclick = exportJson; $('bImport').onclick = () => $('fileIn').click();
    bindRows();
  }

  function itemRow(r, p, showPet) {
    const n = nextOf(r);
    const title = r.type === 'weight' ? `${r.kg} kg` : esc(r.name);
    const sub = showPet ? `${esc(p.name)} · ${fmtD(n)}`
      : r.type === 'vaccine' ? `${T.given}: ${fmtD(r.date)}${n ? ` · ${T.due}: ${fmtD(n)}` : ''}`
      : r.type === 'med' ? `${esc(r.dose || '')} ${r.every ? `· ${T.everyN(r.every)}` : ''} · ${fmtD(r.date)}`
      : `${fmtD(r.date)}${r.notes ? ' · ' + esc(r.notes) : ''}`;
    const actions = n ? `<div class="acts"><button class="sm" data-done="${p.id}|${r.id}" aria-label="${T.done}">✓</button><button class="sm" data-cal="${p.id}|${r.id}">${T.toCal}</button></div>` : '';
    return `<div class="item"><div class="ic">${showPet ? avatarMini(p) : ICON[r.type]}</div><div class="b" data-edit="${p.id}|${r.id}"><b>${showPet ? ICON[r.type] + ' ' : ''}${title}</b><small>${sub}</small>${n ? status(n) : ''}</div>${actions}</div>`;
  }
  const avatarMini = p => p.photo ? `<span class="avatar" style="width:32px;height:32px;background-image:url(${p.photo})"></span>` : ICON[p.species];

  function bindRows() {
    const find = v => { const [pid, rid] = v.split('|'); const p = D.pets.find(x => x.id === pid); return { p, r: p && p.records.find(x => x.id === rid) }; };
    document.querySelectorAll('[data-done]').forEach(b => b.onclick = () => {
      const { p, r } = find(b.dataset.done); if (!r) return;
      const t = todayStr();
      if (r.type === 'vaccine') { const gap = r.next && r.date ? Math.max(1, Math.round((parse(r.next) - parse(r.date)) / 86400000)) : 365; r.date = t; r.next = addDays(t, gap); }
      else r.date = t;
      save(); render();
    });
    document.querySelectorAll('[data-cal]').forEach(b => b.onclick = () => { const { p, r } = find(b.dataset.cal); if (r) downloadIcs([{ p, r }], `${p.name}-${r.name}`); });
    document.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { const { p, r } = find(b.dataset.edit); if (r) recordForm(p, r.type, r); });
  }

  function renderPet() {
    const p = D.pets.find(x => x.id === route.pet);
    if (!p) { route.pet = null; return renderHome(); }
    const tabs = Object.keys(T.tabs);
    const list = route.tab === 'up' ? upcomingFor([p]).map(x => x.r) : p.records.filter(r => r.type === route.tab).sort((a, b) => b.date.localeCompare(a.date));
    const lastW = p.records.filter(r => r.type === 'weight').sort((a, b) => b.date.localeCompare(a.date))[0];
    $('view').innerHTML = `
      <header><button class="back" id="bBack">‹</button><h1></h1><button class="sm" id="bChatPet">💬</button><button class="sm" id="bEditPet">✎</button></header>
      <div class="card hero">${avatar(p)}<div><h2>${esc(p.name)}</h2><small>${esc(p.breed || T[p.species])}${p.birth ? ' · ' + age(p.birth) : ''}${lastW ? ` · ${lastW.kg} kg` : ''}</small></div></div>
      <div class="tabs">${tabs.map(t => `<button data-tab="${t}" class="${route.tab === t ? 'on' : ''}">${T.tabs[t]}</button>`).join('')}</div>
      ${route.tab === 'weight' ? weightChart(p) : ''}
      <div class="card">${list.length ? list.map(r => itemRow(r, p, false)).join('') : `<div class="empty">${route.tab === 'up' ? T.noUpcoming : T.empty}</div>`}</div>
      <div class="row"><button id="bPassport">${D.pro ? '' : '🔒 '}${T.passport}</button><button id="bCalAll">${D.pro ? '' : '🔒 '}${T.calAll}</button></div>`;
    $('bBack').onclick = () => { route.pet = null; render(); };
    $('bEditPet').onclick = () => petForm(p);
    $('bChatPet').onclick = () => window.Chat && Chat.open();
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { route.tab = b.dataset.tab; render(); });
    $('bPassport').onclick = () => D.pro ? passport(p) : openPro();
    $('bCalAll').onclick = () => { if (!D.pro) return openPro(); const items = upcomingFor([p]); if (items.length) downloadIcs(items, `${p.name}-recordatorios`); };
    $('fab').hidden = false;
    $('fab').onclick = () => recordForm(p, route.tab === 'up' ? 'vaccine' : route.tab);
    bindRows();
  }

  function weightChart(p) {
    const w = p.records.filter(r => r.type === 'weight').sort((a, b) => a.date.localeCompare(b.date));
    if (w.length < 2) return '';
    const xs = w.map(r => parse(r.date).getTime()), ys = w.map(r => +r.kg);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys) * .95, y1 = Math.max(...ys) * 1.05;
    const X = x => 30 + (x - x0) / ((x1 - x0) || 1) * 260, Y = y => 140 - (y - y0) / ((y1 - y0) || 1) * 120;
    const pts = w.map((r, i) => `${X(xs[i]).toFixed(1)},${Y(ys[i]).toFixed(1)}`).join(' ');
    return `<div class="card"><svg class="chart" viewBox="0 0 300 160"><polyline points="${pts}" fill="none" stroke="#ff7a45" stroke-width="3" stroke-linejoin="round"/>${w.map((r, i) => `<circle cx="${X(xs[i])}" cy="${Y(ys[i])}" r="4" fill="#ff7a45"/><text x="${X(xs[i])}" y="${Y(ys[i]) - 8}" font-size="10" text-anchor="middle" fill="#8a7766">${r.kg}</text>`).join('')}</svg></div>`;
  }

  // ---------- Formularios ----------
  function sheet(html, onSave, onDelete) {
    $('sheet').innerHTML = html + `<div class="btns">${onDelete ? `<button id="fDel">${T.del}</button>` : ''}<button id="fCancel">${T.cancel}</button><button class="main" id="fSave">${T.save}</button></div>`;
    $('modal').classList.add('show');
    $('fCancel').onclick = close;
    $('fSave').onclick = () => { if (onSave() !== false) { close(); save(); render(); } };
    if (onDelete) $('fDel').onclick = () => { if (confirm(T.sureDel)) { onDelete(); close(); save(); render(); } };
  }
  const close = () => $('modal').classList.remove('show');
  $('modal').onclick = e => { if (e.target === $('modal')) close(); };
  const val = id => ($(id).value || '').trim();

  function petForm(p) {
    let photo = p ? p.photo : '';
    sheet(`<h3>${p ? T.editPet : T.newPet}</h3>
      <label>${T.name}</label><input id="fName" value="${esc(p ? p.name : '')}" maxlength="40">
      <div class="row"><div><label>${T.species}</label><select id="fSpecies">${['dog', 'cat', 'other'].map(s => `<option value="${s}" ${p && p.species === s ? 'selected' : ''}>${ICON[s]} ${T[s]}</option>`).join('')}</select></div>
      <div><label>${T.birth}</label><input type="date" id="fBirth" value="${p ? p.birth || '' : ''}"></div></div>
      <label>${T.breed}</label><input id="fBreed" value="${esc(p ? p.breed || '' : '')}" maxlength="40">
      <label>${T.photo}</label><input type="file" id="fPhoto" accept="image/*">`,
      () => {
        const name = val('fName'); if (!name) { $('fName').focus(); return false; }
        const data = { name, species: $('fSpecies').value, birth: $('fBirth').value, breed: val('fBreed'), photo };
        if (p) Object.assign(p, data); else { const np = Object.assign({ id: uid(), records: [] }, data); D.pets.push(np); route = { pet: np.id, tab: 'up' }; }
      },
      p ? () => { D.pets = D.pets.filter(x => x !== p); route.pet = null; } : null);
    $('fPhoto').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      const img = new Image();
      img.onload = () => { const c = document.createElement('canvas'), s = 256, k = Math.max(s / img.width, s / img.height); c.width = c.height = s; c.getContext('2d').drawImage(img, (s - img.width * k) / 2, (s - img.height * k) / 2, img.width * k, img.height * k); photo = c.toDataURL('image/jpeg', .8); URL.revokeObjectURL(img.src); };
      img.src = URL.createObjectURL(f);
    };
  }

  function recordForm(p, type, r) {
    const t = todayStr();
    const v = k => esc(r ? r[k] || '' : '');
    const fields = {
      vaccine: `<label>${T.vName}</label><input id="fN" value="${v('name')}"><div class="row"><div><label>${T.applied}</label><input type="date" id="fD" value="${r ? r.date : t}"></div><div><label>${T.nextDue}</label><input type="date" id="fX" value="${r ? r.next || '' : addDays(t, 365)}"></div></div>`,
      med: `<label>${T.mName}</label><input id="fN" value="${v('name')}"><label>${T.dose}</label><input id="fDose" value="${v('dose')}"><div class="row"><div><label>${T.lastGiven}</label><input type="date" id="fD" value="${r ? r.date : t}"></div><div><label>${T.every}</label><input type="number" id="fE" min="1" value="${r ? r.every || '' : 30}"></div></div>`,
      visit: `<label>${T.reason}</label><input id="fN" value="${v('name')}"><label>${T.date}</label><input type="date" id="fD" value="${r ? r.date : t}"><label>${T.notes}</label><textarea id="fNotes" rows="3">${v('notes')}</textarea>`,
      weight: `<div class="row"><div><label>${T.kg}</label><input type="number" step="0.1" id="fKg" value="${v('kg')}"></div><div><label>${T.date}</label><input type="date" id="fD" value="${r ? r.date : t}"></div></div>`
    };
    sheet(`<h3>${ICON[type]} ${T.add[type]}</h3>${fields[type]}`, () => {
      const data = { type, date: $('fD').value || t };
      if (type === 'weight') { data.kg = parseFloat($('fKg').value); if (!(data.kg > 0)) return false; }
      else { data.name = val('fN'); if (!data.name) { $('fN').focus(); return false; } }
      if (type === 'vaccine') data.next = $('fX').value;
      if (type === 'med') { data.dose = val('fDose'); data.every = parseInt($('fE').value, 10) || 0; }
      if (type === 'visit') data.notes = val('fNotes');
      if (r) Object.assign(r, data); else p.records.push(Object.assign({ id: uid() }, data));
      route.tab = type;
    }, r ? () => { p.records = p.records.filter(x => x !== r); } : null);
  }

  // ---------- Calendario (.ics con aviso el día antes) ----------
  function downloadIcs(items, fname) {
    const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const icsEsc = s => String(s).replace(/[\\;,]/g, m => '\\' + m).replace(/\n/g, '\\n');
    const ev = items.map(({ p, r }) => {
      const n = nextOf(r); if (!n) return '';
      const d = n.replace(/-/g, ''), d2 = addDays(n, 1).replace(/-/g, '');
      const summary = icsEsc(`${ICON[r.type]} ${T.reminder(p.name, r.name)}`);
      return ['BEGIN:VEVENT', `UID:${r.id}-${d}@mimascota`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${d2}`, `SUMMARY:${summary}`,
        r.type === 'med' && r.every ? `RRULE:FREQ=DAILY;INTERVAL=${r.every}` : '',
        'BEGIN:VALARM', 'TRIGGER:-PT15H', 'ACTION:DISPLAY', `DESCRIPTION:${summary}`, 'END:VALARM', 'END:VEVENT'].filter(Boolean).join('\r\n');
    }).filter(Boolean);
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//MiMascota//ES', 'CALSCALE:GREGORIAN', ...ev, 'END:VCALENDAR'].join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    a.download = fname.replace(/[^\w-]+/g, '_') + '.ics'; a.click();
  }

  // ---------- Pasaporte (imprimir / guardar como PDF) ----------
  function passport(p) {
    const rows = type => p.records.filter(r => r.type === type).sort((a, b) => a.date.localeCompare(b.date));
    const table = (type, cols) => { const rs = rows(type); return rs.length ? `<h3>${ICON[type]} ${T.tabs[type]}</h3><table><tr>${cols.map(c => `<th>${c[0]}</th>`).join('')}</tr>${rs.map(r => `<tr>${cols.map(c => `<td>${c[1](r)}</td>`).join('')}</tr>`).join('')}</table>` : ''; };
    $('print').innerHTML = `<h1>${ICON[p.species]} ${esc(p.name)}</h1><p>${esc(p.breed || T[p.species])} · ${T.birth}: ${fmtD(p.birth) || '—'} ${p.birth ? '(' + age(p.birth) + ')' : ''}</p>
      ${table('vaccine', [[T.vName.split(' (')[0], r => esc(r.name)], [T.applied, r => fmtD(r.date)], [T.nextDue, r => fmtD(r.next)]])}
      ${table('med', [[T.mName.split(' (')[0], r => esc(r.name)], [T.dose, r => esc(r.dose)], [T.lastGiven, r => fmtD(r.date)], [T.every, r => r.every || '']])}
      ${table('visit', [[T.date, r => fmtD(r.date)], [T.reason, r => esc(r.name)], [T.notes, r => esc(r.notes)]])}
      ${table('weight', [[T.date, r => fmtD(r.date)], [T.kg, r => r.kg]])}
      <p style="color:#888;margin-top:20px">${T.app} · ${fmtD(todayStr())}</p>`;
    window.print();
  }

  // ---------- PRO y copias ----------
  function openPro(focusKey) {
    $('sheet').innerHTML = `<h3>${T.proTitle}</h3>${T.pro.map(x => `<div class="item"><div class="ic">✓</div><div class="b">${x}</div></div>`).join('')}
      <div class="price"><button id="pY"><span>${T.yearly}</span><small>US$9.99</small></button><button id="pL" class="main"><span>${T.lifetime}</span><small style="color:#fff">US$19.99</small></button></div><div id="licBox"></div>
      <p style="font-size:12px;text-align:center;opacity:.7;margin:8px 0"><a style="color:inherit" href="../legal/terminos.html" target="_blank">Términos / Terms</a> · <a style="color:inherit" href="../legal/privacidad.html" target="_blank">Privacidad / Privacy</a> · <a style="color:inherit" href="../legal/reembolsos.html" target="_blank">Reembolsos / Refunds</a></p>
      <div class="btns"><button id="pClose">${T.close}</button></div>`;
    lic.mount($('licBox'), focusKey === true);
    $('modal').classList.add('show');
    const go = k => CHECKOUT[k] ? (location.href = CHECKOUT[k]) : alert(T.noPay);
    $('pY').onclick = () => go('yearly'); $('pL').onclick = () => go('lifetime'); $('pClose').onclick = close;
  }
  function exportJson() { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(D)], { type: 'application/json' })); a.download = `mimascota-${todayStr()}.json`; a.click(); }
  $('fileIn').onchange = async e => { try { const x = JSON.parse(await e.target.files[0].text()); if (Array.isArray(x.pets)) { D.pets = x.pets; save(); render(); alert(T.imported); } } catch (err) {} };

  // Aviso al abrir si hay algo vencido hoy
  function notifyDue() {
    const due = upcomingFor(D.pets).filter(x => daysUntil(x.next) <= 0);
    if (!due.length || !('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(T.app, { body: due.map(x => T.reminder(x.p.name, x.r.name)).join(', '), icon: 'icon.svg' }); } catch (e) {}
  }
  if ('Notification' in window && Notification.permission === 'default' && D.pets.length) Notification.requestPermission();

  window.__pet = window.MiMascota = { D, T, render, downloadIcs, nextOf, upcomingFor, daysUntil, age, fmtD, ICON, todayStr };
  render(); notifyDue();
  if (askKey) openPro(true);
  lic.refresh();
})();
