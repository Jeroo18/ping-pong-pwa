// Idiomas compartidos por los 5 proyectos.
// Elige el idioma guardado; si no hay, el del teléfono; si no está disponible, inglés.
// Uso: const T = I18N.strings(STRINGS);  I18N.button(el) convierte un botón en el selector 🌐.
(function () {
  const LANGS = [
    ['en', 'English'], ['es', 'Español'], ['pt', 'Português'], ['fr', 'Français'], ['de', 'Deutsch'],
    ['it', 'Italiano'], ['ru', 'Русский'], ['tr', 'Türkçe'], ['id', 'Bahasa Indonesia'], ['hi', 'हिन्दी'],
    ['ar', 'العربية'], ['ja', '日本語'], ['ko', '한국어'], ['zh', '简体中文']
  ];
  const CODES = LANGS.map(l => l[0]);
  const KEY = 'lang';
  const LOCALE = { pt: 'pt-BR', zh: 'zh-CN' };
  const TITLE = { en: 'Language', es: 'Idioma', pt: 'Idioma', fr: 'Langue', de: 'Sprache', it: 'Lingua', ru: 'Язык', tr: 'Dil', id: 'Bahasa', hi: 'भाषा', ar: 'اللغة', ja: '言語', ko: '언어', zh: '语言' };

  function detect() {
    let saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    if (CODES.includes(saved)) return saved;
    for (const l of (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'])) {
      const c = String(l).toLowerCase().split('-')[0];
      if (CODES.includes(c)) return c;
    }
    return 'en';
  }

  const lang = detect();
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Textos del idioma elegido; lo que falte se toma del inglés.
  function strings(dict) { return Object.assign({}, dict.en, dict[lang]); }

  function open() {
    const o = document.createElement('div');
    o.setAttribute('role', 'dialog');
    o.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';
    o.innerHTML = `<div style="background:#1d2133;color:#fff;border-radius:18px;padding:16px;width:100%;max-width:340px;max-height:85vh;overflow:auto;font:15px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 10px 40px #0008">
      <div style="font-weight:800;font-size:17px;margin:2px 4px 12px">🌐 ${TITLE[lang]}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${LANGS.map(([c, n]) =>
        `<button data-l="${c}" style="font:inherit;font-weight:600;padding:11px 8px;border-radius:12px;cursor:pointer;border:2px solid ${c === lang ? '#7cf29a' : 'transparent'};background:${c === lang ? '#2a3a32' : '#2a2f45'};color:#fff">${n}</button>`).join('')}</div></div>`;
    o.addEventListener('click', e => {
      const b = e.target.closest('button[data-l]');
      if (b) {
        try { localStorage.setItem(KEY, b.dataset.l); } catch (err) {}
        location.reload();
      } else if (e.target === o) o.remove();
    });
    document.body.appendChild(o);
  }

  function button(el) {
    el.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle" aria-hidden="true"><circle cx="12" cy="12" r="8.5" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M3.5 12h17M12 3.5c-3 3.2-3 13.8 0 17M12 3.5c3 3.2 3 13.8 0 17" stroke="currentColor" stroke-width="1.6" fill="none"/></svg>';
    el.setAttribute('aria-label', TITLE[lang]);
    el.title = TITLE[lang];
    el.addEventListener('click', e => { e.stopPropagation(); open(); });
    return el;
  }

  // Botón flotante arriba a la izquierda, para los juegos a pantalla completa.
  function floating() {
    const b = document.createElement('button');
    b.style.cssText = 'position:fixed;top:calc(env(safe-area-inset-top) + 10px);left:10px;z-index:4;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:20px;line-height:40px;box-shadow:none;cursor:pointer';
    document.body.appendChild(b);
    return button(b);
  }

  window.I18N = { lang, locale: LOCALE[lang] || lang, LANGS, strings, open, button, floating };
})();
