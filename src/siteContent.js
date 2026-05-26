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

// ── API Helpers ───────────────────────────────────────────────────────────────
const API_BASE = '/api/data';

async function apiLoad(key) {
  try {
    const res = await fetch(`${API_BASE}?key=${key}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function apiSave(key, data) {
  try {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data }),
    });
  } catch (err) {
    console.error(`apiSave(${key}) failed:`, err);
  }
}

// ── Site Content ─────────────────────────────────────────────────────────────
export async function loadSiteContent() {
  const stored = await apiLoad('content');
  if (!stored) return defaultSiteContent;
  return deepMerge(defaultSiteContent, stored);
}

export async function saveSiteContent(data) {
  return apiSave('content', data);
}

// ── Categories ────────────────────────────────────────────────────────────────
export async function loadCategories() {
  const data = await apiLoad('categories');
  return data || defaultCategories;
}

export async function saveCategories(data) {
  return apiSave('categories', data);
}

// ── Motor Types ───────────────────────────────────────────────────────────────
export async function loadMotorTypes() {
  const data = await apiLoad('motorTypes');
  return data || defaultMotorTypes;
}

export async function saveMotorTypes(data) {
  return apiSave('motorTypes', data);
}
