// Licencias PRO con claves de Lemon Squeezy (compartido por Enfoque y Mi Mascota).
// Al pagar, Lemon Squeezy le da al cliente una clave. La app la activa contra la API pública de
// licencias (no necesita llave secreta) y la vuelve a comprobar cada día: si la suscripción se
// cancela o se reembolsa, PRO se apaga solo.
// Uso: const lic = LICENSE.create({ app: 'enfoque', product: 'Enfoque PRO', storeId: '' , onChange(pro) {} });
//      lic.pro  ·  lic.mount(elemento)  ·  lic.refresh()
(function () {
  const API = 'https://api.lemonsqueezy.com/v1/licenses/';
  const RECHECK_MS = 24 * 3600 * 1000;       // comprobar una vez al día
  const OFFLINE_GRACE_MS = 14 * 24 * 3600 * 1000; // sin internet, PRO sigue hasta 14 días

  // Dentro de la app Android (Google Play) no se puede enlazar a pagos fuera de Play: se ocultan
  // los botones de precio y solo queda la caja para pegar una clave comprada en la web.
  // La app abre ?src=android; se recuerda por pestaña (sessionStorage), no en el navegador normal.
  let ANDROID = false;
  try {
    if (/[?&]src=android\b/.test(location.search) || /^android-app:\/\//.test(document.referrer)) sessionStorage.setItem('android-app', '1');
    ANDROID = sessionStorage.getItem('android-app') === '1';
  } catch (e) {}
  if (ANDROID) {
    document.documentElement.classList.add('android-app');
    const st = document.createElement('style');
    st.textContent = '.android-app .price{display:none!important}';
    document.head.appendChild(st);
  }

  const S = {
    en: { have: 'Already bought? Paste your license key', hint: 'You received it by email after paying.', ph: 'License key', btn: 'Activate', checking: 'Checking…', ok: 'PRO unlocked. Thank you!', bad: 'That key is not valid.', other: 'That key belongs to another product.', expired: 'That key is expired or disabled.', limit: 'That key is already active on the maximum number of devices.', net: 'No connection. Try again with internet.', active: 'PRO active', off: 'Your PRO license is no longer active.' },
    es: { have: '¿Ya compraste? Pega tu clave de licencia', hint: 'Te llegó por correo después de pagar.', ph: 'Clave de licencia', btn: 'Activar', checking: 'Comprobando…', ok: 'PRO activado. ¡Gracias!', bad: 'Esa clave no es válida.', other: 'Esa clave es de otro producto.', expired: 'Esa clave está vencida o desactivada.', limit: 'Esa clave ya está activa en el máximo de dispositivos.', net: 'Sin conexión. Inténtalo de nuevo con internet.', active: 'PRO activo', off: 'Tu licencia PRO ya no está activa.' },
    pt: { have: 'Já comprou? Cole sua chave de licença', hint: 'Ela chegou por e-mail após o pagamento.', ph: 'Chave de licença', btn: 'Ativar', checking: 'Verificando…', ok: 'PRO ativado. Obrigado!', bad: 'Essa chave não é válida.', other: 'Essa chave é de outro produto.', expired: 'Essa chave expirou ou foi desativada.', limit: 'Essa chave já está ativa no número máximo de dispositivos.', net: 'Sem conexão. Tente de novo com internet.', active: 'PRO ativo', off: 'Sua licença PRO não está mais ativa.' },
    fr: { have: 'Déjà acheté ? Collez votre clé de licence', hint: 'Vous l’avez reçue par e-mail après le paiement.', ph: 'Clé de licence', btn: 'Activer', checking: 'Vérification…', ok: 'PRO activé. Merci !', bad: 'Cette clé n’est pas valide.', other: 'Cette clé appartient à un autre produit.', expired: 'Cette clé a expiré ou est désactivée.', limit: 'Cette clé est déjà active sur le nombre maximal d’appareils.', net: 'Pas de connexion. Réessayez avec internet.', active: 'PRO actif', off: 'Votre licence PRO n’est plus active.' },
    de: { have: 'Schon gekauft? Lizenzschlüssel einfügen', hint: 'Du hast ihn nach dem Kauf per E-Mail erhalten.', ph: 'Lizenzschlüssel', btn: 'Aktivieren', checking: 'Wird geprüft…', ok: 'PRO freigeschaltet. Danke!', bad: 'Dieser Schlüssel ist ungültig.', other: 'Dieser Schlüssel gehört zu einem anderen Produkt.', expired: 'Dieser Schlüssel ist abgelaufen oder deaktiviert.', limit: 'Dieser Schlüssel ist bereits auf der maximalen Anzahl an Geräten aktiv.', net: 'Keine Verbindung. Versuche es mit Internet erneut.', active: 'PRO aktiv', off: 'Deine PRO-Lizenz ist nicht mehr aktiv.' },
    it: { have: 'Già acquistato? Incolla la chiave di licenza', hint: 'L’hai ricevuta via e-mail dopo il pagamento.', ph: 'Chiave di licenza', btn: 'Attiva', checking: 'Verifica…', ok: 'PRO attivato. Grazie!', bad: 'Questa chiave non è valida.', other: 'Questa chiave è di un altro prodotto.', expired: 'Questa chiave è scaduta o disattivata.', limit: 'Questa chiave è già attiva sul numero massimo di dispositivi.', net: 'Nessuna connessione. Riprova con internet.', active: 'PRO attivo', off: 'La tua licenza PRO non è più attiva.' },
    ru: { have: 'Уже купили? Вставьте лицензионный ключ', hint: 'Он пришёл на почту после оплаты.', ph: 'Лицензионный ключ', btn: 'Активировать', checking: 'Проверка…', ok: 'PRO активирован. Спасибо!', bad: 'Этот ключ недействителен.', other: 'Этот ключ от другого продукта.', expired: 'Срок ключа истёк или он отключён.', limit: 'Ключ уже активен на максимальном числе устройств.', net: 'Нет связи. Попробуйте снова с интернетом.', active: 'PRO активен', off: 'Ваша лицензия PRO больше не активна.' },
    tr: { have: 'Zaten aldınız mı? Lisans anahtarınızı yapıştırın', hint: 'Ödemeden sonra e-postayla geldi.', ph: 'Lisans anahtarı', btn: 'Etkinleştir', checking: 'Kontrol ediliyor…', ok: 'PRO açıldı. Teşekkürler!', bad: 'Bu anahtar geçerli değil.', other: 'Bu anahtar başka bir ürüne ait.', expired: 'Bu anahtarın süresi dolmuş veya devre dışı.', limit: 'Bu anahtar zaten en fazla cihazda etkin.', net: 'Bağlantı yok. İnternetle tekrar deneyin.', active: 'PRO etkin', off: 'PRO lisansınız artık etkin değil.' },
    id: { have: 'Sudah beli? Tempel kunci lisensi Anda', hint: 'Dikirim lewat email setelah pembayaran.', ph: 'Kunci lisensi', btn: 'Aktifkan', checking: 'Memeriksa…', ok: 'PRO aktif. Terima kasih!', bad: 'Kunci itu tidak valid.', other: 'Kunci itu untuk produk lain.', expired: 'Kunci itu kedaluwarsa atau dinonaktifkan.', limit: 'Kunci itu sudah aktif di jumlah perangkat maksimum.', net: 'Tidak ada koneksi. Coba lagi dengan internet.', active: 'PRO aktif', off: 'Lisensi PRO Anda tidak aktif lagi.' },
    hi: { have: 'पहले ही खरीदा? अपनी लाइसेंस कुंजी चिपकाएँ', hint: 'भुगतान के बाद यह ईमेल से मिली थी।', ph: 'लाइसेंस कुंजी', btn: 'चालू करें', checking: 'जाँच हो रही है…', ok: 'PRO चालू हो गया। धन्यवाद!', bad: 'यह कुंजी मान्य नहीं है।', other: 'यह कुंजी किसी और उत्पाद की है।', expired: 'यह कुंजी समाप्त या बंद है।', limit: 'यह कुंजी पहले से अधिकतम डिवाइस पर चालू है।', net: 'कनेक्शन नहीं है। इंटरनेट के साथ फिर कोशिश करें।', active: 'PRO चालू', off: 'आपका PRO लाइसेंस अब चालू नहीं है।' },
    ar: { have: 'اشتريت بالفعل؟ الصق مفتاح الترخيص', hint: 'وصلك بالبريد الإلكتروني بعد الدفع.', ph: 'مفتاح الترخيص', btn: 'تفعيل', checking: 'جارٍ التحقق…', ok: 'تم تفعيل PRO. شكرًا!', bad: 'هذا المفتاح غير صالح.', other: 'هذا المفتاح لمنتج آخر.', expired: 'هذا المفتاح منتهي أو معطّل.', limit: 'هذا المفتاح مفعّل بالفعل على الحد الأقصى من الأجهزة.', net: 'لا يوجد اتصال. حاول مرة أخرى مع الإنترنت.', active: 'PRO مفعّل', off: 'لم يعد ترخيص PRO مفعّلًا.' },
    ja: { have: '購入済みですか？ライセンスキーを貼り付けてください', hint: '支払い後にメールで届いています。', ph: 'ライセンスキー', btn: '有効にする', checking: '確認中…', ok: 'PRO が有効になりました。ありがとう！', bad: 'このキーは無効です。', other: 'このキーは別の製品のものです。', expired: 'このキーは期限切れか無効化されています。', limit: 'このキーは上限台数の端末ですでに有効です。', net: '接続がありません。インターネットに接続して再試行してください。', active: 'PRO 有効', off: 'PRO ライセンスは無効になりました。' },
    ko: { have: '이미 구매하셨나요? 라이선스 키를 붙여 넣으세요', hint: '결제 후 이메일로 받았습니다.', ph: '라이선스 키', btn: '활성화', checking: '확인 중…', ok: 'PRO가 활성화되었습니다. 감사합니다!', bad: '유효하지 않은 키입니다.', other: '다른 제품의 키입니다.', expired: '만료되었거나 비활성화된 키입니다.', limit: '이 키는 이미 최대 기기 수에서 활성화되어 있습니다.', net: '연결이 없습니다. 인터넷에 연결해 다시 시도하세요.', active: 'PRO 활성', off: 'PRO 라이선스가 더 이상 활성 상태가 아닙니다.' },
    zh: { have: '已经购买？粘贴你的许可证密钥', hint: '付款后已通过邮件发送给你。', ph: '许可证密钥', btn: '激活', checking: '正在验证…', ok: 'PRO 已激活，谢谢！', bad: '该密钥无效。', other: '该密钥属于其他产品。', expired: '该密钥已过期或已停用。', limit: '该密钥已在最多数量的设备上激活。', net: '没有网络连接，请联网后重试。', active: 'PRO 已激活', off: '你的 PRO 许可证已失效。' }
  };
  const T = Object.assign({}, S.en, S[document.documentElement.lang] || {});

  async function call(path, params) {
    const r = await fetch(API + path, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params)
    });
    let j = {};
    try { j = await r.json(); } catch (e) {}
    return j;
  }

  function create(opt) {
    const KEY = `${opt.app}-license`;
    let L = null;
    try { L = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) {}
    const store = () => L ? localStorage.setItem(KEY, JSON.stringify(L)) : localStorage.removeItem(KEY);
    const lic = { T, get pro() { return !!(L && L.ok && Date.now() - L.checked < OFFLINE_GRACE_MS + RECHECK_MS); } };

    // ¿Es de esta tienda y de este producto?
    function mine(meta) {
      if (!meta) return false;
      if (opt.storeId && String(meta.store_id) !== String(opt.storeId)) return false;
      return String(meta.product_name || '').trim().toLowerCase() === opt.product.toLowerCase();
    }
    const statusMsg = s => (s === 'expired' || s === 'disabled') ? T.expired : T.bad;

    async function activate(key) {
      key = key.trim();
      if (!key) return T.bad;
      let j;
      try { j = await call('activate', { license_key: key, instance_name: `${opt.product} · ${(navigator.platform || 'web').slice(0, 30)}` }); }
      catch (e) { return T.net; }
      if (!j.activated) {
        const err = String(j.error || '');
        if (/limit/i.test(err)) return T.limit;
        return statusMsg(j.license_key && j.license_key.status);
      }
      if (!mine(j.meta)) {
        // Libera el hueco que acabamos de ocupar en la clave ajena.
        call('deactivate', { license_key: key, instance_id: j.instance && j.instance.id }).catch(() => {});
        return T.other;
      }
      L = { key, instance: j.instance && j.instance.id, ok: true, checked: Date.now(), variant: j.meta.variant_name || '' };
      store(); opt.onChange && opt.onChange(true);
      return null;
    }

    // Comprobación diaria. Solo se apaga PRO con una respuesta clara de Lemon Squeezy,
    // no por falta de internet (salvo que pasen más de 14 días sin poder comprobar).
    async function refresh(force) {
      if (!L) return;
      if (!force && Date.now() - L.checked < RECHECK_MS) return;
      let j;
      try { j = await call('validate', { license_key: L.key, instance_id: L.instance }); }
      catch (e) { if (!lic.pro) opt.onChange && opt.onChange(false); return; }
      if (j.valid && mine(j.meta)) { L.ok = true; L.checked = Date.now(); store(); return; }
      if (j.valid === false || j.license_key) {
        const was = L.ok; L.ok = false; L.checked = Date.now(); store();
        if (was) { opt.onChange && opt.onChange(false); alert(T.off); }
      }
    }

    // Caja "¿Ya compraste? Pega tu clave" dentro de la ventana PRO.
    function mount(el, focus) {
      if (!el) return;
      if (lic.pro) {
        el.innerHTML = `<p style="text-align:center;margin:10px 0;font-weight:700">✓ ${T.active}${L.variant ? ' · ' + L.variant.replace(/[<>&"]/g, '') : ''}</p>`;
        return;
      }
      el.innerHTML = `<div style="margin:12px 0 4px;padding:10px;border-radius:12px;border:1px dashed currentColor;opacity:.95">
        <div style="font-weight:700;font-size:14px">${T.have}</div>
        <div style="font-size:12px;opacity:.75;margin:2px 0 8px">${T.hint}</div>
        <div style="display:flex;gap:6px"><input id="licKey" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${T.ph}" style="flex:1;min-width:0;font:inherit;font-size:14px;padding:9px;border-radius:9px;border:1px solid #8888">
        <button id="licGo" type="button" style="font:inherit;font-weight:700;padding:9px 12px;border-radius:9px;border:0;background:#7c5cff;color:#fff">${T.btn}</button></div>
        <div id="licMsg" style="font-size:13px;margin-top:6px;min-height:1em"></div></div>`;
      const inp = el.querySelector('#licKey'), btn = el.querySelector('#licGo'), msg = el.querySelector('#licMsg');
      btn.onclick = async () => {
        btn.disabled = true; msg.textContent = T.checking;
        const err = await activate(inp.value);
        btn.disabled = false;
        if (err) { msg.textContent = err; return; }
        msg.textContent = T.ok; setTimeout(() => mount(el), 1200);
      };
      inp.onkeydown = e => { if (e.key === 'Enter') btn.onclick(); };
      if (focus) setTimeout(() => inp.focus(), 250);
    }

    Object.assign(lic, { activate, refresh, mount });
    return lic;
  }

  window.LICENSE = { create, android: ANDROID };
})();
