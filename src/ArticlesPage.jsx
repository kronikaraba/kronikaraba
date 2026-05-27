import { defaultArticles } from './articleData.js';

export default function ArticlesPage({
  articles = defaultArticles,
  adminMode = false,
  onNewArticle,
  onEditArticle,
  onDeleteArticle,
  onOpenArticle,
}) {
  const visibleArticles = Array.isArray(articles) && articles.length ? articles : defaultArticles;

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
            <button type="button" className="article-thumb-wrap" onClick={() => onOpenArticle(article)}>
              <img className="article-thumb" src={article.image} alt="" loading="lazy" />
              <span className="article-tag">{article.tag}</span>
            </button>
            <div className="article-copy">
              {adminMode && (
                <div className="article-admin-actions">
                  <button type="button" className="btn-cancel btn-sm article-edit-btn" onClick={() => onEditArticle(article)}>
                    Düzenle
                  </button>
                  <button type="button" className="btn-cancel btn-sm article-delete-btn" onClick={() => onDeleteArticle(article.id)}>
                    Sil
                  </button>
                </div>
              )}
              <div className="article-date">
                <span className="article-date-icon" aria-hidden="true">◷</span>
                {article.date}
              </div>
              <h2>
                <button type="button" className="article-title-link" onClick={() => onOpenArticle(article)}>
                  {article.title}
                </button>
              </h2>
              <p>{article.excerpt}</p>
              <button type="button" className="article-read-btn" onClick={() => onOpenArticle(article)}>
                Devamını Oku »
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ArticleDetailPage({ article, adminMode = false, onBack, onEditArticle, onDeleteArticle }) {
  if (!article) {
    return (
      <div className="page-view article-detail-page">
        <button type="button" className="article-back-btn" onClick={onBack}>← Makalelere dön</button>
        <div className="article-not-found">Makale bulunamadı.</div>
      </div>
    );
  }

  const paragraphs = String(article.body || '')
    .split(/\n{2,}|\r\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  return (
    <div className="page-view article-detail-page">
      <button type="button" className="article-back-btn" onClick={onBack}>← Makalelere dön</button>

      <article className="article-detail">
        <div className="article-detail-hero">
          <img src={article.image} alt="" />
          <span className="article-tag article-detail-tag">{article.tag}</span>
        </div>

        <div className="article-detail-content">
          {adminMode && (
            <div className="article-detail-admin">
              <button type="button" className="btn-submit btn-sm" onClick={() => onEditArticle(article)}>
                Makaleyi düzenle
              </button>
              <button type="button" className="btn-cancel btn-sm article-delete-btn" onClick={() => onDeleteArticle(article.id)}>
                Makaleyi sil
              </button>
            </div>
          )}
          <div className="article-date">
            <span className="article-date-icon" aria-hidden="true">◷</span>
            {article.date}
          </div>
          <h1>{article.title}</h1>
          <p className="article-detail-excerpt">{article.excerpt}</p>
          <div className="article-detail-body">
            {paragraphs.length
              ? paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
              : <p>{article.body}</p>}
          </div>
        </div>
      </article>
    </div>
  );
}
