import { useState, useMemo, useEffect } from 'react';
import { faultData, brands, categories, motorTypes, riskLevels } from './data.js';
import { AuthModal, loadUser, logout } from './auth.jsx';
import { CommentSection } from './comments.jsx';
import ModelDetailPage from './ModelDetailPage.jsx';
import AdminPanel, { loadAdminFaults } from './AdminPanel.jsx';
import { MarkalarlPage, UzmanPage, MasrafPage } from './Pages.jsx';

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString('tr-TR');
const fmtCost = (min, max) => `₺${fmt(min)} – ₺${fmt(max)}`;

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ search, onSearch, onAdd, user, onLogin, onRegister, onLogout, onMenuToggle, onLogoClick, onNavAction, activeView }) {
  return (
    <nav className="navbar">
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Menü">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <a className="navbar-logo" href="#" onClick={(e) => { e.preventDefault(); onLogoClick && onLogoClick(); }}>
        <span className="logo-badge">KronikArıza</span>
      </a>

      <div className="navbar-nav">
        <a href="/" className={`nav-link${activeView === 'home' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('reset'); }}>Arıza İlanları</a>
        <a href="/" className={`nav-link${activeView === 'markalar' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('brands'); }}>Markalar</a>
        <a href="/" className={`nav-link${activeView === 'uzman' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('uzman'); }}>Usta Yorumları</a>
        <a href="/" className={`nav-link${activeView === 'masraf' ? ' active' : ''}`} onClick={(e) => { e.preventDefault(); onNavAction('masraf'); }}>Masraf Rehberi</a>
      </div>

      <div className="navbar-right">
        <div className="navbar-search">
          <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            id="global-search" type="text"
            placeholder="Marka, model veya arıza ara…"
            value={search} onChange={e => onSearch(e.target.value)} autoComplete="off"
          />
        </div>
        <button id="btn-ariza-ekle" className="navbar-btn" onClick={onAdd}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Arıza Ekle
        </button>
        <div className="navbar-auth">
          {user ? (
            <UserMenu user={user} onLogout={onLogout} />
          ) : (
            <>
              <button className="btn-login" onClick={onLogin}>Giriş Yap</button>
              <button className="btn-register" onClick={onRegister}>Üye Ol</button>
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
  return (
    <div className="user-menu">
      <button className="user-avatar-btn" onClick={() => setOpen(o => !o)}>
        <div className="avatar-circle">{user.username[0].toUpperCase()}</div>
        {user.username}
      </button>
      {open && (
        <div className="user-dropdown" onClick={() => setOpen(false)}>
          <div className="user-dropdown-item" style={{fontWeight:700, color:'var(--gray-900)', cursor:'default'}}>
            👤 {user.username}
          </div>
          <div className="user-dropdown-item" style={{fontSize:11, color:'var(--gray-400)', cursor:'default'}}>{user.email}</div>
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
function Sidebar({ filters, onFilters, allData, isOpen, onClose }) {
  const [open, setOpen] = useState({
    brand: false, model: false, year: false, motorType: false,
    km: false, category: false, cost: false, risk: false, reports: false
  });

  const toggle = (key) => setOpen(p => ({ ...p, [key]: !p[key] }));
  const setFilter = (key, value) =>
    onFilters(prev => ({ ...prev, [key]: prev[key] === value ? '' : value }));

  const clearAll = () => {
    onFilters({ brand:'', model:'', yearMin:'', yearMax:'', motorType:'',
                kmMin:'', category:'', costMin:'', costMax:'', risk:'', minReports:'' });
    setOpen({ brand:false, model:false, year:false, motorType:false,
               km:false, category:false, cost:false, risk:false, reports:false });
  };

  const brandCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.brand] = (m[f.brand]||0)+1; }); return m;
  }, [allData]);
  const catCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.category] = (m[f.category]||0)+1; }); return m;
  }, [allData]);
  const riskCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.risk] = (m[f.risk]||0)+1; }); return m;
  }, [allData]);
  const motorCounts = useMemo(() => {
    const m = {}; allData.forEach(f => { m[f.motorType] = (m[f.motorType]||0)+1; }); return m;
  }, [allData]);

  const hasAny = Object.values(filters).some(v => v !== '');

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-section-title">Arama Kriterleri</div>

      {/* 1. Marka */}
      <FilterRow label="Marka" isOpen={open.brand} onToggle={() => toggle('brand')} hasValue={!!filters.brand}>
        {brands.map(b => (
          <div key={b} className={`filter-option${filters.brand===b?' selected':''}`} onClick={() => setFilter('brand', b)}>
            {b} <span className="opt-count">{brandCounts[b]||0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 2. Model */}
      <FilterRow label="Model" isOpen={open.model} onToggle={() => toggle('model')} hasValue={!!filters.model}>
        <div className="filter-inputs">
          <div className="filter-input-group">
            <span className="filter-input-label">Model adı</span>
            <input
              className="filter-input"
              type="text"
              placeholder="örn. Passat, Golf"
              value={filters.model}
              onChange={e => onFilters(p => ({ ...p, model: e.target.value }))}
            />
          </div>
        </div>
      </FilterRow>

      {/* 3. Model Yılı */}
      <FilterRow label="Model Yılı" isOpen={open.year} onToggle={() => toggle('year')} hasValue={!!(filters.yearMin||filters.yearMax)}>
        <div className="filter-inputs">
          <div className="filter-input-group">
            <span className="filter-input-label">Min Yıl</span>
            <input className="filter-input" type="number" placeholder="örn. 2015"
              value={filters.yearMin} onChange={e => onFilters(p => ({ ...p, yearMin: e.target.value }))} />
          </div>
          <div className="filter-input-group">
            <span className="filter-input-label">Maks Yıl</span>
            <input className="filter-input" type="number" placeholder="örn. 2022"
              value={filters.yearMax} onChange={e => onFilters(p => ({ ...p, yearMax: e.target.value }))} />
          </div>
        </div>
      </FilterRow>

      {/* 4. Motor Tipi */}
      <FilterRow label="Motor Tipi" isOpen={open.motorType} onToggle={() => toggle('motorType')} hasValue={!!filters.motorType}>
        {motorTypes.map(mt => (
          <div key={mt} className={`filter-option${filters.motorType===mt?' selected':''}`} onClick={() => setFilter('motorType', mt)}>
            {mt} <span className="opt-count">{motorCounts[mt]||0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 5. Kilometre Aralığı */}
      <FilterRow label="Kilometre Aralığı" isOpen={open.km} onToggle={() => toggle('km')} hasValue={!!filters.kmMin}>
        <div className="filter-inputs">
          <div className="filter-input-group">
            <span className="filter-input-label">Min KM</span>
            <input className="filter-input" type="number" placeholder="örn. 60000"
              value={filters.kmMin} onChange={e => onFilters(p => ({ ...p, kmMin: e.target.value }))} />
          </div>
        </div>
      </FilterRow>

      {/* 6. Arıza Kategorisi */}
      <FilterRow label="Arıza Kategorisi" isOpen={open.category} onToggle={() => toggle('category')} hasValue={!!filters.category}>
        {categories.map(c => (
          <div key={c} className={`filter-option${filters.category===c?' selected':''}`} onClick={() => setFilter('category', c)}>
            {c} <span className="opt-count">{catCounts[c]||0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 7. Masraf Seviyesi */}
      <FilterRow label="Masraf Seviyesi" isOpen={open.cost} onToggle={() => toggle('cost')} hasValue={!!(filters.costMin||filters.costMax)}>
        <div className="filter-inputs">
          <div className="filter-input-group">
            <span className="filter-input-label">Min (₺)</span>
            <input className="filter-input" type="number" placeholder="0"
              value={filters.costMin} onChange={e => onFilters(p => ({ ...p, costMin: e.target.value }))} />
          </div>
          <div className="filter-input-group">
            <span className="filter-input-label">Maks (₺)</span>
            <input className="filter-input" type="number" placeholder="100.000"
              value={filters.costMax} onChange={e => onFilters(p => ({ ...p, costMax: e.target.value }))} />
          </div>
        </div>
      </FilterRow>

      {/* 8. Risk Seviyesi */}
      <FilterRow label="Risk Seviyesi" isOpen={open.risk} onToggle={() => toggle('risk')} hasValue={!!filters.risk}>
        {riskLevels.map(r => (
          <div key={r} className={`filter-option${filters.risk===r?' selected':''}`} onClick={() => setFilter('risk', r)}>
            <span className={`risk-dot ${r}`} />
            {r} <span className="opt-count">{riskCounts[r]||0}</span>
          </div>
        ))}
      </FilterRow>

      {/* 9. Kullanıcı Doğrulaması */}
      <FilterRow label="Kullanıcı Doğrulaması" isOpen={open.reports} onToggle={() => toggle('reports')} hasValue={!!filters.minReports}>
        <div className="filter-inputs">
          <div className="filter-input-group">
            <span className="filter-input-label">Min Doğrulama Sayısı</span>
            <input className="filter-input" type="number" placeholder="örn. 100"
              value={filters.minReports} onChange={e => onFilters(p => ({ ...p, minReports: e.target.value }))} />
          </div>
        </div>
      </FilterRow>

      {hasAny && (
        <button className="sidebar-clear-btn" onClick={clearAll}>✕ Filtreleri Temizle</button>
      )}
    </aside>
  );
}

// ── Fault Card (list row style) ───────────────────────────────────────────────
function FaultCard({ fault, user, onAuthRequest, onModelClick }) {
  return (
    <article className="fault-card">
      <div className="card-top">
        <div className="card-title-block">
          <p className="card-brand-model card-model-link" onClick={() => onModelClick(fault.model)} title="Detaylı model sayfasını aç">
            {fault.brand} {fault.model}
            <svg className="card-link-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 6 15 12 9 18"/></svg>
          </p>
          <p className="card-kronik">
            <strong>Kronik arıza:</strong> {fault.description}
          </p>
        </div>
        <span className={`risk-badge ${fault.risk}`}>{fault.risk}</span>
      </div>

      <div className="card-info">
        {/* Col 1: Risk + symptoms */}
        <div className="info-col">
          <span className="info-label">Risk</span>
          <div className="info-risk-row">
            <span className={`risk-dot ${fault.risk}`} />
            <span className={`info-risk-level ${fault.risk}`}>
              {fault.risk.charAt(0) + fault.risk.slice(1).toLowerCase()}
            </span>
          </div>
          <p className="info-symptoms">{fault.symptoms}</p>
        </div>

        {/* Col 2: Cost + check tip */}
        <div className="info-col">
          <span className="info-label">Tahmini Masraf</span>
          <p className="info-cost-value">{fmtCost(fault.costMin, fault.costMax)}</p>
          <p className="info-check">Kontrol: {fault.checkTip}</p>
        </div>

        {/* Col 3: Görülme km */}
        <div className="info-col">
          <span className="info-label">Görülme km</span>
          <p className="info-km-value">{fault.kmDisplay}</p>
        </div>

        {/* Col 4: Report count */}
        <div className="info-col">
          <span className="info-label">Doğrulama</span>
          <p className="info-reports-count">{fmt(fault.reportCount)}</p>
          <p className="info-reports-label">kullanıcı doğruladı</p>
        </div>
      </div>

      <CommentSection faultId={fault.id} user={user} onAuthRequest={onAuthRequest} />
    </article>
  );
}

// ── Active pills ──────────────────────────────────────────────────────────────
function ActivePills({ filters, onFilters }) {
  const pills = [];
  if (filters.brand)    pills.push({ label: `Marka: ${filters.brand}`, key: 'brand' });
  if (filters.risk)     pills.push({ label: `Risk: ${filters.risk}`, key: 'risk' });
  if (filters.category) pills.push({ label: `Kategori: ${filters.category}`, key: 'category' });
  if (filters.costMin)  pills.push({ label: `Min Masraf: ₺${fmt(filters.costMin)}`, key: 'costMin' });
  if (filters.costMax)  pills.push({ label: `Maks Masraf: ₺${fmt(filters.costMax)}`, key: 'costMax' });
  if (filters.kmMin)    pills.push({ label: `Min KM: ${fmt(filters.kmMin)}`, key: 'kmMin' });
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
  { value: 'cost-desc',    label: 'En Yüksek Masraf' },
  { value: 'cost-asc',     label: 'En Düşük Masraf' },
  { value: 'risk-desc',    label: 'En Yüksek Risk' },
  { value: 'brand-asc',    label: 'Marka (A→Z)' },
];
const RISK_ORDER = { YÜKSEK: 3, ORTA: 2, DÜŞÜK: 1 };
function sortData(data, sort) {
  const d = [...data];
  switch (sort) {
    case 'reports-desc': return d.sort((a, b) => b.reportCount - a.reportCount);
    case 'cost-desc':    return d.sort((a, b) => b.avgCost - a.avgCost);
    case 'cost-asc':     return d.sort((a, b) => a.avgCost - b.avgCost);
    case 'risk-desc':    return d.sort((a, b) => RISK_ORDER[b.risk] - RISK_ORDER[a.risk]);
    case 'brand-asc':    return d.sort((a, b) => a.brand.localeCompare(b.brand, 'tr'));
    default: return d;
  }
}

// ── Add Fault Modal ───────────────────────────────────────────────────────────
const EMPTY = { brand:'', model:'', year:'', fault:'', description:'', symptoms:'', checkTip:'', risk:'ORTA', costMin:'', costMax:'', kmDisplay:'', category:'' };

function AddModal({ onClose, onAdd }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.fault) return;
    onAdd({
      ...form,
      id: Date.now(),
      avgCost: Math.round((Number(form.costMin) + Number(form.costMax)) / 2) || 0,
      costMin: Number(form.costMin) || 0,
      costMax: Number(form.costMax) || 0,
      kmMin: 0,
      reportCount: 1,
      kmDisplay: form.kmDisplay || '—',
      description: form.fault,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <h2 id="modal-title">Yeni Arıza Ekle</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="f-brand">Marka *</label>
                <input id="f-brand" type="text" placeholder="örn. Volkswagen" value={form.brand} onChange={e => set('brand', e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="f-model">Model *</label>
                <input id="f-model" type="text" placeholder="örn. Golf 1.4 TSI" value={form.model} onChange={e => set('model', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="f-year">Yıl Aralığı</label>
                <input id="f-year" type="text" placeholder="örn. 2015-2019" value={form.year} onChange={e => set('year', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="f-risk">Risk Seviyesi</label>
                <select id="f-risk" value={form.risk} onChange={e => set('risk', e.target.value)}>
                  <option value="YÜKSEK">YÜKSEK</option>
                  <option value="ORTA">ORTA</option>
                  <option value="DÜŞÜK">DÜŞÜK</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="f-fault">Arıza Adı *</label>
              <input id="f-fault" type="text" placeholder="örn. Zincir seti soğuk çalıştırmada ses" value={form.fault} onChange={e => set('fault', e.target.value)} required />
            </div>
            <div className="form-group">
              <label htmlFor="f-symptoms">Belirtiler</label>
              <input id="f-symptoms" type="text" placeholder="örn. Şakırtı sesi, motor lambesi yanar" value={form.symptoms} onChange={e => set('symptoms', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="f-check">Kontrol İpucu</label>
              <input id="f-check" type="text" placeholder="örn. Soğuk çalıştırmada ses var mı?" value={form.checkTip} onChange={e => set('checkTip', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="f-costmin">Min Masraf (₺)</label>
                <input id="f-costmin" type="number" placeholder="örn. 10000" value={form.costMin} onChange={e => set('costMin', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="f-costmax">Maks Masraf (₺)</label>
                <input id="f-costmax" type="number" placeholder="örn. 30000" value={form.costMax} onChange={e => set('costMax', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="f-km">Görülme KM</label>
                <input id="f-km" type="text" placeholder="örn. 60.000 km+" value={form.kmDisplay} onChange={e => set('kmDisplay', e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="f-category">Kategori</label>
                <select id="f-category" value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">— Seçiniz —</option>
                  <option value="Motor">Motor</option>
                  <option value="Şanzıman">Şanzıman</option>
                  <option value="Egzoz">Egzoz</option>
                  <option value="Soğutma">Soğutma</option>
                  <option value="Elektronik">Elektronik</option>
                  <option value="Süspansiyon">Süspansiyon</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit">Arızayı Ekle</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Toast({ message, onDone }) {
  useState(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); });
  return (
    <div className="toast">
      <span>✅</span> {message}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [data, setData] = useState(() => loadAdminFaults());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('reports-desc');
  const [filters, setFilters] = useState({
    brand:'', model:'', yearMin:'', yearMax:'', motorType:'',
    kmMin:'', category:'', costMin:'', costMax:'', risk:'', minReports:''
  });
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(() => loadUser());
  const [authModal, setAuthModal] = useState(null); // 'login' | 'register' | null
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showAdmin, setShowAdmin] = useState(() => window.location.hash === '#/admin');
  const [activeView, setActiveView] = useState('home'); // 'home'|'markalar'|'uzman'|'masraf'

  // Keep URL in sync with admin panel state
  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash === '#/admin') {
        setShowAdmin(true);
      } else {
        setShowAdmin(false);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const goHome = () => {
    history.pushState(null, '', '/');
    setSelectedModel(null);
    setShowAdmin(false);
    setActiveView('home');
    setSearch('');
    setFilters({ brand:'', model:'', yearMin:'', yearMax:'', motorType:'', kmMin:'', category:'', costMin:'', costMax:'', risk:'', minReports:'' });
    setSort('reports-desc');
  };

  const openAdmin = () => {
    window.location.hash = '#/admin';
    setShowAdmin(true);
  };

  const closeAdmin = () => {
    history.pushState(null, '', '/');
    setShowAdmin(false);
    refreshData();
  };

  const refreshData = () => { setData(loadAdminFaults()); };

  const handleLogin = (u) => { setUser(u); setToast(`Hoş geldiniz, ${u.username}!`); };
  const handleLogout = () => { logout(); setUser(null); setToast('Çıkış yapıldı.'); };
  const openAuth = (tab = 'login') => setAuthModal(tab);

  const filtered = useMemo(() => {
    let d = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      d = d.filter(f =>
        f.brand.toLowerCase().includes(q) ||
        f.model.toLowerCase().includes(q) ||
        f.fault.toLowerCase().includes(q) ||
        (f.symptoms || '').toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q)
      );
    }
    if (filters.brand)      d = d.filter(f => f.brand === filters.brand);
    if (filters.model)      d = d.filter(f => f.model.toLowerCase().includes(filters.model.toLowerCase()));
    if (filters.yearMin)    d = d.filter(f => f.yearMax >= Number(filters.yearMin));
    if (filters.yearMax)    d = d.filter(f => f.yearMin <= Number(filters.yearMax));
    if (filters.motorType)  d = d.filter(f => f.motorType === filters.motorType);
    if (filters.kmMin)      d = d.filter(f => f.kmMin >= Number(filters.kmMin));
    if (filters.category)   d = d.filter(f => f.category === filters.category);
    if (filters.costMin)    d = d.filter(f => f.avgCost >= Number(filters.costMin));
    if (filters.costMax)    d = d.filter(f => f.avgCost <= Number(filters.costMax));
    if (filters.risk)       d = d.filter(f => f.risk === filters.risk);
    if (filters.minReports) d = d.filter(f => f.reportCount >= Number(filters.minReports));
    return sortData(d, sort);
  }, [data, search, filters, sort]);

  const handleAdd = (newFault) => {
    setData(prev => [newFault, ...prev]);
    setToast('Arıza başarıyla eklendi!');
  };

  // If admin panel is active, render ONLY the admin panel (full page)
  if (showAdmin) {
    return <AdminPanel onClose={closeAdmin} onDataChange={refreshData} />;
  }

  return (
    <>
      <Navbar
        search={search} onSearch={(v) => { setSearch(v); setSelectedModel(null); setActiveView('home'); }} onAdd={() => setShowModal(true)}
        user={user} onLogin={() => openAuth('login')} onRegister={() => openAuth('register')} onLogout={handleLogout}
        onMenuToggle={() => setSidebarOpen(o => !o)}
        onLogoClick={goHome}
        activeView={activeView}
        onNavAction={(action) => {
          history.pushState(null, '', '/');
          setSelectedModel(null);
          if (action === 'reset') {
            setActiveView('home');
            setSearch('');
            setFilters({ brand:'', model:'', yearMin:'', yearMax:'', motorType:'', kmMin:'', category:'', costMin:'', costMax:'', risk:'', minReports:'' });
            setSort('reports-desc');
          } else if (action === 'brands') {
            setActiveView('markalar');
            setSidebarOpen(false);
          } else if (action === 'uzman') {
            setActiveView('uzman');
          } else if (action === 'masraf') {
            setActiveView('masraf');
          }
        }}
      />

      {/* Sidebar overlay for mobile */}
      <div className={`sidebar-overlay${sidebarOpen ? ' visible' : ''}`} onClick={() => setSidebarOpen(false)} />

      {selectedModel ? (
        <div className="layout layout-detail">
          <main className="main main-detail">
            <ModelDetailPage
              model={selectedModel}
              onBack={() => setSelectedModel(null)}
              user={user}
              onAuthRequest={() => openAuth('login')}
            />
          </main>
        </div>
      ) : activeView === 'markalar' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <MarkalarlPage
              data={data}
              onBrandSelect={(brand) => {
                setActiveView('home');
                setFilters(f => ({ ...f, brand }));
              }}
            />
          </main>
        </div>
      ) : activeView === 'uzman' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <UzmanPage data={data} onModelClick={setSelectedModel} />
          </main>
        </div>
      ) : activeView === 'masraf' ? (
        <div className="layout layout-detail">
          <main className="main main-detail" style={{ maxWidth: 1000 }}>
            <MasrafPage data={data} onModelClick={setSelectedModel} />
          </main>
        </div>
      ) : (
        <div className="layout">
          <Sidebar filters={filters} onFilters={setFilters} allData={data} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

          <main className="main">
            <button className="mobile-filter-btn" onClick={() => setSidebarOpen(true)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/>
              </svg>
              Filtrele
            </button>
            <div className="main-header">
              <p className="results-info">
                <strong>{filtered.length}</strong> / {data.length} arıza kaydı listeleniyor
              </p>
              <div className="sort-bar">
                <span className="sort-label">Sırala:</span>
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

            <ActivePills filters={filters} onFilters={setFilters} />

            {filtered.length === 0 ? (
              <div className="empty-state">
                <h2>Sonuç bulunamadı</h2>
                <p>Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</p>
              </div>
            ) : (
              <div className="card-list">
                {filtered.map(f => <FaultCard key={f.id} fault={f} user={user} onAuthRequest={() => openAuth('login')} onModelClick={setSelectedModel} />)}

              </div>
            )}
          </main>
        </div>
      )}

      {showModal && (
        <AddModal onClose={() => setShowModal(false)} onAdd={handleAdd} />
      )}
      {authModal && (
        <AuthModal defaultTab={authModal} onClose={() => setAuthModal(null)} onLogin={handleLogin} />
      )}
      {toast && (
        <Toast message={toast} onDone={() => setToast(null)} />
      )}
    </>
  );
}
