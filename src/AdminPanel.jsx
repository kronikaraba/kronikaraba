import { useState, useEffect, useMemo } from 'react';
import { faultData as defaultFaults, brands as defaultBrands, categories as defaultCategories } from './data.js';
import { modelDetails as defaultModelDetails } from './modelData.js';
import './admin.css';

// ── Storage Keys ─────────────────────────────────────────────────────────────
const FAULTS_KEY = 'ka_admin_faults';
const MODELS_KEY = 'ka_admin_models';
const ADMIN_KEY  = 'ka_admin_session';
const USERS_KEY  = 'ka_users';
const FORUM_KEY  = 'ka_forum_v2';
const ADMIN_PASS_KEY = 'ka_admin_password';
const PENDING_KEY   = 'ka_pending_faults';
const DEFAULT_PASS = 'admin123';

// ── Public helpers (used by App.jsx) ─────────────────────────────────────────
export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export function loadAdminFaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAULTS_KEY));
    return stored || defaultFaults;
  } catch { return defaultFaults; }
}

export function loadAdminModels() {
  try {
    const stored = JSON.parse(localStorage.getItem(MODELS_KEY));
    return stored || defaultModelDetails;
  } catch { return defaultModelDetails; }
}

function saveFaults(data) { localStorage.setItem(FAULTS_KEY, JSON.stringify(data)); }
function saveModels(data) { localStorage.setItem(MODELS_KEY, JSON.stringify(data)); }
function getAdminPass() { return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_PASS; }
function loadUsers() { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } }
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function loadForum() { try { return JSON.parse(localStorage.getItem(FORUM_KEY)) || {}; } catch { return {}; } }
function saveForum(d) { localStorage.setItem(FORUM_KEY, JSON.stringify(d)); }
function loadPending() { try { return JSON.parse(localStorage.getItem(PENDING_KEY)) || []; } catch { return []; } }
function savePending(d) { localStorage.setItem(PENDING_KEY, JSON.stringify(d)); }

const fmt = (n) => Number(n).toLocaleString('tr-TR');

