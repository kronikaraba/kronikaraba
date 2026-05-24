import { faultData as defaultFaults } from './data.js';
import { modelDetails as defaultModelDetails } from './modelData.js';

export const FAULTS_KEY = 'ka_admin_faults';
export const MODELS_KEY = 'ka_admin_models';
export const ADMIN_KEY = 'ka_admin_session';
export const ADMIN_PASS_KEY = 'ka_admin_password';
export const ADMIN_USER_KEY = 'ka_admin_username';
export const FORUM_KEY = 'ka_forum_v2';
export const PENDING_KEY = 'ka_pending_faults';
export const USERS_KEY = 'ka_users';

const DEFAULT_PASS = 'admin123';
const DEFAULT_USER = 'admin';

// ── SHA-256 hash utility ──
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Sync hash for initial seed (not secure, just to avoid plaintext)
function hashPasswordSync(password) {
  // Simple sync hash fallback: djb2 + base16 (for seed data only)
  let hash = 5381;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) + hash) + password.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'djb2_' + Math.abs(hash).toString(16);
}

export { hashPassword };

export function isAdmin() {
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export async function adminLogin(username, password) {
  const user = localStorage.getItem(ADMIN_USER_KEY) || DEFAULT_USER;
  const storedPass = localStorage.getItem(ADMIN_PASS_KEY);
  const inputHash = await hashPassword(password);

  if (username === user) {
    if (storedPass) {
      // Hashed password stored
      if (inputHash === storedPass) {
        localStorage.setItem(ADMIN_KEY, 'true');
        return true;
      }
      // Fallback: check if stored pass is still plaintext (migration)
      if (password === storedPass) {
        localStorage.setItem(ADMIN_PASS_KEY, inputHash);
        localStorage.setItem(ADMIN_KEY, 'true');
        return true;
      }
    } else {
      // No custom pass set — check against default
      if (password === DEFAULT_PASS) {
        // Auto-migrate: store hashed version
        localStorage.setItem(ADMIN_PASS_KEY, inputHash);
        localStorage.setItem(ADMIN_KEY, 'true');
        return true;
      }
    }
  }
  return false;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_KEY);
}

export function loadAdminFaults() {
  try {
    const stored = JSON.parse(localStorage.getItem(FAULTS_KEY));
    return stored || defaultFaults;
  } catch {
    return defaultFaults;
  }
}

export function loadAdminModels() {
  try {
    const stored = JSON.parse(localStorage.getItem(MODELS_KEY));
    return stored || defaultModelDetails;
  } catch {
    return defaultModelDetails;
  }
}

export function saveAdminFaults(data) {
  localStorage.setItem(FAULTS_KEY, JSON.stringify(data));
}

export function saveAdminModels(data) {
  localStorage.setItem(MODELS_KEY, JSON.stringify(data));
}

export function loadForum() {
  try {
    return JSON.parse(localStorage.getItem(FORUM_KEY)) || {};
  } catch {
    return {};
  }
}

export function saveForum(data) {
  localStorage.setItem(FORUM_KEY, JSON.stringify(data));
}

export function loadPending() {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY)) || [];
  } catch {
    return [];
  }
}

export function savePending(data) {
  localStorage.setItem(PENDING_KEY, JSON.stringify(data));
}

export function loadUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveUsers(data) {
  localStorage.setItem(USERS_KEY, JSON.stringify(data));
}

export function getAdminUsername() {
  return localStorage.getItem(ADMIN_USER_KEY) || DEFAULT_USER;
}
