import { useState, useMemo } from 'react';
import { loadCategories, loadMotorTypes } from './siteContent.js';

const EMPTY = {
  brand: '', model: '', year: '', yearMin: '', yearMax: '', motorType: 'Benzin',
  fault: '', description: '', symptoms: '', checkTip: '', risk: 'ORTA',
  costMin: '', costMax: '', kmDisplay: '', kmMin: '', reportCount: '', category: 'Motor',
};

export default function FaultEditModal({ fault, allFaults, onSave, onClose }) {
  const [form, setForm] = useState(() => fault ? { ...fault, fault: fault.fault || fault.description } : EMPTY);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const catOptions = useMemo(() => loadCategories(), []);
  const motorOptions = useMemo(() => loadMotorTypes(), []);
  const brands = useMemo(() => [...new Set(allFaults.map(f => f.brand))].sort(), [allFaults]);

  const avg = Math.round((Number(form.costMin) + Number(form.costMax)) / 2) || 0;
  const costInvalid = Number(form.costMin) > 0 && Number(form.costMax) > 0 && Number(form.costMin) > Number(form.costMax);

  const submit = (e) => {
    e.preventDefault();
    if (!form.brand || !form.model || !form.fault) return;
    if (costInvalid) return;
    onSave({
      ...form,
      id: form.id || Date.now(),
      yearMin: Number(form.yearMin) || 2020,
      yearMax: Number(form.yearMax) || 2025,
      costMin: Number(form.costMin) || 0,
      costMax: Number(form.costMax) || 0,
      avgCost: avg,
      kmMin: Number(form.kmMin) || 0,
      reportCount: Number(form.reportCount) || 1,
      description: form.fault,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fault-edit-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{fault ? 'Arızayı Düzenle' : 'Yeni Arıza'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Marka *</label>
                <input list="fault-brands" value={form.brand} onChange={e => set('brand', e.target.value)} required />
                <datalist id="fault-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Yıl</label>
                <input value={form.year} onChange={e => set('year', e.target.value)} placeholder="2015-2020" />
              </div>
              <div className="form-group">
                <label>Risk</label>
                <select value={form.risk} onChange={e => set('risk', e.target.value)}>
                  <option>YÜKSEK</option><option>ORTA</option><option>DÜŞÜK</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Arıza *</label>
              <input value={form.fault} onChange={e => set('fault', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Belirtiler</label>
              <input value={form.symptoms} onChange={e => set('symptoms', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Kontrol ipucu</label>
              <input value={form.checkTip} onChange={e => set('checkTip', e.target.value)} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min masraf</label>
                <input type="number" value={form.costMin} onChange={e => set('costMin', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Maks masraf</label>
                <input type="number" value={form.costMax} onChange={e => set('costMax', e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>KM</label>
                <input value={form.kmDisplay} onChange={e => set('kmDisplay', e.target.value)} />
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
                <label>Motor tipi</label>
                <select value={form.motorType} onChange={e => set('motorType', e.target.value)}>
                  {motorOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Doğrulama</label>
                <input type="number" value={form.reportCount} onChange={e => set('reportCount', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit" disabled={costInvalid}>Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}