// ══════════════════════════════════════════════════════════════════════════════
// ── Admin Login ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function AdminLogin({ onLogin }) {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pass === getAdminPass()) {
      localStorage.setItem(ADMIN_KEY, 'true');
      onLogin();
    } else {
      setError('Yanlış şifre!');
    }
  };

  return (
    <div className="adm-login-wrap">
      <form className="adm-login" onSubmit={handleSubmit}>
        <div className="adm-login-logo">KRONİKARIZA</div>
        <h2>Admin Paneli</h2>
        <p>İçerik yönetimi için giriş yapın</p>
        {error && <div className="adm-login-error">{error}</div>}
        <input
          type="password"
          placeholder="Admin şifresi"
          value={pass}
          onChange={e => { setPass(e.target.value); setError(''); }}
          autoFocus
        />
        <button type="submit" className="adm-login-btn">Giriş Yap</button>
        <span className="adm-login-hint">Demo şifre: admin123</span>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── DASHBOARD VIEW ───────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function DashboardView({ faults, models, users, forum, onFilterClick }) {
  const totalFaults = faults.length;
  const totalModels = Object.keys(models).length;
  const totalUsers = users.length;
  const totalComments = Object.values(forum).reduce((s, arr) => {
    return s + arr.length + arr.reduce((rs, p) => rs + (p.replies || []).length, 0);
  }, 0);
  const totalReports = faults.reduce((s, f) => s + f.reportCount, 0);
  const highRiskCount = faults.filter(f => f.risk === 'YÜKSEK').length;
  const avgCost = faults.length ? Math.round(faults.reduce((s, f) => s + f.avgCost, 0) / faults.length) : 0;

  // Brand distribution
  const brandDist = {};
  faults.forEach(f => { brandDist[f.brand] = (brandDist[f.brand] || 0) + 1; });
  const topBrands = Object.entries(brandDist).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxBrand = topBrands.length ? topBrands[0][1] : 1;

  // Category distribution
  const catDist = {};
  faults.forEach(f => { catDist[f.category] = (catDist[f.category] || 0) + 1; });
  const topCats = Object.entries(catDist).sort((a, b) => b[1] - a[1]);

  // Recent faults (last 5)
  const recentFaults = [...faults].sort((a, b) => b.id - a.id).slice(0, 5);

  // Most reported faults
  const topReported = [...faults].sort((a, b) => b.reportCount - a.reportCount).slice(0, 5);

  return (
    <>
      {/* Stats Grid */}
      <div className="adm-stats">
        <div className="adm-stat">
          <div className="adm-stat-icon">🔴</div>
          <div className="adm-stat-val">{totalFaults}</div>
          <div className="adm-stat-label">Toplam Arıza</div>
          <div className="adm-stat-delta">{highRiskCount} yüksek riskli</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon">📄</div>
          <div className="adm-stat-val">{totalModels}</div>
          <div className="adm-stat-label">Model Detayı</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon">👥</div>
          <div className="adm-stat-val">{totalUsers}</div>
          <div className="adm-stat-label">Kayıtlı Kullanıcı</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon">💬</div>
          <div className="adm-stat-val">{totalComments}</div>
          <div className="adm-stat-label">Toplam Yorum</div>
        </div>
      </div>

      {/* Secondary stats */}
      <div className="adm-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="adm-stat">
          <div className="adm-stat-icon">📊</div>
          <div className="adm-stat-val">{fmt(totalReports)}</div>
          <div className="adm-stat-label">Toplam Doğrulama</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon">💰</div>
          <div className="adm-stat-val">₺{fmt(avgCost)}</div>
          <div className="adm-stat-label">Ortalama Masraf</div>
        </div>
        <div className="adm-stat">
          <div className="adm-stat-icon">🏭</div>
          <div className="adm-stat-val">{Object.keys(brandDist).length}</div>
          <div className="adm-stat-label">Marka Sayısı</div>
        </div>
      </div>

      <div className="adm-dash-grid">
        {/* Brand Chart */}
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <div className="adm-section-title">Marka Dağılımı</div>
              <div className="adm-section-sub">Arıza sayısına göre (Filtrelemek için tıklayın)</div>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {topBrands.map(([brand, count]) => (
              <div
                key={brand}
                className="adm-chart-row clickable"
                onClick={() => onFilterClick && onFilterClick({ brand })}
                style={{ cursor: 'pointer' }}
                title={`${brand} arızalarını listele`}
              >
                <span className="adm-chart-label">{brand}</span>
                <div className="adm-chart-bar-wrap">
                  <div className="adm-chart-bar" style={{ width: `${(count / maxBrand) * 100}%` }} />
                </div>
                <span className="adm-chart-val">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Chart */}
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <div className="adm-section-title">Kategori Dağılımı</div>
              <div className="adm-section-sub">Arıza türüne göre (Filtrelemek için tıklayın)</div>
            </div>
          </div>
          <div style={{ padding: '20px 24px' }}>
            {topCats.map(([cat, count]) => {
              const maxCat = topCats[0][1];
              return (
                <div
                  key={cat}
                  className="adm-chart-row clickable"
                  onClick={() => onFilterClick && onFilterClick({ category: cat })}
                  style={{ cursor: 'pointer' }}
                  title={`${cat} kategorisindeki arızaları listele`}
                >
                  <span className="adm-chart-label">{cat}</span>
                  <div className="adm-chart-bar-wrap">
                    <div className="adm-chart-bar cat" style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                  <span className="adm-chart-val">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Reported */}
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <div className="adm-section-title">🏆 En Çok Doğrulanan</div>
              <div className="adm-section-sub">Topluluk raporlarına göre</div>
            </div>
          </div>
          <div className="adm-mini-list">
            {topReported.map((f, i) => (
              <div key={f.id} className="adm-mini-item">
                <div className="adm-mini-rank">{i + 1}</div>
                <div className="adm-mini-body">
                  <div className="adm-mini-title">{f.brand} {f.model}</div>
                  <div className="adm-mini-sub">{f.fault}</div>
                </div>
                <div className="adm-mini-val">{fmt(f.reportCount)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Faults */}
        <div className="adm-section">
          <div className="adm-section-head">
            <div>
              <div className="adm-section-title">🕒 Son Eklenenler</div>
              <div className="adm-section-sub">En son eklenen arıza kayıtları</div>
            </div>
          </div>
          <div className="adm-mini-list">
            {recentFaults.map((f, i) => (
              <div key={f.id} className="adm-mini-item">
                <div className="adm-mini-rank">{i + 1}</div>
                <div className="adm-mini-body">
                  <div className="adm-mini-title">{f.brand} {f.model}</div>
                  <div className="adm-mini-sub">{f.fault}</div>
                </div>
                <span className={`adm-risk ${f.risk}`}>{f.risk}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FAULT FORM ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_FAULT = {
  brand:'', model:'', year:'', yearMin:'', yearMax:'', motorType:'Benzin',
  fault:'', description:'', symptoms:'', checkTip:'', risk:'ORTA',
  costMin:'', costMax:'', kmDisplay:'', kmMin:'', reportCount:'', category:'Motor'
};

function FaultForm({ initial, onSave, onCancel, faults }) {
  const [form, setForm] = useState(initial || EMPTY_FAULT);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const uniqueBrands = useMemo(() => [...new Set(faults.map(f => f.brand))].sort(), [faults]);
  const uniqueModels = useMemo(() => [...new Set(faults.map(f => f.model))].sort(), [faults]);

  const currentAvgCost = Math.round((Number(form.costMin) + Number(form.costMax)) / 2) || 0;
  const isCostInvalid = Number(form.costMin) > 0 && Number(form.costMax) > 0 && Number(form.costMin) > Number(form.costMax);

  const handleYearChange = (val) => {
    set('year', val);
    const match = val.match(/(\d{4})\s*-\s*(\d{4})/);
    if (match) {
      setForm(p => ({ ...p, year: val, yearMin: Number(match[1]), yearMax: Number(match[2]) }));
    }
  };

  const handleYearMinChange = (val) => {
    setForm(p => {
      const newMin = val;
      const newYear = newMin && p.yearMax ? `${newMin}-${p.yearMax}` : p.year;
      return { ...p, yearMin: newMin, year: newYear };
    });
  };

  const handleYearMaxChange = (val) => {
    setForm(p => {
      const newMax = val;
      const newYear = p.yearMin && newMax ? `${p.yearMin}-${newMax}` : p.year;
      return { ...p, yearMax: newMax, year: newYear };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.fault) return;
    if (Number(form.costMin) > Number(form.costMax)) {
      alert('Minimum masraf, maksimum masraftan büyük olamaz!');
      return;
    }
    onSave({
      ...form,
      id: form.id || Date.now(),
      yearMin: Number(form.yearMin) || 2020,
      yearMax: Number(form.yearMax) || 2025,
      costMin: Number(form.costMin) || 0,
      costMax: Number(form.costMax) || 0,
      avgCost: currentAvgCost,
      kmMin: Number(form.kmMin) || 0,
      reportCount: Number(form.reportCount) || 1,
      description: form.fault,
    });
  };

  return (
    <div className="adm-section">
      <div className="adm-section-head">
        <div className="adm-section-title">{initial ? '✏️ Arıza Düzenle' : '➕ Yeni Arıza Ekle'}</div>
      </div>
      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-body">
          <div className="adm-form-grid">
            <div className="adm-field">
              <label>Marka *</label>
              <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="örn. Volkswagen" list="adm-brands-list" required />
            </div>
            <div className="adm-field">
              <label>Model *</label>
              <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="örn. Golf 1.4 TSI" list="adm-models-list" required />
            </div>
            <div className="adm-field">
              <label>Yıl Aralığı</label>
              <input value={form.year} onChange={e => handleYearChange(e.target.value)} placeholder="örn. 2015-2020" />
            </div>
            <div className="adm-field">
              <label>Motor Tipi</label>
              <select value={form.motorType} onChange={e => set('motorType', e.target.value)}>
                <option>Benzin</option><option>Dizel</option><option>Hibrit</option><option>Elektrik</option><option>LPG</option>
              </select>
            </div>
            <div className="adm-field full">
              <label>Arıza Adı *</label>
              <input value={form.fault} onChange={e => set('fault', e.target.value)} placeholder="örn. Zincir seti soğuk çalıştırmada ses" required />
            </div>
            <div className="adm-field full">
              <label>Belirtiler</label>
              <input value={form.symptoms} onChange={e => set('symptoms', e.target.value)} placeholder="örn. Şakırtı sesi, motor lambası" />
            </div>
            <div className="adm-field full">
              <label>Kontrol İpucu</label>
              <input value={form.checkTip} onChange={e => set('checkTip', e.target.value)} placeholder="örn. Soğuk çalıştırmada ses var mı?" />
            </div>
            <div className="adm-field">
              <label>Risk</label>
              <select value={form.risk} onChange={e => set('risk', e.target.value)}>
                <option>YÜKSEK</option><option>ORTA</option><option>DÜŞÜK</option>
              </select>
            </div>
            <div className="adm-field">
              <label>Kategori</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}>
                <option>Motor</option><option>Şanzıman</option><option>Egzoz</option>
                <option>Soğutma</option><option>Elektronik</option><option>Süspansiyon</option><option>Diğer</option>
              </select>
            </div>
            <div className="adm-field">
              <label>Min Masraf (₺)</label>
              <input type="number" value={form.costMin} onChange={e => set('costMin', e.target.value)} placeholder="10000" />
            </div>
            <div className="adm-field">
              <label>Maks Masraf (₺)</label>
              <input type="number" value={form.costMax} onChange={e => set('costMax', e.target.value)} placeholder="30000" />
              <div className="adm-field-hint" style={{ marginTop: 4, fontSize: '11px', color: isCostInvalid ? '#F87171' : '#94A3B8' }}>
                {isCostInvalid ? '⚠️ Min masraf, maks masraftan büyük olamaz!' : `Ortalama Masraf: ₺${fmt(currentAvgCost)}`}
              </div>
            </div>
            <div className="adm-field">
              <label>Görülme KM</label>
              <input value={form.kmDisplay} onChange={e => set('kmDisplay', e.target.value)} placeholder="60.000 km+" />
            </div>
            <div className="adm-field">
              <label>Min KM (sayı)</label>
              <input type="number" value={form.kmMin} onChange={e => set('kmMin', e.target.value)} placeholder="60000" />
            </div>
            <div className="adm-field">
              <label>Min Yıl</label>
              <input type="number" value={form.yearMin} onChange={e => handleYearMinChange(e.target.value)} placeholder="2015" />
            </div>
            <div className="adm-field">
              <label>Maks Yıl</label>
              <input type="number" value={form.yearMax} onChange={e => handleYearMaxChange(e.target.value)} placeholder="2020" />
            </div>
            <div className="adm-field">
              <label>Doğrulama Sayısı</label>
              <input type="number" value={form.reportCount} onChange={e => set('reportCount', e.target.value)} placeholder="100" />
            </div>
          </div>
        </div>
        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn-outline" onClick={onCancel}>İptal</button>
          <button type="submit" className="adm-btn adm-btn-primary" disabled={isCostInvalid}>💾 Kaydet</button>
        </div>

        <datalist id="adm-brands-list">
          {uniqueBrands.map(b => <option key={b} value={b} />)}
        </datalist>
        <datalist id="adm-models-list">
          {uniqueModels.map(m => <option key={m} value={m} />)}
        </datalist>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PAGINATION ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function Pagination({ total, page, perPage, onPage }) {
  const totalPages = Math.ceil(total / perPage);
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  if (start > 1) { pages.push(1); if (start > 2) pages.push('...'); }
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages) { if (end < totalPages - 1) pages.push('...'); pages.push(totalPages); }
  return (
    <div className="adm-pagination">
      <button className="adm-page-btn" disabled={page === 1} onClick={() => onPage(page - 1)}>‹</button>
      {pages.map((p, i) =>
        p === '...' ? <span key={`el-${i}`} className="adm-page-ellipsis">…</span> :
        <button key={p} className={`adm-page-btn${p === page ? ' active' : ''}`} onClick={() => onPage(Number(p))}>{p}</button>
      )}
      <button className="adm-page-btn" disabled={page === totalPages} onClick={() => onPage(page + 1)}>›</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── FAULTS VIEW ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function FaultsView({ faults, setFaults, notify, initialFilters, clearInitialFilters }) {
  const [editFault, setEditFault] = useState(null);
  const [search, setSearch] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterRisk, setFilterRisk] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterMotor, setFilterMotor] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.brand !== undefined) setFilterBrand(initialFilters.brand || '');
      if (initialFilters.risk !== undefined) setFilterRisk(initialFilters.risk || '');
      if (initialFilters.category !== undefined) setFilterCat(initialFilters.category || '');
      if (initialFilters.search !== undefined) setSearch(initialFilters.search || '');
      clearInitialFilters();
      setPage(1);
    }
  }, [initialFilters, clearInitialFilters]);

  const brands = useMemo(() => [...new Set(faults.map(f => f.brand))].sort(), [faults]);
  const cats = useMemo(() => [...new Set(faults.map(f => f.category))].sort(), [faults]);
  const motors = useMemo(() => [...new Set(faults.map(f => f.motorType).filter(Boolean))].sort(), [faults]);

  const filtered = useMemo(() => {
    let d = faults;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(f => f.brand.toLowerCase().includes(q) || f.model.toLowerCase().includes(q) || f.fault.toLowerCase().includes(q));
    }
    if (filterBrand) d = d.filter(f => f.brand === filterBrand);
    if (filterRisk) d = d.filter(f => f.risk === filterRisk);
    if (filterCat) d = d.filter(f => f.category === filterCat);
    if (filterMotor) d = d.filter(f => f.motorType === filterMotor);
    return d;
  }, [faults, search, filterBrand, filterRisk, filterCat, filterMotor]);

  const paginated = useMemo(() => filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE), [filtered, page]);
  const allPageSelected = paginated.length > 0 && paginated.every(f => selected.has(f.id));

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  const toggleAll = () => {
    if (allPageSelected) {
      setSelected(prev => { const next = new Set(prev); paginated.forEach(f => next.delete(f.id)); return next; });
    } else {
      setSelected(prev => { const next = new Set(prev); paginated.forEach(f => next.add(f.id)); return next; });
    }
  };

  const bulkDelete = () => {
    if (!selected.size || !confirm(`Seçili ${selected.size} arızayı silmek istediğinize emin misiniz?`)) return;
    setFaults(prev => { const next = prev.filter(f => !selected.has(f.id)); saveFaults(next); return next; });
    notify(`${selected.size} arıza silindi!`);
    setSelected(new Set());
  };

  const saveFault = (fault) => {
    setFaults(prev => {
      const exists = prev.findIndex(f => f.id === fault.id);
      let next;
      if (exists >= 0) { next = [...prev]; next[exists] = fault; }
      else { next = [fault, ...prev]; }
      saveFaults(next);
      return next;
    });
    setEditFault(null);
    notify('Arıza kaydedildi!');
  };

  const deleteFault = (id) => {
    if (!confirm('Bu arızayı silmek istediğinize emin misiniz?')) return;
    setFaults(prev => {
      const next = prev.filter(f => f.id !== id);
      saveFaults(next);
      return next;
    });
    notify('Arıza silindi!');
  };

  if (editFault) {
    return (
      <>
        <button className="adm-back" onClick={() => setEditFault(null)}>← Listeye Dön</button>
        <FaultForm
          initial={editFault === 'new' ? null : editFault}
          onSave={saveFault}
          onCancel={() => setEditFault(null)}
          faults={faults}
        />
      </>
    );
  }

  return (
    <>
      <div className="adm-section">
        <div className="adm-toolbar" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="adm-search">
            <span>🔍</span>
            <input placeholder="Marka, model veya arıza ara…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <div className="adm-toolbar-filters">
            <select value={filterBrand} onChange={e => { setFilterBrand(e.target.value); setPage(1); }}>
              <option value="">Tüm Markalar</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterRisk} onChange={e => { setFilterRisk(e.target.value); setPage(1); }}>
              <option value="">Tüm Riskler</option>
              <option value="YÜKSEK">YÜKSEK</option>
              <option value="ORTA">ORTA</option>
              <option value="DÜŞÜK">DÜŞÜK</option>
            </select>
            <select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(1); }}>
              <option value="">Tüm Kategoriler</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterMotor} onChange={e => { setFilterMotor(e.target.value); setPage(1); }}>
              <option value="">Tüm Motor Tipleri</option>
              {motors.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {selected.size > 0 && (
              <button className="adm-btn adm-btn-danger" onClick={bulkDelete} style={{ border: '1px solid rgba(248,113,113,0.3)' }}>
                🗑️ Seçiliyi Sil ({selected.size})
              </button>
            )}
            <button className="adm-btn adm-btn-primary" onClick={() => setEditFault('new')}>➕ Yeni Arıza</button>
          </div>
        </div>

        <div className="adm-table-wrap">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}><input type="checkbox" checked={allPageSelected} onChange={toggleAll} /></th>
                <th>ID</th>
                <th>Marka / Model</th>
                <th>Arıza</th>
                <th>Motor</th>
                <th>Kategori</th>
                <th>Risk</th>
                <th>Masraf</th>
                <th>Doğrulama</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  Sonuç bulunamadı
                </td></tr>
              ) : paginated.map(f => (
                <tr key={f.id} style={selected.has(f.id) ? { background: 'rgba(250,204,21,0.05)' } : {}}>
                  <td><input type="checkbox" checked={selected.has(f.id)} onChange={() => toggleSelect(f.id)} /></td>
                  <td style={{ color: '#475569', fontSize: '11px' }}>#{f.id}</td>
                  <td><strong>{f.brand}</strong> {f.model}</td>
                  <td>{f.fault}</td>
                  <td style={{ color: '#94A3B8', fontSize: 12 }}>{f.motorType || '—'}</td>
                  <td><span className="adm-status-chip active">{f.category}</span></td>
                  <td><span className={`adm-risk ${f.risk}`}>{f.risk}</span></td>
                  <td>₺{fmt(f.costMin)} – ₺{fmt(f.costMax)}</td>
                  <td>{fmt(f.reportCount)}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn-edit" onClick={() => setEditFault(f)}>✏️</button>
                      <button className="adm-btn-delete" onClick={() => deleteFault(f.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="adm-table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span>{filtered.length} / {faults.length} kayıt{selected.size > 0 ? ` · ${selected.size} seçili` : ''}</span>
          <Pagination total={filtered.length} page={page} perPage={PER_PAGE} onPage={setPage} />
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MODEL FORM ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const EMPTY_MODEL = {
  heroTitle:'', heroSubtitle:'', blogIntro:'', buyerAdvice:'',
  specs: { motor:'', beygir:'', tork:'', sanziman:'', yakit:'', hiz:'', agirlik:'', bagaj:'' },
  strengths: [''], weaknesses: [''],
  maintenanceTips: [{ km:'', tip:'' }],
};

function ModelForm({ modelKey, initial, onSave, onCancel, faults, models }) {
  const [key, setKey] = useState(modelKey || '');
  const [form, setForm] = useState(initial || EMPTY_MODEL);
  const [selectMode, setSelectMode] = useState('select'); // 'select' or 'custom'

  const unusedModels = useMemo(() => {
    if (!faults) return [];
    const allModels = [...new Set(faults.map(f => f.model))].sort();
    return allModels.filter(m => !models[m]);
  }, [faults, models]);

  // Adjust default selectMode if unusedModels is empty or if we are editing
  useEffect(() => {
    if (modelKey) {
      setSelectMode('custom');
    } else if (unusedModels.length === 0) {
      setSelectMode('custom');
    }
  }, [modelKey, unusedModels]);

  const setSpec = (k, v) => setForm(p => ({ ...p, specs: { ...p.specs, [k]: v } }));
  const setList = (field, i, v) => {
    setForm(p => { const arr = [...p[field]]; arr[i] = v; return { ...p, [field]: arr }; });
  };
  const addToList = (field) => setForm(p => ({ ...p, [field]: [...p[field], ''] }));
  const removeFromList = (field, i) => setForm(p => ({ ...p, [field]: p[field].filter((_, idx) => idx !== i) }));

  const setMaint = (i, k, v) => {
    setForm(p => { const arr = [...p.maintenanceTips]; arr[i] = { ...arr[i], [k]: v }; return { ...p, maintenanceTips: arr }; });
  };
  const addMaint = () => setForm(p => ({ ...p, maintenanceTips: [...p.maintenanceTips, { km:'', tip:'' }] }));
  const removeMaint = (i) => setForm(p => ({ ...p, maintenanceTips: p.maintenanceTips.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!key.trim()) return;
    onSave(key.trim(), {
      ...form,
      strengths: form.strengths.filter(s => s.trim()),
      weaknesses: form.weaknesses.filter(w => w.trim()),
      maintenanceTips: form.maintenanceTips.filter(m => m.km.trim() || m.tip.trim()),
    });
  };

  return (
    <div className="adm-section">
      <div className="adm-section-head">
        <div className="adm-section-title">{modelKey ? `✏️ ${modelKey} Düzenle` : '➕ Yeni Model Detayı'}</div>
      </div>
      <form className="adm-form" onSubmit={handleSubmit}>
        <div className="adm-form-body">
          <div className="adm-form-grid">
            <div className="adm-field full">
              <label>Model Anahtarı * <small>(data.js'deki model adıyla aynı olmalı)</small></label>
              {modelKey ? (
                <input value={key} disabled required />
              ) : selectMode === 'select' && unusedModels.length > 0 ? (
                <div style={{ display: 'flex', gap: 10 }}>
                  <select
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    required
                    style={{ flex: 1 }}
                  >
                    <option value="">-- Listeden Model Seçin --</option>
                    {unusedModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="adm-btn adm-btn-outline"
                    onClick={() => { setSelectMode('custom'); setKey(''); }}
                  >
                    Yeni Model Yaz
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    placeholder="örn. Golf 1.4 TSI"
                    required
                    style={{ flex: 1 }}
                  />
                  {unusedModels.length > 0 && (
                    <button
                      type="button"
                      className="adm-btn adm-btn-outline"
                      onClick={() => { setSelectMode('select'); setKey(''); }}
                    >
                      Listeden Seç
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="adm-field full">
              <label>Hero Başlık</label>
              <input value={form.heroTitle} onChange={e => setForm(p => ({...p, heroTitle: e.target.value}))} placeholder="Volkswagen Golf 1.4 TSI" />
            </div>
            <div className="adm-field full">
              <label>Hero Alt Başlık</label>
              <input value={form.heroSubtitle} onChange={e => setForm(p => ({...p, heroSubtitle: e.target.value}))} placeholder="2013–2019 · Kompakt Sınıf · Benzinli" />
            </div>
            <div className="adm-field full">
              <label>Blog Tanıtım Yazısı</label>
              <textarea rows={4} value={form.blogIntro} onChange={e => setForm(p => ({...p, blogIntro: e.target.value}))} placeholder="Model hakkında detaylı bilgilendirme yazısı..." />
            </div>
            <div className="adm-field full">
              <label>Alıcı Tavsiyesi</label>
              <textarea rows={2} value={form.buyerAdvice} onChange={e => setForm(p => ({...p, buyerAdvice: e.target.value}))} placeholder="Alıcılara öneriler..." />
            </div>
          </div>

          <div className="adm-form-section">⚙️ Teknik Özellikler</div>
          <div className="adm-form-grid">
            {Object.entries(form.specs).map(([k, v]) => (
              <div key={k} className="adm-field">
                <label>{k}</label>
                <input value={v} onChange={e => setSpec(k, e.target.value)} />
              </div>
            ))}
          </div>

          <div className="adm-form-section">✅ Güçlü Yönler</div>
          {form.strengths.map((s, i) => (
            <div key={i} className="adm-list-row">
              <input value={s} onChange={e => setList('strengths', i, e.target.value)} placeholder="Güçlü yön..." />
              <button type="button" className="adm-btn-delete adm-btn-sm" onClick={() => removeFromList('strengths', i)}>✕</button>
            </div>
          ))}
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => addToList('strengths')}>+ Ekle</button>

          <div className="adm-form-section">⚠️ Zayıf Yönler</div>
          {form.weaknesses.map((w, i) => (
            <div key={i} className="adm-list-row">
              <input value={w} onChange={e => setList('weaknesses', i, e.target.value)} placeholder="Zayıf yön..." />
              <button type="button" className="adm-btn-delete adm-btn-sm" onClick={() => removeFromList('weaknesses', i)}>✕</button>
            </div>
          ))}
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => addToList('weaknesses')}>+ Ekle</button>

          <div className="adm-form-section">🛠️ Bakım Rehberi</div>
          {form.maintenanceTips.map((m, i) => (
            <div key={i} className="adm-maint-row">
              <input value={m.km} onChange={e => setMaint(i, 'km', e.target.value)} placeholder="KM" className="adm-maint-km" />
              <input value={m.tip} onChange={e => setMaint(i, 'tip', e.target.value)} placeholder="Bakım açıklaması..." className="adm-maint-tip" />
              <button type="button" className="adm-btn-delete adm-btn-sm" onClick={() => removeMaint(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="adm-btn adm-btn-outline adm-btn-sm" onClick={() => addMaint()}>+ Bakım Ekle</button>
        </div>

        <div className="adm-form-actions">
          <button type="button" className="adm-btn adm-btn-outline" onClick={onCancel}>İptal</button>
          <button type="submit" className="adm-btn adm-btn-primary">💾 Kaydet</button>
        </div>
      </form>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MODELS VIEW ──────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function ModelsView({ models, setModels, faults, notify, onFilterFaults }) {
  const [editModel, setEditModel] = useState(null);
  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    let e = Object.entries(models);
    if (search) {
      const q = search.toLowerCase();
      e = e.filter(([k, m]) => k.toLowerCase().includes(q) || (m.heroTitle || '').toLowerCase().includes(q));
    }
    return e;
  }, [models, search]);

  const getFaultCount = (modelName) => {
    if (!faults) return 0;
    return faults.filter(f => f.model === modelName).length;
  };

  const saveModel = (key, data) => {
    setModels(prev => { const next = { ...prev, [key]: data }; saveModels(next); return next; });
    setEditModel(null);
    notify('Model detayı kaydedildi!');
  };

  const deleteModel = (key) => {
    if (!confirm(`"${key}" model detayını silmek istediğinize emin misiniz?`)) return;
    setModels(prev => { const next = { ...prev }; delete next[key]; saveModels(next); return next; });
    notify('Model detayı silindi!');
  };

  if (editModel) {
    return (
      <>
        <button className="adm-back" onClick={() => setEditModel(null)}>← Listeye Dön</button>
        <ModelForm
          modelKey={editModel === 'new' ? '' : editModel.key}
          initial={editModel === 'new' ? null : editModel.data}
          onSave={saveModel}
          onCancel={() => setEditModel(null)}
          faults={faults}
          models={models}
        />
      </>
    );
  }

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <div className="adm-search">
          <span>🔍</span>
          <input placeholder="Model ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="adm-btn adm-btn-primary" onClick={() => setEditModel('new')}>➕ Yeni Model</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Model</th>
              <th>Başlık</th>
              <th>Blog Yazısı</th>
              <th>Bağlı Arızalar</th>
              <th>Spec</th>
              <th>Güçlü</th>
              <th>Zayıf</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Sonuç bulunamadı</td></tr>
            ) : entries.map(([key, m]) => (
              <tr key={key}>
                <td><strong>{key}</strong></td>
                <td>{m.heroTitle}</td>
                <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{(m.blogIntro || '').substring(0, 60)}…</td>
                <td>
                  <span
                    className="adm-link"
                    style={{ cursor: 'pointer', color: '#FACC15', textDecoration: 'underline', fontWeight: 'bold' }}
                    onClick={() => onFilterFaults && onFilterFaults({ search: key })}
                    title={`"${key}" modeline ait arızaları listele`}
                  >
                    {getFaultCount(key)} arıza
                  </span>
                </td>
                <td>{Object.keys(m.specs || {}).length} alan</td>
                <td>{(m.strengths || []).length}</td>
                <td>{(m.weaknesses || []).length}</td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn-edit" onClick={() => setEditModel({ key, data: m })}>✏️</button>
                    <button className="adm-btn-delete" onClick={() => deleteModel(key)}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-table-footer">{entries.length} / {Object.keys(models).length} model gösteriliyor</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── USERS VIEW ───────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function UserFormModal({ user, onSave, onClose }) {
  const [username, setUsername] = useState(user ? user.username : '');
  const [email, setEmail] = useState(user ? user.email : '');
  const [password, setPassword] = useState(user ? user.password : '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.length < 3) { setError('Kullanıcı adı en az 3 karakter olmalı!'); return; }
    if (!email.includes('@')) { setError('Geçerli bir e-posta adresi girin!'); return; }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı!'); return; }
    onSave({
      id: user ? user.id : Date.now().toString(),
      username,
      email,
      password,
    });
  };

  return (
    <div className="adm-modal-wrap" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="adm-modal">
        <h3>{user ? '✏️ Kullanıcı Düzenle' : '➕ Yeni Kullanıcı Ekle'}</h3>
        {error && <div className="adm-login-error" style={{ marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="adm-field">
            <label>Kullanıcı Adı</label>
            <input value={username} onChange={e => setUsername(e.target.value)} required placeholder="örn. ahmet_oto" />
          </div>
          <div className="adm-field">
            <label>E-posta</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="ornek@email.com" />
          </div>
          <div className="adm-field">
            <label>Şifre</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="En az 6 karakter" />
          </div>
          <div className="adm-modal-actions">
            <button type="button" className="adm-btn adm-btn-outline" onClick={onClose}>İptal</button>
            <button type="submit" className="adm-btn adm-btn-primary">💾 Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UsersView({ users, setUsers, notify }) {
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE_U = 25;

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(u => u.username.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }, [users, search]);
  const paginatedUsers = filtered.slice((page - 1) * PER_PAGE_U, page * PER_PAGE_U);

  const deleteUser = (id) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    setUsers(prev => {
      const next = prev.filter(u => u.id !== id);
      saveUsers(next);
      return next;
    });
    notify('Kullanıcı silindi!');
  };

  const deleteAllUsers = () => {
    if (!confirm('TÜM kullanıcıları silmek istediğinize emin misiniz? Bu geri alınamaz!')) return;
    setUsers([]);
    saveUsers([]);
    localStorage.removeItem('ka_session');
    notify('Tüm kullanıcılar silindi!');
  };

  const handleSaveUser = (user) => {
    let duplicateEmail = false;
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === user.id);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = user;
      } else {
        if (prev.some(u => u.email === user.email)) {
          duplicateEmail = true;
          return prev;
        }
        next = [...prev, user];
      }
      saveUsers(next);
      return next;
    });
    if (duplicateEmail) {
      alert('Bu e-posta adresiyle başka bir kullanıcı zaten kayıtlı!');
      return;
    }
    setEditingUser(null);
    setShowAddUserModal(false);
    notify('Kullanıcı bilgileri başarıyla kaydedildi!');
  };

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <div className="adm-search">
          <span>🔍</span>
          <input placeholder="Kullanıcı ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-toolbar-filters">
          <span style={{ color: '#64748B', fontSize: 13 }}>Toplam: {users.length} kullanıcı</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="adm-btn adm-btn-primary" onClick={() => setShowAddUserModal(true)}>➕ Yeni Kullanıcı</button>
          <button className="adm-btn adm-btn-danger" onClick={deleteAllUsers} style={{ border: '1px solid rgba(248,113,113,0.3)' }}>🗑️ Tümünü Sil</button>
        </div>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th></th>
              <th>Kullanıcı Adı</th>
              <th>E-posta</th>
              <th>ID</th>
              <th>Kayıt Tarihi</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                {users.length === 0 ? 'Henüz kayıtlı kullanıcı yok' : 'Sonuç bulunamadı'}
              </td></tr>
            ) : paginatedUsers.map(u => {
              const date = new Date(Number(u.id));
              const dateStr = isNaN(date.getTime()) ? '—' : date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
              const color = `hsl(${(u.username.charCodeAt(0) * 37) % 360}, 60%, 55%)`;
              return (
                <tr key={u.id}>
                  <td><div className="adm-avatar" style={{ background: color }}>{u.username[0].toUpperCase()}</div></td>
                  <td><strong>{u.username}</strong></td>
                  <td style={{ color: '#94A3B8' }}>{u.email}</td>
                  <td style={{ color: '#475569', fontSize: 11 }}>{u.id}</td>
                  <td>{dateStr}</td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn-edit" onClick={() => setEditingUser(u)}>✏️ Düzenle</button>
                      <button className="adm-btn-delete" onClick={() => deleteUser(u.id)}>🗑️ Sil</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="adm-table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>{filtered.length} / {users.length} kullanıcı gösteriliyor</span>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE_U} onPage={setPage} />
      </div>

      {(showAddUserModal || editingUser) && (
        <UserFormModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={() => { setShowAddUserModal(false); setEditingUser(null); }}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── COMMENTS VIEW ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function CommentsView({ forum, setForum, faults, notify }) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [editingComment, setEditingComment] = useState(null); // { c, text }
  const [page, setPage] = useState(1);
  const PER_PAGE_C = 20;

  // Flatten all comments
  const allComments = useMemo(() => {
    const out = [];
    Object.entries(forum).forEach(([faultId, posts]) => {
      const fault = faults.find(f => String(f.id) === String(faultId));
      const faultLabel = fault ? `${fault.brand} ${fault.model}` : `Arıza #${faultId}`;
      (posts || []).forEach(post => {
        out.push({ ...post, faultId, faultLabel, isReply: false });
        (post.replies || []).forEach(r => {
          out.push({ ...r, faultId, faultLabel, parentId: post.id, isReply: true, type: r.isUsta ? 'usta' : 'yorum' });
        });
      });
    });
    return out;
  }, [forum, faults]);

  const filtered = useMemo(() => {
    let d = allComments;
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(c => c.text.toLowerCase().includes(q) || c.username.toLowerCase().includes(q) || c.faultLabel.toLowerCase().includes(q));
    }
    if (filterType) d = d.filter(c => c.type === filterType);
    return d;
  }, [allComments, search, filterType]);
  const paginatedComments = filtered.slice((page - 1) * PER_PAGE_C, page * PER_PAGE_C);

  const deleteComment = (faultId, commentId, parentId) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return;
    setForum(prev => {
      const next = { ...prev };
      if (parentId) {
        // Delete reply
        next[faultId] = (next[faultId] || []).map(p =>
          p.id === parentId ? { ...p, replies: (p.replies || []).filter(r => r.id !== commentId) } : p
        );
      } else {
        // Delete post
        next[faultId] = (next[faultId] || []).filter(p => p.id !== commentId);
      }
      saveForum(next);
      return next;
    });
    notify('Yorum silindi!');
  };

  const saveCommentEdit = (e) => {
    e.preventDefault();
    if (!editingComment || !editingComment.text.trim()) return;
    const { c, text } = editingComment;
    setForum(prev => {
      const next = { ...prev };
      if (c.parentId) {
        // Edit reply text
        next[c.faultId] = (next[c.faultId] || []).map(p =>
          p.id === c.parentId ? {
            ...p,
            replies: (p.replies || []).map(r => r.id === c.id ? { ...r, text } : r)
          } : p
        );
      } else {
        // Edit post text
        next[c.faultId] = (next[c.faultId] || []).map(p =>
          p.id === c.id ? { ...p, text } : p
        );
      }
      saveForum(next);
      return next;
    });
    setEditingComment(null);
    notify('Yorum güncellendi!');
  };

  const toggleUstaStatus = (c) => {
    setForum(prev => {
      const next = { ...prev };
      if (c.parentId) {
        // Toggle reply isUsta
        next[c.faultId] = (next[c.faultId] || []).map(p =>
          p.id === c.parentId ? {
            ...p,
            replies: (p.replies || []).map(r => r.id === c.id ? { ...r, isUsta: !r.isUsta } : r)
          } : p
        );
      } else {
        // Toggle post isUsta & type
        next[c.faultId] = (next[c.faultId] || []).map(p =>
          p.id === c.id ? {
            ...p,
            isUsta: !p.isUsta,
            type: p.type === 'usta' ? 'yorum' : 'usta'
          } : p
        );
      }
      saveForum(next);
      return next;
    });
    notify('Usta durumu güncellendi!');
  };

  const deleteAllComments = () => {
    if (!confirm('TÜM yorumları silmek istediğinize emin misiniz?')) return;
    setForum({});
    saveForum({});
    notify('Tüm yorumlar silindi!');
  };

  const typeIcons = { usta: '🔧', oneri: '💡', soru: '❓', yorum: '💬' };

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <div className="adm-search">
          <span>🔍</span>
          <input placeholder="Yorum, kullanıcı veya araç ara…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="adm-toolbar-filters">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="">Tüm Türler</option>
            <option value="usta">🔧 Usta Önerisi</option>
            <option value="oneri">💡 Öneri</option>
            <option value="soru">❓ Soru</option>
            <option value="yorum">💬 Yorum</option>
          </select>
          <span style={{ color: '#64748B', fontSize: 13 }}>{allComments.length} yorum</span>
        </div>
        <button className="adm-btn adm-btn-danger" onClick={deleteAllComments} style={{ border: '1px solid rgba(248,113,113,0.3)' }}>🗑️ Tümünü Sil</button>
      </div>

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Tür</th>
              <th>Kullanıcı</th>
              <th>Araç</th>
              <th>Yorum</th>
              <th>Tarih</th>
              <th>👍</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {paginatedComments.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                {allComments.length === 0 ? 'Henüz yorum yok' : 'Sonuç bulunamadı'}
              </td></tr>
            ) : paginatedComments.map(c => (
              <tr key={c.id} style={c.isReply ? { background: 'rgba(255,255,255,0.01)' } : {}}>
                <td>
                  <span className={`adm-status-chip ${c.type === 'usta' ? 'active' : 'inactive'}`}>
                    {typeIcons[c.type] || '💬'} {c.isReply ? '↩ Yanıt' : (c.type || 'yorum')}
                  </span>
                </td>
                <td>
                  <strong>{c.username}</strong>
                  {c.isUsta && <span style={{ color: '#22C55E', fontSize: 10, marginLeft: 4 }}>✓ Usta</span>}
                </td>
                <td style={{ fontSize: 12, color: '#94A3B8' }}>{c.faultLabel}</td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.text}</td>
                <td style={{ fontSize: 12, color: '#64748B' }}>{c.date}</td>
                <td>{c.helpful || 0}</td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn-edit" onClick={() => setEditingComment({ c, text: c.text })} title="Düzenle">✏️</button>
                    <button className="adm-btn-edit" style={{ background: c.isUsta ? 'rgba(34,197,94,0.2)' : 'transparent', color: c.isUsta ? '#22C55E' : '#64748B' }} onClick={() => toggleUstaStatus(c)} title={c.isUsta ? "Usta İşaretini Kaldır" : "Usta Olarak İşaretle"}>🔧</button>
                    <button className="adm-btn-delete" onClick={() => deleteComment(c.faultId, c.id, c.parentId)} title="Sil">🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-table-footer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span>{filtered.length} / {allComments.length} yorum gösteriliyor</span>
        <Pagination total={filtered.length} page={page} perPage={PER_PAGE_C} onPage={setPage} />
      </div>

      {editingComment && (
        <div className="adm-modal-wrap" onClick={e => e.target === e.currentTarget && setEditingComment(null)}>
          <div className="adm-modal">
            <h3>✏️ Yorumu Düzenle</h3>
            <form onSubmit={saveCommentEdit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="adm-field">
                <label>Yorum İçeriği</label>
                <textarea
                  rows={4}
                  value={editingComment.text}
                  onChange={e => setEditingComment(prev => ({ ...prev, text: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '8px', background: '#0F172A', border: '1px solid #334155', color: '#F8FAFC', borderRadius: '6px' }}
                />
              </div>
              <div className="adm-modal-actions">
                <button type="button" className="adm-btn adm-btn-outline" onClick={() => setEditingComment(null)}>İptal</button>
                <button type="submit" className="adm-btn adm-btn-primary">💾 Kaydet</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── SETTINGS VIEW ────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function SettingsView({ faults, setFaults, models, setModels, setForum, setUsers, notify }) {
  const [showPassModal, setShowPassModal] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');

  const changePassword = () => {
    if (oldPass !== getAdminPass()) { setPassError('Mevcut şifre yanlış!'); return; }
    if (newPass.length < 4) { setPassError('Yeni şifre en az 4 karakter olmalı!'); return; }
    if (newPass !== confirmPass) { setPassError('Şifreler eşleşmiyor!'); return; }
    localStorage.setItem(ADMIN_PASS_KEY, newPass);
    setShowPassModal(false);
    setOldPass(''); setNewPass(''); setConfirmPass(''); setPassError('');
    notify('Şifre değiştirildi!');
  };

  const resetFaults = () => {
    if (!confirm('Arıza verilerini varsayılana sıfırlamak istediğinize emin misiniz?')) return;
    localStorage.removeItem(FAULTS_KEY);
    setFaults(defaultFaults);
    notify('Arıza verileri sıfırlandı!');
  };

  const resetModels = () => {
    if (!confirm('Model verilerini varsayılana sıfırlamak istediğinize emin misiniz?')) return;
    localStorage.removeItem(MODELS_KEY);
    setModels(defaultModelDetails);
    notify('Model verileri sıfırlandı!');
  };

  const resetComments = () => {
    if (!confirm('Tüm yorumları silmek istediğinize emin misiniz?')) return;
    localStorage.removeItem(FORUM_KEY);
    setForum({});
    notify('Tüm yorumlar silindi!');
  };

  const resetUsers = () => {
    if (!confirm('Tüm kullanıcıları silmek istediğinize emin misiniz?')) return;
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem('ka_session');
    setUsers([]);
    notify('Tüm kullanıcılar silindi!');
  };

  const resetAll = () => {
    if (!confirm('TÜM VERİLERİ sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;
    localStorage.removeItem(FAULTS_KEY);
    localStorage.removeItem(MODELS_KEY);
    localStorage.removeItem(FORUM_KEY);
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem('ka_session');
    setFaults(defaultFaults);
    setModels(defaultModelDetails);
    setForum({});
    setUsers([]);
    notify('Tüm veriler sıfırlandı!');
  };

  const exportData = () => {
    const data = {
      faults: loadAdminFaults(),
      models: loadAdminModels(),
      users: loadUsers(),
      forum: loadForum(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kronikariza-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Veriler dışa aktarıldı!');
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (!data || typeof data !== 'object') {
            throw new Error('Geçersiz dosya formatı.');
          }
          let valid = false;
          if (data.faults) {
            if (!Array.isArray(data.faults)) throw new Error('Arızalar listesi geçersiz.');
            valid = true;
          }
          if (data.models) {
            if (typeof data.models !== 'object' || Array.isArray(data.models)) throw new Error('Model detayları geçersiz.');
            valid = true;
          }
          if (data.users) {
            if (!Array.isArray(data.users)) throw new Error('Kullanıcılar listesi geçersiz.');
            valid = true;
          }
          if (data.forum) {
            if (typeof data.forum !== 'object' || Array.isArray(data.forum)) throw new Error('Forum yorumları geçersiz.');
            valid = true;
          }
          if (!valid) {
            throw new Error('Dosya içinde içe aktarılacak veri bulunamadı.');
          }
          if (data.faults) { saveFaults(data.faults); setFaults(data.faults); }
          if (data.models) { saveModels(data.models); setModels(data.models); }
          if (data.users) { saveUsers(data.users); setUsers(data.users); }
          if (data.forum) { saveForum(data.forum); setForum(data.forum); }
          notify('Veriler başarıyla içe aktarıldı!');
        } catch (err) {
          notify(`İçe aktarma hatası: ${err.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <>
      {/* Password */}
      <div className="adm-section">
        <div className="adm-section-head">
          <div>
            <div className="adm-section-title">🔐 Güvenlik</div>
            <div className="adm-section-sub">Admin şifresi ve erişim ayarları</div>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#E2E8F0' }}>Admin Şifresi</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                Mevcut şifre: <code style={{ background: '#1A1A24', padding: '2px 8px', borderRadius: 4, color: '#FACC15' }}>
                  {getAdminPass() === DEFAULT_PASS ? 'admin123 (varsayılan)' : '••••••••'}
                </code>
              </div>
            </div>
            <button className="adm-btn adm-btn-outline" onClick={() => setShowPassModal(true)}>Şifre Değiştir</button>
          </div>
        </div>
      </div>

      {/* Data Export/Import */}
      <div className="adm-section">
        <div className="adm-section-head">
          <div>
            <div className="adm-section-title">📦 Veri Yönetimi</div>
            <div className="adm-section-sub">Verileri dışa/içe aktarın veya yedekleyin</div>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">📤 Veri Dışa Aktarma</div>
              <div className="adm-settings-desc">Tüm verileri JSON dosyası olarak indirin</div>
            </div>
            <button className="adm-btn adm-btn-primary" onClick={exportData}>Dışa Aktar</button>
          </div>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">📥 Veri İçe Aktarma</div>
              <div className="adm-settings-desc">Daha önce dışa aktarılmış JSON dosyasını yükleyin</div>
            </div>
            <button className="adm-btn adm-btn-outline" onClick={importData}>İçe Aktar</button>
          </div>
        </div>
      </div>

      {/* Reset sections */}
      <div className="adm-section">
        <div className="adm-section-head">
          <div>
            <div className="adm-section-title">⚠️ Sıfırlama İşlemleri</div>
            <div className="adm-section-sub">Verileri varsayılan değerlere döndürün — dikkatli olun!</div>
          </div>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">Arıza Verilerini Sıfırla</div>
              <div className="adm-settings-desc">Tüm arızalar varsayılan verilere döner</div>
            </div>
            <button className="adm-btn-reset" onClick={resetFaults}>Sıfırla</button>
          </div>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">Model Verilerini Sıfırla</div>
              <div className="adm-settings-desc">Tüm model detayları varsayılana döner</div>
            </div>
            <button className="adm-btn-reset" onClick={resetModels}>Sıfırla</button>
          </div>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">Yorumları Sil</div>
              <div className="adm-settings-desc">Tüm kullanıcı yorumları silinir</div>
            </div>
            <button className="adm-btn-reset" onClick={resetComments}>Sıfırla</button>
          </div>
          <div className="adm-settings-row">
            <div>
              <div className="adm-settings-label">Kullanıcıları Sil</div>
              <div className="adm-settings-desc">Tüm kayıtlı kullanıcı hesapları silinir</div>
            </div>
            <button className="adm-btn-reset" onClick={resetUsers}>Sıfırla</button>
          </div>
          <div style={{ borderTop: '1px solid #2D2D3A', paddingTop: 16 }}>
            <div className="adm-settings-row">
              <div>
                <div className="adm-settings-label" style={{ color: '#F87171' }}>🚨 Tüm Verileri Sıfırla</div>
                <div className="adm-settings-desc">Her şeyi varsayılana döndürür — bu işlem geri alınamaz!</div>
              </div>
              <button className="adm-btn adm-btn-danger" style={{ border: '1px solid rgba(248,113,113,0.3)', padding: '9px 16px', borderRadius: 8, fontWeight: 700 }} onClick={resetAll}>Tümünü Sıfırla</button>
            </div>
          </div>
        </div>
      </div>

      {/* Password Modal */}
      {showPassModal && (
        <div className="adm-modal-wrap" onClick={e => e.target === e.currentTarget && setShowPassModal(false)}>
          <div className="adm-modal">
            <h3>🔐 Şifre Değiştir</h3>
            <p>Yeni admin şifrenizi belirleyin</p>
            {passError && <div className="adm-login-error">{passError}</div>}
            <div className="adm-field">
              <label>Mevcut Şifre</label>
              <input type="password" value={oldPass} onChange={e => { setOldPass(e.target.value); setPassError(''); }} placeholder="Mevcut şifre" />
            </div>
            <div className="adm-field">
              <label>Yeni Şifre</label>
              <input type="password" value={newPass} onChange={e => { setNewPass(e.target.value); setPassError(''); }} placeholder="Yeni şifre (min 4 karakter)" />
            </div>
            <div className="adm-field">
              <label>Yeni Şifre Tekrar</label>
              <input type="password" value={confirmPass} onChange={e => { setConfirmPass(e.target.value); setPassError(''); }} placeholder="Yeni şifre tekrar" />
            </div>
            <div className="adm-modal-actions">
              <button className="adm-btn adm-btn-outline" onClick={() => setShowPassModal(false)}>İptal</button>
              <button className="adm-btn adm-btn-primary" onClick={changePassword}>Şifreyi Değiştir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── PENDING VIEW ─────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
function PendingView({ faults, setFaults, notify }) {
  const [pending, setPending] = useState(() => loadPending());
  const [selected, setSelected] = useState(new Set());

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const onStorage = (e) => { if (e.key === PENDING_KEY) setPending(loadPending()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const approve = (item) => {
    const approved = { ...item, id: Date.now(), reportCount: item.reportCount || 1,
      avgCost: Math.round((Number(item.costMin) + Number(item.costMax)) / 2) || 0 };
    delete approved._pendingId; delete approved._submittedBy; delete approved._submittedAt;
    setFaults(prev => { const next = [approved, ...prev]; saveFaults(next); return next; });
    setPending(prev => { const next = prev.filter(p => p._pendingId !== item._pendingId); savePending(next); return next; });
    notify('Arıza onaylandı ve listeye eklendi!');
  };

  const reject = (pendingId) => {
    if (!confirm('Bu öneriyi reddetmek istediğinize emin misiniz?')) return;
    setPending(prev => { const next = prev.filter(p => p._pendingId !== pendingId); savePending(next); return next; });
    notify('Öneri reddedildi.');
  };

  const toggleSelect = (id) => setSelected(prev => {
    const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next;
  });

  const allSelected = pending.length > 0 && pending.every(p => selected.has(p._pendingId));
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(pending.map(p => p._pendingId)));
  };

  const approveSelected = () => {
    const toApprove = pending.filter(p => selected.has(p._pendingId));
    if (!toApprove.length) return;
    let newFaults = [...faults];
    toApprove.forEach((item, i) => {
      const approved = { ...item, id: Date.now() + i, reportCount: 1,
        avgCost: Math.round((Number(item.costMin) + Number(item.costMax)) / 2) || 0 };
      delete approved._pendingId; delete approved._submittedBy; delete approved._submittedAt;
      newFaults = [approved, ...newFaults];
    });
    saveFaults(newFaults); setFaults(newFaults);
    setPending(prev => { const next = prev.filter(p => !selected.has(p._pendingId)); savePending(next); return next; });
    setSelected(new Set());
    notify(`${toApprove.length} arıza onaylandı!`);
  };

  const rejectSelected = () => {
    if (!selected.size || !confirm(`Seçili ${selected.size} öneriyi reddetmek istediğinize emin misiniz?`)) return;
    setPending(prev => { const next = prev.filter(p => !selected.has(p._pendingId)); savePending(next); return next; });
    setSelected(new Set());
    notify('Seçili öneriler reddedildi.');
  };

  if (pending.length === 0) {
    return (
      <div className="adm-section">
        <div className="adm-section-head">
          <div>
            <div className="adm-section-title">✅ Bekleyen Öneri Yok</div>
            <div className="adm-section-sub">Tüm kullanıcı önerileri işlendi.</div>
          </div>
        </div>
        <div style={{ padding: 48, textAlign: 'center', color: '#64748B' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
          <p style={{ fontSize: 15 }}>Onay bekleyen arıza önerisi bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="adm-section">
      <div className="adm-toolbar">
        <div style={{ color: '#E2E8F0', fontWeight: 600, fontSize: 14 }}>📋 {pending.length} bekleyen öneri</div>
        {selected.size > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="adm-btn adm-btn-primary" onClick={approveSelected}>✅ Onayla ({selected.size})</button>
            <button className="adm-btn adm-btn-danger" onClick={rejectSelected} style={{ border: '1px solid rgba(248,113,113,0.3)' }}>❌ Reddet ({selected.size})</button>
          </div>
        )}
      </div>
      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}><input type="checkbox" checked={allSelected} onChange={toggleAll} /></th>
              <th>Gönderen</th>
              <th>Tarih</th>
              <th>Marka / Model</th>
              <th>Arıza</th>
              <th>Risk</th>
              <th>Masraf</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {pending.map(p => (
              <tr key={p._pendingId}>
                <td><input type="checkbox" checked={selected.has(p._pendingId)} onChange={() => toggleSelect(p._pendingId)} /></td>
                <td><strong>{p._submittedBy || 'Anonim'}</strong></td>
                <td style={{ fontSize: 12, color: '#64748B' }}>{p._submittedAt ? new Date(p._submittedAt).toLocaleDateString('tr-TR') : '—'}</td>
                <td><strong>{p.brand}</strong> {p.model}</td>
                <td>{p.fault}</td>
                <td><span className={`adm-risk ${p.risk || 'ORTA'}`}>{p.risk || 'ORTA'}</span></td>
                <td>{(p.costMin || p.costMax) ? `₺${fmt(p.costMin || 0)} – ₺${fmt(p.costMax || 0)}` : '—'}</td>
                <td>
                  <div className="adm-actions">
                    <button className="adm-btn-edit" style={{ background: 'rgba(34,197,94,0.15)', color: '#22C55E' }} onClick={() => approve(p)} title="Onayla">✅</button>
                    <button className="adm-btn-delete" onClick={() => reject(p._pendingId)} title="Reddet">❌</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="adm-table-footer">{pending.length} bekleyen öneri</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// ── MAIN ADMIN PANEL (Layout with Sidebar) ───────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
const NAV_ITEMS = [
  { key: 'dashboard', icon: '📊', label: 'Dashboard' },
  { key: 'faults',    icon: '🔴', label: 'Arıza Yönetimi' },
  { key: 'models',    icon: '📄', label: 'Model Yönetimi' },
  { key: 'users',     icon: '👥', label: 'Kullanıcılar' },
  { key: 'comments',  icon: '💬', label: 'Yorum Yönetimi' },
  { key: 'pending',   icon: '⏳', label: 'Bekleyen Onaylar' },
  { key: 'settings',  icon: '⚙️', label: 'Ayarlar' },
];

const VIEW_TITLES = {
  dashboard: { title: 'Dashboard', sub: 'Genel bakış ve istatistikler' },
  faults: { title: 'Arıza Yönetimi', sub: 'Arıza kayıtlarını ekle, düzenle, sil' },
  models: { title: 'Model Yönetimi', sub: 'Model detay sayfalarını yönet' },
  users: { title: 'Kullanıcı Yönetimi', sub: 'Kayıtlı kullanıcıları yönet' },
  comments: { title: 'Yorum Yönetimi', sub: 'Kullanıcı yorumlarını yönet ve denetle' },
  settings: { title: 'Ayarlar', sub: 'Şifre, veri yönetimi ve sıfırlama' },
};

export default function AdminPanel({ onClose, onDataChange }) {
  const [authed, setAuthed] = useState(() => isAdmin());
  const [tab, setTab] = useState('dashboard');
  const [faults, setFaults] = useState(() => loadAdminFaults());
  const [models, setModels] = useState(() => loadAdminModels());
  const [users, setUsers] = useState(() => loadUsers());
  const [forum, setForum] = useState(() => loadForum());
  const [pending, setPending] = useState(() => loadPending());
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState('');
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [initialFilters, setInitialFilters] = useState(null);

  const handleFilterClick = (filters) => {
    setInitialFilters(filters);
    setTab('faults');
  };

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }
  }, [toast]);

  const notify = (msg, type = '') => {
    setToast(msg);
    setToastType(type);
    onDataChange && onDataChange();
  };

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_KEY);
    setAuthed(false);
  };

  if (!authed) return <AdminLogin onLogin={() => setAuthed(true)} />;

  const viewInfo = VIEW_TITLES[tab] || VIEW_TITLES.dashboard;

  return (
    <div className="adm-layout">
      {/* Mobile sidebar overlay */}
      {mobileSidebar && <div className="adm-sidebar-overlay" onClick={() => setMobileSidebar(false)} />}

      {/* Sidebar */}
      <aside className={`adm-sidebar${mobileSidebar ? ' mobile-open' : ''}`}>
        <div className="adm-sidebar-brand">
          <div className="adm-sidebar-brand-name">KRONİKARIZA</div>
          <div className="adm-sidebar-brand-sub">Admin Paneli v2.0</div>
        </div>

        <nav className="adm-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              className={`adm-nav-item${tab === item.key ? ' active' : ''}`}
              onClick={() => { setTab(item.key); setMobileSidebar(false); }}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              {item.label}
              {item.key === 'faults' && <span className="adm-nav-badge">{faults.length}</span>}
              {item.key === 'models' && <span className="adm-nav-badge">{Object.keys(models).length}</span>}
              {item.key === 'users' && <span className="adm-nav-badge">{users.length}</span>}
              {item.key === 'comments' && (
                <span className="adm-nav-badge">
                  {Object.values(forum).reduce((s, a) => s + a.length + a.reduce((rs, p) => rs + (p.replies || []).length, 0), 0)}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-footer">
          <div className="adm-sidebar-user">👤 Admin</div>
          <button className="adm-logout-btn" onClick={handleLogout}>
            🚪 Çıkış Yap
          </button>
          <button className="adm-logout-btn" onClick={onClose} style={{ borderColor: '#FACC15', color: '#FACC15' }}>
            ← Siteye Dön
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="adm-main">
        <header className="adm-topbar">
          <div>
            <button className="adm-mobile-menu" onClick={() => setMobileSidebar(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div className="adm-topbar-title">{viewInfo.title}</div>
            <div className="adm-topbar-sub">{viewInfo.sub}</div>
          </div>
          <div className="adm-topbar-actions">
            <button className="adm-btn adm-btn-outline adm-btn-sm" onClick={onClose}>← Siteye Dön</button>
          </div>
        </header>

        <div className="adm-content">
          {tab === 'dashboard' && <DashboardView faults={faults} models={models} users={users} forum={forum} onFilterClick={handleFilterClick} />}
          {tab === 'faults' && <FaultsView faults={faults} setFaults={setFaults} notify={notify} initialFilters={initialFilters} clearInitialFilters={() => setInitialFilters(null)} />}
          {tab === 'models' && <ModelsView models={models} setModels={setModels} faults={faults} notify={notify} onFilterFaults={handleFilterClick} />}
          {tab === 'users' && <UsersView users={users} setUsers={setUsers} notify={notify} />}
          {tab === 'comments' && <CommentsView forum={forum} setForum={setForum} faults={faults} notify={notify} />}
          {tab === 'settings' && <SettingsView faults={faults} setFaults={setFaults} models={models} setModels={setModels} setForum={setForum} setUsers={setUsers} notify={notify} />}
        </div>
      </div>

      {/* Toast */}
      {toast && <div className={`adm-toast${toastType === 'error' ? ' error' : ''}`}>✅ {toast}</div>}
    </div>
  );
}
