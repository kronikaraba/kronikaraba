import { put, list } from '@vercel/blob';

export const config = {
  maxDuration: 30,
};

const VALID_KEYS = ['faults', 'models', 'pending', 'forum', 'users', 'content', 'categories', 'motorTypes'];

/**
 * Vercel Serverless Function — Centralized JSON data store
 *
 * GET  /api/data?key=faults   → Read JSON from Vercel Blob
 * POST /api/data              → Write JSON to Vercel Blob  (body: { key, data })
 */
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN tanımlı değil.' });
  }

  try {
    // ── GET: Read data ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key || !VALID_KEYS.includes(key)) {
        return res.status(400).json({ error: `Geçersiz key. Geçerli: ${VALID_KEYS.join(', ')}` });
      }

      const pathname = `data/${key}.json`;
      const { blobs } = await list({ prefix: pathname, token });

      if (blobs.length === 0) {
        // No data stored yet — return null so frontend falls back to defaults
        return res.status(200).json(null);
      }

      const blob = blobs.find(b => b.pathname === pathname)
        || blobs.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];

      // Fetch the blob content
      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) {
        return res.status(200).json(null);
      }

      const data = await response.json();
      return res.status(200).json(data);
    }

    // ── POST: Write data ────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const { key, data } = req.body;

      if (!key || !VALID_KEYS.includes(key)) {
        return res.status(400).json({ error: `Geçersiz key. Geçerli: ${VALID_KEYS.join(', ')}` });
      }

      if (data === undefined) {
        return res.status(400).json({ error: 'data alanı gerekli.' });
      }

      const pathname = `data/${key}.json`;
      await put(pathname, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token,
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('data API error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Sunucu hatası' });
  }
}
