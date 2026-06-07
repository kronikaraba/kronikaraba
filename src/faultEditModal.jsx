import { useState, useMemo } from 'react';
import { loadCategories, loadMotorTypes } from './siteContent.js';
import { normalizeFault, parseYearRange, formatYearRange } from './faultUtils.js';
import { ForumImageAttach } from './ForumImages.jsx';

const EMPTY = {
  brand: '', model: '', year: '', motorType: 'Benzin',
  fault: '', symptoms: '', checkTip: '', risk: 'ORTA',
  costMin: '', costMax: '', kmDisplay: '', kmMin: '', reportCount: '1', category: 'Motor',
  images: [],
};

function cleanText(value) {
  return String(value || '').trim();
}

function getStoredModelBrand(modelName, detail) {
  const directBrand = cleanText(detail?.brand);
  if (directBrand) return directBrand;

  const title = cleanText(detail?.heroTitle);
  const name = cleanText(modelName);
  if (title && name && title.toLocaleLowerCase('tr-TR').endsWith(name.toLocaleLowerCase('tr-TR'))) {
    return cleanText(title.slice(0, title.length - name.length));
  }

  return '';
}

function storedModelExists(models, brand, model) {
  const targetBrand = cleanText(brand);
  const targetModel = cleanText(model);
  if (!targetModel) return false;
  return Object.entries(models || {}).some(([name, detail]) => {
    if (name !== targetModel) return false;
    const storedBrand = getStoredModelBrand(name, detail);
    return !targetBrand || !storedBrand || storedBrand === targetBrand;
  });
}

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
    images: Array.isArray(fault.images) ? fault.images : [],
    _pendingId: fault._pendingId,
  };
}

export default function FaultEditModal({ fault, allFaults, models = {}, onSave, onClose, categories, motorTypes, allowManualModel = false }) {
  const isPending = Boolean(fault?._pendingId);
  const [form, setForm] = useState(() => initForm(fault));
  const [manualModel, setManualModel] = useState(() => (
    allowManualModel
    && Boolean(fault?.brand)
    && Boolean(fault?.model)
    && !allFaults.some(f => f.brand === fault.brand && f.model === fault.model)
    && !storedModelExists(models, fault.brand, fault.model)
  ));
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const catOptions = categories || [];
  const motorOptions = motorTypes || [];
  const storedModelEntries = useMemo(() => {
    return Object.entries(models || {})
      .map(([model, detail]) => ({ model, brand: getStoredModelBrand(model, detail) }))
      .filter(item => item.model);
  }, [models]);
  const brandOptions = useMemo(() => {
    return [...new Set([
      ...allFaults.map(f => f.brand),
      ...storedModelEntries.map(item => item.brand),
      form.brand,
    ].filter(Boolean))]
      .sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allFaults, storedModelEntries, form.brand]);
  const modelOptions = useMemo(() => {
    const options = [
      ...allFaults.filter(f => f.brand === form.brand).map(f => f.model),
      ...storedModelEntries.filter(item => item.brand === form.brand).map(item => item.model),
    ];
    if (form.model && !options.includes(form.model)) options.push(form.model);
    return [...new Set(options)].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allFaults, storedModelEntries, form.brand, form.model]);

  const setBrand = (brand) => {
    setForm(prev => ({
      ...prev,
      brand,
      model: !manualModel && (
        allFaults.some(f => f.brand === brand && f.model === prev.model)
        || storedModelEntries.some(item => item.brand === brand && item.model === prev.model)
      ) ? prev.model : '',
    }));
  };

  const toggleManualModel = (enabled) => {
    setManualModel(enabled);
    setForm(prev => ({ ...prev, model: '' }));
  };

  const costInvalid = Number(form.costMin) > 0 && Number(form.costMax) > 0 && Number(form.costMin) > Number(form.costMax);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!form.brand?.trim() || !form.model?.trim() || !form.fault?.trim()) {
      setSubmitError('Marka, model ve ariza basligi zorunludur.');
      return;
    }
    if (costInvalid) {
      setSubmitError('Maksimum masraf, minimumdan kucuk olamaz.');
      return;
    }
    if (uploadingImages) {
      setSubmitError('Görsel yüklemesi tamamlanmadan kaydedemezsiniz.');
      return;
    }
    const { yearMin, yearMax, year } = parseYearRange(form.year);
    setSaving(true);
    try {
      await onSave({
        ...form,
        images: form.images?.length ? form.images : undefined,
        year,
        yearMin,
        yearMax,
        _pendingId: form._pendingId,
      });
    } catch (err) {
      console.error('Failed to save fault', err);
      setSubmitError('Ariza kaydedilemedi. Lutfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
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
                <select value={form.brand} onChange={e => setBrand(e.target.value)} required>
                  <option value="" disabled>Marka seçin</option>
                  {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Model *</label>
                {manualModel ? (
                  <input
                    value={form.model}
                    onChange={e => set('model', e.target.value)}
                    placeholder="Model adını manuel girin"
                    required
                    disabled={!form.brand}
                  />
                ) : (
                  <select value={form.model} onChange={e => set('model', e.target.value)} required disabled={!form.brand}>
                    <option value="" disabled>Model seçin</option>
                    {modelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}
                {allowManualModel && (
                  <label className="manual-model-toggle">
                    <input
                      type="checkbox"
                      checked={manualModel}
                      onChange={e => toggleManualModel(e.target.checked)}
                      disabled={!form.brand}
                    />
                    <span>Model listede yok, manuel gir</span>
                  </label>
                )}
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
            <div className="form-group">
              <label>Arıza görselleri</label>
              <ForumImageAttach
                images={form.images || []}
                onChange={images => set('images', images)}
                onUploadingChange={setUploadingImages}
                disabled={saving}
                buttonLabel="📷 Görsel ekle"
                hint="Arıza, motor, uyarı ekranı veya parça fotoğrafı · en fazla 3 · max 5 MB"
              />
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
            {submitError && <p className="form-error">{submitError}</p>}
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
            <button type="button" className="btn-cancel" onClick={onClose} disabled={saving || uploadingImages}>İptal</button>
            <button type="submit" className="btn-submit" disabled={costInvalid || saving || uploadingImages}>
              {uploadingImages ? 'Görseller yükleniyor...' : saving ? 'Kaydediliyor...' : (isPending ? 'Yayınla' : 'Kaydet')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
