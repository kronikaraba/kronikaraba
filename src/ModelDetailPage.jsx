import { useState, useMemo, useEffect } from 'react';
import { CommentSection } from './comments.jsx';
import { getFaultDateLabel } from './dateUtils.js';

const fmt = (n) => Number(n).toLocaleString('tr-TR');
const fmtCost = (min, max) => `₺${fmt(min)} – ₺${fmt(max)}`;

const SPEC_LABELS = {
  motor: 'Motor', beygir: 'Güç', tork: 'Tork',
  sanziman: 'Şanzıman', yakit: 'Yakıt', hiz: 'Maksimum Hız',
  agirlik: 'Ağırlık', bagaj: 'Bagaj Hacmi',
};

const ENGINE_PROFILES = [
  [/1\.0\s*TCe/i, ['1.0L TCe turbo benzinli', '90-100 HP', '160-170 Nm', '6 ileri manuel / EDC', '5.2-6.0 L/100 km', '0-100: 11-13 sn']],
  [/1\.5\s*dCi/i, ['1.5L dCi turbo dizel', '90-115 HP', '220-260 Nm', '6 ileri manuel / EDC', '3.8-4.6 L/100 km', '0-100: 11-13 sn']],
  [/1\.3\s*TCe/i, ['1.3L TCe turbo benzinli', '130-160 HP', '240-270 Nm', '6 ileri manuel / EDC', '5.5-6.5 L/100 km', '0-100: 8.5-10.5 sn']],
  [/1\.4\s*Fire/i, ['1.4L Fire benzinli', '95 HP', '127 Nm', '6 ileri manuel', '6.0-7.2 L/100 km', '0-100: 12-13 sn']],
  [/1\.6\s*Multijet|1\.6\s*MultiJet/i, ['1.6L MultiJet turbo dizel', '120 HP', '320 Nm', '6 ileri manuel / DCT', '4.2-5.0 L/100 km', '0-100: 9.5-11 sn']],
  [/1\.3\s*Multijet|1\.3\s*MultiJet/i, ['1.3L MultiJet turbo dizel', '75-95 HP', '190-200 Nm', '5 ileri manuel', '4.0-4.8 L/100 km', '0-100: 12-14 sn']],
  [/1\.6\s*Valvematic/i, ['1.6L Valvematic benzinli', '132 HP', '160 Nm', '6 ileri manuel / Multidrive S CVT', '6.0-6.8 L/100 km', '0-100: 10-11 sn']],
  [/Hybrid|Hibrit|DM-i/i, ['Hibrit benzinli-elektrik sistem', '122-218 HP sistem gücü', 'E-motor destekli tork', 'e-CVT / hibrit otomatik', '3.8-5.5 L/100 km', '0-100: 7.5-11 sn']],
  [/Electric|EV|T10X|Model Y|Atto 3/i, ['Tam elektrikli motor', '156-534 HP', '310-660 Nm', 'Tek oranlı otomatik', '15-21 kWh/100 km', '0-100: 3.7-9.0 sn']],
  [/1\.4\s*MPI/i, ['1.4L MPI atmosferik benzinli', '100 HP', '134 Nm', '6 ileri manuel / otomatik', '6.0-7.0 L/100 km', '0-100: 11-13 sn']],
  [/1\.0\s*T-GDI/i, ['1.0L T-GDI turbo benzinli', '100 HP', '172 Nm', '6 ileri manuel / DCT', '5.0-5.8 L/100 km', '0-100: 10.5-12 sn']],
  [/1\.6\s*CRDi/i, ['1.6L CRDi turbo dizel', '110-136 HP', '260-320 Nm', '6 ileri manuel / DCT / otomatik', '4.2-5.6 L/100 km', '0-100: 10-12 sn']],
  [/2\.0\s*TDI|2\.0\s*CRDi/i, ['2.0L turbo dizel', '150-185 HP', '340-400 Nm', 'DSG / tork konvertörlü otomatik', '4.8-6.5 L/100 km', '0-100: 8.5-10 sn']],
  [/1\.0\s*TSI|1\.0\s*EcoTSI/i, ['1.0L TSI turbo benzinli', '95-115 HP', '175-200 Nm', '5/6 ileri manuel / DSG', '4.8-5.8 L/100 km', '0-100: 10-12 sn']],
  [/1\.5\s*TSI/i, ['1.5L TSI turbo benzinli', '150 HP', '250 Nm', '6 ileri manuel / 7 ileri DSG', '5.5-6.5 L/100 km', '0-100: 8.5-10 sn']],
  [/1\.6\s*TDI/i, ['1.6L TDI turbo dizel', '105-120 HP', '250 Nm', '5/6 ileri manuel / DSG', '4.0-4.8 L/100 km', '0-100: 10-12 sn']],
  [/1\.6\s*CDTI/i, ['1.6L CDTI turbo dizel', '110-136 HP', '300-320 Nm', '6 ileri manuel / otomatik', '4.0-5.0 L/100 km', '0-100: 10-12 sn']],
  [/1\.3\s*CDTI/i, ['1.3L CDTI turbo dizel', '95 HP', '190 Nm', '5/6 ileri manuel', '3.8-4.5 L/100 km', '0-100: 12-14 sn']],
  [/1\.2\s*PureTech|1\.2\s*Turbo|Crossland 1\.2|Corsa 1\.2|C3 1\.2|C4X 1\.2/i, ['1.2L PureTech/turbo benzinli', '100-130 HP', '205-230 Nm', '6 ileri manuel / EAT8', '5.0-6.2 L/100 km', '0-100: 9.5-12 sn']],
  [/1\.6\s*HDi/i, ['1.6L HDi turbo dizel', '92-115 HP', '230-300 Nm', '5/6 ileri manuel / otomatik', '3.8-4.8 L/100 km', '0-100: 10.5-13 sn']],
  [/1\.5\s*BlueHDi/i, ['1.5L BlueHDi turbo dizel', '100-130 HP', '250-300 Nm', '6 ileri manuel / EAT8', '4.0-5.2 L/100 km', '0-100: 10-12.5 sn']],
  [/1\.0\s*EcoBoost/i, ['1.0L EcoBoost turbo benzinli', '100-125 HP', '170-200 Nm', '6 ileri manuel / otomatik', '4.8-5.8 L/100 km', '0-100: 10-12 sn']],
  [/1\.5\s*TDCi/i, ['1.5L TDCi turbo dizel', '95-120 HP', '250-270 Nm', '6 ileri manuel / otomatik', '4.0-5.0 L/100 km', '0-100: 10.5-12.5 sn']],
  [/1\.5\s*EcoBoost/i, ['1.5L EcoBoost turbo benzinli', '150-182 HP', '240 Nm', '6 ileri manuel / otomatik', '6.2-7.5 L/100 km', '0-100: 8.5-10.5 sn']],
  [/1\.6\s*i-VTEC|1\.5\s*i-VTEC|ECO LPG/i, ['Honda i-VTEC benzinli motor', '121-125 HP', '145-152 Nm', '6 ileri manuel / CVT', '5.5-7.0 L/100 km', '0-100: 10-12 sn']],
  [/1\.6\s*i-DTEC/i, ['1.6L i-DTEC turbo dizel', '120-160 HP', '300-350 Nm', '6 ileri manuel / otomatik', '4.5-5.5 L/100 km', '0-100: 9.5-11.5 sn']],
  [/1\.0\s*DIG-T|1\.0\s*IG-T/i, ['1.0L DIG-T/IG-T turbo benzinli', '100-117 HP', '160-200 Nm', '6 ileri manuel / DCT', '5.0-6.0 L/100 km', '0-100: 10.5-12.5 sn']],
  [/1\.5\s*TFSI|1\.4\s*TFSI|1\.0\s*TFSI/i, ['TFSI turbo benzinli motor', '115-150 HP', '200-250 Nm', '6 ileri manuel / S tronic', '5.0-6.5 L/100 km', '0-100: 8.5-10.5 sn']],
  [/2\.0\s*TDI/i, ['2.0L TDI turbo dizel', '150-190 HP', '340-400 Nm', 'S tronic / tiptronic', '4.5-5.8 L/100 km', '0-100: 7.5-9.0 sn']],
  [/CDI|E220d|A180/i, ['Mercedes turbo dizel motor', '109-194 HP', '260-400 Nm', '7G-DCT / 9G-Tronic', '4.0-5.5 L/100 km', '0-100: 7.3-11 sn']],
  [/CLA 180/i, ['1.6L turbo benzinli', '122 HP', '200 Nm', '7G-DCT otomatik', '5.5-6.5 L/100 km', '0-100: 9.0 sn']],
  [/116i|118i|sDrive18i/i, ['BMW turbo benzinli motor', '136-140 HP', '220 Nm', '8 ileri Steptronic / manuel', '5.5-6.8 L/100 km', '0-100: 8.5-10 sn']],
  [/xDrive20d|D4/i, ['2.0L turbo dizel', '190 HP', '400 Nm', '8 ileri otomatik', '4.8-6.2 L/100 km', '0-100: 7.5-8.5 sn']],
  [/T3|T4/i, ['Volvo turbo benzinli motor', '156-190 HP', '265-300 Nm', '8 ileri Geartronic / otomatik', '6.0-7.5 L/100 km', '0-100: 7.0-9.5 sn']],
  [/Skyactiv-G/i, ['2.0L Skyactiv-G atmosferik benzinli', '120-165 HP', '210 Nm', '6 ileri manuel / otomatik', '5.5-6.5 L/100 km', '0-100: 8.5-10.5 sn']],
  [/Cooper 1\.5/i, ['1.5L TwinPower turbo benzinli', '136 HP', '220 Nm', '6 ileri manuel / 7 ileri DCT', '5.0-6.0 L/100 km', '0-100: 8.0 sn']],
  [/1\.5\s*T-GDI|Tiggo|Omoda|HS 1\.5/i, ['1.5/1.6L turbo benzinli', '147-183 HP', '210-290 Nm', 'CVT / DCT otomatik', '6.8-8.2 L/100 km', '0-100: 8.5-10.5 sn']],
  [/1\.4\s*Boosterjet/i, ['1.4L Boosterjet turbo benzinli', '140 HP', '220 Nm', '6 ileri manuel / otomatik', '5.5-6.3 L/100 km', '0-100: 9.5-10.5 sn']],
  [/ASX 1\.6|XV 1\.6/i, ['1.6L atmosferik benzinli', '114-117 HP', '150-154 Nm', '5 ileri manuel / CVT', '6.5-7.5 L/100 km', '0-100: 11-13 sn']],
  [/1\.4\s*TB/i, ['1.4L TB turbo benzinli', '120-170 HP', '215-250 Nm', '6 ileri manuel / TCT', '6.0-7.2 L/100 km', '0-100: 7.7-9.5 sn']],
];

