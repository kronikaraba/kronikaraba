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

// Helper to get brand gradient
const getBrandGradient = (brand) => {
  const color = BRAND_COLORS[brand] || '#475569';
  return `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`;
};

// SVG Vehicle Silhouette Icon
const VehicleSilhouette = () => (
  <svg viewBox="0 0 100 40" width="45" height="18" fill="currentColor" className="am-card-car-silhouette" style={{ opacity: 0.9, color: 'rgba(255, 255, 255, 0.95)' }}>
    <path d="M10,25 C10,25 12,20 18,18 C24,16 35,16 42,10 C48,5 65,5 72,12 C78,18 88,20 90,25 C92,27 92,29 90,30 C85,30 82,30 82,30 C80,27 75,25 70,25 C65,25 60,27 58,30 L32,30 C30,27 25,25 20,25 C15,25 10,27 8,30 C8,30 8,28 10,25 Z M20,22 C24,22 27,25 27,29 C27,33 24,36 20,36 C16,36 13,33 13,29 C13,25 16,22 20,22 Z M70,22 C74,22 77,25 77,29 C77,33 74,36 70,36 C66,36 63,33 63,29 C63,25 66,22 70,22 Z" />
  </svg>
);

export default function AllModelsPage({ data, models, onModelClick, adminMode, onAddFault, onNewModel, onDeleteModel, onBulkDeleteModels, content }) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState('newest-desc');
  const [selectedModels, setSelectedModels] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
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
      if (f.risk === 'YÜKSEK' || f.risk === 'FECİ') stats[key].riskHigh++;
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

  const toggleSelectModel = (modelName) => {
    setSelectedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelName)) next.delete(modelName);
      else next.add(modelName);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedModels.size === filteredModels.length) {
      setSelectedModels(new Set());
    } else {
      setSelectedModels(new Set(filteredModels.map(m => m.model)));
    }
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelectedModels(new Set());
  };

  const handleBulkDelete = () => {
    if (selectedModels.size === 0) return;
    const modelList = [...selectedModels];
    if (!confirm(`${modelList.length} modeli silmek istediğinize emin misiniz?\n\nBu işlem geri alınamaz.`)) return;
    if (onBulkDeleteModels) {
      onBulkDeleteModels(modelList);
    }
    exitSelectMode();
  };

  const allFilteredSelected = filteredModels.length > 0 && selectedModels.size === filteredModels.length;
  const someSelected = selectedModels.size > 0 && !allFilteredSelected;

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
          <>
            <button type="button" className="am-admin-btn" onClick={onNewModel}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Model Ekle
            </button>
            {!selectMode ? (
              <button
                type="button"
                className="am-admin-btn"
                style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' }}
                onClick={() => setSelectMode(true)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <polyline points="14 18 16 20 20 14" />
                </svg>
                Toplu Seç
              </button>
            ) : (
              <button
                type="button"
                className="am-admin-btn"
                style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.2)' }}
                onClick={exitSelectMode}
              >
                İptal
              </button>
            )}
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {adminMode && selectMode && (
        <div className="am-bulk-bar">
          <label className="am-bulk-check-wrap" onClick={toggleSelectAll}>
            <span className={`am-bulk-checkbox${allFilteredSelected ? ' checked' : someSelected ? ' indeterminate' : ''}`}>
              {allFilteredSelected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {someSelected && !allFilteredSelected && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              )}
            </span>
            <span className="am-bulk-label">
              {allFilteredSelected ? 'Tümünün seçimini kaldır' : 'Tümünü seç'}
            </span>
          </label>
          <span className="am-bulk-count">
            {selectedModels.size > 0 ? `${selectedModels.size} model seçildi` : 'Model seçin'}
          </span>
          <button
            type="button"
            className="am-bulk-delete-btn"
            disabled={selectedModels.size === 0}
            onClick={handleBulkDelete}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            {selectedModels.size > 0 ? `${selectedModels.size} Modeli Sil` : 'Sil'}
          </button>
        </div>
      )}

      {/* Brand pills */}
      <div className="am-brand-pills-outer">
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
            const isSelected = selectedModels.has(m.model);
            return (
              <div
                key={`${m.brand}-${m.model}`}
                className={`am-card${selectMode && isSelected ? ' am-card-selected' : ''}`}
                onClick={() => {
                  if (selectMode) {
                    toggleSelectModel(m.model);
                  } else {
                    onModelClick(m.model);
                  }
                }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: selectMode ? 'pointer' : undefined }}
              >
                {/* Select mode checkbox overlay */}
                {adminMode && selectMode && (
                  <div
                    className="am-card-select-overlay"
                    onClick={e => { e.stopPropagation(); toggleSelectModel(m.model); }}
                  >
                    <span className={`am-card-checkbox${isSelected ? ' checked' : ''}`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </div>
                )}

                {/* Brand Gradient Header */}
                <div className="am-card-header" style={{ background: getBrandGradient(m.brand), padding: '16px 20px', color: '#fff', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="am-card-brand" style={{ fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255, 255, 255, 0.9)' }}>{m.brand}</span>
                    <VehicleSilhouette />
                  </div>
                  <h3 className="am-card-model" style={{ color: '#fff', margin: '8px 0 0 0', fontSize: '18px', fontWeight: 700 }}>{m.model}</h3>
                  {m.riskHigh > 0 && (
                    <span className="am-card-risk-badge" style={{ position: 'absolute', bottom: 12, right: 20, background: 'rgba(239, 68, 68, 0.9)', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 600 }}>
                      {m.riskHigh} YÜKSEK RİSK
                    </span>
                  )}
                </div>

                <div className="am-card-body" style={{ padding: '16px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div className="am-card-cats" style={{ marginBottom: 12 }}>
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
                </div>
                {getRiskBar(m)}

                {/* Admin buttons */}
                {adminMode && !selectMode && (
                  <div className="am-card-admin" onClick={e => e.stopPropagation()} style={{ padding: '0 20px 16px 20px' }}>
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
                    <button
                      type="button"
                      className="am-card-admin-btn am-card-delete-btn"
                      onClick={() => onDeleteModel && onDeleteModel(m.model)}
                      title={m.hasModelPage ? 'Model sayfasını ve arızalarını sil' : 'Bu modelin arızalarını sil'}
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
                  </div>
                )}

                {!selectMode && (
                  <div className="am-card-arrow" style={{ right: 20, bottom: 20 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
