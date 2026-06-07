/**
 * seoUtils.js — KronikAraba SEO Helper
 * Dinamik meta tag, Open Graph ve JSON-LD yönetimi.
 */

const BASE_URL = 'https://kronikaraba.vercel.app';
const SITE_NAME = 'KronikAraba';

/**
 * Meta description ve OG etiketlerini günceller.
 */
export function updateMeta({ title, description, url, type = 'website' }) {
  // Title
  if (title) document.title = title;

  // Description
  setMeta('name', 'description', description || '');

  // OG
  setMeta('property', 'og:title', title || '');
  setMeta('property', 'og:description', description || '');
  setMeta('property', 'og:url', url ? `${BASE_URL}${url}` : BASE_URL);
  setMeta('property', 'og:type', type);

  // Twitter
  setMeta('name', 'twitter:title', title || '');
  setMeta('name', 'twitter:description', description || '');

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url ? `${BASE_URL}${url}` : BASE_URL);
}

function setMeta(attr, name, content) {
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * JSON-LD script'ini DOM'a enjekte eder (önceki varsa kaldırır).
 */
export function injectJsonLd(data) {
  removeJsonLd();
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'jsonld-dynamic';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function removeJsonLd() {
  const existing = document.getElementById('jsonld-dynamic');
  if (existing) existing.remove();
}

const fmt = (n) => Number(n).toLocaleString('tr-TR');

/**
 * Arıza detay sayfası için FAQPage + Product JSON-LD üretir.
 */
export function buildFaultJsonLd(fault) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `${fault.brand} ${fault.model} ${fault.description} belirtileri nelerdir?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: fault.symptoms || `${fault.brand} ${fault.model} modelinde ${fault.description} sorunu yaygın olarak ${fault.kmDisplay} civarında görülmektedir.`,
            },
          },
          {
            '@type': 'Question',
            name: `${fault.brand} ${fault.model} ${fault.description} tamiri ne kadar tutar?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${fault.brand} ${fault.model} için ${fault.description} tamiri tahminen ₺${fmt(fault.costMin)} ile ₺${fmt(fault.costMax)} arasında değişmektedir.`,
            },
          },
          {
            '@type': 'Question',
            name: `${fault.brand} ${fault.model} ${fault.description} için kontrol ipucu nedir?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: fault.checkTip || `${fault.brand} ${fault.model} modelindeki bu arıza için yetkili servis kontrolü önerilir.`,
            },
          },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: fault.brand, item: `${BASE_URL}/markalar` },
          { '@type': 'ListItem', position: 3, name: `${fault.brand} ${fault.model}`, item: `${BASE_URL}/model/${fault.model?.toLowerCase().replace(/\s+/g, '-')}` },
          { '@type': 'ListItem', position: 4, name: fault.description },
        ],
      },
    ],
  };
}

/**
 * Model detay sayfası için Car + ItemList JSON-LD üretir.
 */
export function buildModelJsonLd(model, brand, faults = [], detail = null) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Car',
        name: `${brand} ${model}`,
        brand: { '@type': 'Brand', name: brand },
        description: detail?.blogIntro || `${brand} ${model} kronik arıza kayıtları ve bakım notları.`,
        url: `${BASE_URL}/model/${model?.toLowerCase().replace(/\s+/g, '-')}`,
      },
      {
        '@type': 'ItemList',
        name: `${brand} ${model} Kronik Arızaları`,
        description: `${brand} ${model} modelinde en sık görülen kronik arızalar`,
        numberOfItems: faults.length,
        itemListElement: faults.slice(0, 10).map((f, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: f.description,
          description: `Tahmini masraf: ₺${fmt(f.costMin)} – ₺${fmt(f.costMax)}. Görülme: ${f.kmDisplay}.`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: brand, item: `${BASE_URL}/markalar` },
          { '@type': 'ListItem', position: 3, name: `${brand} ${model}` },
        ],
      },
    ],
  };
}

/**
 * Sayfa bazlı default meta bilgilerini döner.
 */
export function getPageMeta(view) {
  const pages = {
    home: {
      title: 'KronikArıza — Araç Kronik Arıza Veritabanı',
      description: "Türkiye'nin en kapsamlı araç kronik arıza veritabanı. Araç almadan önce kronik arızaları öğrenin. 15+ marka, yüzlerce arıza kaydı.",
      url: '/',
    },
    markalar: {
      title: 'Araç Markaları — Kronik Arıza Veritabanı | KronikAraba',
      description: 'Volkswagen, BMW, Mercedes, Toyota ve daha fazlası. Marka bazında kronik arızaları ve ortalama tamir masraflarını keşfedin.',
      url: '/markalar',
    },
    modeller: {
      title: 'Tüm Modeller — Kronik Arıza Kayıtları | KronikAraba',
      description: 'Yüzlerce araç modeli için kronik arıza kayıtlarına ulaşın. Araç satın almadan önce en yaygın sorunları öğrenin.',
      url: '/modeller',
    },
    uzman: {
      title: 'En Çok Doğrulanan Arızalar — Uzman Görüşleri | KronikAraba',
      description: 'Topluluk tarafından en çok doğrulanmış kronik arızalar. Binlerce kullanıcı deneyimiyle hazırlanmış güvenilir veriler.',
      url: '/uzman-gorusleri',
    },
    masraf: {
      title: 'Masraf Rehberi — Arıza Tamir Maliyetleri | KronikAraba',
      description: 'Araç arızalarının tamir masraflarını karşılaştırın. Yüksek, orta ve düşük masraflı onarımlar için kapsamlı fiyat rehberi.',
      url: '/masraf',
    },
    articles: {
      title: 'Makaleler — Araç Bakım ve Arıza Rehberi | KronikAraba',
      description: 'Araç bakımı, kronik arızalar ve ikinci el araç alım rehberleri. Uzman içerikler ile bilinçli araç sahibi olun.',
      url: '/makaleler',
    },
    arizalar: {
      title: 'Tüm Arızalar — Kronik Arıza Veritabanı | KronikAraba',
      description: 'Tüm araç markalarına ait kronik arıza kayıtlarını filtreleyin. Kategori, risk seviyesi ve masrafa göre arama yapın.',
      url: '/arizalar',
    },
  };
  return pages[view] || pages.home;
}
