export default function Footer({ onNavAction }) {
  const year = new Date().getFullYear();

  const handleLink = (e, action) => {
    e.preventDefault();
    onNavAction && onNavAction(action);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* Brand column */}
        <div className="footer-brand">
          <div className="footer-logo">
            <img src="/brand/kronikaraba-logo.png" alt="KronikAraba" className="footer-logo-img" />
          </div>
          <p className="footer-desc">
            Türkiye'nin en kapsamlı araç kronik arıza veritabanı. Araç almadan önce kronik arızaları öğrenin, bilinçli kararlar verin.
          </p>
          <div className="footer-socials">
            <a href="https://twitter.com/kronikaraba" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
              </svg>
            </a>
            <a href="https://instagram.com/kronikaraba" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="https://youtube.com/@kronikaraba" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="footer-social-link">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-col">
          <h4 className="footer-col-title">Hızlı Erişim</h4>
          <ul className="footer-links">
            <li><a href="/" onClick={(e) => handleLink(e, 'reset')}>Ana Sayfa</a></li>
            <li><a href="/modeller" onClick={(e) => handleLink(e, 'modeller')}>Tüm Modeller</a></li>
            <li><a href="/makaleler" onClick={(e) => handleLink(e, 'articles')}>Makaleler</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Araçlar</h4>
          <ul className="footer-links">
            <li><a href="/masraf" onClick={(e) => handleLink(e, 'masraf')}>Masraf Rehberi</a></li>
            <li><a href="/arizalar" onClick={(e) => handleLink(e, 'explore')}>Tüm Arızalar</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Bilgi</h4>
          <ul className="footer-links">
            <li><span className="footer-info-item">📧 info@kronikaraba.com</span></li>
            <li><span className="footer-info-item">📍 Türkiye</span></li>
            <li><span className="footer-info-item">🔒 Verileriniz güvende</span></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} KronikAraba — Tüm hakları saklıdır.</span>
        <span className="footer-bottom-sep">|</span>
        <span>Veriler topluluk katkılarıyla oluşturulmuştur.</span>
      </div>
    </footer>
  );
}
