import { faultData as defaultFaults } from './data.js';
import { modelDetails as defaultModelDetails } from './modelData.js';
import { defaultArticles } from './articleData.js';

export const ADMIN_KEY = 'ka_admin_session';
export const ADMIN_PASS_KEY = 'ka_admin_password';
export const ADMIN_USER_KEY = 'ka_admin_username';
export const ADMIN_TOKEN_KEY = 'ka_admin_token';

// ── API Helpers (with localStorage fallback) ─────────────────────────────────
const API_BASE = '/api/data';
const LS_PREFIX = 'ka_data_';
const LS_DIRTY_PREFIX = 'ka_data_dirty_';

/**
 * Get the stored admin API token for authenticated requests.
 */
function getApiToken() {
  try {
    return localStorage.getItem(ADMIN_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

/**
 * Build headers for API requests, including auth if available.
 */
function authHeaders(extra = {}) {
  const token = getApiToken();
  const headers = { ...extra };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function lsLoad(key) {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function lsSave(key, data) {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
  } catch (err) {
    console.error(`lsSave(${key}) failed:`, err);
  }
}

function lsIsDirty(key) {
  try {
    return localStorage.getItem(LS_DIRTY_PREFIX + key) === 'true';
  } catch {
    return false;
  }
}

function lsSetDirty(key, dirty) {
  try {
    if (dirty) {
      localStorage.setItem(LS_DIRTY_PREFIX + key, 'true');
    } else {
      localStorage.removeItem(LS_DIRTY_PREFIX + key);
    }
  } catch {}
}

async function apiLoad(key) {
  try {
    const res = await fetch(`${API_BASE}?key=${key}`, {
      headers: authHeaders(),
      cache: 'no-store',
    });
    if (res.status === 403) {
      // Unauthorized — don't fallback to localStorage for protected keys
      console.warn(`apiLoad(${key}): access denied`);
      return null;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // Server responded successfully — clear the dirty flag.
    lsSetDirty(key, false);

    if (data != null) {
      // Server has authoritative data — sync localStorage with it.
      lsSave(key, data);
      return data;
    }

    // Server returned null — the blob doesn't exist yet.
    // If we have localStorage data (e.g. from admin edits that failed to sync),
    // use it and try to push it to the server so all devices get it.
    const localData = lsLoad(key);
    if (localData != null) {
      // Auto-sync local data to server in the background
      apiSave(key, localData).catch(() => {});
      return localData;
    }

    return null;
  } catch (err) {
    console.warn(`apiLoad(${key}) failed, falling back to localStorage:`, err);
    return lsLoad(key);
  }
}

async function apiSave(key, data) {
  // Always save to localStorage first (instant persistence)
  lsSave(key, data);
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ key, data }),
    });
    if (res.status === 401) {
      console.warn(`apiSave(${key}): authentication required. Data saved to localStorage only.`);
      lsSetDirty(key, true);
      return false;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    lsSetDirty(key, false);
    return true;
  } catch (err) {
    console.warn(`apiSave(${key}) failed, data saved to localStorage only:`, err);
    lsSetDirty(key, true);
    return false;
  }
}

/**
 * Sync any dirty (unsynced) localStorage data to the server.
 * Called on app startup when admin is authenticated.
 * This ensures localStorage-only edits eventually reach the server.
 */
export async function syncDirtyToServer() {
  const token = getApiToken();
  if (!token) return; // not admin, skip

  const keysToSync = ['faults', 'models', 'pending', 'forum', 'articles', 'content', 'categories', 'motorTypes'];
  
  for (const key of keysToSync) {
    if (lsIsDirty(key)) {
      const localData = lsLoad(key);
      if (localData != null) {
        console.info(`syncDirtyToServer: syncing dirty key "${key}" to server...`);
        try {
          await apiSave(key, localData);
        } catch (err) {
          console.warn(`syncDirtyToServer: failed to sync "${key}":`, err);
        }
      }
    }
  }
}

// ── SHA-256 hash utility ─────────────────────────────────────────────────────
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export { hashPassword };

// ── Admin Auth (stays in localStorage — per-browser session) ─────────────────
export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === 'true' && !!getApiToken();
}

