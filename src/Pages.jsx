import { useMemo } from 'react';
import { Editable } from './liveEdit.jsx';

const fmt = (n) => Number(n).toLocaleString('tr-TR');

const BRAND_COLORS = {
  'Volkswagen': '#1E3A8A', 'BMW': '#0052CC', 'Mercedes': '#1A1A1A',
  'Audi': '#C41E3A', 'Renault': '#EFCB00', 'Ford': '#003476',
  'Toyota': '#EB0A1E', 'Fiat': '#8B0000', 'Hyundai': '#003087',
  'Peugeot': '#003087', 'Dacia': '#1F2F5A',
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
      if (f.risk === 'YÜKSEK') s[f.brand].riskHigh++;
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
                {brand.slice(0, 2).toUpperCase()}
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
                <span className="uzman-meta-item"><span className="meta-lbl">Masraf:</span> ₺{fmt(fault.costMin)} – ₺{fmt(fault.costMax)}</span>
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

// ── MASRAF REHBERİ ────────────────────────────────────────────────────────────
export function MasrafPage({ data, content, onModelClick }) {
  const ms = content?.masraf || {};
  const sorted = useMemo(() => [...data].sort((a, b) => b.avgCost - a.avgCost), [data]);

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

  return (
    <div className="page-view">
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

      <div className="masraf-tiers">
        {tiers.map(tier => (
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
