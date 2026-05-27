export const ARTICLE_ITEMS = [
  {
    id: 'boya-koruma',
    date: '3 hafta önce',
    image: '/articles/paint-protection.png',
    tag: 'Dikkat Çekenler',
    title: 'Boyadan Öte: Aracınızı Koruyan Seramik Kaplama ve PPF Rehberi',
    excerpt: 'Modern otomobillerde boya koruması sadece parlaklık değil; ikinci el değeri, taş izi riski ve bakım maliyetiyle doğrudan ilgilidir.',
    body: 'PPF, özellikle kaput ve tampon gibi darbeye açık yüzeylerde fiziksel koruma sağlar. Seramik kaplama ise yıkama kolaylığı, parlaklık ve kimyasal dayanım için güçlüdür. İkisini aynı araçta doğru bölgelerde kullanmak, gereksiz masrafı azaltır.',
  },
  {
    id: 'filo-guvenligi',
    date: '4 hafta önce',
    image: '/articles/fleet-safety.png',
    tag: 'Dikkat Çekenler',
    title: 'Filo Portalı ile İşletmenizde Verimlilik ve Güvenliği Yükseltin',
    excerpt: 'Filo yönetiminde periyodik bakım, sürücü davranışı ve arıza geçmişi tek ekranda izlendiğinde beklenmeyen duruşlar azalır.',
    body: 'Düzenli servis planı, lastik ve fren takibi, araç başına maliyet raporu ve kilometre uyumsuzluğu kontrolleri filo güvenliği için temel sinyallerdir. Küçük uyarılar erken yakalandığında hem operasyon aksaması hem de yüksek onarım faturası düşer.',
  },
  {
    id: 'arac-kontrol',
    date: '16 Nisan 2026',
    image: '/articles/vehicle-check.png',
    tag: 'Rehber',
    title: 'Online Araç Kiralama ve İkinci Elde Kontrol Listesi Neden Önemli?',
    excerpt: 'Kaporta, şasi, kilometre ve servis kaydı kontrol edilmeden yapılan seçimler, düşük görünen fiyatın gerçek maliyetini yükseltebilir.',
    body: 'Araç tesliminde boya ölçümü, lastik diş derinliği, cam ve far durumu, hata kodu taraması ve ekspertiz notları birlikte değerlendirilmelidir. Fotoğraflı kayıt tutmak, sonradan oluşabilecek anlaşmazlıkların önüne geçer.',
  },
];

export default function ArticlesPage({ articles = ARTICLE_ITEMS, adminMode = false, onNewArticle, onEditArticle }) {
  const visibleArticles = Array.isArray(articles) && articles.length ? articles : ARTICLE_ITEMS;

  return (
    <div className="page-view articles-page">
      <header className="articles-head">
        <div>
          <span className="articles-eyebrow">KronikArıza Makaleleri</span>
          <h1>Bakım, kontrol ve satın alma rehberleri</h1>
        </div>
        {adminMode && (
          <button type="button" className="btn-submit articles-admin-new" onClick={onNewArticle}>
            + Yeni makale
          </button>
        )}
      </header>

      <div className="articles-list">
        {visibleArticles.map(article => (
          <article id={article.id} className="article-row" key={article.id}>
            <div className="article-thumb-wrap">
              <img className="article-thumb" src={article.image} alt="" loading="lazy" />
              <span className="article-tag">{article.tag}</span>
            </div>
            <div className="article-copy">
              {adminMode && (
                <button type="button" className="btn-cancel btn-sm article-edit-btn" onClick={() => onEditArticle(article)}>
                  Makaleyi düzenle
                </button>
              )}
              <div className="article-date">
                <span className="article-date-icon" aria-hidden="true">◷</span>
                {article.date}
              </div>
              <h2>{article.title}</h2>
              <p>{article.excerpt}</p>
              <details className="article-readmore">
                <summary>Devamını Oku »</summary>
                <div className="article-more">{article.body}</div>
              </details>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
