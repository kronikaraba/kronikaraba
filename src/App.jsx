import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { riskLevels } from './data.js';
import { loadCategories, loadMotorTypes } from './siteContent.js';
import { AuthModal, loadUser, logout } from './auth.jsx';
import { CommentSection, getCommentCount, buildCommentCountMap, buildFaultActivityMap } from './comments.jsx';
import ModelDetailPage from './ModelDetailPage.jsx';
import FaultDetailPage from './FaultDetailPage.jsx';
import { loadAdminFaults, saveAdminFaults, loadAdminModels, saveAdminModels, loadPending, savePending, loadForum, loadArticles, saveArticles } from './adminStorage.js';
import { normalizeFault, getPendingId } from './faultUtils.js';
import { LiveEditProvider, Editable, useLiveEdit } from './liveEdit.jsx';
import FaultEditModal from './faultEditModal.jsx';
import ModelEditModal from './modelEditModal.jsx';
import AdminHub from './adminHub.jsx';
import { MarkalarlPage, UzmanPage, MasrafPage } from './Pages.jsx';
import ArticlesPage, { ArticleDetailPage } from './ArticlesPage.jsx';
import ArticleEditModal from './ArticleEditModal.jsx';
import LandingPage from './LandingPage.jsx';
import UserFaultSuggestModal from './UserFaultSuggestModal.jsx';
import { getFaultActivityInfo } from './dateUtils.js';
import { popularModelTags } from './popularModels.js';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('tr-TR');
const fmtCost = (min, max) => `₺${fmt(min)} – ₺${fmt(max)}`;
const matchesModelQuery = (fault, query) => {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  const brand = String(fault.brand || '').toLowerCase();
  const model = String(fault.model || '').toLowerCase();
  return model.includes(q) || `${brand} ${model}`.includes(q);
};

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ content, search, onSearch, onAdd, user, onLogin, onRegister, onLogout, onMenuToggle, onLogoClick, onNavAction, activeView, onSuggest }) {
  const nb = content.navbar;
  const { editMode, authed } = useLiveEdit();

  const handleLogoClick = (e) => {
    e.preventDefault();
    onLogoClick && onLogoClick();
  };

  return (
    <nav className="navbar">
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Menü">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <a className="navbar-logo" href="#" onClick={handleLogoClick}>
        <img className="navbar-logo-img" src="/brand/kronikaraba-logo.png" alt={nb.brandName || 'KronikArıza'} />
      </a>

      <div className="navbar-nav">
        <a href="/" className={`nav-link${activeView === 'home' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('reset'); }}>
          <Editable value={nb.navLinks.home} path={['navbar', 'navLinks', 'home']} />
        </a>
        <a href="/markalar" className={`nav-link${activeView === 'markalar' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('brands'); }}>
          <Editable value={nb.navLinks.brands} path={['navbar', 'navLinks', 'brands']} />
        </a>
        <a href="/makaleler" className={`nav-link${activeView === 'articles' || activeView === 'articleDetail' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('articles'); }}>
          <Editable value={nb.navLinks.articles || 'Makaleler'} path={['navbar', 'navLinks', 'articles']} />
        </a>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {editMode && (
            <span className="live-ph-edit">
              <Editable value={nb.searchPlaceholder} path={['navbar', 'searchPlaceholder']} />
            </span>
          )}
          <input
            id="global-search" type="text"
            placeholder={nb.searchPlaceholder}
            value={search} onChange={e => onSearch(e.target.value)} autoComplete="off"
          />
        </div>
        {authed ? (
          <button id="btn-ariza-ekle" className="navbar-btn" onClick={onAdd} type="button">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="btn-label">
              {editMode ? (
                <Editable value={nb.addBtnText} path={['navbar', 'addBtnText']} />
              ) : (
                nb.addBtnText
              )}
            </span>
          </button>
        ) : (
          <button id="btn-ariza-ekle-user" className="navbar-btn" onClick={onSuggest}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className="btn-label">Arıza Bildir</span>
          </button>
        )}
        <div className="navbar-auth">
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : editMode ? (
            <>
              <span className="btn-login"><Editable value={nb.loginText} path={['navbar', 'loginText']} /></span>
              <span className="btn-register"><Editable value={nb.registerText} path={['navbar', 'registerText']} /></span>
            </>
          ) : (
            <>
              <button className="btn-login" onClick={onLogin}>{nb.loginText}</button>
              <button className="btn-register" onClick={onRegister}>{nb.registerText}</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── UserMenu ─────────────────────────────────────────────────────────────────
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const { authed, editMode, setEditMode, pendingCount, openHub, adminCallbacks } = useLiveEdit();
  const isAdminUser = authed || user?.isAdmin === true;
  const runAdminAction = (action) => {
    action();
    setOpen(false);
  };

  return (
    <div className="user-menu">
      <button className="user-avatar-btn" onClick={() => setOpen(o => !o)}>
        <div className="avatar-circle">{user.username[0].toUpperCase()}</div>
        <span>{user.username}</span>
      </button>
      {open && (
        <div className="user-dropdown" onClick={() => setOpen(false)}>
          <div className="user-dropdown-item" style={{ fontWeight: 700, color: 'var(--gray-900)', cursor: 'default' }}>
            👤 {user.username}
          </div>
          <div className="user-dropdown-item" style={{ fontSize: 11, color: 'var(--gray-400)', cursor: 'default' }}>{user.email}</div>
          {isAdminUser && (
            <>
              <div className="user-dropdown-sep" />
              <div className="user-dropdown-admin-head">
                <span>Admin</span>
                <strong>{editMode ? 'Düzenleme açık' : 'Önizleme modu'}</strong>
              </div>
              <div className="user-dropdown-admin-grid">
                <button type="button" onClick={() => runAdminAction(() => openHub('pending'))}>Yönetim</button>
                <button type="button" onClick={() => runAdminAction(() => setEditMode(m => !m))}>
                  {editMode ? 'Önizleme' : 'Düzenle'}
                </button>
              </div>
              {editMode && (
                <div className="user-dropdown-admin-grid user-dropdown-admin-grid-wide">
                  <button type="button" onClick={() => runAdminAction(() => (adminCallbacks.onNewFault || (() => {}))())}>Arıza ekle</button>
                  <button type="button" onClick={() => runAdminAction(() => (adminCallbacks.onNewModel || (() => {}))())}>Model ekle</button>
                  <button type="button" onClick={() => runAdminAction(() => openHub('forum'))}>Tartışma</button>
                  <button type="button" onClick={() => runAdminAction(() => openHub('pending'))}>
                    Öneriler{pendingCount > 0 ? ` (${pendingCount})` : ''}
                  </button>
                  <button type="button" onClick={() => runAdminAction(() => openHub('categories'))}>Listeler</button>
                </div>
              )}
            </>
          )}
          <div className="user-dropdown-sep" />
          <button className="user-dropdown-item danger" onClick={onLogout}>Çıkış Yap</button>
        </div>
      )}
    </div>
  );
}

// ── Collapsible sidebar filter row ───────────────────────────────────────────
function FilterRow({ label, isOpen, onToggle, hasValue, children }) {
  return (
    <>
      <div
        className={`filter-row${isOpen ? ' open' : ''}${hasValue ? ' active' : ''}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onToggle()}
      >
        <span className="filter-row-label">{label}</span>
        {hasValue && <span className="filter-row-badge">✓</span>}
        <span className="filter-row-arrow">›</span>
      </div>
      {isOpen && (
        <div className="filter-panel">
          {children}
        </div>
      )}
    </>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ content, filters, onFilters, allData, isOpen, onClose, onOpenAdvanced, isMobile, onNavAction, activeView, categories, motorTypes }) {
  const [open, setOpen] = useState({
    brand: false, model: false, category: false, motorType: false, risk: false
  });

  const toggle = (key) => setOpen(p => ({ ...p, [key]: !p[key] }));
  const setFilter = (key, value) =>
    onFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));

  const clearAll = () => {
    onFilters({
      brand: '', model: '', yearMin: '', yearMax: '', motorType: '',
      kmMin: '', category: '', costMin: '', costMax: '', risk: '', minReports: ''
    });
    setOpen({
      brand: false, model: false, category: false, motorType: false, risk: false
    });
  };

  const brandList = useMemo(() => [...new Set(allData.map(f => f.brand))].sort(), [allData]);
  const categoryList = categories || [];
  const motorTypeList = motorTypes || [];

  const brandCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.brand] = (m[f.brand] || 0) + 1; }); return m;
  }, [allData]);
  const modelCounts = useMemo(() => {
    const m = {};
    popularModelTags.forEach(model => {
      m[model] = allData.filter(f => matchesModelQuery(f, model)).length;
    });
    return m;
  }, [allData]);
  const catCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.category] = (m[f.category] || 0) + 1; }); return m;
  }, [allData]);
  const riskCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.risk] = (m[f.risk] || 0) + 1; }); return m;
  }, [allData]);
  const motorCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.motorType] = (m[f.motorType] || 0) + 1; }); return m;
  }, [allData]);

  const hasAny = Object.values(filters).some(v => v !== '');
  const nb = content.navbar;

  return (
    <aside className={`sidebar ${isMobile ? 'sidebar-mobile' : 'sidebar-desktop'}${isOpen ? ' open' : ''}`}>
      {isMobile && (
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Kapat">✕</button>
      )}

      {isMobile && (
        <div className="sidebar-mobile-nav">
          <div className="sidebar-section-title" style={{ marginTop: 0 }}>Menü</div>
          <a href="/" className={`sidebar-nav-link${activeView === 'home' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('reset'); }}>
            <span>🏠</span> {nb.navLinks.home}
          </a>
          <a href="/markalar" className={`sidebar-nav-link${activeView === 'markalar' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('brands'); }}>
            <span>🏢</span> {nb.navLinks.brands}
          </a>
          <a href="/makaleler" className={`sidebar-nav-link${activeView === 'articles' || activeView === 'articleDetail' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('articles'); }}>
            <span>📰</span> {nb.navLinks.articles || 'Makaleler'}
          </a>
          <div className="sidebar-divider" style={{ margin: '15px 0' }} />
        </div>
      )}

      <div className="sidebar-section-title">
        <Editable value={content.home.filterTitle} path={['home', 'filterTitle']} />
      </div>

      {/* 1. Marka */}
      <FilterRow label="Marka" isOpen={open.brand} onToggle={() => toggle('brand')} hasValue={!!filters.brand}>
        {brandList.map(b => (
          <div key={b} className={`filter-option${filters.brand === b ? ' selected' : ''}`} onClick={() => setFilter('brand', b)}>
            {b} <span className="opt-count">{brandCounts[b] || 0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 2. Model */}
      <FilterRow label="Model" isOpen={open.model} onToggle={() => toggle('model')} hasValue={!!filters.model}>
        {popularModelTags.map(model => (
          <div key={model} className={`filter-option${filters.model === model ? ' selected' : ''}`} onClick={() => setFilter('model', model)}>
            {model} <span className="opt-count">{modelCounts[model] || 0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 3. Arıza Kategorisi */}
      <FilterRow label="Arıza Kategorisi" isOpen={open.category} onToggle={() => toggle('category')} hasValue={!!filters.category}>
        {categoryList.map(c => (
          <div key={c} className={`filter-option${filters.category === c ? ' selected' : ''}`} onClick={() => setFilter('category', c)}>
            {c} <span className="opt-count">{catCounts[c] || 0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 4. Motor Tipi */}
      <FilterRow label="Motor Tipi" isOpen={open.motorType} onToggle={() => toggle('motorType')} hasValue={!!filters.motorType}>
        {motorTypeList.map(mt => (
          <div key={mt} className={`filter-option${filters.motorType === mt ? ' selected' : ''}`} onClick={() => setFilter('motorType', mt)}>
            {mt} <span className="opt-count">{motorCounts[mt] || 0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 5. Risk Seviyesi */}
      <FilterRow label="Risk Seviyesi" isOpen={open.risk} onToggle={() => toggle('risk')} hasValue={!!filters.risk}>
        {riskLevels.map(r => (
          <div key={r} className={`filter-option${filters.risk === r ? ' selected' : ''}`} onClick={() => setFilter('risk', r)}>
            <span className={`risk-dot ${r}`} />
            {r} <span className="opt-count">{riskCounts[r] || 0}</span>
          </div>
        ))}
      </FilterRow>

      <button className="sidebar-adv-btn" onClick={onOpenAdvanced}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        Detaylı Arama
      </button>

      {hasAny && (
        <button className="sidebar-clear-btn" onClick={clearAll}>✕ Filtreleri Temizle</button>
      )}
    </aside>
  );
}

// ── Advanced Filter Modal ────────────────────────────────────────────────────────
function AdvancedFilterModal({ isOpen, onClose, filters, onFilters }) {
  const [localFilters, setLocalFilters] = useState({ ...filters });

  useEffect(() => {
    if (isOpen) {
      setLocalFilters({ ...filters });
    }
  }, [isOpen, filters]);

  if (!isOpen) return null;

  const handleApply = () => {
    onFilters(localFilters);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      ...localFilters,
      model: '',
      yearMin: '',
      yearMax: '',
      kmMin: '',
      costMin: '',
      costMax: '',
      minReports: ''
    };
    setLocalFilters(cleared);
    onFilters(cleared);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="filter-modal" onClick={e => e.stopPropagation()}>
        <div className="filter-modal-header">
          <div className="filter-modal-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <h3>Detaylı Arama</h3>
          </div>
          <button className="filter-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="filter-modal-body">
          {/* 1. Model adı arama */}
          <div className="filter-group">
            <label className="filter-label">Model Adı</label>
            <input
              className="filter-input-text"
              type="text"
              placeholder="örn. Passat, Golf, 320i"
              value={localFilters.model || ''}
              onChange={e => setLocalFilters(p => ({ ...p, model: e.target.value }))}
            />
          </div>

          {/* 2. Model Yılı Aralığı */}
          <div className="filter-group">
            <label className="filter-label">Model Yılı Aralığı</label>
            <div className="filter-row-inputs">
              <input
                className="filter-input-number"
                type="number"
                placeholder="En Eski Yıl"
                value={localFilters.yearMin || ''}
                onChange={e => setLocalFilters(p => ({ ...p, yearMin: e.target.value }))}
              />
              <span className="filter-input-sep">-</span>
              <input
                className="filter-input-number"
                type="number"
                placeholder="En Yeni Yıl"
                value={localFilters.yearMax || ''}
                onChange={e => setLocalFilters(p => ({ ...p, yearMax: e.target.value }))}
              />
            </div>
          </div>

          {/* 3. Kilometre Aralığı */}
          <div className="filter-group">
            <label className="filter-label">Görülme Kilometresi (En Az)</label>
            <input
              className="filter-input-text"
              type="number"
              placeholder="örn. 60000"
              value={localFilters.kmMin || ''}
              onChange={e => setLocalFilters(p => ({ ...p, kmMin: e.target.value }))}
            />
          </div>

          {/* 4. Tahmini Masraf Aralığı */}
          <div className="filter-group">
            <label className="filter-label">Tahmini Masraf Aralığı (₺)</label>
            <div className="filter-row-inputs">
              <input
                className="filter-input-number"
                type="number"
                placeholder="Min ₺"
                value={localFilters.costMin || ''}
                onChange={e => setLocalFilters(p => ({ ...p, costMin: e.target.value }))}
              />
              <span className="filter-input-sep">-</span>
              <input
                className="filter-input-number"
                type="number"
                placeholder="Maks ₺"
                value={localFilters.costMax || ''}
                onChange={e => setLocalFilters(p => ({ ...p, costMax: e.target.value }))}
              />
            </div>
          </div>

          {/* 5. Kullanıcı Doğrulama sayısı */}
          <div className="filter-group">
            <label className="filter-label">Minimum Kullanıcı Doğrulaması</label>
            <input
              className="filter-input-text"
              type="number"
              placeholder="örn. 50"
              value={localFilters.minReports || ''}
              onChange={e => setLocalFilters(p => ({ ...p, minReports: e.target.value }))}
            />
          </div>
        </div>

        <div className="filter-modal-footer">
          <button className="btn-filter-clear" onClick={handleClear}>Temizle</button>
          <button className="btn-filter-apply" onClick={handleApply}>Uygula</button>
        </div>
      </div>
    </div>
  );
}

// Category icons mapping
const CAT_ICONS = {
  Motor: '🔧',
  Şanzıman: '⚙️',
  Egzoz: '💨',
  Süspansiyon: '🔩',
  Elektrik: '⚡',
  Fren: '🛑',
};

// ── Fault Card (forum thread row style) ───────────────────────────────────────────
function FaultCard({ fault, user, onAuthRequest, onModelClick, onEdit, onDelete, adminMode, onClick, commentCount: commentCountProp, activity }) {
  const { editMode } = useLiveEdit();
  const showAdmin = adminMode && editMode;
  const catIcon = CAT_ICONS[fault.category] || '🔧';
  const commentCount = commentCountProp != null ? commentCountProp : getCommentCount(fault.id);
  const faultActivity = activity || getFaultActivityInfo(fault);

  return (
    <article 
      className={`thread-row${showAdmin ? ' thread-row-editable' : ''}`}
      onClick={() => onClick && onClick(fault)}
    >
      <div className="thread-main">
        <div className="thread-icon-wrap" title={fault.category}>
          <span className="thread-cat-icon">{catIcon}</span>
        </div>
        <div className="thread-details">
          <div className="thread-header">
            <span 
              className="thread-model-link" 
              onClick={(e) => {
                e.stopPropagation();
                onModelClick && onModelClick(fault.model);
              }}
              title="Model detay sayfasına git"
            >
              {fault.brand} {fault.model}
            </span>
            <span className="thread-header-dot">·</span>
            <h2 className="thread-title">{fault.description}</h2>
            <span className="thread-header-dot">·</span>
            <span className="thread-date" title={`Son hareket: ${faultActivity.exact}`}>{faultActivity.fullLabel}</span>
          </div>
          <div className="thread-meta">
            <span className="thread-cat-badge">{fault.category}</span>
            <span className="thread-meta-text">
              {fault.year} · {fault.motorType} · {fault.kmDisplay}
            </span>
          </div>
        </div>
      </div>

      <div className="thread-metrics-wrapper">
        <div className="thread-metrics">
          <span className={`risk-badge-mini ${fault.risk}`} title={`Risk Seviyesi: ${fault.risk}`}>
            {fault.risk}
          </span>
          
          <div className="thread-metric-item" title={`${commentCount} Yorum`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="thread-metric-val">{commentCount}</span>
          </div>

          <div className="thread-metric-item" title={`${fault.reportCount} Kullanıcı Doğruladı`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span className="thread-metric-val">{fault.reportCount}</span>
          </div>
        </div>

        {showAdmin && (
          <div className="thread-admin-actions" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="thread-admin-btn" 
              onClick={() => onEdit(fault)} 
              title="Düzenle"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button 
              type="button" 
              className="thread-admin-btn thread-admin-del" 
              onClick={() => onDelete(fault.id)} 
              title="Sil"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ── Active pills ──────────────────────────────────────────────────────────────
function ActivePills({ filters, onFilters }) {
  const pills = [];
  if (filters.brand) pills.push({ label: `Marka: ${filters.brand}`, key: 'brand' });
  if (filters.model) pills.push({ label: `Model: ${filters.model}`, key: 'model' });
  if (filters.risk) pills.push({ label: `Risk: ${filters.risk}`, key: 'risk' });
  if (filters.category) pills.push({ label: `Kategori: ${filters.category}`, key: 'category' });
  if (filters.costMin) pills.push({ label: `Min Masraf: ₺${fmt(filters.costMin)}`, key: 'costMin' });
  if (filters.costMax) pills.push({ label: `Maks Masraf: ₺${fmt(filters.costMax)}`, key: 'costMax' });
  if (filters.kmMin) pills.push({ label: `Min KM: ${fmt(filters.kmMin)}`, key: 'kmMin' });
  if (!pills.length) return null;
  return (
    <div className="active-pills">
      {pills.map(p => (
        <span key={p.key} className="pill">
          {p.label}
          <button
            className="pill-x"
            onClick={() => onFilters(prev => ({ ...prev, [p.key]: '' }))}
            aria-label={`${p.label} filtresini kaldır`}
          >×</button>
        </span>
      ))}
    </div>
  );
}

// ── Sort ──────────────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'reports-desc', label: 'En Çok Doğrulanan' },
  { value: 'cost-desc', label: 'En Yüksek Masraf' },
  { value: 'cost-asc', label: 'En Düşük Masraf' },
  { value: 'risk-desc', label: 'En Yüksek Risk' },
  { value: 'brand-asc', label: 'Marka (A→Z)' },
];
const RISK_ORDER = { YÜKSEK: 3, ORTA: 2, DÜŞÜK: 1 };
function sortData(data, sort) {
  const d = [...data];
  switch (sort) {
    case 'reports-desc': return d.sort((a, b) => b.reportCount - a.reportCount);
    case 'cost-desc': return d.sort((a, b) => b.avgCost - a.avgCost);
    case 'cost-asc': return d.sort((a, b) => a.avgCost - b.avgCost);
    case 'risk-desc': return d.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
    case 'brand-asc': return d.sort((a, b) => a.brand.localeCompare(b.brand, 'tr'));
    default: return d;
  }
}

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [message, onDone]);
  return (
    <div className="toast">
      <span>✅</span> {message}
    </div>
  );
}

const safeGetHistoryState = () => {
  try {
    if (typeof window !== 'undefined' && window.history && window.history.state) {
      const s = window.history.state;
      if (s && typeof s === 'object') {
        return s;
      }
    }
  } catch (e) {
    console.error("Error reading history state:", e);
  }
  return null;
};

const EMPTY_FILTERS = {
  brand: '', model: '', yearMin: '', yearMax: '', motorType: '',
  kmMin: '', category: '', costMin: '', costMax: '', risk: '', minReports: ''
};

const VIEW_PATHS = {
  home: '/',
  markalar: '/markalar',
  uzman: '/uzman-gorusleri',
  masraf: '/masraf',
  articles: '/makaleler',
  articleDetail: '/makaleler',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'kayit';
}

function makeFaultPath(fault) {
  const title = `${fault.brand || ''} ${fault.model || ''} ${fault.fault || fault.description || ''}`;
  return `/ariza/${slugify(title)}-${fault.id}`;
}

function makeModelPath(model) {
  return `/model/${slugify(model)}`;
}

function findModelBySlug(slug, faults = [], models = {}) {
  const names = [...new Set([
    ...Object.keys(models || {}),
    ...faults.map(f => f.model),
  ].filter(Boolean))];
  return names.find(name => slugify(name) === slug) || null;
}

function routeStateFromPath(faults = [], models = {}) {
  if (typeof window === 'undefined') return null;
  const pathname = decodeURIComponent(window.location.pathname || '/').replace(/\/+$/, '') || '/';

  if (pathname === '/markalar') return { activeView: 'markalar', selectedModel: null, selectedFaultId: null, forceExplorer: false };
  if (pathname === '/uzman-gorusleri') return { activeView: 'uzman', selectedModel: null, selectedFaultId: null, forceExplorer: false };
  if (pathname === '/masraf') return { activeView: 'masraf', selectedModel: null, selectedFaultId: null, forceExplorer: false };
  if (pathname === '/makaleler') return { activeView: 'articles', selectedModel: null, selectedFaultId: null, forceExplorer: false };
  if (pathname.startsWith('/makaleler/')) {
    const id = pathname.split('/').filter(Boolean).pop() || '';
    return { activeView: 'articleDetail', selectedModel: null, selectedFaultId: null, selectedArticleId: id, forceExplorer: false };
  }
  if (pathname === '/arizalar') return { activeView: 'home', selectedModel: null, selectedFaultId: null, forceExplorer: true };

  if (pathname.startsWith('/ariza/')) {
    const segment = pathname.split('/').filter(Boolean).pop() || '';
    const id = segment.split('-').pop();
    return { activeView: 'home', selectedModel: null, selectedFaultId: id, forceExplorer: false };
  }

  if (pathname.startsWith('/model/')) {
    const slug = pathname.split('/').filter(Boolean).pop() || '';
    return {
      activeView: 'home',
      selectedModel: findModelBySlug(slug, faults, models),
      selectedModelSlug: slug,
      selectedFaultId: null,
      forceExplorer: false,
    };
  }

  return null;
}

// ── App ───────────────────────────────────────────────────────────────────────
function AppContent() {
  const {
    content, editMode, authed,
    hubOpen, hubTab, setHubOpen, setHubTab, refreshPending,
    registerAdminCallbacks,
    handleLogout: adminLogoutContext,
    loginAdmin,
  } = useLiveEdit();
  const [data, setData] = useState([]);
  const [models, setModels] = useState({});
  const [categories, setCategories] = useState([]);
  const [motorTypes, setMotorTypes] = useState([]);
  const [forum, setForum] = useState({});
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initAll() {
      try {
        const [loadedData, loadedModels, loadedCats, loadedMotors, loadedForum, loadedArticles] = await Promise.all([
          loadAdminFaults(),
          loadAdminModels(),
          loadCategories(),
          loadMotorTypes(),
          loadForum(),
          loadArticles()
        ]);
        setData(loadedData);
        setModels(loadedModels);
        setCategories(loadedCats);
        setMotorTypes(loadedMotors);
        setForum(loadedForum);
        setArticles(loadedArticles);

        const initialNav = routeStateFromPath(loadedData, loadedModels) || safeGetHistoryState();
        const stateId = initialNav?.selectedFaultId;
        if (initialNav) {
          setActiveView(initialNav.activeView || 'home');
          setSelectedModel(initialNav.selectedModel || (initialNav.selectedModelSlug ? findModelBySlug(initialNav.selectedModelSlug, loadedData, loadedModels) : null));
          setSelectedArticleId(initialNav.selectedArticleId || null);
          setForceExplorer(Boolean(initialNav.forceExplorer));
          setSearch(initialNav.search || '');
          if (initialNav.filters && typeof initialNav.filters === 'object') {
            setFilters(initialNav.filters);
          }
        }
        if (stateId) {
          const found = loadedData.find(f => String(f.id) === String(stateId));
          if (found) {
            setSelectedFault(found);
          }
        } else if (initialNav?.selectedFaultId === null) {
          setSelectedFault(null);
        }
      } catch (err) {
        console.error("Failed to load initial data", err);
      } finally {
        setLoading(false);
      }
    }
    initAll();
  }, []);

  const historyState = safeGetHistoryState();
  const initialRouteState = routeStateFromPath() || historyState || {};

  const [search, setSearch] = useState(() => initialRouteState.search || '');
  const [sort, setSort] = useState('reports-desc');
  const [filters, setFilters] = useState(() => initialRouteState.filters || EMPTY_FILTERS);
  const [editFault, setEditFault] = useState(null);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(() => loadUser());
  const [authModal, setAuthModal] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => initialRouteState.selectedModel || null);
  const [selectedFault, setSelectedFault] = useState(null);
  const [activeView, setActiveView] = useState(() => initialRouteState.activeView || 'home');
  const [editModel, setEditModel] = useState(null);
  const [editArticle, setEditArticle] = useState(null);
  const [selectedArticleId, setSelectedArticleId] = useState(() => initialRouteState.selectedArticleId || null);
  const [forceExplorer, setForceExplorer] = useState(() => initialRouteState.forceExplorer || false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const PAGE_SIZE = 20;
  const adminMode = authed && editMode;
  const articleAdminMode = authed || user?.isAdmin === true;

  // ── Browser history helpers ────────────────────────────────────────────────
  const skipPushRef = useRef(false); // flag to skip pushState during popstate handling

  const buildRoutePath = useCallback((state) => {
    if (state.selectedFaultId) {
      const fault = data.find(f => String(f.id) === String(state.selectedFaultId))
        || (selectedFault && String(selectedFault.id) === String(state.selectedFaultId) ? selectedFault : null);
      return fault ? makeFaultPath(fault) : `/ariza/${state.selectedFaultId}`;
    }
    if (state.selectedArticleId) return `/makaleler/${encodeURIComponent(state.selectedArticleId)}`;
    if (state.selectedModel) return makeModelPath(state.selectedModel);
    if (state.activeView && state.activeView !== 'home') return VIEW_PATHS[state.activeView] || '/';
    const hasFilters = Object.values(state.filters || {}).some(v => v !== '');
    if (state.forceExplorer || state.search || hasFilters) return '/arizalar';
    return '/';
  }, [data, selectedFault]);

  const buildNavState = useCallback(() => ({
    activeView,
    selectedModel,
    selectedFaultId: selectedFault?.id || routeStateFromPath(data, models)?.selectedFaultId || null,
    selectedArticleId,
    forceExplorer,
    search,
    filters,
  }), [activeView, selectedModel, selectedFault, selectedArticleId, forceExplorer, search, filters, data, models]);

  // Push a new history entry whenever a meaningful navigation happens
  const pushNav = useCallback((overrides = {}) => {
    if (skipPushRef.current) return;
    const state = {
      activeView: overrides.activeView ?? activeView,
      selectedModel: overrides.selectedModel !== undefined ? overrides.selectedModel : selectedModel,
      selectedFaultId: overrides.selectedFaultId !== undefined ? overrides.selectedFaultId : (selectedFault?.id || null),
      selectedArticleId: overrides.selectedArticleId !== undefined ? overrides.selectedArticleId : selectedArticleId,
      forceExplorer: overrides.forceExplorer !== undefined ? overrides.forceExplorer : forceExplorer,
      search: overrides.search !== undefined ? overrides.search : search,
      filters: overrides.filters !== undefined ? overrides.filters : filters,
    };
    window.history.pushState(state, '', buildRoutePath(state));
  }, [activeView, selectedModel, selectedFault, selectedArticleId, forceExplorer, search, filters, buildRoutePath]);

  // Replace initial history entry so back from first page works
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.history && !window.history.state) {
        const routeState = routeStateFromPath(data, models);
        const state = routeState ? { ...buildNavState(), ...routeState } : buildNavState();
        const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
        window.history.replaceState(state, '', routeState ? currentUrl : buildRoutePath(state));
      }
    } catch (e) {
      console.error("Error setting initial replaceState:", e);
    }
  }, [buildNavState, buildRoutePath, data, models]); // only acts while state is empty

  // Listen for browser back/forward
  useEffect(() => {
    const handlePopState = (e) => {
      try {
        const fallbackState = routeStateFromPath(data, models) || {
          activeView: 'home',
          selectedModel: null,
          selectedFaultId: null,
          selectedArticleId: null,
          forceExplorer: false,
          search: '',
          filters: EMPTY_FILTERS,
        };
        const s = e.state && typeof e.state === 'object' ? e.state : fallbackState;
        skipPushRef.current = true;
        setActiveView(s.activeView || 'home');
        setSelectedModel(s.selectedModel || (s.selectedModelSlug ? findModelBySlug(s.selectedModelSlug, data, models) : null));
        setSelectedArticleId(s.selectedArticleId || null);
        // Restore selectedFault from ID
        if (s.selectedFaultId) {
          const found = data.find(f => String(f.id) === String(s.selectedFaultId));
          setSelectedFault(found || null);
        } else {
          setSelectedFault(null);
        }
        setForceExplorer(s.forceExplorer || false);
        setSearch(s.search || '');
        if (s.filters && typeof s.filters === 'object') {
          setFilters(s.filters);
        } else {
          setFilters(EMPTY_FILTERS);
        }
        skipPushRef.current = false;
      } catch (err) {
        console.error("Error in popstate handler:", err);
        skipPushRef.current = false;
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [data, models]);

  const openSuggest = () => {
    // Yönetici: doğrudan yayınla; onay kuyruğuna gönderme
    if (authed || user?.isAdmin) {
      setEditFault('new');
      return;
    }
    if (!user) { openAuth('login'); return; }
    setSuggestOpen(true);
  };

  const showLanding = activeView === 'home' && !search && !Object.values(filters).some(v => v !== '') && !forceExplorer;

  useEffect(() => {
    const titles = {
      home: 'KronikArıza — Araç Kronik Arıza Veritabanı',
      markalar: 'Markalar | KronikAraba',
      uzman: 'Uzman Görüşleri | KronikAraba',
      masraf: 'Masraf Hesaplama | KronikAraba',
      articles: 'Makaleler | KronikAraba',
      articleDetail: 'Makale | KronikAraba',
    };
    document.title = titles[activeView] || titles.home;
  }, [activeView]);

  useEffect(() => {
    registerAdminCallbacks({
      onNewFault: () => setEditFault('new'),
      onNewModel: () => setEditModel({ key: null, data: null }),
    });
  }, [registerAdminCallbacks]);

  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash === '#/admin') {
        history.replaceState(null, '', '/');
        setAuthModal('login');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleNavAction = useCallback((action) => {
    setSelectedModel(null);
    setSelectedFault(null);
    setSelectedArticleId(null);
    setSidebarOpen(false);
    const emptyFilters = EMPTY_FILTERS;
    if (action === 'reset') {
      setActiveView('home');
      setSearch('');
      setFilters(emptyFilters);
      setSort('reports-desc');
      setForceExplorer(false);
      pushNav({ activeView: 'home', selectedModel: null, selectedFaultId: null, selectedArticleId: null, forceExplorer: false, search: '', filters: emptyFilters });
    } else if (action === 'brands') {
      setActiveView('markalar');
      pushNav({ activeView: 'markalar', selectedModel: null, selectedFaultId: null, selectedArticleId: null });
    } else if (action === 'uzman') {
      setActiveView('uzman');
      pushNav({ activeView: 'uzman', selectedModel: null, selectedFaultId: null, selectedArticleId: null });
    } else if (action === 'masraf') {
      setActiveView('masraf');
      pushNav({ activeView: 'masraf', selectedModel: null, selectedFaultId: null, selectedArticleId: null });
    } else if (action === 'articles') {
      setActiveView('articles');
      pushNav({ activeView: 'articles', selectedModel: null, selectedFaultId: null, selectedArticleId: null });
    }
  }, [pushNav]);

  const goHome = () => {
    handleNavAction('reset');
  };

  const persistFaults = useCallback(async (next) => {
    setData(next);
    return saveAdminFaults(next);
  }, []);

  const handleLogin = (u) => { setUser(u); setToast(`Hoş geldiniz, ${u.username}!`); };
  const handleLogout = () => {
    logout();
    adminLogoutContext();
    setUser(null);
    setToast('Çıkış yapıldı.');
  };
  const openAuth = (tab = 'login') => setAuthModal(tab);

  const filtered = useMemo(() => {
    let d = data;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      d = d.filter(f => {
        const brand = f.brand.toLowerCase();
        const model = f.model.toLowerCase();
        return (
          brand.includes(q) ||
          model.includes(q) ||
          `${brand} ${model}`.includes(q) ||
          f.fault.toLowerCase().includes(q) ||
          (f.symptoms || '').toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
        );
      });
    }
    if (filters.brand) d = d.filter(f => f.brand === filters.brand);
    if (filters.model) d = d.filter(f => matchesModelQuery(f, filters.model));
    if (filters.yearMin) d = d.filter(f => f.yearMax >= Number(filters.yearMin));
    if (filters.yearMax) d = d.filter(f => f.yearMin <= Number(filters.yearMax));
    if (filters.motorType) d = d.filter(f => f.motorType === filters.motorType);
    if (filters.kmMin) d = d.filter(f => f.kmMin >= Number(filters.kmMin));
    if (filters.category) d = d.filter(f => f.category === filters.category);
    if (filters.costMin) d = d.filter(f => f.avgCost >= Number(filters.costMin));
    if (filters.costMax) d = d.filter(f => f.avgCost <= Number(filters.costMax));
    if (filters.risk) d = d.filter(f => f.risk === filters.risk);
    if (filters.minReports) d = d.filter(f => f.reportCount >= Number(filters.minReports));
    return sortData(d, sort);
  }, [data, search, filters, sort]);

  // Reset visible count when filters/search change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, filters, sort]);

  // Build comment count map once (instead of per-card localStorage reads)
  const commentCountMap = useMemo(() => {
    return buildCommentCountMap(data.map(f => f.id), forum);
  }, [data, forum]);

  const faultActivityMap = useMemo(() => {
    return buildFaultActivityMap(data, forum);
  }, [data, forum]);

  const handleForumChange = useCallback((nextForum) => {
    setForum(nextForum || {});
  }, []);

  // ── Loading screen (MUST be after all hooks to avoid Rules of Hooks violation) ──
  if (loading) {
    return (
      <div className="app-loading-screen" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--gray-50, #f9fafb)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <div className="app-loading-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid var(--gray-200, #e5e7eb)',
          borderTopColor: 'var(--primary-600, #2563eb)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }} />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--gray-800, #1f2937)', margin: 0 }}>
          KronikArıza yükleniyor...
        </h2>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  const handleSaveFault = async (fault) => {
    const pendingId = fault._pendingId;
    const normalized = normalizeFault(fault);
    const idx = data.findIndex(f => String(f.id) === String(normalized.id));
    const next = idx >= 0
      ? data.map((f, i) => (String(f.id) === String(normalized.id) ? normalized : f))
      : [normalized, ...data];
    const savedRemotely = await persistFaults(next);
    if (pendingId) {
      try {
        const pendingList = await loadPending();
        await savePending(pendingList.filter(p => getPendingId(p) !== pendingId));
        refreshPending();
      } catch (err) {
        console.error("Failed to update pending suggestions", err);
      }
    }
    setEditFault(null);
    if (selectedFault && String(selectedFault.id) === String(normalized.id)) {
      setSelectedFault(normalized);
    }
    if (savedRemotely) {
      setToast(pendingId ? 'Öneri yayınlandı!' : 'Arıza kaydedildi!');
    } else {
      setToast(pendingId
        ? 'Öneri bu tarayıcıda yayınlandı; sunucuya yazılamadı.'
        : 'Arıza bu tarayıcıda kaydedildi; sunucuya yazılamadı.'
      );
    }
    return savedRemotely;
  };

  const handleDeleteFault = async (id) => {
    if (!confirm('Bu arızayı silmek istediğinize emin misiniz?')) return;
    await persistFaults(data.filter(f => String(f.id) !== String(id)));
    if (selectedFault && String(selectedFault.id) === String(id)) {
      setSelectedFault(null);
    }
    setToast('Arıza silindi.');
  };

  const handleApprovePending = async (fault) => {
    const normalized = normalizeFault(fault);
    const exists = data.some(f => String(f.id) === String(normalized.id));
    await persistFaults(exists ? data.map(f => (String(f.id) === String(normalized.id) ? normalized : f)) : [normalized, ...data]);
    refreshPending();
  };

  const handleSaveModel = (key, modelData) => {
    setModels(prev => {
      const next = { ...prev, [key]: modelData };
      saveAdminModels(next);
      return next;
    });
    setEditModel(null);
    setToast('Model makalesi kaydedildi!');
  };

  const handleSaveArticle = async (article) => {
    const exists = articles.some(a => String(a.id) === String(article.id));
    const next = exists
      ? articles.map(a => (String(a.id) === String(article.id) ? article : a))
      : [article, ...articles];
    setArticles(next);
    const savedRemotely = await saveArticles(next);
    if (selectedArticleId && String(selectedArticleId) === String(article.id)) {
      setSelectedArticleId(article.id);
    }
    setEditArticle(null);
    setToast(savedRemotely
      ? 'Makale kaydedildi!'
      : 'Makale bu tarayıcıda kaydedildi; sunucuya yazılamadı.'
    );
  };

  const handleOpenArticle = (article) => {
    setSelectedArticleId(article.id);
    setSelectedModel(null);
    setSelectedFault(null);
    setActiveView('articleDetail');
    pushNav({ activeView: 'articleDetail', selectedArticleId: article.id, selectedModel: null, selectedFaultId: null });
  };

  const handleDeleteArticle = async (id) => {
    if (!confirm('Bu makaleyi silmek istediğinize emin misiniz?')) return;
    const next = articles.filter(a => String(a.id) !== String(id));
    setArticles(next);
    await saveArticles(next);
    if (String(selectedArticleId) === String(id)) {
      setSelectedArticleId(null);
      setActiveView('articles');
      pushNav({ activeView: 'articles', selectedArticleId: null, selectedModel: null, selectedFaultId: null });
    }
    setToast('Makale silindi.');
  };

  const notify = (msg) => setToast(msg);
  const home = content.home;
  const selectedArticle = selectedArticleId
    ? articles.find(a => String(a.id) === String(selectedArticleId))
    : null;

  return (
    <>
      <Navbar
        content={content}
        search={search} onSearch={(v) => { setSearch(v); setSelectedModel(null); setSelectedFault(null); setSelectedArticleId(null); setActiveView('home'); if (v) pushNav({ activeView: 'home', selectedModel: null, selectedFaultId: null, selectedArticleId: null, search: v }); }}
        onAdd={() => authed && setEditFault('new')}
        user={user} onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        onLogoClick={goHome}
        activeView={activeView}
        onSuggest={openSuggest}
        onNavAction={handleNavAction}
      />

      {/* Mobile Menu / Sidebar (drawer) */}
      <Sidebar
        content={content}
        filters={filters} onFilters={setFilters}
        allData={data}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAdvanced={() => { setSidebarOpen(false); setAdvancedOpen(true); }}
        isMobile={true}
        onNavAction={handleNavAction}
        activeView={activeView}
        categories={categories}
        motorTypes={motorTypes}
      />

      {/* Sidebar overlay for mobile */}
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {selectedFault ? (
        <div className="layout layout-detail">
          <main className="main main-detail">
            <FaultDetailPage
              fault={selectedFault}
              activity={faultActivityMap[selectedFault.id]}
              user={user}
              onAuthRequest={() => openAuth('login')}
              onBack={() => { setSelectedFault(null); pushNav({ selectedFaultId: null }); }}
              onModelClick={(modelName) => {
                setSelectedFault(null);
                setSelectedModel(modelName);
                pushNav({ selectedFaultId: null, selectedModel: modelName });
              }}
              adminMode={adminMode}
              onEdit={setEditFault}
              onDelete={handleDeleteFault}
              onVerify={async (f) => {
                const updated = { ...f, reportCount: f.reportCount + 1 };
                const next = data.map(d => String(d.id) === String(f.id) ? updated : d);
                await persistFaults(next);
                setSelectedFault(updated);
              }}
              onSuggestFault={openSuggest}
              onForumChange={handleForumChange}
            />
          </main>
        </div>
      ) : selectedModel ? (
        <div className="layout layout-detail">
          <main className="main main-detail">
            <ModelDetailPage
              model={selectedModel}
              models={models}
              faults={data}
              activityMap={faultActivityMap}
              adminMode={adminMode}
              onBack={() => { setSelectedModel(null); pushNav({ selectedModel: null }); }}
              onEditModel={(key, data) => setEditModel({ key, data })}
              onCreateModel={() => setEditModel({ key: selectedModel, data: null })}
              user={user}
              onAuthRequest={() => openAuth('login')}
              onForumChange={handleForumChange}
            />
          </main>
        </div>
      ) : activeView === 'markalar' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <MarkalarlPage
              data={data}
              content={content}
              onBrandSelect={(brand) => {
                setActiveView('home');
                const newFilters = { ...filters, brand };
                setFilters(newFilters);
                pushNav({ activeView: 'home', filters: newFilters });
              }}
            />
          </main>
        </div>
      ) : activeView === 'uzman' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <UzmanPage data={data} content={content} onModelClick={(m) => { setSelectedModel(m); pushNav({ selectedModel: m }); }} />
          </main>
        </div>
      ) : activeView === 'masraf' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <MasrafPage data={data} content={content} onModelClick={(m) => { setSelectedModel(m); pushNav({ selectedModel: m }); }} />
          </main>
        </div>
      ) : activeView === 'articleDetail' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 940 }}>
            <ArticleDetailPage
              article={selectedArticle}
              adminMode={articleAdminMode}
              onBack={() => {
                setSelectedArticleId(null);
                setActiveView('articles');
                pushNav({ activeView: 'articles', selectedArticleId: null, selectedModel: null, selectedFaultId: null });
              }}
              onEditArticle={setEditArticle}
              onDeleteArticle={handleDeleteArticle}
            />
          </main>
        </div>
      ) : activeView === 'articles' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1040 }}>
            <ArticlesPage
              articles={articles}
              adminMode={articleAdminMode}
              onNewArticle={() => setEditArticle('new')}
              onEditArticle={setEditArticle}
              onDeleteArticle={handleDeleteArticle}
              onOpenArticle={handleOpenArticle}
            />
          </main>
        </div>
      ) : showLanding ? (
        <div className="landing-page-wrap">
          <LandingPage
            data={data}
            models={models}
            activityMap={faultActivityMap}
            onBrandSelect={(brand) => {
              const newFilters = { ...filters, brand };
              setFilters(newFilters);
              setForceExplorer(true);
              pushNav({ forceExplorer: true, filters: newFilters });
            }}
            onModelClick={(m) => { setSelectedModel(m); pushNav({ selectedModel: m }); }}
            onFaultClick={(f) => { setSelectedFault(f); pushNav({ selectedFaultId: f.id }); }}
            onSearch={(val) => {
              setSearch(val);
              setSelectedModel(null);
              setSelectedFault(null);
              setSelectedArticleId(null);
              setActiveView('home');
              if (val) {
                setForceExplorer(true);
                pushNav({ activeView: 'home', selectedModel: null, selectedFaultId: null, selectedArticleId: null, forceExplorer: true, search: val });
              }
            }}
            onExploreAll={() => { setForceExplorer(true); pushNav({ forceExplorer: true }); }}
            onSuggestFault={openSuggest}
            content={content}
          />
        </div>
      ) : (
        <div className="layout">
          <Sidebar
            content={content} filters={filters} onFilters={setFilters} allData={data}
            onOpenAdvanced={() => setAdvancedOpen(true)} isMobile={false}
            categories={categories} motorTypes={motorTypes}
          />

          <main className="main">
            <button className="mobile-filter-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              <Editable value={home.filterBtnText || 'Filtrele'} path={['home', 'filterBtnText']} />
            </button>
            <div className="main-header">
              <p className="results-info">
                <strong>{filtered.length}</strong> / {data.length}{' '}
                <Editable value={home.resultsText || 'arıza kaydı listeleniyor'} path={['home', 'resultsText']} />
              </p>
              <div className="sort-bar">
                <span className="sort-label">
                  <Editable value={home.sortLabel || 'Sırala:'} path={['home', 'sortLabel']} />
                </span>
                <select
                  id="sort-select"
                  className="sort-select"
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="active-pills-slot">
              <ActivePills filters={filters} onFilters={setFilters} />
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--gray-300)" strokeWidth="1.2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    <line x1="8" y1="11" x2="14" y2="11"/>
                  </svg>
                </div>
                <h2><Editable value={home.emptyTitle || 'Sonuç bulunamadı'} path={['home', 'emptyTitle']} /></h2>
                <p><Editable value={home.emptyDesc || 'Farklı filtreler deneyin veya arama teriminizi değiştirin.'} path={['home', 'emptyDesc']} multiline /></p>
                <button
                  className="empty-state-clear-btn"
                  onClick={() => {
                    setFilters({ brand: '', model: '', yearMin: '', yearMax: '', motorType: '', kmMin: '', category: '', costMin: '', costMax: '', risk: '', minReports: '' });
                    setSearch('');
                  }}
                >
                  ✕ Filtreleri Temizle
                </button>
              </div>
            ) : (
              <>
                <div className="card-list">
                  {filtered.slice(0, visibleCount).map(f => (
                    <FaultCard
                      key={f.id} fault={f} user={user}
                      adminMode={adminMode}
                      onAuthRequest={() => openAuth('login')}
                      onModelClick={(m) => { setSelectedModel(m); pushNav({ selectedModel: m }); }}
                      onEdit={setEditFault}
                      onDelete={handleDeleteFault}
                      onClick={(f) => { setSelectedFault(f); pushNav({ selectedFaultId: f.id }); }}
                      commentCount={commentCountMap[f.id] || 0}
                      activity={faultActivityMap[f.id]}
                    />
                  ))}
                </div>
                {visibleCount < filtered.length && (
                  <div className="load-more-wrap">
                    <button
                      className="load-more-btn"
                      onClick={() => setVisibleCount(v => v + PAGE_SIZE)}
                    >
                      Daha Fazla Yükle ({Math.min(PAGE_SIZE, filtered.length - visibleCount)} kalan)
                    </button>
                    <span className="load-more-info">{visibleCount} / {filtered.length} gösteriliyor</span>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      )}

      {editFault && (
        <FaultEditModal
          fault={editFault === 'new' ? null : editFault}
          allFaults={data}
          onSave={handleSaveFault}
          onClose={() => setEditFault(null)}
          categories={categories}
          motorTypes={motorTypes}
          allowManualModel={authed || user?.isAdmin === true}
        />
      )}
      {editModel && (
        <ModelEditModal
          modelKey={editModel.key}
          initial={editModel.data}
          models={models}
          faults={data}
          onSave={handleSaveModel}
          onClose={() => setEditModel(null)}
        />
      )}
      {editArticle && (
        <ArticleEditModal
          article={editArticle === 'new' ? null : editArticle}
          onSave={handleSaveArticle}
          onClose={() => setEditArticle(null)}
        />
      )}
      <AdminHub
        open={hubOpen}
        tab={hubTab}
        onTab={setHubTab}
        onClose={() => setHubOpen(false)}
        faults={data}
        models={models}
        onApproveFaults={handleApprovePending}
        onEditFault={setEditFault}
        onEditModel={(key, data) => setEditModel({ key, data })}
        onNewModel={() => setEditModel({ key: null, data: null })}
        onNotify={notify}
      />
      {authModal && (
        <AuthModal
          defaultTab={authModal}
          onClose={() => setAuthModal(null)}
          onLogin={handleLogin}
          onAdminLogin={async (username, password) => {
            if (await loginAdmin(username, password)) {
              const adminUser = { id: 'admin', username: username, email: 'admin@kronikaraba.com', isAdmin: true };
              localStorage.setItem('ka_session', JSON.stringify(adminUser));
              setUser(adminUser);
              setToast(`Hoş geldiniz, Yönetici!`);
              return true;
            }
            return false;
          }}
        />
      )}
      {advancedOpen && (
        <AdvancedFilterModal
          isOpen={advancedOpen}
          onClose={() => setAdvancedOpen(false)}
          filters={filters}
          onFilters={setFilters}
        />
      )}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
      {suggestOpen && (
        <UserFaultSuggestModal
          user={user}
          allFaults={data}
          onClose={() => setSuggestOpen(false)}
          onSubmit={() => {
            refreshPending();
            setToast('Arıza öneriniz gönderildi! Admin onayı bekleniyor.');
          }}
          onDirectPublish={handleSaveFault}
          categories={categories}
          motorTypes={motorTypes}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LiveEditProvider>
      <AppContent />
    </LiveEditProvider>
  );
}