function getSegment(model) {
  if (/Duster|Captur|Tucson|3008|2008|5008|C-HR|RAV4|Bayon|Kona|Tiguan|T-Roc|T-Cross|Taigo|Mokka|Crossland|C5 Aircross|Kuga|Puma|CR-V|Qashqai|Juke|Kodiaq|Kamiq|Ateca|Q3|Q2|X1|X3|Sportage|Stonic|XC40|XC60|T10X|Model Y|Seal U|Atto 3|HS|ZS|Tiggo|Omoda|Renegade|Vitara|ASX|XV|X-Trail|HR-V/i.test(model)) return 'SUV / crossover';
  if (/Doblo|Caddy|Berlingo|Courier|Fiorino|Logan MCV/i.test(model)) return 'hafif ticari / MPV';
  if (/Passat|Talisman|Mondeo|Insignia|Superb|A4|E220d|S60|508/i.test(model)) return 'D/E segment sedan';
  if (/Clio|i20|Polo|Corsa|208|C3|Fiesta|Yaris|Micra|Ibiza|Picanto|Punto/i.test(model)) return 'B segment';
  return 'C segment / kompakt';
}

function getBodySpecs(model, first) {
  if (/Model Y/i.test(model)) return ['1.900-2.000 kg', '854 L (arka bagaj)'];
  if (/T10X/i.test(model)) return ['1.950 kg civarı', '441 L'];
  if (/Atto 3/i.test(model)) return ['1.750 kg civarı', '440 L'];
  if (/Seal U/i.test(model)) return ['1.940 kg civarı', '425 L'];
  if (/Doblo|Caddy|Berlingo|Courier|Fiorino/i.test(model)) return ['1.300-1.650 kg', '600 L+ yük alanı'];
  if (getSegment(model).includes('SUV')) return ['1.300-1.800 kg', '400-600 L'];
  if (getSegment(model).includes('D/E')) return ['1.450-1.750 kg', '480-620 L'];
  if (getSegment(model).includes('B segment')) return ['1.050-1.250 kg', '280-390 L'];
  if (first.motorType === 'Elektrik') return ['1.500-2.000 kg', '350-850 L'];
  return ['1.200-1.450 kg', '380-520 L'];
}

