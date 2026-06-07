import React from 'react';

/**
 * SkeletonCard — Arıza kartı iskelet yükleyici
 */
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card-header">
        <div className="skeleton-line skeleton-line-sm" />
        <div className="skeleton-badge" />
      </div>
      <div className="skeleton-line skeleton-line-lg" />
      <div className="skeleton-line skeleton-line-md" />
      <div className="skeleton-card-footer">
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
        <div className="skeleton-chip" />
      </div>
    </div>
  );
}

/**
 * SkeletonList — Birden fazla kart iskelet listesi
 */
export function SkeletonList({ count = 6 }) {
  return (
    <div className="skeleton-list" role="status" aria-label="Yükleniyor...">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/**
 * SkeletonBrandGrid — Markalar sayfası için iskelet grid
 */
export function SkeletonBrandGrid({ count = 8 }) {
  return (
    <div className="brands-grid skeleton-brand-grid" role="status" aria-label="Markalar yükleniyor...">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-brand-card" aria-hidden="true">
          <div className="skeleton-brand-logo" />
          <div className="skeleton-brand-body">
            <div className="skeleton-line skeleton-line-md" />
            <div className="skeleton-line skeleton-line-sm" />
            <div className="skeleton-brand-chips">
              <div className="skeleton-chip" />
              <div className="skeleton-chip" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonDetailPage — Model/arıza detay sayfası iskeleti
 */
export function SkeletonDetailPage() {
  return (
    <div className="skeleton-detail-page" role="status" aria-label="Sayfa yükleniyor...">
      <div className="skeleton-hero">
        <div className="skeleton-line skeleton-line-sm" style={{ width: 80 }} />
        <div className="skeleton-line skeleton-line-xl" />
        <div className="skeleton-line skeleton-line-md" />
        <div className="skeleton-hero-stats">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-stat-block">
              <div className="skeleton-line skeleton-line-lg" />
              <div className="skeleton-line skeleton-line-sm" />
            </div>
          ))}
        </div>
      </div>
      <div className="skeleton-tabs">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton-tab-btn" />)}
      </div>
      <SkeletonList count={3} />
    </div>
  );
}
