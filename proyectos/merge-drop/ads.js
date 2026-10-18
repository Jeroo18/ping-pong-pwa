// Capa única de anuncios para todos los proyectos.
// Hoy funciona en modo "demo" (simula el anuncio). Al publicar, detecta sola:
//   - CrazyGames SDK v3 (si subes el juego a crazygames.com)
//   - AdMob vía Capacitor (@capacitor-community/admob) cuando lo empaquetas para Google Play
// Cambia los IDs de AdMob en ADMOB_IDS antes de compilar la app.
(function () {
  const ADMOB_IDS = {
    // IDs de prueba oficiales de Google. Sustitúyelos por los tuyos en admob.google.com
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712'
  };
  const MIN_GAP_MS = 90000; // no más de un intersticial cada 90 s
  let lastInterstitial = Date.now();
  let provider = 'demo';
  // En los ZIP para portales (index.html pone ADS_NO_DEMO) no se muestra el anuncio de prueba:
  // CrazyGames no permite anuncios propios mientras el juego está en Basic Launch.
  const NO_DEMO = window.ADS_NO_DEMO === true;

  const cg = () => window.CrazyGames && window.CrazyGames.SDK;
  const admob = () => window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob;

  async function init() {
    try {
      if (cg()) { await cg().init(); provider = 'crazygames'; }
      else if (admob()) { await admob().initialize({}); provider = 'admob'; }
    } catch (e) { provider = 'demo'; }
    return provider;
  }

  function demoAd(label) {
    return new Promise(resolve => {
      const o = document.createElement('div');
      o.setAttribute('role', 'dialog');
      o.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.85);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;font:600 18px system-ui;gap:12px;text-align:center;padding:24px';
      let n = 3;
      o.innerHTML = `<div style="opacity:.7;font-size:13px">${label}</div><div id="adN" style="font-size:48px">${n}</div><div style="opacity:.6;font-size:12px">Espacio publicitario · Ad space</div>`;
      document.body.appendChild(o);
      const t = setInterval(() => {
        n--; const el = o.querySelector('#adN'); if (el) el.textContent = n;
        if (n <= 0) { clearInterval(t); o.remove(); resolve(true); }
      }, 700);
    });
  }

  function cgAd(type) {
    return new Promise(resolve => {
      cg().ad.requestAd(type, {
        adStarted: () => {},
        adFinished: () => resolve(true),
        adError: () => resolve(false)
      });
    });
  }

  async function rewarded() {
    try {
      if (provider === 'crazygames') return await cgAd('rewarded');
      if (provider === 'admob') {
        await admob().prepareRewardVideoAd({ adId: ADMOB_IDS.rewarded });
        const r = await admob().showRewardVideoAd();
        return !!r;
      }
    } catch (e) { return false; }
    return NO_DEMO ? true : demoAd('Anuncio con recompensa · Rewarded ad');
  }

  async function interstitial(force) {
    if (!force && Date.now() - lastInterstitial < MIN_GAP_MS) return false;
    lastInterstitial = Date.now();
    try {
      if (provider === 'crazygames') return await cgAd('midgame');
      if (provider === 'admob') {
        await admob().prepareInterstitial({ adId: ADMOB_IDS.interstitial });
        await admob().showInterstitial();
        return true;
      }
    } catch (e) { return false; }
    return NO_DEMO ? false : demoAd('Anuncio · Ad');
  }

  // Avisos de juego que CrazyGames usa para pausar/medir (no hacen nada fuera de ahí)
  function gameplayStart() { try { provider === 'crazygames' && cg().game.gameplayStart(); } catch (e) {} }
  function gameplayStop() { try { provider === 'crazygames' && cg().game.gameplayStop(); } catch (e) {} }
  function happytime() { try { provider === 'crazygames' && cg().game.happytime(); } catch (e) {} }

  window.Ads = { init, rewarded, interstitial, gameplayStart, gameplayStop, happytime, get provider() { return provider; } };
  init();
})();
