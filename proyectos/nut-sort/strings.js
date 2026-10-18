// Textos de Nut Sort en 14 idiomas. Lo que falte en un idioma se toma del inglés.
window.STRINGS = {
  en: {
    undo: 'Undo', ad: 'ad', win: 'Level complete!', next: 'Next', shop: 'Themes',
    close: 'Close', level: n => `Level ${n}`, earned: n => `You earned ${n} 🪙`, noUndo: 'Nothing to undo',
    noCoins: 'Not enough coins', stuck: 'No moves: undo or add a bolt', boltAdded: 'Extra bolt added',
    oneBolt: 'Only one extra bolt per level', buy: p => `${p} 🪙`, owned: 'Use', themes: ['Purple', 'Forest', 'Wood', 'Ocean']
  },
  es: {
    undo: 'Deshacer', ad: 'anuncio', win: '¡Nivel completado!', next: 'Siguiente', shop: 'Temas',
    close: 'Cerrar', level: n => `Nivel ${n}`, earned: n => `Ganaste ${n} 🪙`, noUndo: 'Nada que deshacer',
    noCoins: 'Te faltan monedas', stuck: 'Sin salida: deshaz o añade un tornillo', boltAdded: 'Tornillo extra añadido',
    oneBolt: 'Solo un tornillo extra por nivel', owned: 'Usar', themes: ['Morado', 'Bosque', 'Madera', 'Océano']
  },
  pt: {
    undo: 'Desfazer', ad: 'anúncio', win: 'Nível concluído!', next: 'Próximo', shop: 'Temas',
    close: 'Fechar', level: n => `Nível ${n}`, earned: n => `Você ganhou ${n} 🪙`, noUndo: 'Nada para desfazer',
    noCoins: 'Moedas insuficientes', stuck: 'Sem jogadas: desfaça ou adicione um parafuso', boltAdded: 'Parafuso extra adicionado',
    oneBolt: 'Só um parafuso extra por nível', owned: 'Usar', themes: ['Roxo', 'Floresta', 'Madeira', 'Oceano']
  },
  fr: {
    undo: 'Annuler', ad: 'pub', win: 'Niveau terminé !', next: 'Suivant', shop: 'Thèmes',
    close: 'Fermer', level: n => `Niveau ${n}`, earned: n => `Tu as gagné ${n} 🪙`, noUndo: 'Rien à annuler',
    noCoins: 'Pas assez de pièces', stuck: 'Bloqué : annule ou ajoute une vis', boltAdded: 'Vis supplémentaire ajoutée',
    oneBolt: 'Une seule vis en plus par niveau', owned: 'Utiliser', themes: ['Violet', 'Forêt', 'Bois', 'Océan']
  },
  de: {
    undo: 'Zurück', ad: 'Werbung', win: 'Level geschafft!', next: 'Weiter', shop: 'Designs',
    close: 'Schließen', level: n => `Level ${n}`, earned: n => `Du hast ${n} 🪙 verdient`, noUndo: 'Nichts rückgängig zu machen',
    noCoins: 'Nicht genug Münzen', stuck: 'Keine Züge: zurück oder Schraube hinzufügen', boltAdded: 'Extra-Schraube hinzugefügt',
    oneBolt: 'Nur eine Extra-Schraube pro Level', owned: 'Nutzen', themes: ['Lila', 'Wald', 'Holz', 'Ozean']
  },
  it: {
    undo: 'Annulla', ad: 'pubblicità', win: 'Livello completato!', next: 'Avanti', shop: 'Temi',
    close: 'Chiudi', level: n => `Livello ${n}`, earned: n => `Hai guadagnato ${n} 🪙`, noUndo: 'Niente da annullare',
    noCoins: 'Monete insufficienti', stuck: 'Nessuna mossa: annulla o aggiungi una vite', boltAdded: 'Vite extra aggiunta',
    oneBolt: 'Solo una vite extra per livello', owned: 'Usa', themes: ['Viola', 'Foresta', 'Legno', 'Oceano']
  },
  ru: {
    undo: 'Отменить', ad: 'реклама', win: 'Уровень пройден!', next: 'Дальше', shop: 'Темы',
    close: 'Закрыть', level: n => `Уровень ${n}`, earned: n => `Вы получили ${n} 🪙`, noUndo: 'Нечего отменять',
    noCoins: 'Не хватает монет', stuck: 'Нет ходов: отмените или добавьте болт', boltAdded: 'Добавлен лишний болт',
    oneBolt: 'Только один лишний болт за уровень', owned: 'Выбрать', themes: ['Фиолетовая', 'Лес', 'Дерево', 'Океан']
  },
  tr: {
    undo: 'Geri al', ad: 'reklam', win: 'Bölüm tamamlandı!', next: 'Sonraki', shop: 'Temalar',
    close: 'Kapat', level: n => `Bölüm ${n}`, earned: n => `${n} 🪙 kazandın`, noUndo: 'Geri alınacak hamle yok',
    noCoins: 'Yeterli jeton yok', stuck: 'Hamle kalmadı: geri al veya vida ekle', boltAdded: 'Ekstra vida eklendi',
    oneBolt: 'Bölüm başına yalnızca bir ekstra vida', owned: 'Kullan', themes: ['Mor', 'Orman', 'Ahşap', 'Okyanus']
  },
  id: {
    undo: 'Urungkan', ad: 'iklan', win: 'Level selesai!', next: 'Lanjut', shop: 'Tema',
    close: 'Tutup', level: n => `Level ${n}`, earned: n => `Kamu dapat ${n} 🪙`, noUndo: 'Tidak ada yang bisa diurungkan',
    noCoins: 'Koin tidak cukup', stuck: 'Buntu: urungkan atau tambah baut', boltAdded: 'Baut tambahan ditambahkan',
    oneBolt: 'Hanya satu baut tambahan per level', owned: 'Pakai', themes: ['Ungu', 'Hutan', 'Kayu', 'Samudra']
  },
  hi: {
    undo: 'वापस लें', ad: 'विज्ञापन', win: 'लेवल पूरा!', next: 'आगे', shop: 'थीम',
    close: 'बंद करें', level: n => `लेवल ${n}`, earned: n => `आपने ${n} 🪙 कमाए`, noUndo: 'वापस लेने को कुछ नहीं',
    noCoins: 'सिक्के कम हैं', stuck: 'कोई चाल नहीं: वापस लें या बोल्ट जोड़ें', boltAdded: 'अतिरिक्त बोल्ट जोड़ा गया',
    oneBolt: 'हर लेवल में सिर्फ़ एक अतिरिक्त बोल्ट', owned: 'इस्तेमाल करें', themes: ['बैंगनी', 'जंगल', 'लकड़ी', 'समुद्र']
  },
  ar: {
    undo: 'تراجع', ad: 'إعلان', win: 'اكتمل المستوى!', next: 'التالي', shop: 'السمات',
    close: 'إغلاق', level: n => `المستوى ${n}`, earned: n => `ربحت ${n} 🪙`, noUndo: 'لا يوجد ما يمكن التراجع عنه',
    noCoins: 'العملات غير كافية', stuck: 'لا حركات: تراجع أو أضف برغيًا', boltAdded: 'تمت إضافة برغي إضافي',
    oneBolt: 'برغي إضافي واحد فقط لكل مستوى', owned: 'استخدام', themes: ['بنفسجي', 'غابة', 'خشب', 'محيط']
  },
  ja: {
    undo: '戻す', ad: '広告', win: 'レベルクリア！', next: '次へ', shop: 'テーマ',
    close: '閉じる', level: n => `レベル ${n}`, earned: n => `${n} 🪙 獲得！`, noUndo: '戻せる手がありません',
    noCoins: 'コインが足りません', stuck: '手詰まり：戻すかボルトを追加', boltAdded: 'ボルトを追加しました',
    oneBolt: '追加ボルトは1レベルに1本まで', owned: '使う', themes: ['パープル', 'フォレスト', 'ウッド', 'オーシャン']
  },
  ko: {
    undo: '되돌리기', ad: '광고', win: '레벨 클리어!', next: '다음', shop: '테마',
    close: '닫기', level: n => `레벨 ${n}`, earned: n => `${n} 🪙 획득!`, noUndo: '되돌릴 수가 없어요',
    noCoins: '코인이 부족해요', stuck: '막혔어요: 되돌리거나 볼트를 추가하세요', boltAdded: '볼트가 추가됐어요',
    oneBolt: '추가 볼트는 레벨당 1개만', owned: '사용', themes: ['퍼플', '숲', '나무', '바다']
  },
  zh: {
    undo: '撤销', ad: '广告', win: '过关！', next: '下一关', shop: '主题',
    close: '关闭', level: n => `第 ${n} 关`, earned: n => `获得 ${n} 🪙`, noUndo: '没有可撤销的步骤',
    noCoins: '金币不足', stuck: '无路可走：撤销或添加螺栓', boltAdded: '已添加额外螺栓',
    oneBolt: '每关只能添加一个额外螺栓', owned: '使用', themes: ['紫色', '森林', '木纹', '海洋']
  }
};
