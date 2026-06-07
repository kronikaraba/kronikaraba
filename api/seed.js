import { put, list } from '@vercel/blob';
import { faultData } from '../src/data.js';
import { modelDetails } from '../src/modelData.js';
import { defaultArticles } from '../src/articleData.js';
import { defaultCategories, defaultMotorTypes, defaultSiteContent } from '../src/siteContent.js';

export const config = { maxDuration: 30 };

/**
 * POST /api/seed — Varsayılan verileri Vercel Blob'a yükler.
 * Sadece boş olan key'leri doldurur (mevcut veriyi ezmez).
 * Bir kez çalıştırılması yeterlidir.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authentication required for seed operation
  const adminToken = process.env.ADMIN_API_TOKEN;
  if (adminToken) {
    const authHeader = req.headers['authorization'] || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (bearerToken !== adminToken) {
      return res.status(401).json({ error: 'Seed işlemi için yetkilendirme gerekli.' });
    }
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return res.status(503).json({ error: 'BLOB_READ_WRITE_TOKEN tanımlı değil.' });
  }

  const results = {};

  const seeds = [
    { key: 'faults', data: faultData },
    { key: 'models', data: modelDetails },
    { key: 'pending', data: [] },
    { key: 'forum', data: {} },
    { key: 'users', data: [] },
    { key: 'content', data: defaultSiteContent },
    { key: 'categories', data: defaultCategories },
    { key: 'motorTypes', data: defaultMotorTypes },
    { key: 'articles', data: defaultArticles },
  ];

  try {
    for (const { key, data } of seeds) {
      const pathname = `data/${key}.json`;
      const { blobs } = await list({ prefix: pathname, token });

      if (blobs.length > 0) {
        results[key] = 'already exists — skipped';
        continue;
      }

      await put(pathname, JSON.stringify(data), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token,
      });
      results[key] = 'seeded';
    }

    return res.status(200).json({ ok: true, results });
  } catch (err) {
    console.error('seed error:', err);
    return res.status(500).json({ error: err?.message || 'Seed başarısız.' });
  }
}
