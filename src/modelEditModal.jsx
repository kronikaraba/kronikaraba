import { useState, useMemo, useEffect } from 'react';
import { ForumImageAttach } from './ForumImages.jsx';

const EMPTY_MODEL = {
  brand: '', heroTitle: '', heroSubtitle: '', blogIntro: '', buyerAdvice: '',
  images: [],
  specs: { motor: '', beygir: '', tork: '', sanziman: '', yakit: '', hiz: '', agirlik: '', bagaj: '' },
  strengths: [''], weaknesses: [''],
  maintenanceTips: [{ km: '', tip: '' }],
};

function normalizeModelImages(value) {
  const list = Array.isArray(value) ? value : (value ? [value] : []);

  return list
    .map((img, index) => {
      if (typeof img === 'string') {
        const url = img.trim();
        return url ? { id: `model-img-${index}`, url, name: '' } : null;
      }
      const url = String(img?.url || '').trim();
      if (!url) return null;
      return {
        id: String(img.id || `model-img-${index}`),
        url,
        name: String(img.name || ''),
      };
    })
    .filter(Boolean);
}

export default function ModelEditModal({ modelKey, initial, models, faults, onSave, onClose }) {
  const [key, setKey] = useState(modelKey || '');
  const [form, setForm] = useState(() => {
    if (initial) {
      return {
        ...EMPTY_MODEL,
        ...initial,
        brand: initial.brand || '',
        images: normalizeModelImages(initial.images ?? initial.image),
      };
    }
    // If modelKey is set, try to infer brand from existing faults
    if (modelKey) {
      const faultForModel = faults.find(f => f.model === modelKey);
      return { ...EMPTY_MODEL, brand: faultForModel?.brand || '' };
    }
    return { ...EMPTY_MODEL };
  });
  const [selectMode, setSelectMode] = useState('select');
  const [uploadingImages, setUploadingImages] = useState(false);

  // Get all unique brands from faults
  const brandOptions = useMemo(() => {
    return [...new Set(faults.map(f => f.brand).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'));
  }, [faults]);

  const unusedModels = useMemo(() => {
    let all = [...new Set(faults.map(f => f.model))].sort();
    // If a brand is selected, filter models by that brand
    if (form.brand) {
      const brandModels = new Set(faults.filter(f => f.brand === form.brand).map(f => f.model));
      all = all.filter(m => brandModels.has(m));
    }
    return all.filter(m => !models[m]);
  }, [faults, models, form.brand]);

  useEffect(() => {
    if (modelKey) setSelectMode('custom');
    else if (unusedModels.length === 0) setSelectMode('custom');
  }, [modelKey, unusedModels.length]);

  const setBrand = (brand) => {
    setForm(p => ({ ...p, brand }));
    // Reset model selection when brand changes (only if not editing)
    if (!modelKey) setKey('');
  };

  const setSpec = (k, v) => setForm(p => ({ ...p, specs: { ...p.specs, [k]: v } }));
  const setList = (field, i, v) => setForm(p => {
    const arr = [...p[field]]; arr[i] = v; return { ...p, [field]: arr };
  });
  const addToList = (field) => setForm(p => ({ ...p, [field]: [...p[field], ''] }));
  const removeFromList = (field, i) => setForm(p => ({ ...p, [field]: p[field].filter((_, idx) => idx !== i) }));
  const setMaint = (i, k, v) => setForm(p => {
    const arr = [...p.maintenanceTips];
    arr[i] = { ...arr[i], [k]: v };
    return { ...p, maintenanceTips: arr };
  });

  const submit = (e) => {
    e.preventDefault();
    if (uploadingImages) return;
    if (!key.trim()) return;
    onSave(key.trim(), {
      ...form,
      brand: form.brand,
      images: form.images?.length ? form.images : undefined,
      strengths: form.strengths.filter(s => s.trim()),
      weaknesses: form.weaknesses.filter(w => w.trim()),
      maintenanceTips: form.maintenanceTips.filter(m => m.km.trim() || m.tip.trim()),
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal model-edit-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{modelKey ? 'Model makalesini düzenle' : 'Yeni model sayfası'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body admin-scroll-body">
            {/* Marka seçimi */}
            <div className="form-group">
              <label>Marka *</label>
              {modelKey ? (
                <input value={form.brand} disabled />
              ) : (
                <select value={form.brand} onChange={e => setBrand(e.target.value)} required>
                  <option value="" disabled>Marka seçin</option>
                  {brandOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              )}
            </div>
            {/* Model seçimi */}
            <div className="form-group">
              <label>Model adı * <small>(arıza kayıtlarındaki model ile aynı)</small></label>
              {modelKey ? (
                <input value={key} disabled />
              ) : selectMode === 'select' && unusedModels.length > 0 ? (
                <div className="form-row">
                  <select value={key} onChange={e => setKey(e.target.value)} required style={{ flex: 1 }} disabled={!form.brand}>
                    <option value="">Listeden seçin</option>
                    {unusedModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button type="button" className="btn-cancel" onClick={() => setSelectMode('custom')}>Yeni yaz</button>
                </div>
              ) : (
                <div className="form-row">
                  <input value={key} onChange={e => setKey(e.target.value)} placeholder="örn. Golf 1.4 TSI" required style={{ flex: 1 }} disabled={!form.brand} />
                  {unusedModels.length > 0 && (
                    <button type="button" className="btn-cancel" onClick={() => setSelectMode('select')}>Listeden seç</button>
                  )}
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Sayfa başlığı</label>
              <input value={form.heroTitle} onChange={e => setForm(p => ({ ...p, heroTitle: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Alt başlık</label>
              <input value={form.heroSubtitle} onChange={e => setForm(p => ({ ...p, heroSubtitle: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Model görselleri</label>
              <ForumImageAttach
                images={form.images || []}
                onChange={images => setForm(p => ({ ...p, images }))}
                onUploadingChange={setUploadingImages}
                buttonLabel="📷 Görsel ekle"
                hint="Model, araç dış görünüşü veya iç mekan fotoğrafı · en fazla 3 · max 5 MB"
              />
            </div>
            <div className="form-group">
              <label>Makale / tanıtım yazısı</label>
              <textarea rows={4} value={form.blogIntro} onChange={e => setForm(p => ({ ...p, blogIntro: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Alıcı tavsiyesi</label>
              <textarea rows={2} value={form.buyerAdvice} onChange={e => setForm(p => ({ ...p, buyerAdvice: e.target.value }))} />
            </div>
            <p className="admin-section-label">Teknik özellikler</p>
            <div className="form-row form-row-wrap">
              {Object.entries(form.specs).map(([k, v]) => (
                <div key={k} className="form-group form-group-sm">
                  <label>{k}</label>
                  <input value={v} onChange={e => setSpec(k, e.target.value)} />
                </div>
              ))}
            </div>
            <p className="admin-section-label">Güçlü yönler</p>
            {form.strengths.map((s, i) => (
              <div key={i} className="list-edit-row">
                <input value={s} onChange={e => setList('strengths', i, e.target.value)} />
                <button type="button" onClick={() => removeFromList('strengths', i)}>×</button>
              </div>
            ))}
            <button type="button" className="btn-link-sm" onClick={() => addToList('strengths')}>+ Ekle</button>
            <p className="admin-section-label">Zayıf yönler</p>
            {form.weaknesses.map((w, i) => (
              <div key={i} className="list-edit-row">
                <input value={w} onChange={e => setList('weaknesses', i, e.target.value)} />
                <button type="button" onClick={() => removeFromList('weaknesses', i)}>×</button>
              </div>
            ))}
            <button type="button" className="btn-link-sm" onClick={() => addToList('weaknesses')}>+ Ekle</button>
            <p className="admin-section-label">Bakım rehberi</p>
            {form.maintenanceTips.map((m, i) => (
              <div key={i} className="list-edit-row">
                <input className="km-input" value={m.km} onChange={e => setMaint(i, 'km', e.target.value)} placeholder="KM" />
                <input value={m.tip} onChange={e => setMaint(i, 'tip', e.target.value)} placeholder="Bakım açıklaması" />
                <button type="button" onClick={() => setForm(p => ({ ...p, maintenanceTips: p.maintenanceTips.filter((_, idx) => idx !== i) }))}>×</button>
              </div>
            ))}
            <button type="button" className="btn-link-sm" onClick={() => setForm(p => ({ ...p, maintenanceTips: [...p.maintenanceTips, { km: '', tip: '' }] }))}>+ Bakım ekle</button>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={uploadingImages}>İptal</button>
            <button type="submit" className="btn-submit" disabled={uploadingImages}>
              {uploadingImages ? 'Görseller yükleniyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
