// Textos de Block Burst en 14 idiomas. Lo que falte en un idioma se toma del inglés.
window.STRINGS = {
  en: { score: 'Score', best: 'Best', over: 'No space left', revive: 'Continue', again: 'Play again', ad: 'ad', bestTxt: b => `Best: ${b}`, newBest: 'New best!', combo: 'Combo', great: ['Good!', 'Great!', 'Amazing!', 'Unreal!'] },
  es: { score: 'Puntos', best: 'Récord', over: 'Sin espacio', revive: 'Continuar', again: 'Jugar de nuevo', ad: 'anuncio', bestTxt: b => `Récord: ${b}`, newBest: '¡Nuevo récord!', combo: 'Combo', great: ['¡Bien!', '¡Genial!', '¡Increíble!', '¡Brutal!'] },
  pt: { score: 'Pontos', best: 'Recorde', over: 'Sem espaço', revive: 'Continuar', again: 'Jogar de novo', ad: 'anúncio', bestTxt: b => `Recorde: ${b}`, newBest: 'Novo recorde!', combo: 'Combo', great: ['Boa!', 'Ótimo!', 'Incrível!', 'Insano!'] },
  fr: { score: 'Score', best: 'Record', over: 'Plus de place', revive: 'Continuer', again: 'Rejouer', ad: 'pub', bestTxt: b => `Record : ${b}`, newBest: 'Nouveau record !', combo: 'Combo', great: ['Bien !', 'Super !', 'Génial !', 'Incroyable !'] },
  de: { score: 'Punkte', best: 'Rekord', over: 'Kein Platz mehr', revive: 'Weiterspielen', again: 'Nochmal', ad: 'Werbung', bestTxt: b => `Rekord: ${b}`, newBest: 'Neuer Rekord!', combo: 'Combo', great: ['Gut!', 'Super!', 'Klasse!', 'Wahnsinn!'] },
  it: { score: 'Punti', best: 'Record', over: 'Spazio finito', revive: 'Continua', again: 'Gioca ancora', ad: 'pubblicità', bestTxt: b => `Record: ${b}`, newBest: 'Nuovo record!', combo: 'Combo', great: ['Bene!', 'Ottimo!', 'Fantastico!', 'Pazzesco!'] },
  ru: { score: 'Очки', best: 'Рекорд', over: 'Нет места', revive: 'Продолжить', again: 'Ещё раз', ad: 'реклама', bestTxt: b => `Рекорд: ${b}`, newBest: 'Новый рекорд!', combo: 'Комбо', great: ['Хорошо!', 'Отлично!', 'Супер!', 'Невероятно!'] },
  tr: { score: 'Puan', best: 'Rekor', over: 'Yer kalmadı', revive: 'Devam et', again: 'Tekrar oyna', ad: 'reklam', bestTxt: b => `Rekor: ${b}`, newBest: 'Yeni rekor!', combo: 'Kombo', great: ['İyi!', 'Harika!', 'Muhteşem!', 'İnanılmaz!'] },
  id: { score: 'Skor', best: 'Rekor', over: 'Tidak ada ruang', revive: 'Lanjutkan', again: 'Main lagi', ad: 'iklan', bestTxt: b => `Rekor: ${b}`, newBest: 'Rekor baru!', combo: 'Kombo', great: ['Bagus!', 'Hebat!', 'Luar biasa!', 'Gila!'] },
  hi: { score: 'स्कोर', best: 'रिकॉर्ड', over: 'जगह खत्म', revive: 'जारी रखें', again: 'फिर खेलें', ad: 'विज्ञापन', bestTxt: b => `रिकॉर्ड: ${b}`, newBest: 'नया रिकॉर्ड!', combo: 'कॉम्बो', great: ['बढ़िया!', 'शानदार!', 'कमाल!', 'ज़बरदस्त!'] },
  ar: { score: 'النقاط', best: 'الأفضل', over: 'لا توجد مساحة', revive: 'متابعة', again: 'العب مجددًا', ad: 'إعلان', bestTxt: b => `الأفضل: ${b}`, newBest: 'رقم قياسي جديد!', combo: 'كومبو', great: ['جيد!', 'رائع!', 'مذهل!', 'خرافي!'] },
  ja: { score: 'スコア', best: 'ベスト', over: '置く場所がありません', revive: 'コンティニュー', again: 'もう一度', ad: '広告', bestTxt: b => `ベスト: ${b}`, newBest: '新記録！', combo: 'コンボ', great: ['いいね！', 'すごい！', '最高！', '神！'] },
  ko: { score: '점수', best: '최고', over: '공간이 없어요', revive: '계속하기', again: '다시 하기', ad: '광고', bestTxt: b => `최고: ${b}`, newBest: '신기록!', combo: '콤보', great: ['좋아요!', '멋져요!', '대단해요!', '미쳤다!'] },
  zh: { score: '分数', best: '最高', over: '没有空间了', revive: '继续', again: '再玩一次', ad: '广告', bestTxt: b => `最高分：${b}`, newBest: '新纪录！', combo: '连击', great: ['不错！', '很棒！', '太强了！', '无敌！'] }
};
