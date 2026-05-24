// ── Storage Keys ─────────────────────────────────────────────────────────────
const CONTENT_KEY    = 'ka_site_content';
const CATEGORIES_KEY = 'ka_categories';
const MOTOR_KEY      = 'ka_motor_types';

// ── Defaults ─────────────────────────────────────────────────────────────────
export const defaultSiteContent = {
  navbar: {
    brandName:         'KronikArıza',
    addBtnText:        'Arıza Ekle',
    searchPlaceholder: 'Marka, model veya arıza ara…',
    loginText:         'Giriş Yap',
    registerText:      'Üye Ol',
    navLinks: {
      home:   'Arıza İlanları',
      brands: 'Markalar',
      uzman:  'Usta Yorumları',
      masraf: 'Masraf Rehberi',
    },
  },
  home: {
    filterTitle:   'Arama Kriterleri',
    filterBtnText: 'Filtrele',
    sortLabel:     'Sırala:',
    resultsText:   'arıza kaydı listeleniyor',
    emptyTitle:    'Sonuç bulunamadı',
    emptyDesc:     'Arama veya filtre kriterlerinizi değiştirmeyi deneyin.',
  },
  addModal: {
    title:     'Yeni Arıza Ekle',
    submitBtn: 'Arızayı Ekle',
    cancelBtn: 'İptal',
  },
  markalar: {
    heroBadge:   '🏭 Araç Markaları',
    heroTitle:   'Tüm Markalar',
    heroSub:     "Türkiye'de en yaygın araç markalarına ait kronik arıza veritabanı",
    statBrands:  'Marka',
    statFaults:  'Arıza Kaydı',
    statReports: 'Toplam Doğrulama',
  },
  uzman: {
    heroBadge:    '🔍 Topluluk Doğrulaması',
    heroTitle:    'En Çok Doğrulanan Arızalar',
    heroSub:      'Binlerce araç sahibi tarafından raporlanmış ve doğrulanmış kronik arızalar',
    statReports:  'Toplam Doğrulama',
    statFaults:   'Kayıtlı Arıza',
    statHighRisk: 'Yüksek Riskli',
  },
  masraf: {
    heroBadge: '💰 Maliyet Analizi',
    heroTitle: 'Masraf Rehberi',
    heroSub:   'Araç arızalarının tahmini onarım maliyetleri ve maliyet analizi',
    statAvg:   'Ortalama Masraf',
    statMax:   'En Yüksek',
    statFaults:'Arıza Kaydı',
    tiers: [
      { label: '🔴 Pahalı Onarımlar',  sub: '₺30.000 ve üzeri',   min: 30000, max: null  },
      { label: '🟠 Orta Masraflı',      sub: '₺10.000 – ₺30.000', min: 10000, max: 30000 },
      { label: '🟢 Ekonomik Onarımlar', sub: '₺10.000 altı',       min: 0,     max: 10000 },
    ],
  },
};

export const defaultCategories = ['Motor', 'Şanzıman', 'Egzoz', 'Soğutma', 'Elektronik', 'Süspansiyon', 'Diğer'];
export const defaultMotorTypes = ['Benzin', 'Dizel', 'Hibrit', 'Elektrik', 'LPG'];

// ── Deep Merge ────────────────────────────────────────────────────────────────
function deepMerge(defaults, overrides) {
  const result = { ...defaults };
  Object.keys(overrides || {}).forEach(key => {
    if (
      overrides[key] !== null &&
      typeof overrides[key] === 'object' && !Array.isArray(overrides[key]) &&
      defaults[key] !== null &&
      typeof defaults[key] === 'object' && !Array.isArray(defaults[key])
    ) {
      result[key] = deepMerge(defaults[key], overrides[key]);
    } else {
      result[key] = overrides[key];
    }
  });
  return result;
}

// ── Site Content ─────────────────────────────────────────────────────────────
export function loadSiteContent() {
  try {
    const stored = JSON.parse(localStorage.getItem(CONTENT_KEY));
    if (!stored) return defaultSiteContent;
    return deepMerge(defaultSiteContent, stored);
  } catch { return defaultSiteContent; }
}

export function saveSiteContent(data) {
  localStorage.setItem(CONTENT_KEY, JSON.stringify(data));
}

// ── Categories ────────────────────────────────────────────────────────────────
export function loadCategories() {
  try { return JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || defaultCategories; }
  catch { return defaultCategories; }
}

export function saveCategories(data) {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(data));
}

// ── Motor Types ───────────────────────────────────────────────────────────────
export function loadMotorTypes() {
  try { return JSON.parse(localStorage.getItem(MOTOR_KEY)) || defaultMotorTypes; }
  catch { return defaultMotorTypes; }
}

export function saveMotorTypes(data) {
  localStorage.setItem(MOTOR_KEY, JSON.stringify(data));
}
