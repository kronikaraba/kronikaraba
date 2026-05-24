import { useState, useMemo } from 'react';
import { loadCategories, loadMotorTypes } from './siteContent.js';
import { normalizeFault, parseYearRange, formatYearRange } from './faultUtils.js';

const EMPTY = {
  brand: '', model: '', year: '', motorType: 'Benzin',
  fault: '', symptoms: '', checkTip: '', risk: 'ORTA',
  costMin: '', costMax: '', kmDisplay: '', kmMin: '', reportCount: '1', category: 'Motor',
};

function initForm(fault) {
  if (!fault) return { ...EMPTY };
  return {
    ...EMPTY,
    ...fault,
    fault: fault.fault || fault.description || '',
    year: fault.year || formatYearRange(fault.yearMin, fault.yearMax),
    costMin: fault.costMin ?? '',
    costMax: fault.costMax ?? '',
    kmMin: fault.kmMin ?? '',
    reportCount: fault.reportCount ?? 1,
    _pendingId: fault._pendingId,
  };
}

export default function FaultEditModal({ fault, allFaults, onSave, onClose }) {
  const isPending = Boolean(fault?._pendingId);
  const [form, setForm] = useState(() => initForm(fault));
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const catOptions = useMemo(() => loadCategories(), []);
  const motorOptions = useMemo(() => loadMotorTypes(), []);
  const brands = useMemo(() => [...new Set(allFaults.map(f => f.brand))].sort(), [allFaults]);

  const costInvalid = Number(form.costMin) > 0 && Number(form.costMax) > 0 && Number(form.costMin) > Number(form.costMax);

  const submit = (e) => {
    e.preventDefault();
    if (!form.brand?.trim() || !form.model?.trim() || !form.fault?.trim()) return;
    if (costInvalid) return;
    const { yearMin, yearMax, year } = parseYearRange(form.year);
    onSave(normalizeFault({
      ...form,
      year,
      yearMin,
      yearMax,
      _pendingId: form._pendingId,
    }));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal fault-edit-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>
            {isPending ? 'Öneriyi tamamla ve yayınla' : fault ? 'Arızayı düzenle' : 'Yeni arıza kaydı'}
          </h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        {isPending && (
          <p className="fault-edit-hint">Kullanıcı önerisindeki eksik alanları doldurup kaydedin; kayıt otomatik yayınlanır.</p>
        )}
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Marka *</label>
                <input list="fault-brands" value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="örn. Volkswagen" required />
                <datalist id="fault-brands">{brands.map(b => <option key={b} value={b} />)}</datalist>
              </div>
              <div className="form-group">
                <label>Model *</label>
                <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="örn. Golf 1.4 TSI" required />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Model yılları</label>
                <input value={form.year} onChange={e => set('year', e.target.value)} placeholder="2015-2020" />
              </div>
              <div className="form-group">
                <label>Risk seviyesi</label>
                <select value={form.risk} onChange={e => set('risk', e.target.value)}>
                  <option>YÜKSEK</option><option>ORTA</option><option>DÜŞÜK</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Arıza başlığı *</label>
              <input value={form.fault} onChange={e => set('fault', e.target.value)} placeholder="Kısa ve net başlık" required />
            </div>
            <div className="form-group">
              <label>Belirtiler</label>
              <textarea
                value={form.symptoms}
                onChange={e => set('symptoms', e.target.value)}
                placeholder="Sürücünün fark ettiği belirtiler"
                rows={2}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>
            <div className="form-group">
              <label>Kontrol ipucu</label>
              <input value={form.checkTip} onChange={e => set('checkTip', e.target.value)} placeholder="Alıcı veya servis neye baksın?" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Min. masraf (₺)</label>
                <input type="number" min="0" value={form.costMin} onChange={e => set('costMin', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Maks. masraf (₺)</label>
                <input type="number" min="0" value={form.costMax} onChange={e => set('costMax', e.target.value)} placeholder="0" />
              </div>
            </div>
            {costInvalid && <p className="form-error">Maksimum masraf, minimumdan küçük olamaz.</p>}
            <div className="form-row">
              <div className="form-group">
                <label>Görüldüğü KM (metin)</label>
                <input value={form.kmDisplay} onChange={e => set('kmDisplay', e.target.value)} placeholder="örn. 80.000 km+" />
              </div>
              <div className="form-group">
                <label>KM (sayı, filtre için)</label>
                <input type="number" min="0" value={form.kmMin} onChange={e => set('kmMin', e.target.value)} placeholder="80000" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Kategori</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}>
                  {catOptions.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Motor tipi</label>
                <select value={form.motorType} onChange={e => set('motorType', e.target.value)}>
                  {motorOptions.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Kullanıcı doğrulama sayısı</label>
              <input type="number" min="1" value={form.reportCount} onChange={e => set('reportCount', e.target.value)} title="Kaç kullanıcı bu arızayı doğruladı" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit" disabled={costInvalid}>
              {isPending ? 'Yayınla' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
