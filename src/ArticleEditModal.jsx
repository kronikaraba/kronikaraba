import { useState } from 'react';

const EMPTY_ARTICLE = {
  title: '',
  excerpt: '',
  body: '',
  date: 'Bugün',
  tag: 'Rehber',
  image: '/articles/paint-protection.png',
};

const IMAGE_OPTIONS = [
  { value: '/articles/paint-protection.png', label: 'Boya koruma görseli' },
  { value: '/articles/fleet-safety.png', label: 'Filo güvenliği görseli' },
  { value: '/articles/vehicle-check.png', label: 'Araç kontrol görseli' },
];

function slugify(value) {
  return String(value || '')
    .trim()
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `makale-${Date.now()}`;
}

export default function ArticleEditModal({ article, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_ARTICLE, ...(article || {}) }));
  const [error, setError] = useState('');
  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.excerpt.trim() || !form.body.trim()) {
      setError('Başlık, özet ve içerik zorunludur.');
      return;
    }
    const now = new Date().toISOString();
    onSave({
      ...form,
      id: form.id || slugify(form.title),
      title: form.title.trim(),
      excerpt: form.excerpt.trim(),
      body: form.body.trim(),
      date: form.date.trim() || 'Bugün',
      tag: form.tag.trim() || 'Rehber',
      image: form.image.trim() || EMPTY_ARTICLE.image,
      createdAt: form.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal article-edit-modal" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{article ? 'Makaleyi düzenle' : 'Yeni makale aç'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Kapat">×</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Etiket</label>
                <input value={form.tag} onChange={e => set('tag', e.target.value)} placeholder="Dikkat Çekenler" />
              </div>
              <div className="form-group">
                <label>Tarih</label>
                <input value={form.date} onChange={e => set('date', e.target.value)} placeholder="3 hafta önce" />
              </div>
            </div>
            <div className="form-group">
              <label>Başlık *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Makale başlığı" required />
            </div>
            <div className="form-group">
              <label>Özet *</label>
              <textarea value={form.excerpt} onChange={e => set('excerpt', e.target.value)} rows={3} placeholder="Liste ekranında görünecek kısa açıklama" required />
            </div>
            <div className="form-group">
              <label>İçerik *</label>
              <textarea value={form.body} onChange={e => set('body', e.target.value)} rows={10} placeholder="Detay sayfasında yayınlanacak uzun makale metni" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hazır görsel</label>
                <select value={IMAGE_OPTIONS.some(opt => opt.value === form.image) ? form.image : ''} onChange={e => e.target.value && set('image', e.target.value)}>
                  <option value="" disabled>Görsel seçin</option>
                  {IMAGE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Görsel yolu</label>
                <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="/articles/vehicle-check.png" />
              </div>
            </div>
            {error && <p className="form-error">{error}</p>}
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
