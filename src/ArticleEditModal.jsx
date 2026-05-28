import { useState, useRef } from 'react';
import { uploadImageToCloud, MAX_UPLOAD_BYTES } from './imageUpload.js';

const EMPTY_ARTICLE = {
  title: '',
  excerpt: '',
  body: '',
  date: 'Bugün',
  tag: 'Rehber',
  image: '',
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
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `makale-${Date.now()}`;
}

export default function ArticleEditModal({ article, onSave, onClose }) {
  const [form, setForm] = useState(() => ({ ...EMPTY_ARTICLE, ...(article || {}) }));
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const result = await uploadImageToCloud(file);
      set('image', result.url);
    } catch (err) {
      setUploadError(err.message || 'Görsel yüklenemedi.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = () => {
    set('image', '');
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
      image: (form.image || '').trim(),
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

            {/* ── Image upload (same pattern as forum comments) ── */}
            <div className="form-group">
              <label>Kapak Görseli</label>
              <div className="article-image-attach">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="forum-image-input-hidden"
                  disabled={uploading}
                  onChange={handleImagePick}
                />

                {form.image ? (
                  <div className="article-image-preview-wrap">
                    <div className="article-image-preview">
                      <img src={form.image} alt="Kapak görseli" />
                      <button
                        type="button"
                        className="forum-image-remove"
                        onClick={removeImage}
                        aria-label="Görseli kaldır"
                        title="Görseli kaldır"
                      >×</button>
                    </div>
                    <button
                      type="button"
                      className="article-image-change-btn"
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading ? 'Yükleniyor…' : '📷 Görseli Değiştir'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="article-image-pick-btn"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <>
                        <span className="article-upload-spinner" />
                        Yükleniyor…
                      </>
                    ) : (
                      <>📷 Kapak görseli yükle</>
                    )}
                  </button>
                )}
                <span className="forum-image-hint">JPG, PNG, WebP · max 5 MB</span>
                {uploadError && <p className="forum-image-error">{uploadError}</p>}
              </div>
            </div>

            {error && <p className="form-error">{error}</p>}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>İptal</button>
            <button type="submit" className="btn-submit" disabled={uploading}>Kaydet</button>
          </div>
        </form>
      </div>
    </div>
  );
}
