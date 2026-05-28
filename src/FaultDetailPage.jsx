import React, { useEffect, useState, useMemo } from 'react';
import { CommentSection } from './comments.jsx';
import { useLiveEdit } from './liveEdit.jsx';
import { getFaultDateLabel, getFaultActivityInfo, formatRelativeTime, useNow } from './dateUtils.js';

const fmt = (n) => Number(n).toLocaleString('tr-TR');
const fmtCost = (min, max) => `₺${fmt(min)} – ₺${fmt(max)}`;

// Category icons
const CAT_ICONS = {
  Motor: '🔧',
  Şanzıman: '⚙️',
  Egzoz: '💨',
  Süspansiyon: '🔩',
  Elektrik: '⚡',
  Fren: '🛑',
};

export default function FaultDetailPage({ fault, activity, user, onAuthRequest, onBack, onModelClick, adminMode, onEdit, onDelete, onVerify, onSuggestFault, onForumChange }) {
  const { editMode, authed } = useLiveEdit();
  // Arıza düzenleme/silme: editMode de açık olmalı
  const showAdmin = adminMode && editMode;
  // Yorum yönetimi: admin girişi yeterli, editMode şartsız
  const commentAdminMode = authed || (adminMode && editMode);
  const catIcon = CAT_ICONS[fault.category] || '🔧';
  const now = useNow();
  const faultDate = getFaultDateLabel(fault);
  const faultActivity = useMemo(() => {
    if (!activity) return getFaultActivityInfo(fault, [], now);
    const relative = formatRelativeTime(activity.timestamp, fault?.id, now);
    return {
      ...activity,
      relative,
      shortLabel: `${relative} ${activity.label}`,
      fullLabel: `${relative} ${activity.label} · ${activity.exact}`,
    };
  }, [activity, fault, now]);
  const activityLabel = faultActivity.fullLabel;
  const activityExact = faultActivity.exact;

  // Verify state — check localStorage for per-user per-fault tracking
  const verifyKey = `ka_verified_${fault.id}`;
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (!user) {
      setVerified(false);
      return;
    }
    try {
      const list = JSON.parse(localStorage.getItem(verifyKey)) || [];
      setVerified(list.includes(user.id));
    } catch {
      setVerified(false);
    }
  }, [user, fault.id, verifyKey]);

  const handleVerify = () => {
    if (!user) { onAuthRequest(); return; }
    if (verified) return;
    try {
      const list = JSON.parse(localStorage.getItem(verifyKey)) || [];
      list.push(user.id);
      localStorage.setItem(verifyKey, JSON.stringify(list));
    } catch {}
    setVerified(true);
    if (onVerify) onVerify(fault);
  };

  useEffect(() => {
    const prev = document.title;
    document.title = `${fault.description} — ${fault.brand} ${fault.model} | KronikAraba`;
    return () => { document.title = prev; };
  }, [fault]);

  return (
    <div className="fault-detail-page">
      {/* Back navigation */}
      <div className="fd-back-nav">
        <button className="fd-back-btn" onClick={onBack}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Tüm Konulara Dön
        </button>
        {showAdmin && (
          <div className="fd-admin-actions">
            <button type="button" className="fd-admin-btn" onClick={() => onEdit(fault)} title="Düzenle">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Düzenle
            </button>
            <button type="button" className="fd-admin-btn fd-admin-del" onClick={() => { onDelete(fault.id); onBack(); }} title="Sil">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
              Sil
            </button>
          </div>
        )}
      </div>

      {/* Hero / OP Post header */}
      <div className="fd-hero">
        <div className="fd-hero-top">
          <div className="fd-hero-left">
            <div className="fd-breadcrumb">
              <span className="fd-cat-icon">{catIcon}</span>
              <span className="fd-cat-name">{fault.category}</span>
              <span className="fd-sep">›</span>
              <span className="fd-brand-link" onClick={() => onModelClick(fault.model)}>{fault.brand} {fault.model}</span>
            </div>
            <h1 className="fd-title">{fault.description}</h1>
            <p className="fd-subtitle">
              {fault.year} · {fault.motorType} · Kayıt: {faultDate} · <span title={`Son hareket: ${activityExact}`}>Son hareket: {activityLabel}</span>
            </p>
          </div>
          <div className="fd-hero-right">
            <span className={`risk-badge ${fault.risk}`}>{fault.risk} Risk</span>
          </div>
        </div>
      </div>

      {/* Info Grid — "İlk Mesaj" detayları */}
      <div className="fd-info-grid">
        <div className="fd-info-card">
          <div className="fd-info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <span className="fd-info-label">Belirtiler</span>
          <p className="fd-info-value fd-info-text">{fault.symptoms}</p>
        </div>
        <div className="fd-info-card">
          <div className="fd-info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>
          </div>
          <span className="fd-info-label">Tahmini Masraf</span>
          <p className="fd-info-value fd-info-cost">{fmtCost(fault.costMin, fault.costMax)}</p>
        </div>
        <div className="fd-info-card">
          <div className="fd-info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <span className="fd-info-label">Görülme KM</span>
          <p className="fd-info-value fd-info-km">{fault.kmDisplay}</p>
        </div>
        <div className="fd-info-card">
          <div className="fd-info-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg>
          </div>
          <span className="fd-info-label">Doğrulama</span>
          <p className="fd-info-value fd-info-reports">{fmt(fault.reportCount)}</p>
          <span className="fd-info-sub">kullanıcı doğruladı</span>
          <button
            type="button"
            className={`fd-verify-btn${verified ? ' verified' : ''}`}
            onClick={handleVerify}
            disabled={verified}
          >
            {verified ? (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Doğruladın</>
            ) : (
              <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3"/></svg> Ben de yaşadım</>
            )}
          </button>
        </div>
      </div>

      {/* Kontrol İpucu */}
      <div className="fd-tip-card">
        <div className="fd-tip-icon">💡</div>
        <div className="fd-tip-content">
          <span className="fd-tip-label">Kontrol İpucu</span>
          <p className="fd-tip-text">{fault.checkTip}</p>
        </div>
      </div>

      {/* Suggest Fault CTA */}
      <div className="fd-suggest-cta">
        <div className="fd-suggest-icon">📝</div>
        <div className="fd-suggest-content">
          <span className="fd-suggest-title">Farklı bir arıza mı yaşıyorsunuz?</span>
          <p className="fd-suggest-text">Topluluğa katkıda bulunun, yaşadığınız arızayı bildirin.</p>
        </div>
        <button type="button" className="fd-suggest-btn" onClick={() => onSuggestFault && onSuggestFault()}>Arıza Bildir</button>
      </div>

      {/* Tartışma / Yorumlar — her zaman açık */}
      <div className="fd-discussion">
        <div className="fd-discussion-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <div>
            <h2>Tartışma</h2>
            <p className="fd-discussion-sub">Metin yazın veya bagaj / motor / arıza fotoğrafı ekleyin (bulutta saklanır).</p>
          </div>
        </div>
        <CommentSection
          faultId={fault.id}
          fault={fault}
          user={user}
          onAuthRequest={onAuthRequest}
          adminMode={commentAdminMode}
          alwaysOpen={true}
          onForumChange={onForumChange}
        />
      </div>
    </div>
  );
}
