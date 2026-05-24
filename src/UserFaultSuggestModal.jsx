import { useState, useMemo } from 'react';
import { loadCategories, loadMotorTypes } from './siteContent.js';
import { savePending, loadPending } from './adminStorage.js';
import { normalizeFault } from './faultUtils.js';

const EMPTY = {
  brand: '', model: '', fault: '', symptoms: '', category: 'Motor', motorType: 'Benzin',
  year: '', risk: 'ORTA',
};

export default function UserFaultSuggestModal({ user, allFaults, onClose, onSubmit, onDirectPublish }) {
  const isAdminUser = user?.isAdmin === true;
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const catOptions = useMemo(() => loadCategories(), []);
  const motorOptions = useMemo(() => loadMotorTypes(), []);
  const brands = useMemo(() => [...new Set(allFaults.map(f => f.brand))].sort(), [allFaults]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.brand.trim() || !form.model.trim() || !form.fault.trim()) return;

    const draft = normalizeFault({
      ...form,
      id: Date.now(),
      fault: form.fault.trim(),
      year: form.year,
      costMin: 0,
      costMax: 0,
      kmDisplay: '',
      checkTip: '',
      symptoms: form.symptoms,
    });

    if (isAdminUser && onDirectPublish) {
      onDirectPublish(draft);
      onClose();
      return;
    }

    const pending = loadPending();
    savePending([...pending, {
      ...draft,
      _pendingId: `p-${Date.now()}`,
      _submittedBy: user?.username || 'Anonim',
      _submittedAt: new Date().toLocaleDateString('tr-TR'),
    }]);
    setSubmitted(true);
    if (onSubmit) onSubmit();
  };

  if (submitted) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 440 }} role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>Teşekkürler!</h2>
            <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
          </div>
          <div className="modal-body" style={{ textAlign: 'center', padding: '32px 24px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <p style={{ fontSize: 15, color: 'var(--gray-700)', lineHeight: 1.6 }}>
              Arıza öneriniz başarıyla gönderildi.<br />
              Yönetici onayından sonra veritabanına eklenecektir.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-submit" onClick={onClose}>Tamam</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fault-edit-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>🚗 Arıza Bildir</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        {!isAdminUser && (
          <div className="suggest-info-banner">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Öneriniz admin onayından sonra yayınlanacaktır.</span>
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Marka *</label>
                <input list="suggest-brands" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="örn. Volkswagen" required />
                <datalist id="suggest-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="örn. Golf" required />
              </div>
            </div>
            <div className="form-group">
              <label>Arıza Açıklaması *</label>
              <input value={form.fault} onChange={e => set('fault', e.target.value)} placeholder="örn. TSI Zincir Gergi Arızası" required />
            </div>
            <div className="form-group">
              <label>Belirtiler</label>
              <textarea
                value={form.symptoms}
                onChange={e => set('symptoms', e.target.value)}
                placeholder="Araçta yaşadığınız belirtileri açıklayın…"
                rows={3}
                maxLength={500}
                style={{ resize: 'vertical' }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Yıl Aralığı</label>
                <input value={form.year} onChange={e => set('year', e.target.value)} placeholder="örn. 2015-2020" />
              </div>
              <div className="form-group">
                <label>Kategori</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {catOptions.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Motor Tipi</label>
                <select value={form.motorType} onChange={e => set('motorType', e.target.value)}>
                  {motorOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Risk Tahmini</label>
                <select value={form.risk} onChange={e => set('risk', e.target.value)}>
                  <option>YÜKSEK</option><option>ORTA</option><option>DÜŞÜK</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit">Gönder</button>
          </div>
        </form>
      </div>
    </div>
  );
}
