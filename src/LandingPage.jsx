import { useState, useMemo } from 'react';
import { Editable } from './liveEdit.jsx';
import { getFaultDateLabel } from './dateUtils.js';
import { popularModelTags } from './popularModels.js';

export default function LandingPage({
  data,
  models,
  onBrandSelect,
  onModelClick,
  onFaultClick,
  onSearch,
  onExploreAll,
  onSuggestFault,
  content,
  activityMap = {},
}) {
  const [searchVal, setSearchVal] = useState('');
  const lp = content?.landing || {};

  const brandCount = useMemo(() => [...new Set(data.map(f => f.brand))].length, [data]);
  const totalReports = useMemo(() => data.reduce((s, f) => s + f.reportCount, 0), [data]);
  const faultCount = data.length;

  const popularBrands = [
    { name: 'Volkswagen', abbr: 'VW',   color: '#1E3A8A' },
    { name: 'BMW',        abbr: 'BMW',  color: '#0052CC' },
    { name: 'Mercedes',   abbr: 'MB',   color: '#1A1A1A' },
    { name: 'Audi',       abbr: 'AUDI', color: '#C41E3A' },
    { name: 'Renault',    abbr: 'REN',  color: '#EFCB00', dark: true },
    { name: 'Ford',       abbr: 'FORD', color: '#003476' },
    { name: 'Toyota',     abbr: 'TOY',  color: '#EB0A1E' },
    { name: 'Fiat',       abbr: 'FIAT', color: '#8B0000' },
  ];

  const brandStats = useMemo(() => {
    const s = {};
    data.forEach(f => { s[f.brand] = (s[f.brand] || 0) + 1; });
    return s;
  }, [data]);

  const topFaults = useMemo(() =>
    [...data].sort((a, b) => b.reportCount - a.reportCount).slice(0, 5),
  [data]);

  const recentFaults = useMemo(() =>
    [...data]
      .sort((a, b) => {
        const aTime = activityMap[a.id]?.timestamp || 0;
        const bTime = activityMap[b.id]?.timestamp || 0;
        return bTime - aTime || b.reportCount - a.reportCount;
      })
      .slice(0, 8),
  [data, activityMap]);

  const fmt = (n) => Number(n).toLocaleString('tr-TR');

  const submitSearch = (e) => {
    e?.preventDefault();
    const q = searchVal.trim();
    if (q) {
      onSearch(q);
    } else {
      onExploreAll();
    }
  };

  const RISK_COLOR = {
    'YÜKSEK': { bg: 'var(--red-bg)', text: 'var(--red-text)', dot: 'var(--red)' },
    'ORTA':   { bg: 'var(--orange-bg)', text: 'var(--orange-text)', dot: 'var(--orange)' },
    'DÜŞÜK':  { bg: 'var(--green-bg)', text: 'var(--green-text)', dot: 'var(--green)' },
  };

  const CAT_ICON = { Motor:'🔧', Şanzıman:'⚙️', Egzoz:'💨', Süspansiyon:'🔩', Elektrik:'⚡', Fren:'🛑' };

  return (
    <div className="lp-root">

      {/* ── FORUM HEADER BANNER ── */}
      <div className="lp-banner">
        <div className="lp-banner-inner">
          <div className="lp-banner-left">
            <div className="lp-banner-brand">
              <h1 className="lp-banner-title">
                <Editable value={lp.heroTitle || 'Kronik Arıza Forumu'} path={['landing','heroTitle']} />
              </h1>
              <p className="lp-banner-sub">
                <Editable value={lp.heroSubtitle || 'Türkiye\'nin en büyük araç kronik arıza veritabanı — sürücüler tarafından, sürücüler için.'} path={['landing','heroSubtitle']} multiline />
              </p>
            </div>
          </div>

          {/* Stats bar */}
          <div className="lp-banner-stats">
            <div className="lp-banner-stat">
              <span className="lp-bs-num">{brandCount}</span>
              <span className="lp-bs-label">Marka</span>
            </div>
            <div className="lp-banner-stat-sep" />
            <div className="lp-banner-stat">
              <span className="lp-bs-num">{faultCount}</span>
              <span className="lp-bs-label">Arıza Kaydı</span>
            </div>
            <div className="lp-banner-stat-sep" />
            <div className="lp-banner-stat">
              <span className="lp-bs-num">{fmt(totalReports)}</span>
              <span className="lp-bs-label">Doğrulama</span>
            </div>
          </div>
        </div>

        {/* Search bar inside banner */}
        <div className="lp-banner-search-wrap">
          <form className="lp-banner-search" onSubmit={submitSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Marka, model veya arıza arayın… (ör: TSI zincir, DSG sarsıntı)"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
            />
            <button type="submit" className="lp-search-btn">Ara</button>
          </form>
          <div className="lp-quick-tags">
            <span className="lp-qt-label">Popüler:</span>
            {popularModelTags.map(q => (
              <button key={q} type="button" className="lp-qt-tag" onClick={() => { setSearchVal(q); onSearch(q); }}>{q}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN FORUM LAYOUT ── */}
      <div className="lp-forum-layout">

        {/* ── LEFT: Forum thread list ── */}
        <div className="lp-forum-main">

          {/* Category bar */}
          <div className="lp-cat-bar">
            <div className="lp-cat-bar-title">📋 Kategoriler</div>
            <div className="lp-cat-pills">
              {['Motor','Şanzıman','Elektrik','Fren','Süspansiyon','Egzoz'].map(cat => {
                const count = data.filter(f => f.category === cat).length;
                return (
                  <button key={cat} type="button" className="lp-cat-pill" onClick={() => { onSearch(cat); }}>
                    <span>{CAT_ICON[cat] || '🔧'}</span>
                    <span>{cat}</span>
                    <span className="lp-cat-pill-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread list header */}
          <div className="lp-thread-board">
            <div className="lp-thread-board-header">
              <div className="lp-tbh-left">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                <span>Son Arıza Konuları</span>
              </div>
              <button type="button" className="lp-see-all-btn" onClick={onExploreAll}>
                Tümünü Gör →
              </button>
            </div>

            {/* Threads */}
            <div className="lp-threads">
              {recentFaults.map((f, i) => {
                const rc = RISK_COLOR[f.risk] || RISK_COLOR['ORTA'];
                const icon = CAT_ICON[f.category] || '🔧';
                const activity = activityMap[f.id];
                return (
                  <div
                    key={f.id}
                    className="lp-thread-row"
                    onClick={() => onFaultClick && onFaultClick(f)}
                  >
                    {/* Category icon */}
                    <div className="lp-tr-icon">{icon}</div>

                    {/* Main content */}
                    <div className="lp-tr-body">
                      <div className="lp-tr-header">
                        <span
                          className="lp-tr-brand-model"
                          onClick={(e) => { e.stopPropagation(); onModelClick && onModelClick(f.model); }}
                          title="Model detay sayfasına git"
                        >{f.brand} {f.model}</span>
                        <span className="lp-tr-dot">·</span>
                        <span className="lp-tr-title">{f.description || f.fault}</span>
                        <span className="lp-tr-dot">·</span>
                        <span className="lp-tr-activity" title={`Son hareket: ${activity?.exact || getFaultDateLabel(f)}`}>
                          {activity?.fullLabel || `Kayıt: ${getFaultDateLabel(f)}`}
                        </span>
                      </div>
                      <div className="lp-tr-meta">
                        <span className="lp-tr-cat-tag">{f.category}</span>
                        <span className="lp-tr-meta-text">{f.year}</span>
                        <span className="lp-tr-meta-sep">·</span>
                        <span className="lp-tr-meta-text">{f.motorType}</span>
                        <span className="lp-tr-meta-sep">·</span>
                        <span className="lp-tr-meta-text">{f.kmDisplay}</span>
                      </div>
                    </div>

                    {/* Right metrics */}
                    <div className="lp-tr-right">
                      <span
                        className="lp-tr-risk"
                        style={{ background: rc.bg, color: rc.text }}
                      >
                        {f.risk}
                      </span>
                      <div className="lp-tr-metrics">
                        <span className="lp-tr-metric" title="Doğrulayan">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                            <polyline points="22 4 12 14.01 9 11.01"/>
                          </svg>
                          {fmt(f.reportCount)}
                        </span>
                        <span className="lp-tr-metric" title="Masraf">
                          ₺{fmt(f.avgCost)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Load more */}
            <div className="lp-thread-footer">
              <button type="button" className="lp-load-more-btn" onClick={onExploreAll}>
                Tüm {faultCount} arızayı görüntüle →
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="lp-forum-sidebar">

          {/* Top reports */}
          <div className="lp-sidebar-widget">
            <div className="lp-sw-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                <polyline points="17 6 23 6 23 12"/>
              </svg>
              En Çok Doğrulanan
            </div>
            <div className="lp-sw-list">
              {topFaults.map((f, i) => {
                const rc = RISK_COLOR[f.risk] || RISK_COLOR['ORTA'];
                return (
                  <div
                    key={f.id}
                    className="lp-sw-item"
                    onClick={() => onFaultClick && onFaultClick(f)}
                  >
                    <span className="lp-sw-rank">{i + 1}</span>
                    <div className="lp-sw-item-body">
                      <div className="lp-sw-item-title">{f.brand} {f.model}</div>
                      <div className="lp-sw-item-sub">{f.description || f.fault}</div>
                    </div>
                    <div className="lp-sw-item-right">
                      <span className="lp-sw-reports">{fmt(f.reportCount)}</span>
                      <span className="lp-sw-risk" style={{ color: rc.dot }}>●</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Brands widget */}
          <div className="lp-sidebar-widget">
            <div className="lp-sw-header">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <rect x="2" y="3" width="20" height="14" rx="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
              Markalar
            </div>
            <div className="lp-brands-grid">
              {popularBrands.map(b => {
                const count = brandStats[b.name] || 0;
                return (
                  <button
                    key={b.name}
                    type="button"
                    className="lp-brand-btn"
                    onClick={() => onBrandSelect(b.name)}
                  >
                    <div className="lp-brand-circle" style={{ background: b.color, color: b.dark ? '#111' : '#fff' }}>
                      {b.abbr}
                    </div>
                    <span className="lp-brand-name">{b.name}</span>
                    <span className="lp-brand-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA widget */}
          <div className="lp-cta-widget">
            <div className="lp-cta-icon">🔍</div>
            <div className="lp-cta-title">Arıza Bulamadın mı?</div>
            <div className="lp-cta-text">Detaylı filtreler ile {faultCount} arıza kaydı arasında arama yapın.</div>
            <button type="button" className="lp-cta-btn" onClick={onExploreAll}>
              Tüm Veritabanını İncele
            </button>
          </div>

          {/* Suggest fault CTA widget */}
          <div className="lp-cta-widget lp-cta-suggest">
            <div className="lp-cta-icon">📝</div>
            <div className="lp-cta-title">Arıza Bildir</div>
            <div className="lp-cta-text">Kronik bir arıza mı yaşıyorsunuz? Toplulukla paylaşın, veritabanına katkıda bulunun.</div>
            <button type="button" className="lp-cta-btn lp-cta-btn-suggest" onClick={() => onSuggestFault && onSuggestFault()}>
              Arıza Öner
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
