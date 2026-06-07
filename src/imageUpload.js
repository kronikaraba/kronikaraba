export const FORUM_IMAGE_LIMIT = 3;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Tarayıcıda sıkıştır → Blob (sunucuya gönderim) */
export function compressImageToBlob(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file.type?.startsWith('image/')) {
      reject(new Error('Sadece fotoğraf yüklenebilir.'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('Dosya en fazla 5 MB olabilir.'));
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = Math.round((h * maxWidth) / w);
        w = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);

      let q = quality;
      const tryEncode = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Fotoğraf işlenemedi.'));
              return;
            }
            if (blob.size > 900_000 && q > 0.45) {
              q -= 0.1;
              tryEncode();
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          q,
        );
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Fotoğraf okunamadı.'));
    };
    img.src = url;
  });
}

/** Buluta yükle → herkese açık URL */
export async function uploadImageToCloud(file) {
  const blob = await compressImageToBlob(file);
  const name = (file.name || 'photo.jpg').replace(/\.[^.]+$/, '') + '.jpg';

  // Blob'u ArrayBuffer'a çevir — bazı tarayıcılarda raw Blob gönderimi kesintiye uğrayabiliyor
  const buffer = await blob.arrayBuffer();

  // Include admin auth token if available
  const adminToken = (() => {
    try { return localStorage.getItem('ka_admin_token') || ''; } catch { return ''; }
  })();

  const headers = {
    'Content-Type': 'image/jpeg',
    'X-File-Name': encodeURIComponent(name),
  };
  if (adminToken) {
    headers['Authorization'] = `Bearer ${adminToken}`;
  }

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: buffer,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Fotoğraf yüklenemedi.');
  }
  return { url: data.url, name };
}

export async function uploadImages(files, currentCount = 0, max = FORUM_IMAGE_LIMIT) {
  const list = Array.from(files);
  const uploaded = [];
  let lastError = '';

  for (const file of list) {
    if (currentCount + uploaded.length >= max) {
      lastError = `En fazla ${max} fotoğraf ekleyebilirsiniz.`;
      break;
    }
    try {
      const item = await uploadImageToCloud(file);
      uploaded.push({ id: `img-${Date.now()}-${uploaded.length}`, ...item });
    } catch (e) {
      lastError = e.message || 'Yükleme hatası';
      break;
    }
  }

  return { uploaded, error: lastError };
}
