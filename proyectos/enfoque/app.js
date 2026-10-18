// Enfoque — temporizador + ruido marrón + mini-pasos para TDAH.
// Todo se guarda en el teléfono (localStorage). Plan PRO con enlaces de pago (Stripe Payment Links)
// en la web, o Google Play Billing (RevenueCat) cuando se empaquete como app.
(function () {
  // Pega aquí tus enlaces de pago de Stripe. Configura su "URL de éxito" como https://TU-SITIO/enfoque/?pro=1
  const CHECKOUT = { monthly: '', yearly: '' };

  const T = I18N.strings(STRINGS);
  I18N.button(document.getElementById('bLang'));
  document.getElementById('appName').textContent = T.app;
  document.querySelectorAll('[data-t]').forEach(el => { el.textContent = T[el.dataset.t]; });
  const $ = id => document.getElementById(id);
  $('task').placeholder = T.task; $('stepIn').placeholder = T.stepPh; $('habitIn').placeholder = T.habitPh;

  const FREE_HABITS = 3;
  const PRO_SOUNDS = ['pink', 'white', 'rain', 'bin40'];
  const D = Object.assign({ pro: false, task: '', steps: [], habits: [], log: {}, sessions: 0, minutes: 25 }, JSON.parse(localStorage.getItem('enfoque') || '{}'));
  const save = () => localStorage.setItem('enfoque', JSON.stringify(D));
  if (new URLSearchParams(location.search).get('pro') === '1') { D.pro = true; save(); history.replaceState(null, '', location.pathname); setTimeout(() => alert(T.proOn), 300); }
  const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  // ---------- Temporizador ----------
  let phase = 'focus', total = D.minutes * 60, endAt = 0, remaining = total, running = false, focusCount = 0, wake = null, tick = null;
  const ARC = 678.6;
  function fmt(s) { s = Math.max(0, Math.ceil(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }
  function drawTimer() {
    $('clock').textContent = fmt(remaining);
    $('phase').textContent = phase === 'focus' ? T.focus : T.brk;
    $('arc').style.strokeDashoffset = ARC * (1 - remaining / total);
    $('arc').style.stroke = phase === 'focus' ? 'url(#g)' : '#ffb454';
    $('bStart').textContent = running ? T.pause : (remaining < total ? T.resume : T.start);
    document.title = running ? `${fmt(remaining)} · ${T.app}` : `${T.app} — ${T.tagline}`;
  }
  function loop() {
    remaining = (endAt - Date.now()) / 1000;
    if (remaining <= 0) { finish(); return; }
    drawTimer();
  }
  async function start() {
    running = true; endAt = Date.now() + remaining * 1000;
    tick = setInterval(loop, 250);
    try { wake = await navigator.wakeLock.request('screen'); } catch (e) {}
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
    drawTimer();
  }
  function pause() { running = false; clearInterval(tick); remaining = (endAt - Date.now()) / 1000; if (wake) { wake.release(); wake = null; } drawTimer(); }
  function setPhase(p, minutes) { phase = p; total = remaining = minutes * 60; drawTimer(); }
  function finish() {
    pause(); chime();
    if (phase === 'focus') {
      const k = dayKey(); D.log[k] = (D.log[k] || 0) + Math.round(total / 60); D.sessions++; save(); focusCount++;
      notify(T.doneTitle, T.doneBody);
      setPhase('break', focusCount % 4 === 0 ? 15 : 5);
    } else { notify(T.breakDone, D.task || ''); setPhase('focus', D.minutes); }
    renderStats();
  }
  function notify(title, body) {
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([200, 100, 200]); } catch (e) {}
    if ('Notification' in window && Notification.permission === 'granted') { try { new Notification(title, { body, icon: 'icon.svg' }); } catch (e) {} }
  }
  function chime() {
    const a = audio(); const t = a.currentTime;
    [660, 880, 1320].forEach((f, i) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.setValueAtTime(0, t + i * .18); g.gain.linearRampToValueAtTime(.2, t + i * .18 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .18 + .8); o.connect(g).connect(a.destination); o.start(t + i * .18); o.stop(t + i * .18 + .9); });
  }
  $('bStart').onclick = () => running ? pause() : start();
  $('bReset').onclick = () => { pause(); setPhase('focus', D.minutes); };

  function renderPresets() {
    const box = $('presets'); box.innerHTML = '';
    [5, 15, 25, 45].forEach(m => {
      const b = document.createElement('button'); b.textContent = `${m}′`; b.className = D.minutes === m ? 'on' : '';
      b.onclick = () => { if (running) return; D.minutes = m; save(); setPhase('focus', m); renderPresets(); };
      box.appendChild(b);
    });
    const c = document.createElement('button'); c.textContent = ![5, 15, 25, 45].includes(D.minutes) ? `${D.minutes}′` : T.custom;
    c.className = (![5, 15, 25, 45].includes(D.minutes) ? 'on ' : '') + (D.pro ? '' : 'lock');
    c.onclick = () => {
      if (!D.pro) return openPro();
      const m = parseInt(prompt(T.customAsk, D.minutes), 10);
      if (m > 0 && m <= 240) { D.minutes = m; save(); setPhase('focus', m); renderPresets(); }
    };
    box.appendChild(c);
  }

  $('task').value = D.task;
  $('task').oninput = e => { D.task = e.target.value; save(); };

  // ---------- Mini-pasos ----------
  function renderList(el, items, onToggle, onDelete, extra) {
    el.innerHTML = '';
    items.forEach((it, i) => {
      const li = document.createElement('li'); li.className = it.done ? 'done' : '';
      const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = !!it.done; cb.onchange = () => onToggle(i);
      const sp = document.createElement('span'); sp.textContent = it.name;
      li.append(cb, sp);
      if (extra) { const e = document.createElement('small'); e.textContent = extra(it); e.className = 'mut'; li.append(e); }
      const x = document.createElement('button'); x.className = 'x'; x.textContent = '✕'; x.onclick = () => onDelete(i);
      li.append(x); el.appendChild(li);
    });
  }
  function renderSteps() {
    renderList($('steps'), D.steps, i => { D.steps[i].done = !D.steps[i].done; if (D.steps[i].done) pop(); save(); renderSteps(); }, i => { D.steps.splice(i, 1); save(); renderSteps(); });
  }
  function addStep() { const v = $('stepIn').value.trim(); if (!v) return; D.steps.push({ name: v }); $('stepIn').value = ''; save(); renderSteps(); }
  $('bStep').onclick = addStep; $('stepIn').onkeydown = e => { if (e.key === 'Enter') addStep(); };
  function pop() { const a = audio(), o = a.createOscillator(), g = a.createGain(); o.frequency.value = 990; g.gain.setValueAtTime(.12, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + .15); o.connect(g).connect(a.destination); o.start(); o.stop(a.currentTime + .16); }

  // ---------- Hábitos ----------
  function habitStreak(h) { let n = 0; const d = new Date(); if (!h.days[dayKey(d)]) d.setDate(d.getDate() - 1); while (h.days[dayKey(d)]) { n++; d.setDate(d.getDate() - 1); } return n; }
  function renderHabits() {
    const k = dayKey();
    const view = D.habits.map(h => ({ name: h.name, done: !!h.days[k], h }));
    renderList($('habits'), view, i => { const h = D.habits[i]; if (h.days[k]) delete h.days[k]; else { h.days[k] = true; pop(); } save(); renderHabits(); },
      i => { D.habits.splice(i, 1); save(); renderHabits(); }, it => T.streakDays(habitStreak(it.h)));
    $('habitsHelp').textContent = D.pro ? T.habitsPro : T.habitsFree(FREE_HABITS);
  }
  function addHabit() {
    const v = $('habitIn').value.trim(); if (!v) return;
    if (!D.pro && D.habits.length >= FREE_HABITS) return openPro();
    D.habits.push({ name: v, days: {} }); $('habitIn').value = ''; save(); renderHabits();
  }
  $('bHabit').onclick = addHabit; $('habitIn').onkeydown = e => { if (e.key === 'Enter') addHabit(); };

  // ---------- Sonidos (generados en el navegador, sin archivos) ----------
  let actx, master, current = null, soundName = 'off';
  function audio() { if (!actx) { actx = new (window.AudioContext || window.webkitAudioContext)(); master = actx.createGain(); master.gain.value = +$('vol').value; master.connect(actx.destination); } if (actx.state === 'suspended') actx.resume(); return actx; }
  function noiseBuffer(kind) {
    const a = audio(), len = a.sampleRate * 4, buf = a.createBuffer(2, len, a.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch); let last = 0, b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        if (kind === 'brown') { last = (last + .02 * w) / 1.02; d[i] = last * 3.5; }
        else if (kind === 'pink') { b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852; b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; }
        else d[i] = w * .35;
      }
    }
    return buf;
  }
  function stopSound() { if (current) { current.forEach(n => { try { n.stop(); } catch (e) {} n.disconnect(); }); current = null; } }
  function playSound(name) {
    stopSound(); soundName = name; renderSounds();
    if (name === 'off') return;
    const a = audio();
    if (name === 'bin40') {
      const nodes = [];
      [[200, -1], [240, 1]].forEach(([f, pan]) => { const o = a.createOscillator(), p = a.createStereoPanner(), g = a.createGain(); o.frequency.value = f; p.pan.value = pan; g.gain.value = .25; o.connect(g).connect(p).connect(master); o.start(); nodes.push(o); });
      current = nodes; return;
    }
    const src = a.createBufferSource(); src.buffer = noiseBuffer(name === 'rain' ? 'pink' : name); src.loop = true;
    if (name === 'rain') { const hp = a.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 600; const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000; src.connect(hp).connect(lp).connect(master); }
    else src.connect(master);
    src.start(); current = [src];
  }
  function renderSounds() {
    const box = $('sounds'); box.innerHTML = '';
    Object.keys(T.sounds).forEach(k => {
      const b = document.createElement('button'); const locked = !D.pro && PRO_SOUNDS.includes(k);
      b.textContent = (locked ? '🔒 ' : '') + T.sounds[k]; b.className = (soundName === k ? 'on ' : '') + (locked ? 'lock' : '');
      b.onclick = () => locked ? openPro() : playSound(k);
      box.appendChild(b);
    });
  }
  $('vol').oninput = e => { audio(); master.gain.value = +e.target.value; };

  // ---------- Estadísticas ----------
  function renderStats() {
    const k = dayKey();
    $('sToday').textContent = D.log[k] || 0;
    $('sTotal').textContent = D.sessions;
    let streak = 0; const d = new Date(); if (!D.log[dayKey(d)]) d.setDate(d.getDate() - 1);
    while (D.log[dayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
    $('sStreak').textContent = streak;
    const days = []; for (let i = 6; i >= 0; i--) { const x = new Date(); x.setDate(x.getDate() - i); days.push(x); }
    const max = Math.max(25, ...days.map(x => D.log[dayKey(x)] || 0));
    $('bars').innerHTML = days.map(x => { const v = D.log[dayKey(x)] || 0; return `<div><span>${v || ''}</span><i style="height:${v / max * 90}%"></i>${T.days[x.getDay()]}</div>`; }).join('');
  }
  $('bExport').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(D)], { type: 'application/json' })); a.download = `enfoque-${dayKey()}.json`; a.click(); };
  $('bImport').onclick = () => $('fileIn').click();
  $('fileIn').onchange = async e => { try { const x = JSON.parse(await e.target.files[0].text()); const pro = D.pro; Object.assign(D, x, { pro: pro || false }); save(); renderAll(); alert(T.imported); } catch (err) {} };

  // ---------- PRO ----------
  function openPro() { $('proList').innerHTML = T.pro.map(p => `<li>✓ <span>${p}</span></li>`).join(''); $('mPro').classList.add('show'); }
  function checkout(plan) { if (CHECKOUT[plan]) location.href = CHECKOUT[plan]; else alert(T.noPay); }
  $('bPro').onclick = openPro; $('bClosePro').onclick = () => $('mPro').classList.remove('show');
  $('bMonthly').onclick = () => checkout('monthly'); $('bYearly').onclick = () => checkout('yearly');
  if (D.pro) $('bPro').textContent = 'PRO ✓';

  // ---------- Navegación ----------
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
    document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.id === b.dataset.tab));
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && running) loop(); });

  function renderAll() { setPhase('focus', D.minutes); renderPresets(); renderSteps(); renderHabits(); renderSounds(); renderStats(); }
  window.__enf = { D, finish, playSound, get remaining() { return remaining; } };
  renderAll();
})();