function getTransmission(model, first, fallbackTransmission) {
  if (/DCT|DSG|S-Tronic|S tronic|TCT/i.test(model)) return 'çift kavrama otomatik';
  if (/EAT8/i.test(model)) return '8 ileri EAT8 otomatik';
  if (/CVT|Hybrid|Hibrit/i.test(model)) return 'CVT / e-CVT otomatik';
  if (first.motorType === 'Elektrik') return 'tek oranlı otomatik';
  return fallbackTransmission;
}

function inferSpecs(model, first) {
  const text = `${model} ${first.brand} ${first.motorType}`;
  const profile = ENGINE_PROFILES.find(([pattern]) => pattern.test(text))?.[1];
  const [motor, beygir, tork, sanziman, yakit, hiz] = profile || [
    `${first.motorType} motor`,
    first.motorType === 'Dizel' ? '90-150 HP' : '95-150 HP',
    first.motorType === 'Dizel' ? '200-340 Nm' : '130-250 Nm',
    first.motorType === 'Elektrik' ? 'tek oranlı otomatik' : 'manuel / otomatik seçenekleri',
    first.motorType === 'Elektrik' ? '15-21 kWh/100 km' : '4.5-7.5 L/100 km',
    first.motorType === 'Elektrik' ? '0-100: 4-9 sn' : '0-100: 9-13 sn',
  ];
  const [agirlik, bagaj] = getBodySpecs(model, first);

  return {
    motor,
    beygir,
    tork,
    sanziman: getTransmission(model, first, sanziman),
    yakit,
    hiz,
    agirlik,
    bagaj,
  };
}

