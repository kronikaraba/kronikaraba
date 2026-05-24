import { useState, useMemo, useEffect } from 'react';

const EMPTY_MODEL = {
  heroTitle: '', heroSubtitle: '', blogIntro: '', buyerAdvice: '',
  specs: { motor: '', beygir: '', tork: '', sanziman: '', yakit: '', hiz: '', agirlik: '', bagaj: '' },
  strengths: [''], weaknesses: [''],
  maintenanceTips: [{ km: '', tip: '' }],
};

export default function ModelEditModal({ modelKey, initial, models, faults, onSave, onClose }) {
  const [key, setKey] = useState(modelKey || '');
  const [form, setForm] = useState(initial || EMPTY_MODEL);
  const [selectMode, setSelectMode] = useState('select');

  const unusedModels = useMemo(() => {
    const all = [...new Set(faults.map(f => f.model))].sort();
    return all.filter(m => !models[m]);
  }, [faults, models]);

  useEffect(() => {
    if (modelKey) setSelectMode('custom');
    else if (unusedModels.length === 0) setSelectMode('custom');
  }, [modelKey, unusedModels.length]);

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
    if (!key.trim()) return;
    onSave(key.trim(), {
      ...form,
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
            <div className="form-group">
              <label>Model adı * <small>(arıza kayıtlarındaki model ile aynı)</small></label>
              {modelKey ? (
                <input value={key} disabled />
              ) : selectMode === 'select' && unusedModels.length > 0 ? (
                <div className="form-row">
                  <select value={key} onChange={e => setKey(e.target.value)} required style={{ flex: 1 }}>
                    <option value="">Listeden seçin</option>
                    {unusedModels.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <button type="button" className="btn-cancel" onClick={() => setSelectMode('custom')}>Yeni yaz</button>
                </div>
              ) : (
                <div className="form-row">
                  <input value={key} onChange={e => setKey(e.target.value)} placeholder="örn. Golf 1.4 TSI" required style={{ flex: 1 }} />
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
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit">Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}
