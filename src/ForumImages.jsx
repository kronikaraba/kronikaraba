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
            aria-label={`Fotoğraf ${i + 1} - büyüt`}
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

export function ForumImageAttach({
  images = [],
  onChange,
  disabled,
  onUploadingChange,
  max = FORUM_IMAGE_LIMIT,
  buttonLabel = '📷 Fotoğraf ekle',
  hint,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const safeImages = Array.isArray(images) ? images : [];

  const pickFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setError('');
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const { uploaded, error: err } = await uploadImages(files, safeImages.length, max);
      if (uploaded.length) onChange([...safeImages, ...uploaded]);
      if (err) setError(err);
    } catch (ex) {
      setError(ex.message || 'Yükleme başarısız');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const imageKey = (img, index) => img.id || img.url || `image-${index}`;
  const remove = (targetKey) => onChange(safeImages.filter((img, index) => imageKey(img, index) !== targetKey));

  return (
    <div className="forum-image-attach">
      <div className="forum-image-attach-row">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          className="forum-image-input-hidden"
          disabled={disabled || uploading || safeImages.length >= max}
          onChange={pickFiles}
        />
        <button
          type="button"
          className="forum-image-pick-btn"
          disabled={disabled || uploading || safeImages.length >= max}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? 'Yükleniyor…' : buttonLabel}
        </button>
        <span className="forum-image-hint">
          {hint || `Bagaj, motor, arıza görseli · en fazla ${max} · max 5 MB`}
        </span>
      </div>
      {error && <p className="forum-image-error">{error}</p>}
      {safeImages.length > 0 && (
        <div className="forum-image-previews">
          {safeImages.map((img, index) => (
            <div key={imageKey(img, index)} className="forum-image-preview">
              <img src={img.url} alt={img.name || ''} />
              <button type="button" className="forum-image-remove" onClick={() => remove(imageKey(img, index))} aria-label="Kaldır">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