function buildFallbackModelDetail(model, modelFaults) {
  if (!modelFaults.length) return null;

  const first = modelFaults[0];
  const commonCategories = [...new Set(modelFaults.map(f => f.category))].join(', ');
  const highRiskCount = modelFaults.filter(f => f.risk === 'YÜKSEK').length;
  const years = modelFaults.flatMap(f => [Number(f.yearMin), Number(f.yearMax)]).filter(Boolean);
  const yearText = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : first.year;
  const specs = inferSpecs(model, first);
  const segment = getSegment(model);

  return {
    heroTitle: `${first.brand} ${model}`,
    heroSubtitle: `${yearText} · ${segment} · ${specs.motor}`,
    blogIntro: `${first.brand} ${model}, Türkiye ikinci el ve sıfır pazarında sık görülen modeller arasında yer aldığı için kronik arıza takibinde önemlidir. Bu sayfada ${specs.motor}, ${specs.sanziman} ve model özelinde öne çıkan ${modelFaults.length} arıza kaydı; belirtiler, tahmini masraf ve ekspertiz kontrol ipuçlarıyla listelenir.`,
    specs,
    strengths: [
      'Türkiye pazarında bilinen servis ve parça ağı',
      'İkinci elde karşılaştırılabilir çok sayıda ilan',
      'Bakım geçmişi düzgünse öngörülebilir kullanım maliyeti',
    ],
    weaknesses: [
      `${commonCategories || 'Mekanik'} tarafında kontrol ihtiyacı`,
      highRiskCount ? `${highRiskCount} yüksek riskli arıza kaydı` : 'Bakım gecikirse masraf artışı',
      'Ekspertizde model özelinde test sürüşü şart',
    ],
    maintenanceTips: [
      { km: 'Her bakım', tip: 'Motor yağı, filtreler, kaçak ve elektronik hata kodu kontrolü' },
      { km: first.kmDisplay || '60.000 km+', tip: first.checkTip },
      { km: 'Satın alma öncesi', tip: 'Soğuk çalışma, test sürüşü ve arıza kayıtları birlikte kontrol edilmeli' },
    ],
    buyerAdvice: `${model} alırken yalnızca boya/değişen raporuna bakmayın. Bu sayfadaki arıza belirtilerini test sürüşünde deneyin, bakım faturalarını isteyin ve özellikle ${commonCategories || 'mekanik'} kontrollerini ekspertize ekletin.`,
  };
}

