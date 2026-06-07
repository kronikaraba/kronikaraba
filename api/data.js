import { put, list } from '@vercel/blob';

export const config = {
  maxDuration: 30,
};

const VALID_KEYS = ['faults', 'models', 'pending', 'forum', 'users', 'content', 'categories', 'motorTypes', 'articles'];

// Keys that require admin authentication for ALL operations
const ADMIN_ONLY_KEYS = ['users'];

// Keys that are publicly readable but require auth to write
const PUBLIC_READ_KEYS = ['faults', 'models', 'content', 'categories', 'motorTypes', 'articles', 'forum', 'pending'];

/**
 * Verify admin token from Authorization header.
 * Compares against ADMIN_API_TOKEN env variable.
 */
function verifyAuth(req) {
  const token = process.env.ADMIN_API_TOKEN;
  if (!token) return false; // If no token configured, deny write access

  const authHeader = req.headers['authorization'] || req.headers['x-admin-token'] || '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  return bearerToken === token;
}

/**
 * Strip sensitive fields from user records before sending to client.
 */
function sanitizeUsers(data) {
  if (!Array.isArray(data)) return data;
  return data.map(({ password, ...rest }) => rest);
}

/**
 * Vercel Serverless Function — Centralized JSON data store
 *
 * GET  /api/data?key=faults   → Read JSON from Vercel Blob
 * POST /api/data              → Write JSON to Vercel Blob  (body: { key, data })
 *
 * Authentication:
 * - GET on public keys: no auth required
 * - GET on admin-only keys (users): requires admin token
 * - POST (all keys): requires admin token via Authorization header
 */
export default async function handler(req, res) {
  // CORS headers — restrict to own domain in production
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['*'];

  const origin = req.headers.origin || '';
  const isAllowed = allowedOrigins.includes('*') || allowedOrigins.some(o => origin === o || origin.endsWith(o));

  res.setHeader('Access-Control-Allow-Origin', isAllowed ? origin || '*' : allowedOrigins[0]);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!blobToken) {
    return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN tanımlı değil.' });
  }

  try {
    // ── GET: Read data ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const key = req.query.key;
      if (!key || !VALID_KEYS.includes(key)) {
        return res.status(400).json({ error: `Geçersiz key. Geçerli: ${PUBLIC_READ_KEYS.join(', ')}` });
      }

      // Admin-only keys require authentication even for reading
      if (ADMIN_ONLY_KEYS.includes(key)) {
        if (!verifyAuth(req)) {
          return res.status(403).json({ error: 'Bu veriye erişim yetkisi gerekli.' });
        }
      }

      const pathname = `data/${key}.json`;
      const { blobs } = await list({ prefix: pathname, token: blobToken });

      if (blobs.length === 0) {
        return res.status(200).json(null);
      }

      const blob = blobs.find(b => b.pathname === pathname)
        || blobs.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0))[0];

      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) {
        return res.status(200).json(null);
      }

      let data = await response.json();

      // Sanitize sensitive data — never expose passwords even to admin
      if (key === 'users') {
        data = sanitizeUsers(data);
      }

      return res.status(200).json(data);
    }

    // ── POST: Write data ────────────────────────────────────────────────────
    if (req.method === 'POST') {
      // ALL write operations require admin authentication
      if (!verifyAuth(req)) {
        return res.status(401).json({ error: 'Yazma işlemi için yetkilendirme gerekli. Authorization header eksik veya geçersiz.' });
      }

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
        token: blobToken,
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('data API error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Sunucu hatası' });
  }
}
