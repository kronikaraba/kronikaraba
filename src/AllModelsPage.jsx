import { useState, useMemo } from 'react';
import { Editable } from './liveEdit.jsx';
import { getDateTimeMs } from './dateUtils.js';

const fmt = (n) => Number(n).toLocaleString('tr-TR');

const MODEL_SORT_OPTIONS = [
  { value: 'newest-desc', label: 'En Yeni' },
  { value: 'reports-desc', label: 'En Çok Doğrulanan' },
  { value: 'faults-desc', label: 'En Çok Arıza' },
  { value: 'cost-desc', label: 'En Yüksek Masraf' },
  { value: 'brand-asc', label: 'Marka (A-Z)' },
];

const BRAND_COLORS = {
  'Volkswagen': '#1E3A8A', 'BMW': '#0052CC', 'Mercedes': '#1A1A1A',
  'Audi': '#C41E3A', 'Renault': '#EFCB00', 'Ford': '#003476',
  'Toyota': '#EB0A1E', 'Fiat': '#8B0000', 'Hyundai': '#003087',
  'Peugeot': '#003087', 'Dacia': '#1F2F5A', 'Opel': '#F7D117',
  'Citroen': '#AC1926', 'Honda': '#CC0000', 'Nissan': '#C3002F',
  'Kia': '#05141F', 'Volvo': '#003057', 'Skoda': '#4BA82E',
  'MINI': '#000000', 'Mazda': '#910000', 'BYD': '#1B1B1B',
  'Tesla': '#CC0000', 'Togg': '#1E3A5F', 'MG': '#D00000',
  'Chery': '#DA251D', 'Suzuki': '#004D99', 'Mitsubishi': '#CC0033',
  'Subaru': '#013C74', 'Alfa Romeo': '#981E32', 'Jeep': '#1D4D2B',
};