export default function ModelDetailPage({
  model, models, faults, activityMap = {}, adminMode,
  onBack, onEditModel, onCreateModel, user, onAuthRequest, onForumChange,
}) {
  const modelFaults = useMemo(() => faults.filter(f => f.model === model), [faults, model]);
  const storedDetail = useMemo(() => models[model], [models, model]);
  const detail = useMemo(() => storedDetail || buildFallbackModelDetail(model, modelFaults), [storedDetail, model, modelFaults]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const prev = document.title;
    const brand = modelFaults[0]?.brand || '';
    document.title = `${brand} ${model} — Kronik Arızalar | KronikAraba`;
    return () => { document.title = prev; };
  }, [model, modelFaults]);
  if (!detail) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={onBack}>← Geri Dön</button>
        <div className="detail-empty">
          <h2>Model bilgisi bulunamadı</h2>
          <p>{model} modeli için henüz detaylı makale eklenmemiştir.</p>
          {adminMode && (
            <button type="button" className="btn-submit" style={{ marginTop: 16 }} onClick={onCreateModel}>
              + Model makalesi oluştur
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      <button className="detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Tüm Arızalara Dön
      </button>

      {adminMode && storedDetail && (
        <div className="detail-admin-bar">
          <button type="button" className="btn-submit btn-sm" onClick={() => onEditModel(model, detail)}>
            ✏️ Makaleyi düzenle
          </button>
        </div>
      )}
      {adminMode && !storedDetail && (
        <div className="detail-admin-bar">
          <button type="button" className="btn-submit btn-sm" onClick={onCreateModel}>
            + Kalıcı model makalesi oluştur
          </button>
        </div>
      )}

      <div className="detail-hero">
        <div className="detail-hero-content">
          <div className="detail-hero-badge">{modelFaults[0]?.brand}</div>
          <h1 className="detail-hero-title">{detail.heroTitle}</h1>
          <p className="detail-hero-subtitle">{detail.heroSubtitle}</p>
          <div className="detail-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{modelFaults.length}</span>
              <span className="hero-stat-label">Kronik Arıza</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">
                {fmt(modelFaults.reduce((s, f) => s + f.reportCount, 0))}
              </span>
              <span className="hero-stat-label">Toplam Doğrulama</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">
                {modelFaults.length ? fmtCost(
                  Math.min(...modelFaults.map(f => f.costMin)),
                  Math.max(...modelFaults.map(f => f.costMax))
                ) : '—'}
              </span>
              <span className="hero-stat-label">Masraf Aralığı</span>
            </div>
          </div>
        </div>
        <div className="detail-hero-visual">
          <div className="hero-icon-circle">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M7 17v1a1 1 0 001 1h1a1 1 0 001-1v-1M14 17v1a1 1 0 001 1h1a1 1 0 001-1v-1"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </div>
        </div>
      </div>

      <div className="detail-tabs">
        {[
          { key: 'overview', label: 'Genel Bilgi' },
          { key: 'specs', label: 'Teknik Özellikler' },
          { key: 'faults', label: `Kronik Arızalar (${modelFaults.length})` },
          { key: 'maintenance', label: 'Bakım Rehberi' },
        ].map(t => (
          <button
            key={t.key}
            className={`detail-tab${activeTab === t.key ? ' active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="detail-content">
        {activeTab === 'overview' && (
          <div className="detail-section detail-fade-in">
            <div className="blog-card">
              <div className="blog-card-header">
                <h2>Model Hakkında</h2>
              </div>
              <p className="blog-text">{detail.blogIntro}</p>
            </div>
            <div className="detail-two-col">
              <div className="sw-card sw-good">
                <h3>Güçlü Yönler</h3>
                <ul>{detail.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </div>
              <div className="sw-card sw-bad">
                <h3>Zayıf Yönler</h3>
                <ul>{detail.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
              </div>
            </div>
            <div className="blog-card advice-card">
              <div className="blog-card-header">
                <h2>Alıcı Tavsiyesi</h2>
              </div>
              <p className="blog-text">{detail.buyerAdvice}</p>
            </div>
          </div>
        )}

        {activeTab === 'specs' && (
          <div className="detail-section detail-fade-in">
            <div className="specs-grid">
              {Object.entries(detail.specs).map(([key, val]) => (
                <div key={key} className="spec-card">
                  <span className="spec-label">{SPEC_LABELS[key] || key}</span>
                  <span className="spec-value">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'faults' && (
          <div className="detail-section detail-fade-in">
            {modelFaults.map(fault => (
              <div key={fault.id} className="detail-fault-card">
                <div className="dfc-header">
                  <div>
                    <h3 className="dfc-title">{fault.description}</h3>
                    <p className="dfc-category">
                      {fault.category} · {fault.year} · Kayıt: {getFaultDateLabel(fault)} · Son hareket: {activityMap[fault.id]?.fullLabel || getFaultDateLabel(fault)}
                    </p>
                  </div>
                  <span className={`risk-badge ${fault.risk}`}>{fault.risk}</span>
                </div>
                <div className="dfc-body">
                  <div className="dfc-info-grid">
                    <div className="dfc-info">
                      <span className="dfc-info-label">Belirtiler</span>
                      <p>{fault.symptoms}</p>
                    </div>
                    <div className="dfc-info">
                      <span className="dfc-info-label">Kontrol İpucu</span>
                      <p>{fault.checkTip}</p>
                    </div>
                    <div className="dfc-info">
                      <span className="dfc-info-label">Tahmini Masraf</span>
                      <p className="dfc-cost">{fmtCost(fault.costMin, fault.costMax)}</p>
                    </div>
                    <div className="dfc-info">
                      <span className="dfc-info-label">Görülme KM / Doğrulama</span>
                      <p>{fault.kmDisplay} · <strong>{fmt(fault.reportCount)}</strong> kullanıcı</p>
                    </div>
                  </div>
                </div>
                <div className="dfc-discussion">
                  <CommentSection faultId={fault.id} user={user} onAuthRequest={onAuthRequest} adminMode={adminMode} onForumChange={onForumChange} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="detail-section detail-fade-in">
            <div className="blog-card">
              <div className="blog-card-header">
                <h2>Periyodik Bakım Tablosu</h2>
              </div>
              <div className="maint-timeline">
                {detail.maintenanceTips.map((m, i) => (
                  <div key={i} className="maint-item">
                    <div className="maint-dot" />
                    <div className="maint-content">
                      <span className="maint-km">{m.km}</span>
                      <p className="maint-tip">{m.tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
