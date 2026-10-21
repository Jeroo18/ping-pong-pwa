// Perfil de jugador, trofeos y compartir en redes. Compartido por los 3 juegos.
// Todo se guarda en el teléfono (localStorage); el perfil es el mismo para los 3 juegos.
// Uso:
//   Trophies.init({ game: 'nut-sort', title: 'Nut Sort', color: '#7b4dff', button: el,
//                   list: [{ id, tier: 'bronze'|'silver'|'gold'|'platinum', icon, stat, goal, text: S => S.levels(5) }] });
//   Trophies.set('score', 1200)  // guarda el máximo     Trophies.add('lines', 2)  // suma
// En los ZIP de portales (window.PORTAL_BUILD) no se pone el enlace a la web: CrazyGames no permite enlaces a otra versión jugable.
(function () {
  const L = {
    en: {
      trophies: 'Trophies', profile: 'Player profile', create: 'Create your player profile', name: 'Name', namePh: 'Your player name', avatar: 'Avatar',
      save: 'Save', cancel: 'Cancel', close: 'Close', edit: 'Edit', unlocked: 'Trophy unlocked!', share: 'Share', shareTitle: 'Share trophy',
      copy: 'Copy text', copied: 'Copied!', download: 'Save image', player: 'Player', since: d => `Playing since ${d}`, count: (a, b) => `${a} of ${b} trophies`,
      tiers: { bronze: 'Bronze', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' },
      levels: n => `Complete ${n} levels`, score: n => `Score ${n} points in one game`, combo: n => `Make a x${n} combo`, lines: n => `Clear ${n} lines`,
      plays: n => `Play ${n} games`, days: n => `Play on ${n} different days`, coins: n => `Earn ${n} coins`, make: x => `Create ${x}`,
      shareText: (g, t) => `🏆 I unlocked “${t}” in ${g}! Can you beat me?`, playAt: g => `Play ${g}`
    },
    es: {
      trophies: 'Trofeos', profile: 'Perfil de jugador', create: 'Crea tu perfil de jugador', name: 'Nombre', namePh: 'Tu nombre de jugador', avatar: 'Avatar',
      save: 'Guardar', cancel: 'Cancelar', close: 'Cerrar', edit: 'Editar', unlocked: '¡Trofeo desbloqueado!', share: 'Compartir', shareTitle: 'Compartir trofeo',
      copy: 'Copiar texto', copied: '¡Copiado!', download: 'Guardar imagen', player: 'Jugador', since: d => `Jugando desde ${d}`, count: (a, b) => `${a} de ${b} trofeos`,
      tiers: { bronze: 'Bronce', silver: 'Plata', gold: 'Oro', platinum: 'Platino' },
      levels: n => `Completa ${n} niveles`, score: n => `Haz ${n} puntos en una partida`, combo: n => `Haz un combo x${n}`, lines: n => `Limpia ${n} líneas`,
      plays: n => `Juega ${n} partidas`, days: n => `Juega ${n} días distintos`, coins: n => `Gana ${n} monedas`, make: x => `Crea ${x}`,
      shareText: (g, t) => `🏆 ¡Desbloqueé “${t}” en ${g}! ¿Me superas?`, playAt: g => `Juega ${g}`
    },
    pt: {
      trophies: 'Troféus', profile: 'Perfil do jogador', create: 'Crie seu perfil de jogador', name: 'Nome', namePh: 'Seu nome de jogador', avatar: 'Avatar',
      save: 'Salvar', cancel: 'Cancelar', close: 'Fechar', edit: 'Editar', unlocked: 'Troféu desbloqueado!', share: 'Compartilhar', shareTitle: 'Compartilhar troféu',
      copy: 'Copiar texto', copied: 'Copiado!', download: 'Salvar imagem', player: 'Jogador', since: d => `Jogando desde ${d}`, count: (a, b) => `${a} de ${b} troféus`,
      tiers: { bronze: 'Bronze', silver: 'Prata', gold: 'Ouro', platinum: 'Platina' },
      levels: n => `Complete ${n} níveis`, score: n => `Faça ${n} pontos em uma partida`, combo: n => `Faça um combo x${n}`, lines: n => `Limpe ${n} linhas`,
      plays: n => `Jogue ${n} partidas`, days: n => `Jogue em ${n} dias diferentes`, coins: n => `Ganhe ${n} moedas`, make: x => `Crie ${x}`,
      shareText: (g, t) => `🏆 Desbloqueei “${t}” no ${g}! Consegue me superar?`, playAt: g => `Jogue ${g}`
    },
    fr: {
      trophies: 'Trophées', profile: 'Profil joueur', create: 'Crée ton profil de joueur', name: 'Nom', namePh: 'Ton nom de joueur', avatar: 'Avatar',
      save: 'Enregistrer', cancel: 'Annuler', close: 'Fermer', edit: 'Modifier', unlocked: 'Trophée débloqué !', share: 'Partager', shareTitle: 'Partager le trophée',
      copy: 'Copier le texte', copied: 'Copié !', download: 'Enregistrer l’image', player: 'Joueur', since: d => `Joue depuis le ${d}`, count: (a, b) => `${a} sur ${b} trophées`,
      tiers: { bronze: 'Bronze', silver: 'Argent', gold: 'Or', platinum: 'Platine' },
      levels: n => `Termine ${n} niveaux`, score: n => `Fais ${n} points en une partie`, combo: n => `Fais un combo x${n}`, lines: n => `Efface ${n} lignes`,
      plays: n => `Joue ${n} parties`, days: n => `Joue ${n} jours différents`, coins: n => `Gagne ${n} pièces`, make: x => `Crée ${x}`,
      shareText: (g, t) => `🏆 J’ai débloqué « ${t} » dans ${g} ! Tu peux faire mieux ?`, playAt: g => `Joue à ${g}`
    },
    de: {
      trophies: 'Trophäen', profile: 'Spielerprofil', create: 'Erstelle dein Spielerprofil', name: 'Name', namePh: 'Dein Spielername', avatar: 'Avatar',
      save: 'Speichern', cancel: 'Abbrechen', close: 'Schließen', edit: 'Bearbeiten', unlocked: 'Trophäe freigeschaltet!', share: 'Teilen', shareTitle: 'Trophäe teilen',
      copy: 'Text kopieren', copied: 'Kopiert!', download: 'Bild speichern', player: 'Spieler', since: d => `Spielt seit ${d}`, count: (a, b) => `${a} von ${b} Trophäen`,
      tiers: { bronze: 'Bronze', silver: 'Silber', gold: 'Gold', platinum: 'Platin' },
      levels: n => `Schaffe ${n} Level`, score: n => `Erziele ${n} Punkte in einem Spiel`, combo: n => `Schaffe eine x${n}-Combo`, lines: n => `Räume ${n} Reihen ab`,
      plays: n => `Spiele ${n} Runden`, days: n => `Spiele an ${n} verschiedenen Tagen`, coins: n => `Verdiene ${n} Münzen`, make: x => `Erschaffe: ${x}`,
      shareText: (g, t) => `🏆 Ich habe „${t}“ in ${g} geschafft! Schaffst du das auch?`, playAt: g => `Spiele ${g}`
    },
    it: {
      trophies: 'Trofei', profile: 'Profilo giocatore', create: 'Crea il tuo profilo giocatore', name: 'Nome', namePh: 'Il tuo nome da giocatore', avatar: 'Avatar',
      save: 'Salva', cancel: 'Annulla', close: 'Chiudi', edit: 'Modifica', unlocked: 'Trofeo sbloccato!', share: 'Condividi', shareTitle: 'Condividi trofeo',
      copy: 'Copia testo', copied: 'Copiato!', download: 'Salva immagine', player: 'Giocatore', since: d => `Gioca dal ${d}`, count: (a, b) => `${a} di ${b} trofei`,
      tiers: { bronze: 'Bronzo', silver: 'Argento', gold: 'Oro', platinum: 'Platino' },
      levels: n => `Completa ${n} livelli`, score: n => `Fai ${n} punti in una partita`, combo: n => `Fai una combo x${n}`, lines: n => `Elimina ${n} linee`,
      plays: n => `Gioca ${n} partite`, days: n => `Gioca in ${n} giorni diversi`, coins: n => `Guadagna ${n} monete`, make: x => `Crea ${x}`,
      shareText: (g, t) => `🏆 Ho sbloccato “${t}” in ${g}! Riesci a battermi?`, playAt: g => `Gioca a ${g}`
    },
    ru: {
      trophies: 'Трофеи', profile: 'Профиль игрока', create: 'Создайте профиль игрока', name: 'Имя', namePh: 'Ваше имя в игре', avatar: 'Аватар',
      save: 'Сохранить', cancel: 'Отмена', close: 'Закрыть', edit: 'Изменить', unlocked: 'Трофей получен!', share: 'Поделиться', shareTitle: 'Поделиться трофеем',
      copy: 'Копировать текст', copied: 'Скопировано!', download: 'Сохранить картинку', player: 'Игрок', since: d => `Играет с ${d}`, count: (a, b) => `${a} из ${b} трофеев`,
      tiers: { bronze: 'Бронза', silver: 'Серебро', gold: 'Золото', platinum: 'Платина' },
      levels: n => `Пройдите ${n} уровней`, score: n => `Наберите ${n} очков за игру`, combo: n => `Сделайте комбо x${n}`, lines: n => `Очистите ${n} линий`,
      plays: n => `Сыграйте ${n} партий`, days: n => `Играйте ${n} разных дней`, coins: n => `Заработайте ${n} монет`, make: x => `Создайте: ${x}`,
      shareText: (g, t) => `🏆 Я получил трофей «${t}» в ${g}! Сможешь лучше?`, playAt: g => `Играть в ${g}`
    },
    tr: {
      trophies: 'Kupalar', profile: 'Oyuncu profili', create: 'Oyuncu profilini oluştur', name: 'Ad', namePh: 'Oyuncu adın', avatar: 'Avatar',
      save: 'Kaydet', cancel: 'İptal', close: 'Kapat', edit: 'Düzenle', unlocked: 'Kupa açıldı!', share: 'Paylaş', shareTitle: 'Kupayı paylaş',
      copy: 'Metni kopyala', copied: 'Kopyalandı!', download: 'Resmi kaydet', player: 'Oyuncu', since: d => `${d} tarihinden beri oynuyor`, count: (a, b) => `${b} kupadan ${a}`,
      tiers: { bronze: 'Bronz', silver: 'Gümüş', gold: 'Altın', platinum: 'Platin' },
      levels: n => `${n} bölüm tamamla`, score: n => `Bir oyunda ${n} puan yap`, combo: n => `x${n} kombo yap`, lines: n => `${n} sıra temizle`,
      plays: n => `${n} oyun oyna`, days: n => `${n} farklı günde oyna`, coins: n => `${n} jeton kazan`, make: x => `Oluştur: ${x}`,
      shareText: (g, t) => `🏆 ${g} oyununda “${t}” kupasını açtım! Beni geçebilir misin?`, playAt: g => `${g} oyna`
    },
    id: {
      trophies: 'Trofi', profile: 'Profil pemain', create: 'Buat profil pemainmu', name: 'Nama', namePh: 'Nama pemainmu', avatar: 'Avatar',
      save: 'Simpan', cancel: 'Batal', close: 'Tutup', edit: 'Ubah', unlocked: 'Trofi terbuka!', share: 'Bagikan', shareTitle: 'Bagikan trofi',
      copy: 'Salin teks', copied: 'Disalin!', download: 'Simpan gambar', player: 'Pemain', since: d => `Bermain sejak ${d}`, count: (a, b) => `${a} dari ${b} trofi`,
      tiers: { bronze: 'Perunggu', silver: 'Perak', gold: 'Emas', platinum: 'Platinum' },
      levels: n => `Selesaikan ${n} level`, score: n => `Raih ${n} poin dalam satu permainan`, combo: n => `Buat kombo x${n}`, lines: n => `Hapus ${n} baris`,
      plays: n => `Main ${n} kali`, days: n => `Main di ${n} hari berbeda`, coins: n => `Kumpulkan ${n} koin`, make: x => `Ciptakan ${x}`,
      shareText: (g, t) => `🏆 Aku membuka “${t}” di ${g}! Bisa kalahkan aku?`, playAt: g => `Main ${g}`
    },
    hi: {
      trophies: 'ट्रॉफ़ियाँ', profile: 'खिलाड़ी प्रोफ़ाइल', create: 'अपनी खिलाड़ी प्रोफ़ाइल बनाएँ', name: 'नाम', namePh: 'आपका खिलाड़ी नाम', avatar: 'अवतार',
      save: 'सेव करें', cancel: 'रद्द करें', close: 'बंद करें', edit: 'बदलें', unlocked: 'ट्रॉफ़ी मिली!', share: 'शेयर करें', shareTitle: 'ट्रॉफ़ी शेयर करें',
      copy: 'टेक्स्ट कॉपी करें', copied: 'कॉपी हो गया!', download: 'इमेज सेव करें', player: 'खिलाड़ी', since: d => `${d} से खेल रहे हैं`, count: (a, b) => `${b} में से ${a} ट्रॉफ़ियाँ`,
      tiers: { bronze: 'कांस्य', silver: 'रजत', gold: 'स्वर्ण', platinum: 'प्लैटिनम' },
      levels: n => `${n} लेवल पूरे करें`, score: n => `एक गेम में ${n} अंक बनाएँ`, combo: n => `x${n} कॉम्बो बनाएँ`, lines: n => `${n} लाइनें साफ़ करें`,
      plays: n => `${n} गेम खेलें`, days: n => `${n} अलग-अलग दिन खेलें`, coins: n => `${n} सिक्के कमाएँ`, make: x => `${x} बनाएँ`,
      shareText: (g, t) => `🏆 मैंने ${g} में “${t}” ट्रॉफ़ी जीती! क्या आप मुझे हरा सकते हैं?`, playAt: g => `${g} खेलें`
    },
    ar: {
      trophies: 'الكؤوس', profile: 'ملف اللاعب', create: 'أنشئ ملفك كلاعب', name: 'الاسم', namePh: 'اسمك في اللعبة', avatar: 'الصورة الرمزية',
      save: 'حفظ', cancel: 'إلغاء', close: 'إغلاق', edit: 'تعديل', unlocked: 'حصلت على كأس!', share: 'مشاركة', shareTitle: 'مشاركة الكأس',
      copy: 'نسخ النص', copied: 'تم النسخ!', download: 'حفظ الصورة', player: 'لاعب', since: d => `يلعب منذ ${d}`, count: (a, b) => `${a} من ${b} كؤوس`,
      tiers: { bronze: 'برونزي', silver: 'فضي', gold: 'ذهبي', platinum: 'بلاتيني' },
      levels: n => `أكمل ${n} مستويات`, score: n => `اجمع ${n} نقطة في لعبة واحدة`, combo: n => `حقق كومبو x${n}`, lines: n => `امسح ${n} صفًا`,
      plays: n => `العب ${n} مرات`, days: n => `العب في ${n} أيام مختلفة`, coins: n => `اربح ${n} عملة`, make: x => `اصنع ${x}`,
      shareText: (g, t) => `🏆 حصلت على كأس “${t}” في ${g}! هل يمكنك التفوق علي؟`, playAt: g => `العب ${g}`
    },
    ja: {
      trophies: 'トロフィー', profile: 'プレイヤープロフィール', create: 'プレイヤープロフィールを作成', name: '名前', namePh: 'プレイヤー名', avatar: 'アバター',
      save: '保存', cancel: 'キャンセル', close: '閉じる', edit: '編集', unlocked: 'トロフィー獲得！', share: 'シェア', shareTitle: 'トロフィーをシェア',
      copy: 'テキストをコピー', copied: 'コピーしました！', download: '画像を保存', player: 'プレイヤー', since: d => `${d}からプレイ`, count: (a, b) => `トロフィー ${a} / ${b}`,
      tiers: { bronze: 'ブロンズ', silver: 'シルバー', gold: 'ゴールド', platinum: 'プラチナ' },
      levels: n => `${n}レベルクリア`, score: n => `1ゲームで${n}点`, combo: n => `${n}連続コンボ`, lines: n => `${n}ライン消す`,
      plays: n => `${n}回プレイ`, days: n => `${n}日間プレイ`, coins: n => `コインを${n}枚獲得`, make: x => `${x}を作る`,
      shareText: (g, t) => `🏆 ${g}で「${t}」のトロフィーを獲得！勝てるかな？`, playAt: g => `${g}をプレイ`
    },
    ko: {
      trophies: '트로피', profile: '플레이어 프로필', create: '플레이어 프로필 만들기', name: '이름', namePh: '플레이어 이름', avatar: '아바타',
      save: '저장', cancel: '취소', close: '닫기', edit: '수정', unlocked: '트로피 획득!', share: '공유', shareTitle: '트로피 공유',
      copy: '텍스트 복사', copied: '복사됐어요!', download: '이미지 저장', player: '플레이어', since: d => `${d}부터 플레이`, count: (a, b) => `트로피 ${a} / ${b}`,
      tiers: { bronze: '브론즈', silver: '실버', gold: '골드', platinum: '플래티넘' },
      levels: n => `${n}레벨 클리어`, score: n => `한 판에 ${n}점`, combo: n => `x${n} 콤보`, lines: n => `${n}줄 지우기`,
      plays: n => `${n}판 플레이`, days: n => `서로 다른 ${n}일 플레이`, coins: n => `코인 ${n}개 모으기`, make: x => `${x} 만들기`,
      shareText: (g, t) => `🏆 ${g}에서 “${t}” 트로피를 땄어요! 이길 수 있나요?`, playAt: g => `${g} 플레이`
    },
    zh: {
      trophies: '奖杯', profile: '玩家资料', create: '创建你的玩家资料', name: '名字', namePh: '你的玩家名', avatar: '头像',
      save: '保存', cancel: '取消', close: '关闭', edit: '编辑', unlocked: '获得奖杯！', share: '分享', shareTitle: '分享奖杯',
      copy: '复制文字', copied: '已复制！', download: '保存图片', player: '玩家', since: d => `${d} 开始游戏`, count: (a, b) => `奖杯 ${a} / ${b}`,
      tiers: { bronze: '铜', silver: '银', gold: '金', platinum: '白金' },
      levels: n => `完成 ${n} 关`, score: n => `单局得到 ${n} 分`, combo: n => `达成 x${n} 连击`, lines: n => `消除 ${n} 行`,
      plays: n => `玩 ${n} 局`, days: n => `在 ${n} 个不同的日子玩`, coins: n => `赚到 ${n} 金币`, make: x => `合成${x}`,
      shareText: (g, t) => `🏆 我在 ${g} 中获得了「${t}」奖杯！你能超过我吗？`, playAt: g => `来玩 ${g}`
    }
  };
  const S = window.I18N ? I18N.strings(L) : L.en;
  const TIER_COLOR = { bronze: '#cd7f32', silver: '#c0c7d1', gold: '#ffc83d', platinum: '#7fe7ff' };
  const AVATARS = ['😀', '😎', '🤩', '🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🐵', '🦄', '🐙', '👾', '🤖', '🧙', '🥷'];
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const fmtDate = s => { try { return new Date(s + 'T12:00:00').toLocaleDateString(window.I18N ? I18N.locale : 'en', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) { return s; } };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  let cfg = null, data = null, profile = null;
  const KEY = () => `trophies:${cfg.game}`;

  function css() {
    if (document.getElementById('tz-css')) return;
    const st = document.createElement('style'); st.id = 'tz-css';
    st.textContent = `
.tz-ov{position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:14px;font:15px system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#fff}
.tz-card{background:#1d2133;border-radius:20px;width:100%;max-width:420px;max-height:88vh;overflow:auto;padding:18px;box-shadow:0 10px 40px #0009;text-align:start}
.tz-card h2{margin:0 0 12px;font-size:19px}
.tz-head{display:flex;align-items:center;gap:12px;background:#2a2f45;border-radius:16px;padding:12px;margin-bottom:12px}
.tz-av{font-size:38px;width:56px;height:56px;border-radius:50%;background:#353b57;display:flex;align-items:center;justify-content:center;flex:none}
.tz-head b{display:block;font-size:17px}.tz-head small{color:#aab3d1}
.tz-btn{font:inherit;font-weight:700;border:0;border-radius:12px;padding:10px 14px;cursor:pointer;background:#353b57;color:#fff;box-shadow:none}
.tz-btn.main{background:#ffc83d;color:#221a00}.tz-btn.sm{padding:6px 10px;font-size:13px}
.tz-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.tz-row .tz-btn{flex:1}
.tz-item{display:flex;align-items:center;gap:12px;padding:10px 4px;border-top:1px solid #2c3249}
.tz-ic{width:46px;height:46px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;flex:none;border:3px solid}
.tz-item.lock .tz-ic{filter:grayscale(1);opacity:.45}
.tz-tx{flex:1;min-width:0}.tz-tx b{display:block;font-size:14px}.tz-tx small{color:#aab3d1;font-size:12px}
.tz-bar{height:6px;background:#2c3249;border-radius:3px;margin-top:5px;overflow:hidden}.tz-bar i{display:block;height:100%;background:#ffc83d}
.tz-in{width:100%;font:inherit;background:#12152a;color:#fff;border:1px solid #353b57;border-radius:12px;padding:11px;margin:6px 0 12px;box-sizing:border-box}
.tz-avs{display:grid;grid-template-columns:repeat(8,1fr);gap:6px}
.tz-avs button{font-size:24px;padding:6px 0;border-radius:10px;border:2px solid transparent;background:#2a2f45;cursor:pointer;box-shadow:none}
.tz-avs button.on{border-color:#ffc83d}
.tz-toast{position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 12px);transform:translate(-50%,-140%);z-index:9100;background:#1d2133;color:#fff;border-radius:16px;padding:10px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 8px 30px #0008;transition:transform .35s;max-width:92vw;font:14px system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
.tz-toast.show{transform:translate(-50%,0)}.tz-toast b{display:block;color:#ffc83d}
.tz-share img{width:100%;border-radius:14px;margin-bottom:6px}
.tz-fab{position:fixed;top:calc(env(safe-area-inset-top) + 10px);left:58px;z-index:4;width:40px;height:40px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.14);color:#fff;font-size:20px;line-height:40px;box-shadow:none;cursor:pointer}`;
    document.head.appendChild(st);
  }

  function overlay(html) {
    const o = document.createElement('div'); o.className = 'tz-ov';
    o.innerHTML = `<div class="tz-card">${html}</div>`;
    o.addEventListener('click', e => { if (e.target === o) o.remove(); });
    document.body.appendChild(o);
    return o;
  }

  function trophyText(t) { return t.text(S); }
  function progressOf(t) { return Math.min(data.stats[t.stat] || 0, t.goal); }

  function check() {
    const fresh = [];
    for (const t of cfg.list) if (!data.got[t.id] && (data.stats[t.stat] || 0) >= t.goal) { data.got[t.id] = today(); fresh.push(t); }
    if (fresh.length) { write(KEY(), data); fresh.forEach((t, i) => setTimeout(() => toast(t), i * 4200)); }
    updateButton();
  }
  function set(stat, v) { if (!cfg) return; if (v > (data.stats[stat] || 0)) { data.stats[stat] = v; write(KEY(), data); check(); } }
  function add(stat, n = 1) { if (!cfg) return; data.stats[stat] = (data.stats[stat] || 0) + n; write(KEY(), data); check(); }

  function updateButton() {
    if (!cfg || !cfg.button) return;
    const n = Object.keys(data.got).length;
    cfg.button.title = S.count(n, cfg.list.length);
    cfg.button.setAttribute('aria-label', S.trophies);
  }

  function toast(t) {
    css();
    const el = document.createElement('div'); el.className = 'tz-toast';
    el.innerHTML = `<div class="tz-ic" style="border-color:${TIER_COLOR[t.tier]};background:#2a2f45">${t.icon}</div><div><b>${esc(S.unlocked)}</b>${esc(trophyText(t))}</div><button class="tz-btn sm main">${esc(S.share)}</button>`;
    el.querySelector('button').onclick = () => { el.remove(); share(t); };
    document.body.appendChild(el);
    try { if (navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate([30, 40, 30]); } catch (e) {}
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 400); }, 4000);
  }

  // ---------- Perfil ----------
  function editProfile(then) {
    css();
    let av = (profile && profile.avatar) || AVATARS[0];
    const o = overlay(`<h2>${esc(profile ? S.profile : S.create)}</h2>
      <label>${esc(S.name)}</label><input class="tz-in" id="tzName" maxlength="20" placeholder="${esc(S.namePh)}" value="${esc(profile ? profile.name : '')}">
      <label>${esc(S.avatar)}</label><div class="tz-avs" style="margin-top:6px">${AVATARS.map(a => `<button data-a="${a}" class="${a === av ? 'on' : ''}">${a}</button>`).join('')}</div>
      <div class="tz-row"><button class="tz-btn" id="tzCancel">${esc(S.cancel)}</button><button class="tz-btn main" id="tzSave">${esc(S.save)}</button></div>`);
    o.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { av = b.dataset.a; o.querySelectorAll('[data-a]').forEach(x => x.classList.toggle('on', x === b)); });
    o.querySelector('#tzCancel').onclick = () => o.remove();
    o.querySelector('#tzSave').onclick = () => {
      const name = o.querySelector('#tzName').value.trim().slice(0, 20);
      if (!name) { o.querySelector('#tzName').focus(); return; }
      profile = Object.assign({ since: today() }, profile, { name, avatar: av });
      write('profile', profile); o.remove(); then && then();
    };
    setTimeout(() => o.querySelector('#tzName').focus(), 50);
  }

  // ---------- Vitrina de trofeos ----------
  function open() {
    css();
    if (!profile) return editProfile(open);
    const got = Object.keys(data.got).length;
    const o = overlay(`<h2>🏆 ${esc(S.trophies)} · ${esc(cfg.title)}</h2>
      <div class="tz-head"><div class="tz-av">${profile.avatar}</div><div style="flex:1;min-width:0"><b>${esc(profile.name)}</b><small>${esc(S.count(got, cfg.list.length))} · ${esc(S.since(fmtDate(profile.since)))}</small></div><button class="tz-btn sm" id="tzEdit">${esc(S.edit)}</button></div>
      ${cfg.list.map(t => {
        const ok = !!data.got[t.id], p = progressOf(t);
        return `<div class="tz-item ${ok ? '' : 'lock'}"><div class="tz-ic" style="border-color:${TIER_COLOR[t.tier]}">${t.icon}</div>
          <div class="tz-tx"><b>${esc(trophyText(t))}</b><small>${esc(S.tiers[t.tier])}${ok ? ' · ' + esc(fmtDate(data.got[t.id])) : ` · ${p} / ${t.goal}`}</small>${ok ? '' : `<div class="tz-bar"><i style="width:${p / t.goal * 100}%"></i></div>`}</div>
          ${ok ? `<button class="tz-btn sm main" data-share="${t.id}">${esc(S.share)}</button>` : ''}</div>`;
      }).join('')}
      <div class="tz-row"><button class="tz-btn" id="tzClose">${esc(S.close)}</button></div>`);
    o.querySelector('#tzClose').onclick = () => o.remove();
    o.querySelector('#tzEdit').onclick = () => { o.remove(); editProfile(open); };
    o.querySelectorAll('[data-share]').forEach(b => b.onclick = () => share(cfg.list.find(t => t.id === b.dataset.share)));
  }

  // ---------- Compartir ----------
  function shareUrl() { return window.PORTAL_BUILD ? '' : location.origin + location.pathname; }

  function card(t) {
    const c = document.createElement('canvas'); c.width = c.height = 1080;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 1080); g.addColorStop(0, cfg.color); g.addColorStop(1, '#0d0f1c');
    x.fillStyle = g; x.fillRect(0, 0, 1080, 1080);
    x.textAlign = 'center'; x.fillStyle = '#fff';
    x.font = '800 76px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; x.fillText(cfg.title, 540, 140);
    x.font = '700 44px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; x.fillStyle = TIER_COLOR[t.tier]; x.fillText(`🏆 ${S.tiers[t.tier]}`, 540, 215);
    x.beginPath(); x.arc(540, 450, 190, 0, Math.PI * 2); x.fillStyle = 'rgba(255,255,255,.1)'; x.fill();
    x.lineWidth = 18; x.strokeStyle = TIER_COLOR[t.tier]; x.stroke();
    x.font = '200px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.textBaseline = 'middle'; x.fillStyle = '#fff'; x.fillText(t.icon, 540, 460);
    x.textBaseline = 'alphabetic';
    // Texto del trofeo, en varias líneas si hace falta
    x.font = '800 62px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; x.fillStyle = '#fff';
    const words = trophyText(t).split(' '), lines = []; let line = '';
    for (const w of words) { const test = line ? line + ' ' + w : w; if (x.measureText(test).width > 900 && line) { lines.push(line); line = w; } else line = test; }
    lines.push(line);
    lines.slice(0, 3).forEach((l, i) => x.fillText(l, 540, 750 + i * 74));
    x.font = '600 46px system-ui,"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; x.fillStyle = '#d7dcf0';
    x.fillText(`${profile ? profile.avatar + ' ' + profile.name : S.player} · ${fmtDate(data.got[t.id] || today())}`, 540, 750 + Math.min(lines.length, 3) * 74 + 40);
    x.font = '700 40px system-ui,-apple-system,Segoe UI,Roboto,sans-serif'; x.fillStyle = '#ffc83d';
    const u = shareUrl(); x.fillText(u ? u.replace(/^https?:\/\//, '') : S.playAt(cfg.title), 540, 1030);
    return c;
  }

  async function share(t) {
    if (!t) return;
    const text = S.shareText(cfg.title, trophyText(t)), url = shareUrl();
    const full = url ? `${text} ${url}` : text;
    const c = card(t);
    const blob = await new Promise(r => c.toBlob(r, 'image/png'));
    const file = blob && typeof File === 'function' ? new File([blob], `${cfg.game}-trophy.png`, { type: 'image/png' }) : null;
    try {
      if (file && navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: cfg.title, text: full }); return; }
      if (navigator.share) { await navigator.share(url ? { title: cfg.title, text, url } : { title: cfg.title, text }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    shareSheet(t, text, url, c);
  }

  // Si el teléfono no tiene el menú de compartir: botones de redes, copiar y guardar imagen
  function shareSheet(t, text, url, c) {
    css();
    const enc = encodeURIComponent, full = url ? `${text} ${url}` : text;
    const nets = [['WhatsApp', `https://wa.me/?text=${enc(full)}`], ['X', `https://x.com/intent/post?text=${enc(text)}${url ? `&url=${enc(url)}` : ''}`]];
    if (url) nets.push(['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`], ['Telegram', `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`]);
    const o = overlay(`<div class="tz-share"><h2>${esc(S.shareTitle)}</h2><img alt="" src="${c.toDataURL('image/png')}">
      <div class="tz-row">${nets.map(([n, h]) => `<a class="tz-btn" style="text-align:center;text-decoration:none" target="_blank" rel="noopener" href="${h}">${n}</a>`).join('')}</div>
      <div class="tz-row"><button class="tz-btn" id="tzCopy">${esc(S.copy)}</button><button class="tz-btn" id="tzDl">${esc(S.download)}</button></div>
      <div class="tz-row"><button class="tz-btn" id="tzClose">${esc(S.close)}</button></div></div>`);
    o.querySelector('#tzClose').onclick = () => o.remove();
    o.querySelector('#tzCopy').onclick = async e => { try { await navigator.clipboard.writeText(full); e.target.textContent = S.copied; } catch (err) {} };
    o.querySelector('#tzDl').onclick = () => { const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = `${cfg.game}-trophy.png`; a.click(); };
  }

  const TROPHY_SVG = '<svg viewBox="0 0 24 24" width="20" height="20" style="vertical-align:middle" aria-hidden="true"><path d="M7 3h10v5a5 5 0 0 1-10 0z" fill="currentColor"/><path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" stroke="currentColor" stroke-width="1.8" fill="none"/><rect x="11" y="12" width="2" height="5" fill="currentColor"/><rect x="7.5" y="17" width="9" height="3" rx="1" fill="currentColor"/></svg>';
  function init(c) {
    cfg = c; data = read(KEY(), { stats: {}, got: {}, days: [] });
    data.days = data.days || [];
    profile = read('profile', null);
    if (!data.days.includes(today())) { data.days.push(today()); data.days = data.days.slice(-400); }
    data.stats.days = data.days.length;
    write(KEY(), data);
    css();
    if (c.button) { c.button.innerHTML = TROPHY_SVG; c.button.addEventListener('click', e => { e.stopPropagation(); open(); }); }
    else if (c.floating) { const b = document.createElement('button'); b.className = 'tz-fab'; document.body.appendChild(b); c.button = b; b.innerHTML = TROPHY_SVG; b.addEventListener('click', e => { e.stopPropagation(); open(); }); }
    setTimeout(check, 600);
  }

  window.Trophies = { init, set, add, open, share, editProfile, get data() { return data; }, get profile() { return profile; }, strings: S, all: L };
})();
