// Asistente (chat) de Mi Mascota con 3 modos:
//  1) Básico: sin internet ni IA; responde con los datos de la app (próximos, resumen, peso).
//  2) IA en el teléfono: descarga una vez un modelo pequeño (Qwen2.5 0.5B o 1.5B) y lo ejecuta en el
//     navegador con WebLLM + WebGPU. Después funciona sin internet y nada sale del teléfono.
//  3) Conectar mi IA: la cuenta del usuario en Gemini, Groq, OpenRouter, OpenAI u otro servicio compatible
//     con OpenAI. La clave se guarda solo en el teléfono (localStorage) y se llama directo, sin servidor nuestro.
(function () {
  const C = I18N.strings(CHAT_STRINGS);
  const M = () => window.MiMascota;
  const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.86';
  const LOCAL = { small: { id: 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC', size: '290 MB' }, big: { id: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', size: '880 MB' } };
  const PROVIDERS = {
    gemini: { name: 'Google Gemini', base: 'https://generativelanguage.googleapis.com/v1beta/openai', model: 'gemini-2.5-flash', keyUrl: 'https://aistudio.google.com/apikey' },
    groq: { name: 'Groq', base: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-20b', keyUrl: 'https://console.groq.com/keys' },
    openrouter: { name: 'OpenRouter', base: 'https://openrouter.ai/api/v1', model: 'openrouter/free', keyUrl: 'https://openrouter.ai/keys' },
    openai: { name: 'OpenAI', base: 'https://api.openai.com/v1', model: 'gpt-4o-mini', keyUrl: 'https://platform.openai.com/api-keys' },
    custom: { name: C.custom, base: '', model: '', keyUrl: '' }
  };
  // Modelos preferidos cuando hay que elegir uno solo (los servicios retiran modelos cada pocos meses)
  const PREFER = {
    gemini: [/^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-flash-lite$/, /flash/],
    groq: [/gpt-oss-20b/, /gpt-oss-120b/, /qwen/, /llama/],
    openrouter: [/^openrouter\/free$/, /:free$/],
    openai: [/^gpt-6-luna$/, /^gpt-[\d.]+-mini$/, /^gpt-4o-mini$/, /mini/],
    custom: []
  };
  const ver = id => (id.match(/\d+(\.\d+)?/) || ['0'])[0] * 1;
  function pickModel(prov, ids) {
    const ok = ids.filter(i => !/preview|exp|thinking|search|audio|vision|instruct-1k/i.test(i) || prov === 'openrouter');
    for (const re of PREFER[prov] || []) { const m = ok.filter(i => re.test(i)).sort((a, b) => ver(b) - ver(a)); if (m.length) return m[0]; }
    return ok[0] || ids[0] || '';
  }
  const curModel = () => cfg.models[cfg.provider] || PROVIDERS[cfg.provider].model;
  const LANG_NAME = { en: 'English', es: 'Spanish', pt: 'Brazilian Portuguese', fr: 'French', de: 'German', it: 'Italian', ru: 'Russian', tr: 'Turkish', id: 'Indonesian', hi: 'Hindi', ar: 'Arabic', ja: 'Japanese', ko: 'Korean', zh: 'Simplified Chinese' };

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');

  const cfg = Object.assign({ mode: 'basic', local: 'small', provider: 'gemini', keys: {}, models: {}, base: '' }, read('mimascota-ai', {}));
  const saveCfg = () => write('mimascota-ai', cfg);
  let history = read('mimascota-chat', []);
  const saveHist = () => write('mimascota-chat', history.slice(-40));
  let engine = null, engineId = '', busy = false, root = null;

  // ---------- Respuestas del modo básico (sin IA) ----------
  const recs = (p, t) => p.records.filter(r => r.type === t).sort((a, b) => a.date.localeCompare(b.date));
  function when(next) { const m = M(), n = m.daysUntil(next); return n < 0 ? m.T.overdue(-n) : n === 0 ? m.T.today : m.T.inDays(n); }
  function basicUpcoming() {
    const m = M(); if (!m.D.pets.length) return C.noPets;
    const up = m.upcomingFor(m.D.pets).filter(x => m.daysUntil(x.next) <= 60).slice(0, 8);
    if (!up.length) return m.T.noUpcoming;
    return `**${C.upTitle}**\n` + up.map(x => `• ${m.ICON[x.r.type]} ${x.p.name}: ${x.r.name} — ${when(x.next)} (${m.fmtD(x.next)})`).join('\n');
  }
  function basicSummary() {
    const m = M(); if (!m.D.pets.length) return C.noPets;
    return m.D.pets.map(p => {
      const w = recs(p, 'weight').pop(), v = recs(p, 'visit').pop();
      return `${m.ICON[p.species] || '🐾'} **${p.name}** — ${p.breed || m.T[p.species]}${p.birth ? ' · ' + m.age(p.birth) : ''}\n` +
        `${m.T.weightLbl}: ${w ? w.kg + ' kg' : '—'} · ${m.T.tabs.vaccine}: ${recs(p, 'vaccine').length} · ${m.T.tabs.med}: ${recs(p, 'med').length} · ${m.T.tabs.visit}: ${v ? m.fmtD(v.date) : '—'}`;
    }).join('\n\n');
  }
  function basicWeight() {
    const m = M(); if (!m.D.pets.length) return C.noPets;
    return m.D.pets.map(p => {
      const w = recs(p, 'weight');
      if (!w.length) return C.weightNone(p.name);
      const a = w[0], b = w[w.length - 1];
      if (w.length === 1) return `⚖️ **${p.name}**: ${b.kg} kg (${m.fmtD(b.date)})`;
      const d = Math.round((b.kg - a.kg) * 10) / 10;
      return `⚖️ **${p.name}**: ${a.kg} kg (${m.fmtD(a.date)}) → ${b.kg} kg (${m.fmtD(b.date)}) · ${d > 0 ? '+' : ''}${d} kg`;
    }).join('\n');
  }
  // Palabras clave en los 14 idiomas para el modo básico
  const INTENTS = [
    [/vacun|vaccin|impf|прив|aşı|vaksin|टीक|لقاح|ワクチン|백신|疫苗|próxim|proxim|next|soon|upcoming|proch|nächst|demnäch|scad|arriv|скоро|yaklaş|datang|जल्द|القادم|予定|예정|待办|近期|antipul|flea|pulg|tratam|treat|médic|medic|wurm|parasit|дегель|pire|cacing|कृमि|ديدان|駆虫|구충|驱虫/i, basicUpcoming],
    [/pes[oaé]|weigh|poids|pèse|gewicht|wiegt|вес|весит|kilo|berat|वज़न|وزن|体重|체중|몸무게|多重|gord|fat|dick|grasso|толст|şişman|gemuk/i, basicWeight],
    [/resum|summary|résumé|übersicht|zusammen|riepil|сводк|итог|özet|ringkas|सारांश|ملخص|まとめ|요약|汇总|总结|salud|saúde|health|santé|gesund|salute|здоров|sağlık|kesehatan|सेहत|صح|健康|건강/i, basicSummary]
  ];
  function basicAnswer(text) { for (const [re, fn] of INTENTS) if (re.test(text)) return fn(); return C.basicOnly; }

  // ---------- Contexto para la IA ----------
  function systemPrompt() {
    const m = M();
    const pets = m.D.pets.map(p => ({
      name: p.name, species: p.species, breed: p.breed || undefined, age: p.birth ? m.age(p.birth) : undefined,
      vaccines: recs(p, 'vaccine').map(r => ({ name: r.name, given: r.date, next: r.next || undefined })),
      treatments: recs(p, 'med').map(r => ({ name: r.name, dose: r.dose || undefined, last: r.date, everyDays: r.every || undefined, next: m.nextOf(r) || undefined })),
      visits: recs(p, 'visit').slice(-5).map(r => ({ date: r.date, reason: r.name, notes: r.notes || undefined })),
      weightsKg: recs(p, 'weight').slice(-6).map(r => ({ date: r.date, kg: r.kg }))
    }));
    return `You are the friendly pet-care assistant inside the app "${m.T.app}". Always answer in ${LANG_NAME[I18N.lang] || 'English'}, briefly (under 120 words) and practically. ` +
      `Today is ${m.todayStr()}. Use the owner's records below when they help; never invent records. ` +
      `You are not a veterinarian: if a symptom could be serious (not eating, vomiting, diarrhea with blood, trouble breathing, seizures, poisoning, injuries), tell them to contact a vet right away. ` +
      `Pets: ${JSON.stringify(pets)}`;
  }
  const chatMessages = () => [{ role: 'system', content: systemPrompt() }, ...history.filter(h => h.role !== 'info').slice(-12).map(h => ({ role: h.role, content: h.content }))];

  // ---------- IA en el teléfono (WebLLM) ----------
  async function gpuInfo() {
    if (!navigator.gpu) return null;
    try { const a = await navigator.gpu.requestAdapter(); return a ? { f16: a.features.has('shader-f16') } : null; } catch (e) { return null; }
  }
  async function loadLocal(onProgress) {
    const g = await gpuInfo();
    if (!g) throw new Error(C.noGpu);
    let id = LOCAL[cfg.local].id;
    if (!g.f16) id = id.replace('q4f16_1', 'q4f32_1'); // teléfonos sin soporte de 16 bits
    if (engine && engineId === id) return engine;
    const webllm = await import(WEBLLM_URL);
    const opts = { initProgressCallback: r => onProgress(Math.round((r.progress || 0) * 100)) };
    try { engine = await webllm.CreateMLCEngine(id, opts); }
    catch (e) {
      // Si una descarga anterior quedó a medias o dañada, se borra el modelo y se descarga otra vez
      try { await webllm.deleteModelAllInfoInCache(id); } catch (err) {}
      engine = await webllm.CreateMLCEngine(id, opts);
    }
    engineId = id;
    return engine;
  }
  async function* localStream(messages, onProgress) {
    const e = await loadLocal(onProgress);
    const chunks = await e.chat.completions.create({ messages, stream: true, temperature: 0.6, max_tokens: 400 });
    for await (const c of chunks) { const t = c.choices && c.choices[0] && c.choices[0].delta && c.choices[0].delta.content; if (t) yield t; }
  }

  // ---------- Conectar mi IA (API compatible con OpenAI) ----------
  function apiBase() { return (cfg.provider === 'custom' ? cfg.base : PROVIDERS[cfg.provider].base).replace(/\/+$/, ''); }
  function apiHeaders(json = true) {
    const key = cfg.keys[cfg.provider] || '', h = json ? { 'Content-Type': 'application/json' } : {};
    if (key) h.Authorization = 'Bearer ' + key;
    if (cfg.provider === 'openrouter') { h['HTTP-Referer'] = location.origin; h['X-Title'] = M().T.app; }
    return h;
  }
  async function apiError(res) {
    let t = await res.text();
    try { const j = JSON.parse(t); const e = Array.isArray(j) ? j[0] && j[0].error : j.error; t = (e && (e.message || e)) || t; } catch (err) {}
    return new Error(`${res.status} ${String(t).slice(0, 220)}`);
  }
  const modelGone = e => /^(400|404|410|422)\b/.test(e.message) && /model|not found|does not exist|decommission|deprecat|no endpoints|unsupported/i.test(e.message);
  async function* apiStream(messages, onSwitch) {
    if (!apiBase()) throw new Error(C.needKey);
    if (!cfg.keys[cfg.provider] && cfg.provider !== 'custom') throw new Error(C.needKey);
    const post = model => fetch(apiBase() + '/chat/completions', { method: 'POST', headers: apiHeaders(), body: JSON.stringify({ model, messages, stream: true, temperature: 0.6 }) });
    let res = await post(curModel());
    if (!res.ok) {
      const err = await apiError(res);
      if (!modelGone(err)) throw err;
      // El modelo ya no existe: busco uno disponible en la cuenta y reintento una vez
      let ids = []; try { ids = await listModels(); } catch (e) { throw err; }
      const m = pickModel(cfg.provider, ids);
      if (!m || m === curModel()) throw err;
      cfg.models[cfg.provider] = m; saveCfg(); onSwitch && onSwitch(m);
      res = await post(m);
      if (!res.ok) throw await apiError(res);
    }
    if (!(res.headers.get('content-type') || '').includes('event-stream') || !res.body) {
      const j = await res.json(); yield (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || ''; return;
    }
    const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
    for (;;) {
      const { done, value } = await reader.read(); if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const d = line.slice(5).trim(); if (d === '[DONE]') return;
        try { const j = JSON.parse(d); const c = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content; if (c) yield c; } catch (e) {}
      }
    }
  }
  const NOT_CHAT = /embed|tts|whisper|image|imagen|audio|moderation|realtime|transcri|dall-e|veo|live|guard|safety|aqa|banana|lyria|computer-use|robotics/i;
  async function listModels() {
    let res = await fetch(apiBase() + '/models', { headers: apiHeaders(false) });
    let native = false;
    if (!res.ok && cfg.provider === 'gemini') {
      // Respaldo: la lista nativa de Gemini (la compatible con OpenAI no siempre responde)
      res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': cfg.keys.gemini || '' } });
      native = true;
    }
    if (!res.ok) throw await apiError(res);
    const j = await res.json();
    const list = j.data || j.models || [];
    return list.filter(m => !native || !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent'))
      .map(m => String(m.id || m.name || '').replace(/^models\//, ''))
      .filter(id => id && !NOT_CHAT.test(id)).sort();
  }

  // ---------- Interfaz ----------
  function css() {
    if (document.getElementById('ch-css')) return;
    const st = document.createElement('style'); st.id = 'ch-css';
    st.textContent = `
.ch{position:fixed;inset:0;z-index:60;background:var(--bg,#fff7ef);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top)}
.ch-top{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--line,#f0e2d3);background:var(--card,#fff)}
.ch-top h2{flex:1;margin:0;font-size:18px}.ch-top small{display:block;font-size:12px;color:var(--mut,#8a7a6a);font-weight:600}
.ch-msgs{flex:1;overflow:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px}
.ch-b{max-width:86%;padding:10px 13px;border-radius:16px;line-height:1.45;font-size:15px;word-wrap:break-word}
.ch-b.assistant,.ch-b.info{align-self:flex-start;background:var(--card,#fff);border:1px solid var(--line,#f0e2d3);border-end-start-radius:4px}
.ch-b.info{background:#fff3e8}
.ch-b.user{align-self:flex-end;background:var(--acc,#ff7a45);color:#fff;border-end-end-radius:4px}
.ch-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 12px 8px;scrollbar-width:none}.ch-chips::-webkit-scrollbar{display:none}
.ch-chips button{white-space:nowrap;border-radius:999px;padding:7px 12px;font-size:13px}
.ch-note{font-size:11px;color:var(--mut,#8a7a6a);padding:0 14px 6px;text-align:center}
.ch-in{display:flex;gap:8px;padding:8px 12px calc(env(safe-area-inset-bottom) + 10px);background:var(--card,#fff);border-top:1px solid var(--line,#f0e2d3)}
.ch-in textarea{flex:1;resize:none;font:inherit;border:1px solid var(--line,#f0e2d3);border-radius:14px;padding:10px 12px;max-height:110px;background:#fff;color:inherit}
.ch-in button{background:var(--acc,#ff7a45);color:#fff;border-color:var(--acc,#ff7a45)}
.ch-set{flex:1;overflow:auto;padding:14px 12px}
.ch-opt{display:block;background:var(--card,#fff);border:2px solid var(--line,#f0e2d3);border-radius:16px;padding:12px;margin-bottom:10px;cursor:pointer}
.ch-opt.on{border-color:var(--acc,#ff7a45)}.ch-opt b{display:block;margin-bottom:4px}.ch-opt p{margin:0;color:var(--mut,#8a7a6a);font-size:13px}
.ch-sub{margin-top:10px;display:none}.ch-opt.on .ch-sub{display:block}
.ch-sub label{display:block;font-size:13px;font-weight:700;margin:8px 0 4px}
.ch-sub input,.ch-sub select{width:100%;box-sizing:border-box;font:inherit;border:1px solid var(--line,#f0e2d3);border-radius:12px;padding:10px;background:#fff;color:inherit}
.ch-st{font-size:13px;margin-top:8px;color:var(--mut,#8a7a6a);word-break:break-word}
.ch-dots::after{content:'…';animation:chd 1s infinite}@keyframes chd{50%{opacity:.2}}`;
    document.head.appendChild(st);
  }

  function modeLabel() { return cfg.mode === 'local' ? `${C.modeLocal} · ${LOCAL[cfg.local].size}` : cfg.mode === 'api' ? `${C.modeApi} · ${PROVIDERS[cfg.provider].name}` : C.modeBasic; }

  function open() {
    css();
    if (root) root.remove();
    root = document.createElement('div'); root.className = 'ch'; root.id = 'chat';
    document.body.appendChild(root);
    showChat();
  }
  function close() { if (root) { root.remove(); root = null; } }

  function showChat() {
    root.innerHTML = `<div class="ch-top"><button class="back" id="chBack" aria-label="${esc(C.back)}">‹</button><h2>💬 ${esc(C.chat)}<small id="chMode">${esc(modeLabel())}</small></h2>
      <button class="sm" id="chNew" title="${esc(C.newChat)}">🗑️</button><button class="sm" id="chSet" title="${esc(C.settings)}">⚙️</button></div>
      <div class="ch-msgs" id="chMsgs"></div>
      <div class="ch-chips"><button data-q="up">📅 ${esc(C.chipUp)}</button><button data-q="sum">🩺 ${esc(C.chipSum)}</button><button data-q="weight">⚖️ ${esc(C.chipWeight)}</button></div>
      <div class="ch-note">${esc(C.disclaimer)}</div>
      <div class="ch-in"><textarea id="chText" rows="1" placeholder="${esc(C.chatPh)}"></textarea><button id="chSend">${esc(C.send)}</button></div>`;
    root.querySelector('#chBack').onclick = close;
    root.querySelector('#chSet').onclick = showSettings;
    root.querySelector('#chNew').onclick = () => { history = []; saveHist(); renderMsgs(); };
    root.querySelectorAll('[data-q]').forEach(b => b.onclick = () => {
      const q = b.dataset.q, fn = q === 'up' ? basicUpcoming : q === 'sum' ? basicSummary : basicWeight;
      history.push({ role: 'user', content: b.textContent.replace(/^\S+\s/, '') }, { role: 'assistant', content: fn() }); saveHist(); renderMsgs();
    });
    const ta = root.querySelector('#chText');
    ta.oninput = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 110) + 'px'; };
    ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
    root.querySelector('#chSend').onclick = send;
    renderMsgs();
  }

  function renderMsgs() {
    const box = root && root.querySelector('#chMsgs'); if (!box) return;
    const hello = cfg.mode === 'basic' ? C.hello : C.helloAi;
    box.innerHTML = `<div class="ch-b assistant">${fmt(hello)}</div>` + history.map(h => `<div class="ch-b ${h.role}">${fmt(h.content)}</div>`).join('');
    box.scrollTop = box.scrollHeight;
  }

  async function send() {
    if (busy || !root) return;
    const ta = root.querySelector('#chText'), text = ta.value.trim();
    if (!text) return;
    ta.value = ''; ta.style.height = 'auto';
    history.push({ role: 'user', content: text });
    if (cfg.mode === 'basic') { history.push({ role: 'assistant', content: basicAnswer(text) }); saveHist(); renderMsgs(); return; }
    busy = true; saveHist(); renderMsgs();
    const box = root.querySelector('#chMsgs');
    const bubble = document.createElement('div'); bubble.className = 'ch-b assistant'; bubble.innerHTML = '<span class="ch-dots"></span>';
    box.appendChild(bubble); box.scrollTop = box.scrollHeight;
    let out = '';
    try {
      const stream = cfg.mode === 'local' ? localStream(chatMessages(), p => { bubble.textContent = C.loading(p); })
        : apiStream(chatMessages(), m => { history.push({ role: 'info', content: C.modelSwitched(m) }); saveHist(); });
      for await (const t of stream) { out += t; bubble.innerHTML = fmt(out); box.scrollTop = box.scrollHeight; }
      history.push({ role: 'assistant', content: out.trim() || '…' });
    } catch (e) {
      history.push({ role: 'info', content: C.error(e && e.message ? e.message : String(e)) });
    }
    busy = false; saveHist(); renderMsgs();
  }

  function showSettings() {
    const p = cfg.provider;
    root.innerHTML = `<div class="ch-top"><button class="back" id="chBack" aria-label="${esc(C.back)}">‹</button><h2>⚙️ ${esc(C.settings)}</h2></div>
      <div class="ch-set">
        <div class="ch-opt ${cfg.mode === 'basic' ? 'on' : ''}" data-m="basic"><b>📋 ${esc(C.modeBasic)}</b><p>${esc(C.hello)}</p></div>
        <div class="ch-opt ${cfg.mode === 'local' ? 'on' : ''}" data-m="local"><b>📱 ${esc(C.modeLocal)}</b><p>${esc(C.localInfo)}</p>
          <div class="ch-sub"><select id="chLocal">${Object.entries(LOCAL).map(([k, v]) => `<option value="${k}" ${cfg.local === k ? 'selected' : ''}>${esc(k === 'small' ? C.localSmall : C.localBig)} · ${v.size}</option>`).join('')}</select>
          <div class="row" style="margin-top:10px"><button class="main" id="chUseLocal">${esc(C.useLocal)}</button></div><div class="ch-st" id="chLocalSt"></div></div></div>
        <div class="ch-opt ${cfg.mode === 'api' ? 'on' : ''}" data-m="api"><b>🔌 ${esc(C.modeApi)}</b><p>${esc(C.apiInfo)}</p>
          <div class="ch-sub">
            <label>${esc(C.provider)}</label><select id="chProv">${Object.entries(PROVIDERS).map(([k, v]) => `<option value="${k}" ${p === k ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select>
            <div id="chBaseRow" style="display:${p === 'custom' ? 'block' : 'none'}"><label>${esc(C.baseUrl)}</label><input id="chBase" inputmode="url" placeholder="https://…/v1" value="${esc(cfg.base)}"></div>
            <label>${esc(C.apiKey)}</label><input id="chKey" type="password" autocomplete="off" value="${esc(cfg.keys[p] || '')}">
            <div class="ch-st" id="chKeyLink">${PROVIDERS[p].keyUrl ? `<a href="${PROVIDERS[p].keyUrl}" target="_blank" rel="noopener">🔑 ${esc(C.getKey)} (${esc(PROVIDERS[p].name)})</a>` : ''}</div>
            <label>${esc(C.model)}</label><select id="chModelSel">${modelOptions([], cfg.models[p] || PROVIDERS[p].model)}</select>
            <input id="chModel" style="margin-top:6px;display:${cfg.models[p] || PROVIDERS[p].model ? 'none' : 'block'}" placeholder="${esc(C.modelPh)}" autocapitalize="off" autocorrect="off" spellcheck="false" value="${esc(cfg.models[p] || PROVIDERS[p].model)}">
            <div class="row" style="margin-top:10px"><button id="chLoad">${esc(C.loadModels)}</button><button class="main" id="chSave">${esc(m().T.save)}</button></div>
            <div class="ch-st" id="chApiSt"></div>
          </div></div>
      </div>`;
    const $ = s => root.querySelector(s);
    $('#chBack').onclick = showChat;
    root.querySelectorAll('[data-m]').forEach(o => o.addEventListener('click', e => {
      if (e.target.closest('.ch-sub')) return;
      root.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x === o));
      if (o.dataset.m === 'basic') { cfg.mode = 'basic'; saveCfg(); }
    }));
    $('#chLocal').onchange = e => { cfg.local = e.target.value; saveCfg(); };
    $('#chUseLocal').onclick = async () => {
      const st = $('#chLocalSt'); st.textContent = C.loading(0);
      try { await loadLocal(pc => { st.textContent = C.loading(pc); }); cfg.mode = 'local'; saveCfg(); st.textContent = C.ready; }
      catch (e) { st.textContent = e && e.message ? e.message : String(e); }
    };
    const readForm = () => {
      const k = $('#chProv').value;
      cfg.provider = k; cfg.keys[k] = $('#chKey').value.trim(); cfg.models[k] = $('#chModel').value.trim();
      if (k === 'custom') cfg.base = $('#chBase').value.trim();
    };
    $('#chProv').onchange = e => { cfg.provider = e.target.value; saveCfg(); showSettings(); root.querySelectorAll('[data-m]').forEach(x => x.classList.toggle('on', x.dataset.m === 'api')); };
    $('#chModelSel').onchange = e => {
      const other = e.target.value === '__other';
      $('#chModel').style.display = other ? 'block' : 'none';
      if (other) { $('#chModel').value = ''; $('#chModel').focus(); } else $('#chModel').value = e.target.value;
    };
    // Trae los modelos de la cuenta; si el elegido no está, elige uno disponible
    const refresh = async (quiet) => {
      readForm(); const st = $('#chApiSt');
      if (!apiBase() || (!cfg.keys[cfg.provider] && cfg.provider !== 'custom')) { if (!quiet) st.textContent = C.needKey; return false; }
      st.innerHTML = '<span class="ch-dots"></span>';
      try {
        const ids = await listModels();
        let cur = $('#chModel').value.trim();
        if (ids.length && !ids.includes(cur)) cur = pickModel(cfg.provider, ids);
        $('#chModelSel').innerHTML = modelOptions(ids, cur);
        $('#chModel').value = cur; $('#chModel').style.display = cur ? 'none' : 'block';
        cfg.models[cfg.provider] = cur; saveCfg();
        st.textContent = C.testOk(cur, ids.length);
        return true;
      } catch (e) { st.textContent = C.error(e.message); return false; }
    };
    $('#chLoad').onclick = () => refresh(false);
    $('#chSave').onclick = async () => { readForm(); cfg.mode = 'api'; saveCfg(); $('#chMode') && ($('#chMode').textContent = modeLabel()); await refresh(false); };
    if (cfg.keys[p] || (p === 'custom' && cfg.base)) refresh(true);
  }
  function modelOptions(ids, cur) {
    const all = [...new Set([cur, ...ids].filter(Boolean))];
    return all.map(i => `<option value="${esc(i)}" ${i === cur ? 'selected' : ''}>${esc(i)}</option>`).join('') + `<option value="__other">${esc(C.otherModel)}</option>`;
  }
  const m = () => M();

  window.Chat = { open, close, basicAnswer, get cfg() { return cfg; } };
})();