export default function AllModelsPage({ data, models, onModelClick, adminMode, onAddFault, onNewModel, onDeleteModel, content }) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest-desc');
  const mc = content?.modeller || {};

  // Build model stats from fault data and stored model pages.
  const modelStats = useMemo(() => {
    const stats = {};
    data.forEach(f => {
      const key = f.model;
      if (!stats[key]) {
        stats[key] = {
          model: f.model,
          brand: f.brand,
          faultCount: 0,
          totalReports: 0,
          totalCost: 0,
          riskHigh: 0,
          riskMedium: 0,
          riskLow: 0,
          categories: new Set(),
          createdAtMs: 0,
        };
      }
      const recordTime = getDateTimeMs(f.createdAt || f.publishedAt || f.suggestedAt || f.updatedAt, f.id);
      stats[key].createdAtMs = Math.max(stats[key].createdAtMs || 0, recordTime);
      stats[key].faultCount++;
      stats[key].totalReports += f.reportCount;
      stats[key].totalCost += f.avgCost;
      if (f.risk === 'YÜKSEK') stats[key].riskHigh++;
      else if (f.risk === 'ORTA') stats[key].riskMedium++;
      else stats[key].riskLow++;
      stats[key].categories.add(f.category);
    });
    // Calculate averages
    Object.keys(stats).forEach(k => {
      stats[k].avgCost = Math.round(stats[k].totalCost / stats[k].faultCount);
      stats[k].categories = [...stats[k].categories];
    });

    Object.entries(models || {}).forEach(([modelName, detail]) => {
      const modelTime = getDateTimeMs(detail?.createdAt || detail?.updatedAt);
      if (!stats[modelName]) {
        stats[modelName] = {
          model: modelName,
          brand: detail?.brand || String(detail?.heroTitle || '').replace(modelName, '').trim() || 'Diğer',
          faultCount: 0,
          totalReports: 0,
          totalCost: 0,
          avgCost: 0,
          riskHigh: 0,
          riskMedium: 0,
          riskLow: 0,
          categories: [],
          hasModelPage: true,
          createdAtMs: modelTime,
        };
      } else {
        stats[modelName].brand = detail?.brand || stats[modelName].brand;
        stats[modelName].hasModelPage = true;
        stats[modelName].createdAtMs = Math.max(stats[modelName].createdAtMs || 0, modelTime);
      }
    });

    return stats;
  }, [data, models]);

  // Get unique brands sorted by total reports
  const brands = useMemo(() => {
    const brandMap = {};
    data.forEach(f => {
      if (!brandMap[f.brand]) brandMap[f.brand] = { reports: 0, models: new Set() };
      brandMap[f.brand].reports += f.reportCount;
      brandMap[f.brand].models.add(f.model);
    });
    Object.entries(models || {}).forEach(([modelName, detail]) => {
      const brand = detail?.brand || String(detail?.heroTitle || '').replace(modelName, '').trim() || 'Diğer';
      if (!brandMap[brand]) brandMap[brand] = { reports: 0, models: new Set() };
      brandMap[brand].models.add(modelName);
    });
    return Object.entries(brandMap)
      .sort((a, b) => b[1].reports - a[1].reports)
      .map(([name, info]) => ({ name, modelCount: info.models.size, reports: info.reports }));
  }, [data, models]);

  // Filter models
  const filteredModels = useMemo(() => {
    let list = Object.values(modelStats);
    if (selectedBrand) {
      list = list.filter(m => m.brand === selectedBrand);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(m =>
        m.model.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        `${m.brand} ${m.model}`.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => {
      switch (sort) {
        case 'newest-desc':
          return (b.createdAtMs || 0) - (a.createdAtMs || 0) || b.totalReports - a.totalReports;
        case 'faults-desc':
          return b.faultCount - a.faultCount || b.totalReports - a.totalReports;
        case 'cost-desc':
          return b.avgCost - a.avgCost || b.totalReports - a.totalReports;
        case 'brand-asc':
          return a.brand.localeCompare(b.brand, 'tr') || a.model.localeCompare(b.model, 'tr');
        case 'reports-desc':
        default:
          return b.totalReports - a.totalReports;
      }
    });
  }, [modelStats, selectedBrand, searchQuery, sort]);

  const totalModels = Object.keys(modelStats).length;
  const totalBrands = brands.length;
  const totalFaults = data.length;

  const getRiskBar = (m) => {
    const total = m.faultCount;
    if (!total) return null;
    return (
      <div className="am-risk-bar">
        {m.riskHigh > 0 && (
          <div className="am-risk-seg am-risk-high" style={{ width: `${(m.riskHigh / total) * 100}%` }} title={`${m.riskHigh} Yüksek Risk`} />
        )}
        {m.riskMedium > 0 && (
          <div className="am-risk-seg am-risk-medium" style={{ width: `${(m.riskMedium / total) * 100}%` }} title={`${m.riskMedium} Orta Risk`} />
        )}
        {m.riskLow > 0 && (
          <div className="am-risk-seg am-risk-low" style={{ width: `${(m.riskLow / total) * 100}%` }} title={`${m.riskLow} Düşük Risk`} />
        )}
      </div>
    );
  };

  return (
    <div className="page-view">
      {/* Hero */}
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="page-hero-content">
          <div className="page-hero-badge">
            <Editable value={mc.heroBadge || 'Araç Modelleri'} path={['modeller', 'heroBadge']} />
          </div>
          <h1 className="page-hero-title">
            <Editable value={mc.heroTitle || 'Tüm Modeller'} path={['modeller', 'heroTitle']} />
          </h1>
          <p className="page-hero-sub">
            <Editable value={mc.heroSub || 'Markalara göre modelleri inceleyin, kronik arızaları ve masraf analizlerini keşfedin.'} path={['modeller', 'heroSub']} multiline />
          </p>
          <div className="page-hero-stats">
            <div className="ph-stat"><span>{totalBrands}</span><label>Marka</label></div>
            <div className="ph-stat"><span>{totalModels}</span><label>Model</label></div>
            <div className="ph-stat"><span>{totalFaults}</span><label>Arıza Kaydı</label></div>
          </div>
        </div>
      </div>

      {/* Search + Brand filter */}
      <div className="am-toolbar">
        <div className="am-search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="am-search-input"
            placeholder="Model veya marka arayın…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <label className="am-sort-wrap">
          <span>Sırala</span>
          <select value={sort} onChange={e => setSort(e.target.value)}>
            {MODEL_SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        {adminMode && (
          <button type="button" className="am-admin-btn" onClick={onNewModel}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Model Ekle
          </button>
        )}
      </div>

      {/* Brand pills */}
      <div className="am-brand-pills">
        <button
          type="button"
          className={`am-brand-pill${!selectedBrand ? ' active' : ''}`}
          onClick={() => setSelectedBrand('')}
        >
          Tümü <span className="am-pill-count">{totalModels}</span>
        </button>
        {brands.map(b => {
          const color = BRAND_COLORS[b.name] || '#374151';
          return (
            <button
              key={b.name}
              type="button"
              className={`am-brand-pill${selectedBrand === b.name ? ' active' : ''}`}
              onClick={() => setSelectedBrand(prev => prev === b.name ? '' : b.name)}
            >
              <span className="am-pill-dot" style={{ background: color }} />
              {b.name}
              <span className="am-pill-count">{b.modelCount}</span>
            </button>
          );
        })}
      </div>

      {/* Models grid */}
      {filteredModels.length === 0 ? (
        <div className="am-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h3>Model bulunamadı</h3>
          <p>Farklı bir marka veya arama terimi deneyin.</p>
        </div>
      ) : (
        <div className="am-grid">
          {filteredModels.map(m => {
            const color = BRAND_COLORS[m.brand] || '#374151';
            return (
              <div
                key={`${m.brand}-${m.model}`}
                className="am-card"
                onClick={() => onModelClick(m.model)}
              >
                <div className="am-card-top">
                  <div className="am-card-brand-dot" style={{ background: color }} />
                  <span className="am-card-brand">{m.brand}</span>
                  {m.riskHigh > 0 && (
                    <span className="am-card-risk-badge">
                      {m.riskHigh} yüksek risk
                    </span>
                  )}
                </div>
                <h3 className="am-card-model">{m.model}</h3>
                <div className="am-card-cats">
                  {m.categories.slice(0, 3).map(c => (
                    <span key={c} className="am-card-cat">{c}</span>
                  ))}
                  {m.categories.length > 3 && (
                    <span className="am-card-cat am-card-cat-more">+{m.categories.length - 3}</span>
                  )}
                </div>
                <div className="am-card-stats">
                  <div className="am-stat">
                    <span className="am-stat-val">{m.faultCount}</span>
                    <span className="am-stat-lbl">Arıza</span>
                  </div>
                  <div className="am-stat">
                    <span className="am-stat-val">{fmt(m.totalReports)}</span>
                    <span className="am-stat-lbl">Doğrulama</span>
                  </div>
                  <div className="am-stat">
                    <span className="am-stat-val">₺{fmt(m.avgCost)}</span>
                    <span className="am-stat-lbl">Ort. Masraf</span>
                  </div>
                </div>
                {getRiskBar(m)}

                {/* Admin: arıza ekle */}
                {adminMode && (
                  <div className="am-card-admin" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      className="am-card-admin-btn"
                      onClick={() => onAddFault && onAddFault(m.brand, m.model)}
                      title="Bu modele arıza ekle"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      Arıza Ekle
                    </button>
                    {m.hasModelPage && (
                      <button
                        type="button"
                        className="am-card-admin-btn am-card-delete-btn"
                        onClick={() => onDeleteModel && onDeleteModel(m.model)}
                        title="Kayıtlı model sayfasını sil"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                        Model Sil
                      </button>
                    )}
                  </div>
                )}

                <div className="am-card-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
