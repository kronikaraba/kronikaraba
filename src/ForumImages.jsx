import { useRef, useState, useEffect } from 'react';
import { FORUM_IMAGE_LIMIT, uploadImages } from './imageUpload.js';

export function ForumPostImages({ images }) {
  const [lightbox, setLightbox] = useState(null);
  const lightboxRef = useRef(null);

  useEffect(() => {
    if (!lightbox) return;
    const preventScroll = (e) => {
      e.preventDefault();
    };
    const el = lightboxRef.current;
    if (el) {
      el.addEventListener('wheel', preventScroll, { passive: false });
      el.addEventListener('touchmove', preventScroll, { passive: false });
    }
    return () => {
      if (el) {
        el.removeEventListener('wheel', preventScroll);
        el.removeEventListener('touchmove', preventScroll);
      }
    };
  }, [lightbox]);

  if (!images?.length) return null;

  return (
    <>
      <div className="forum-images">
        {images.map((img, i) => (
          <button
            key={img.id || img.url || i}
            type="button"
            className="forum-image-thumb"
            onClick={() => setLightbox(img.url)}
            aria-label={`Fotoğraf ${i + 1} — büyüt`}
          >
            <img src={img.url} alt={img.name || `Fotoğraf ${i + 1}`} loading="lazy" />
          </button>
        ))}
      </div>
      {lightbox && (
        <div
          ref={lightboxRef}
          className="forum-lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button type="button" className="forum-lightbox-close" aria-label="Kapat">×</button>
          <img src={lightbox} alt="Büyük görünüm" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

export function ForumImageAttach({ images, onChange, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const pickFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setError('');
    setUploading(true);
    try {
      const { uploaded, error: err } = await uploadImages(files, images.length);
      if (uploaded.length) onChange([...images, ...uploaded]);
      if (err) setError(err);
    } catch (ex) {
      setError(ex.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (id) => onChange(images.filter(img => img.id !== id));

  return (
    <div className="forum-image-attach">
      <div className="forum-image-attach-row">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="forum-image-input-hidden"
          disabled={disabled || uploading || images.length >= FORUM_IMAGE_LIMIT}
          onChange={pickFiles}
        />
        <button
          type="button"
          className="forum-image-pick-btn"
          disabled={disabled || uploading || images.length >= FORUM_IMAGE_LIMIT}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Yükleniyor…' : '📷 Fotoğraf ekle'}
        </button>
        <span className="forum-image-hint">
          Bagaj, motor, arıza görseli · en fazla {FORUM_IMAGE_LIMIT} · max 5 MB
        </span>
      </div>
      {error && <p className="forum-image-error">{error}</p>}
      {images.length > 0 && (
        <div className="forum-image-previews">
          {images.map(img => (
            <div key={img.id} className="forum-image-preview">
              <img src={img.url} alt={img.name || ''} />
              <button type="button" className="forum-image-remove" onClick={() => remove(img.id)} aria-label="Kaldır">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