function isLocalDevHost() {
  try {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  } catch {
    return false;
  }
}

async function validateAdminToken(token) {
  const res = await fetch(`${API_BASE}?key=users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('Admin API is not available in this dev server.');
  }
  return res.ok;
}

export async function adminLogin(username, password) {
  // Admin credentials are validated against ADMIN_API_TOKEN on the server
  // The client sends the token which is configured in Vercel env variables
  const inputHash = await hashPassword(password);

  // Try to authenticate with a protected endpoint. Public data endpoints cannot
  // prove admin rights because they are readable without a token.
  try {
    const candidates = [password, inputHash];
    for (const candidate of candidates) {
      if (await validateAdminToken(candidate)) {
        localStorage.setItem(ADMIN_KEY, 'true');
        localStorage.setItem(ADMIN_TOKEN_KEY, candidate);
        localStorage.setItem(ADMIN_USER_KEY, username);
        return true;
      }
    }
  } catch (err) {
    if (isLocalDevHost()) {
      // Plain Vite dev does not run /api serverless functions. Allow the local
      // admin UI to open, but writes will stay marked as local-only until a real
      // API token is used through Vercel/dev/prod.
      localStorage.setItem(ADMIN_KEY, 'true');
      localStorage.setItem(ADMIN_TOKEN_KEY, password);
      localStorage.setItem(ADMIN_USER_KEY, username);
      return true;
    }
    console.error('Admin login error:', err);
  }

  return false;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// ── Centralized Data (API-backed) ────────────────────────────────────────────

// Faults
export async function loadAdminFaults() {
  const data = await apiLoad('faults');
  // Only fall back to hardcoded defaults when the server is unreachable
  // AND localStorage is empty (data === null from catch branch).
  // When the server explicitly returns null, it means the data store exists
  // but is empty — use an empty array, not defaults with old/deleted faults.
  if (Array.isArray(data)) return data;
  // apiLoad returns null when either server returned null or it was unreachable.
  // Check if we got null because server was down (localStorage fallback) or
  // because the server store is genuinely empty. We distinguish by checking
  // if localStorage still has data (offline fallback path).
  const localFallback = lsLoad('faults');
  if (Array.isArray(localFallback)) return localFallback;
  // No server data AND no localStorage → first-ever visit, use defaults.
  return defaultFaults;
}

export async function saveAdminFaults(data) {
  return apiSave('faults', data);
}

// Models
export async function loadAdminModels() {
  const data = await apiLoad('models');
  if (data && typeof data === 'object' && !Array.isArray(data)) return data;
  const localFallback = lsLoad('models');
  if (localFallback && typeof localFallback === 'object' && !Array.isArray(localFallback)) return localFallback;
  // No server data AND no localStorage → first-ever visit, use defaults.
  return defaultModelDetails;
}

export async function saveAdminModels(data) {
  return apiSave('models', data);
}

// Articles
export async function loadArticles() {
  const data = await apiLoad('articles');
  return Array.isArray(data) ? data : defaultArticles;
}

export async function saveArticles(data) {
  return apiSave('articles', data);
}

// Forum
export async function loadForum() {
  const data = await apiLoad('forum');
  return (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
}

export async function saveForum(data) {
  return apiSave('forum', data);
}

// Pending
export async function loadPending() {
  const data = await apiLoad('pending');
  return Array.isArray(data) ? data : [];
}

export async function savePending(data) {
  return apiSave('pending', data);
}

// Users — now requires admin auth on the server side
export async function loadUsers() {
  const data = await apiLoad('users');
  return Array.isArray(data) ? data : [];
}

export async function saveUsers(data) {
  return apiSave('users', data);
}

export function getAdminUsername() {
  return localStorage.getItem(ADMIN_USER_KEY) || 'admin';
}
