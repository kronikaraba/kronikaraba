import { useMemo, useState } from 'react';
import { Editable } from './liveEdit.jsx';

const fmt = (n) => Number(n).toLocaleString('tr-TR');

const BRAND_COLORS = {
  'Volkswagen': '#1E3A8A', 'BMW': '#0052CC', 'Mercedes': '#1A1A1A',
  'Audi': '#C41E3A', 'Renault': '#EFCB00', 'Ford': '#003476',
  'Toyota': '#EB0A1E', 'Fiat': '#8B0000', 'Hyundai': '#003087',
  'Peugeot': '#003087', 'Dacia': '#1F2F5A',
};

// Gerçek marka kısaltmaları (VO, RE yerine VW, REN vb.)
const BRAND_ABBR = {
  'Volkswagen': 'VW',
  'Mercedes': 'MB',
  'BMW': 'BMW',
  'Audi': 'AUDI',
  'Renault': 'REN',
  'Ford': 'FORD',
  'Toyota': 'TOY',
  'Fiat': 'FIAT',
  'Hyundai': 'HYN',
  'Peugeot': 'PEU',
  'Dacia': 'DAC',
  'Opel': 'OPEL',
  'Citroen': 'CIT',
  'Honda': 'HON',
  'Nissan': 'NIS',
  'Kia': 'KIA',
  'Volvo': 'VOL',
  'Skoda': 'ŠKOD',
  'MINI': 'MINI',
  'Mazda': 'MAZ',
  'BYD': 'BYD',
  'Tesla': 'TES',
  'Togg': 'TOGG',
  'MG': 'MG',
  'Subaru': 'SUB',
  'Suzuki': 'SUZ',
  'Mitsubishi': 'MIT',
  'Chery': 'CHE',
  'Alfa Romeo': 'AR',
  'Jeep': 'JEEP',
};

const getBrandAbbr = (brand) =>
  BRAND_ABBR[brand] || brand.slice(0, 3).toUpperCase();

const fmtCostSafe = (min, max) => {
  const minN = Number(min || 0);
  const maxN = Number(max || 0);
  if (minN === 0 && maxN === 0) return 'Belirtilmemiş';
  return `₺${fmt(minN)} – ₺${fmt(maxN)}`;
};

