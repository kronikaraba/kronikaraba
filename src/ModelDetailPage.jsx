import { useState, useMemo } from 'react';
import { loadAdminFaults, loadAdminModels } from './AdminPanel.jsx';
import { CommentSection } from './comments.jsx';

const fmt = (n) => Number(n).toLocaleString('tr-TR');
const fmtCost = (min, max) => `₺${fmt(min)} – ₺${fmt(max)}`;

const SPEC_LABELS = {
  motor: '🔧 Motor', beygir: '🐎 Güç', tork: '⚡ Tork',
  sanziman: '⚙️ Şanzıman', yakit: '⛽ Yakıt', hiz: '🏁 Hız',
  agirlik: '⚖️ Ağırlık', bagaj: '🧳 Bagaj',
};

export default function ModelDetailPage({ model, onBack, user, onAuthRequest }) {
  const detail = useMemo(() => loadAdminModels()[model], [model]);
  const faults = useMemo(() => loadAdminFaults().filter(f => f.model === model), [model]);
  const [activeTab, setActiveTab] = useState('overview');

  if (!detail) {
    return (
      <div className="detail-page">
        <button className="detail-back" onClick={onBack}>← Geri Dön</button>
        <div className="detail-empty">
          <h2>Model bilgisi bulunamadı</h2>
          <p>{model} modeli için henüz detaylı bilgi eklenmemiştir.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* Back Button */}
      <button className="detail-back" onClick={onBack}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Tüm Arızalara Dön
      </button>

      {/* Hero Section */}
      <div className="detail-hero">
        <div className="detail-hero-content">
          <div className="detail-hero-badge">{faults[0]?.brand}</div>
          <h1 className="detail-hero-title">{detail.heroTitle}</h1>
          <p className="detail-hero-subtitle">{detail.heroSubtitle}</p>
          <div className="detail-hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{faults.length}</span>
              <span className="hero-stat-label">Kronik Arıza</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">
                {fmt(faults.reduce((s, f) => s + f.reportCount, 0))}
              </span>
              <span className="hero-stat-label">Toplam Doğrulama</span>
            </div>
            <div className="hero-stat">
              <span className="hero-stat-value">
                {fmtCost(
                  Math.min(...faults.map(f => f.costMin)),
                  Math.max(...faults.map(f => f.costMax))
                )}
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

      {/* Tab Navigation */}
      <div className="detail-tabs">
        {[
          { key: 'overview', label: '📋 Genel Bilgi' },
          { key: 'specs', label: '⚙️ Teknik Özellikler' },
          { key: 'faults', label: `🔴 Kronik Arızalar (${faults.length})` },
          { key: 'maintenance', label: '🛠️ Bakım Rehberi' },
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

      {/* Tab Content */}
      <div className="detail-content">

        {/* === OVERVIEW === */}
        {activeTab === 'overview' && (
          <div className="detail-section detail-fade-in">
            {/* Blog Intro */}
            <div className="blog-card">
              <div className="blog-card-header">
                <div className="blog-card-icon">📰</div>
                <h2>Model Hakkında</h2>
              </div>
              <p className="blog-text">{detail.blogIntro}</p>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="detail-two-col">
              <div className="sw-card sw-good">
                <h3><span className="sw-icon">✅</span> Güçlü Yönler</h3>
                <ul>
                  {detail.strengths.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div className="sw-card sw-bad">
                <h3><span className="sw-icon">⚠️</span> Zayıf Yönler</h3>
                <ul>
                  {detail.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              </div>
            </div>

            {/* Buyer Advice */}
            <div className="blog-card advice-card">
              <div className="blog-card-header">
                <div className="blog-card-icon">💡</div>
                <h2>Alıcı Tavsiyesi</h2>
              </div>
              <p className="blog-text">{detail.buyerAdvice}</p>
            </div>
          </div>
        )}

        {/* === SPECS === */}
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

        {/* === FAULTS === */}
        {activeTab === 'faults' && (
          <div className="detail-section detail-fade-in">
            {faults.map(fault => (
              <div key={fault.id} className="detail-fault-card">
                <div className="dfc-header">
                  <div>
                    <h3 className="dfc-title">{fault.description}</h3>
                    <p className="dfc-category">{fault.category} · {fault.year}</p>
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

                {/* Discussion Section for this fault */}
                <div className="dfc-discussion">
                  <CommentSection faultId={fault.id} user={user} onAuthRequest={onAuthRequest} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* === MAINTENANCE === */}
        {activeTab === 'maintenance' && (
          <div className="detail-section detail-fade-in">
            <div className="blog-card">
              <div className="blog-card-header">
                <div className="blog-card-icon">🛠️</div>
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
