import { put } from '@vercel/blob';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 30,
};

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Vercel Serverless Function — Node.js handler
 * POST /api/upload
 * Body: raw image binary
 * Headers: Content-Type: image/jpeg, X-File-Name: <encoded filename>
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authentication check for uploads
    const adminToken = process.env.ADMIN_API_TOKEN;
    if (adminToken) {
      const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || '';
      const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      if (bearerToken !== adminToken) {
        return res.status(401).json({ error: 'Yükleme için yetkilendirme gerekli.' });
      }
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return res.status(503).json({
        error: 'BLOB_READ_WRITE_TOKEN tanımlı değil.',
      });
    }

    const mimeType = req.headers['content-type'] || 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Sadece görsel dosyaları yüklenebilir.' });
    }

    // Raw binary body oku
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'Boş dosya gönderildi.' });
    }

    if (fileBuffer.length > MAX_BYTES) {
      return res.status(400).json({ error: 'Dosya en fazla 5 MB olabilir.' });
    }

    const rawName = req.headers['x-file-name']
      ? decodeURIComponent(req.headers['x-file-name'])
      : 'photo.jpg';
    const safeName = rawName.replace(/[^\w.\-]/g, '_').slice(0, 80);
    const pathname = `forum/${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${safeName}`;

    const blob = await put(pathname, fileBuffer, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: false,
      token,
    });

    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error('upload error', err?.message || err, JSON.stringify(err));
    return res.status(500).json({
      error: err?.message || 'Yükleme başarısız oldu.',
    });
  }
}