// ── MARKALAR ─────────────────────────────────────────────────────────────────
export function MarkalarlPage({ data, content, onBrandSelect }) {
  const m = content?.markalar || {};
  const brandStats = useMemo(() => {
    const s = {};
    data.forEach(f => {
      if (!s[f.brand]) s[f.brand] = { count: 0, reports: 0, totalCost: 0, riskHigh: 0 };
      s[f.brand].count++;
      s[f.brand].reports += f.reportCount;
      s[f.brand].totalCost += f.avgCost;
      if (f.risk === 'YÜKSEK' || f.risk === 'FECİ') s[f.brand].riskHigh++;
    });
    Object.keys(s).forEach(b => { s[b].avgCost = Math.round(s[b].totalCost / s[b].count); });
    return s;
  }, [data]);

  const brands = Object.keys(brandStats).sort((a, b) => brandStats[b].reports - brandStats[a].reports);
  const totalReports = data.reduce((s, f) => s + f.reportCount, 0);

  return (
    <div className="page-view">
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="page-hero-content">
          <div className="page-hero-badge"><Editable value={m.heroBadge || 'Araç Markaları'} path={['markalar', 'heroBadge']} /></div>
          <h1 className="page-hero-title"><Editable value={m.heroTitle || 'Tüm Markalar'} path={['markalar', 'heroTitle']} /></h1>
          <p className="page-hero-sub"><Editable value={m.heroSub || ''} path={['markalar', 'heroSub']} multiline /></p>
          <div className="page-hero-stats">
            <div className="ph-stat"><span>{brands.length}</span><label><Editable value={m.statBrands || 'Marka'} path={['markalar', 'statBrands']} /></label></div>
            <div className="ph-stat"><span>{data.length}</span><label><Editable value={m.statFaults || 'Arıza Kaydı'} path={['markalar', 'statFaults']} /></label></div>
            <div className="ph-stat"><span>{fmt(totalReports)}</span><label><Editable value={m.statReports || 'Toplam Doğrulama'} path={['markalar', 'statReports']} /></label></div>
          </div>
        </div>
      </div>

      <div className="brands-grid">
        {brands.map(brand => {
          const s = brandStats[brand];
          const color = BRAND_COLORS[brand] || '#374151';
          const riskRatio = Math.round((s.riskHigh / s.count) * 100);
          return (
            <div key={brand} className="brand-card" onClick={() => onBrandSelect(brand)}>
              <div className="brand-card-logo" style={{ background: color }}>
                {getBrandAbbr(brand)}
              </div>
              <div className="brand-card-body">
                <h3 className="brand-card-name">{brand}</h3>
                <p className="brand-card-sub">{s.count} kronik arıza kaydı</p>
                <div className="brand-card-row">
                  <span className="brand-stat-chip">{fmt(s.reports)} doğrulama</span>
                  {riskRatio >= 50 && <span className="brand-risk-chip">%{riskRatio} yüksek risk</span>}
                </div>
              </div>
              <div className="brand-card-right">
                <span className="brand-avg-cost">₺{fmt(s.avgCost)}</span>
                <span className="brand-avg-label">ort. masraf</span>
                <span className="brand-arrow">›</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── USTA YORUMLARI ────────────────────────────────────────────────────────────
export function UzmanPage({ data, content, onModelClick }) {
  const u = content?.uzman || {};
  const top = useMemo(() =>
    [...data].sort((a, b) => b.reportCount - a.reportCount), [data]);

  const totalReports = data.reduce((s, f) => s + f.reportCount, 0);
  const highRisk = data.filter(f => f.risk === 'YÜKSEK').length;

  const MEDALS = ['1.', '2.', '3.'];

  return (
    <div className="page-view">
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="page-hero-content">
          <div className="page-hero-badge"><Editable value={u.heroBadge || 'Topluluk Doğrulaması'} path={['uzman', 'heroBadge']} /></div>
          <h1 className="page-hero-title"><Editable value={u.heroTitle || 'En Çok Doğrulanan Arızalar'} path={['uzman', 'heroTitle']} /></h1>
          <p className="page-hero-sub"><Editable value={u.heroSub || ''} path={['uzman', 'heroSub']} multiline /></p>
          <div className="page-hero-stats">
            <div className="ph-stat"><span>{fmt(totalReports)}</span><label><Editable value={u.statReports || 'Toplam Doğrulama'} path={['uzman', 'statReports']} /></label></div>
            <div className="ph-stat"><span>{data.length}</span><label><Editable value={u.statFaults || 'Kayıtlı Arıza'} path={['uzman', 'statFaults']} /></label></div>
            <div className="ph-stat"><span>{highRisk}</span><label><Editable value={u.statHighRisk || 'Yüksek Riskli'} path={['uzman', 'statHighRisk']} /></label></div>
          </div>
        </div>
      </div>

      <div className="uzman-list">
        {top.map((fault, i) => (
          <div key={fault.id} className="uzman-card" onClick={() => onModelClick(fault.model)}>
            <div className="uzman-rank">
              {i < 3 ? <span className="uzman-medal">{MEDALS[i]}</span> : <span className="uzman-num">#{i + 1}</span>}
            </div>
            <div className="uzman-body">
              <div className="uzman-top-row">
                <span className="uzman-brand-model">{fault.brand} {fault.model}</span>
                <span className={`risk-badge ${fault.risk}`}>{fault.risk}</span>
              </div>
              <p className="uzman-fault">{fault.description}</p>
              <div className="uzman-meta">
                <span className="uzman-meta-item"><span className="meta-lbl">Kategori:</span> {fault.category}</span>
                <span className="uzman-meta-item"><span className="meta-lbl">Kilometre:</span> {fault.kmDisplay}</span>
                <span className="uzman-meta-item"><span className="meta-lbl">Masraf:</span> {fmtCostSafe(fault.costMin, fault.costMax)}</span>
              </div>
            </div>
            <div className="uzman-reports">
              <span className="uzman-report-count">{fmt(fault.reportCount)}</span>
              <span className="uzman-report-label">doğrulama</span>
              <div className="uzman-bar">
                <div className="uzman-bar-fill" style={{ width: `${Math.min(100, (fault.reportCount / top[0].reportCount) * 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



export function MasrafPage({ data, content, onModelClick }) {
  const ms = content?.masraf || {};
  const sorted = useMemo(() => [...data].sort((a, b) => b.avgCost - a.avgCost), [data]);

  // ── Filter State ──
  const [searchQ, setSearchQ] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');

  // ── Wizard State ──
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizStep, setWizStep] = useState(0); // 0=brand,1=model,2=cat,3=result
  const [wizBrand, setWizBrand] = useState('');
  const [wizModel, setWizModel] = useState('');
  const [wizCat, setWizCat] = useState('');

  const brands = useMemo(() => [...new Set(data.map(f => f.brand).filter(Boolean))].sort(), [data]);
  const wizModels = useMemo(() => wizBrand ? [...new Set(data.filter(f => f.brand === wizBrand).map(f => f.model).filter(Boolean))].sort() : [], [data, wizBrand]);
  const wizCats = useMemo(() => (wizBrand && wizModel) ? [...new Set(data.filter(f => f.brand === wizBrand && f.model === wizModel).map(f => f.category).filter(Boolean))].sort() : [], [data, wizBrand, wizModel]);
  const wizResults = useMemo(() => {
    if (!wizBrand || !wizModel) return [];
    return data.filter(f => f.brand === wizBrand && f.model === wizModel && (!wizCat || f.category === wizCat));
  }, [data, wizBrand, wizModel, wizCat]);

  const tierDefs = ms.tiers || [
    { label: 'Yüksek Masraflı Onarımlar', sub: '₺30.000 ve üzeri', min: 30000, max: null },
    { label: 'Orta Masraflı Onarımlar', sub: '₺10.000 – ₺30.000', min: 10000, max: 30000 },
    { label: 'Düşük Masraflı Onarımlar', sub: '₺10.000 altı', min: 0, max: 10000 },
  ];
  const tiers = [
    { key: 'high', label: tierDefs[0]?.label, sub: tierDefs[0]?.sub, tierIdx: 0, faults: sorted.filter(f => f.avgCost >= 30000), color: '#DC2626' },
    { key: 'mid', label: tierDefs[1]?.label, sub: tierDefs[1]?.sub, tierIdx: 1, faults: sorted.filter(f => f.avgCost >= 10000 && f.avgCost < 30000), color: '#D97706' },
    { key: 'low', label: tierDefs[2]?.label, sub: tierDefs[2]?.sub, tierIdx: 2, faults: sorted.filter(f => f.avgCost < 10000), color: '#16A34A' },
  ];

  const avgCost = Math.round(data.reduce((s, f) => s + f.avgCost, 0) / data.length);
  const maxCost = Math.max(...data.map(f => f.costMax));

  // Filtered tiers
  const filterFault = (f) => {
    const q = searchQ.toLowerCase();
    const matchQ = !q || `${f.brand} ${f.model} ${f.description}`.toLowerCase().includes(q);
    const matchBrand = !brandFilter || f.brand === brandFilter;
    return matchQ && matchBrand;
  };
  const filteredTiers = tiers
    .filter(t => !tierFilter || t.key === tierFilter)
    .map(t => ({ ...t, faults: t.faults.filter(filterFault) }))
    .filter(t => t.faults.length > 0);

  const resetWizard = () => { setWizStep(0); setWizBrand(''); setWizModel(''); setWizCat(''); };
  const WIZARD_STEPS = ['Marka', 'Model', 'Kategori', 'Sonuç'];
  const wizMaxCost = wizResults.length ? Math.max(...wizResults.map(f => f.costMax)) : 1;

  return (
    <div className="page-view">
      {/* Hero */}
      <div className="page-hero" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)' }}>
        <div className="page-hero-content">
          <div className="page-hero-badge"><Editable value={ms.heroBadge || 'Maliyet Analizi'} path={['masraf', 'heroBadge']} /></div>
          <h1 className="page-hero-title"><Editable value={ms.heroTitle || 'Masraf Rehberi'} path={['masraf', 'heroTitle']} /></h1>
          <p className="page-hero-sub"><Editable value={ms.heroSub || ''} path={['masraf', 'heroSub']} multiline /></p>
          <div className="page-hero-stats">
            <div className="ph-stat"><span>₺{fmt(avgCost)}</span><label><Editable value={ms.statAvg || 'Ortalama Masraf'} path={['masraf', 'statAvg']} /></label></div>
            <div className="ph-stat"><span>₺{fmt(maxCost)}</span><label><Editable value={ms.statMax || 'En Yüksek'} path={['masraf', 'statMax']} /></label></div>
            <div className="ph-stat"><span>{data.length}</span><label><Editable value={ms.statFaults || 'Arıza Kaydı'} path={['masraf', 'statFaults']} /></label></div>
          </div>
        </div>
      </div>

      {/* ── Interactive Wizard CTA ── */}
      {!wizardOpen ? (
        <div className="masraf-wizard-cta">
          <div className="masraf-wizard-cta-icon">🧮</div>
          <div className="masraf-wizard-cta-body">
            <h3>Araç Bazlı Maliyet Hesapla</h3>
            <p>Marka, model ve kategori seçerek tahmini tamir bütçenizi öğrenin.</p>
          </div>
          <button className="masraf-wizard-cta-btn" onClick={() => { setWizardOpen(true); resetWizard(); }}>
            Sihirbazı Başlat →
          </button>
        </div>
      ) : (
        <div className="masraf-wizard">
          <div className="masraf-wizard-header">
            <h3 className="masraf-wizard-title">Maliyet Sihirbazı</h3>
            <button className="masraf-wizard-close" onClick={() => setWizardOpen(false)} aria-label="Kapat">✕</button>
          </div>

          {/* Progress steps */}
          <div className="masraf-wizard-steps">
            {WIZARD_STEPS.map((s, i) => (
              <div key={s} className={`masraf-wizard-step${wizStep > i ? ' done' : wizStep === i ? ' active' : ''}`}>
                <div className="mws-circle">{wizStep > i ? '✓' : i + 1}</div>
                <span>{s}</span>
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="masraf-wizard-body">
            {wizStep === 0 && (
              <div className="masraf-wizard-grid">
                {brands.map(b => (
                  <button key={b} className="masraf-wiz-item" onClick={() => { setWizBrand(b); setWizModel(''); setWizCat(''); setWizStep(1); }}>
                    {b}
                  </button>
                ))}
              </div>
            )}
            {wizStep === 1 && (
              <div className="masraf-wizard-grid">
                {wizModels.map(m => (
                  <button key={m} className="masraf-wiz-item" onClick={() => { setWizModel(m); setWizCat(''); setWizStep(2); }}>
                    {wizBrand} {m}
                  </button>
                ))}
              </div>
            )}
            {wizStep === 2 && (
              <div className="masraf-wizard-grid">
                <button className="masraf-wiz-item masraf-wiz-all" onClick={() => { setWizCat(''); setWizStep(3); }}>
                  Tüm Kategoriler
                </button>
                {wizCats.map(c => (
                  <button key={c} className="masraf-wiz-item" onClick={() => { setWizCat(c); setWizStep(3); }}>
                    {c}
                  </button>
                ))}
              </div>
            )}
            {wizStep === 3 && (
              <div className="masraf-wizard-results">
                <div className="masraf-wiz-summary">
                  <span className="masraf-wiz-car">{wizBrand} {wizModel}</span>
                  {wizCat && <span className="masraf-wiz-cat">{wizCat}</span>}
                  <span className="masraf-wiz-count">{wizResults.length} arıza bulundu</span>
                </div>
                {wizResults.length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '24px 0' }}>Bu kriterlere uygun arıza kaydı bulunamadı.</p>
                ) : wizResults.map(fault => {
                  const tierColor = fault.avgCost >= 30000 ? '#DC2626' : fault.avgCost >= 10000 ? '#D97706' : '#16A34A';
                  return (
                    <div key={fault.id} className="masraf-row masraf-wiz-row" onClick={() => onModelClick(fault.model)}>
                      <div className="masraf-row-left">
                        <span className="masraf-brand">{fault.brand} {fault.model}</span>
                        <span className="masraf-fault-name">{fault.description}</span>
                        <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>{fault.category} · {fault.kmDisplay}</span>
                      </div>
                      <div className="masraf-row-right">
                        <span className="masraf-cost-val" style={{ color: tierColor }}>
                          ₺{fmt(fault.costMin)} – ₺{fmt(fault.costMax)}
                        </span>
                        <div className="masraf-bar-wrap">
                          <div className="masraf-cost-bar" style={{ width: `${Math.min(100, (fault.avgCost / wizMaxCost) * 100)}%`, background: tierColor }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="masraf-wizard-nav">
            <button className="masraf-wiz-back-btn" onClick={() => { if (wizStep === 0) setWizardOpen(false); else setWizStep(s => s - 1); }}>
              ← {wizStep === 0 ? 'İptal' : 'Geri'}
            </button>
            {wizStep === 3 && (
              <button className="masraf-wiz-restart-btn" onClick={resetWizard}>Yeniden Hesapla</button>
            )}
          </div>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div className="masraf-filter-bar">
        <div className="masraf-filter-search">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Marka, model veya arıza ara..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
            className="masraf-filter-input"
          />
          {searchQ && <button className="masraf-filter-clear" onClick={() => setSearchQ('')}>✕</button>}
        </div>
        <div className="masraf-filter-selects">
          <select
            className="masraf-filter-select"
            value={brandFilter}
            onChange={e => setBrandFilter(e.target.value)}
          >
            <option value="">Tüm Markalar</option>
            {brands.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <div className="masraf-tier-btns">
            {[
              { key: '', label: 'Tümü' },
              { key: 'high', label: 'Yüksek', color: '#DC2626' },
              { key: 'mid', label: 'Orta', color: '#D97706' },
              { key: 'low', label: 'Düşük', color: '#16A34A' },
            ].map(t => (
              <button
                key={t.key}
                className={`masraf-tier-btn${tierFilter === t.key ? ' active' : ''}`}
                style={tierFilter === t.key && t.color ? { background: t.color, color: '#fff', borderColor: t.color } : {}}
                onClick={() => setTierFilter(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tier Lists ── */}
      <div className="masraf-tiers">
        {filteredTiers.length === 0 ? (
          <div className="masraf-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--gray-300)', marginBottom: 12 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p>Arama kriterlerinize uygun arıza bulunamadı.</p>
            <button onClick={() => { setSearchQ(''); setBrandFilter(''); setTierFilter(''); }} className="masraf-empty-reset">Filtreleri Temizle</button>
          </div>
        ) : filteredTiers.map(tier => (
          <div key={tier.key} className="masraf-tier">
            <div className="masraf-tier-header" style={{ borderColor: tier.color }}>
              <h2 className="masraf-tier-title">
                <Editable value={tier.label} path={['masraf', 'tiers', tier.tierIdx, 'label']} />
              </h2>
              <span className="masraf-tier-sub">
                <Editable value={tier.sub} path={['masraf', 'tiers', tier.tierIdx, 'sub']} />
              </span>
              <span className="masraf-tier-count" style={{ background: tier.color }}>{tier.faults.length} arıza</span>
            </div>
            <div className="masraf-tier-list">
              {tier.faults.map(fault => (
                <div key={fault.id} className="masraf-row" onClick={() => onModelClick(fault.model)}>
                  <div className="masraf-row-left">
                    <span className="masraf-brand">{fault.brand} {fault.model}</span>
                    <span className="masraf-fault-name">{fault.description}</span>
                  </div>
                  <div className="masraf-row-right">
                    <span className="masraf-cost-val" style={{ color: tier.color }}>
                      ₺{fmt(fault.costMin)} – ₺{fmt(fault.costMax)}
                    </span>
                    <div className="masraf-bar-wrap">
                      <div className="masraf-cost-bar" style={{ width: `${Math.min(100, (fault.avgCost / maxCost) * 100)}%`, background: tier.color }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

