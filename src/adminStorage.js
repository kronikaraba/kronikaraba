import { faultData as defaultFaults } from './data.js';
import { modelDetails as defaultModelDetails } from './modelData.js';

export const ADMIN_KEY = 'ka_admin_session';
export const ADMIN_PASS_KEY = 'ka_admin_password';
export const ADMIN_USER_KEY = 'ka_admin_username';

const DEFAULT_PASS = 'admin123';
const DEFAULT_USER = 'admin';

// ── API Helpers ──────────────────────────────────────────────────────────────
const API_BASE = '/api/data';

async function apiLoad(key) {
  try {
    const res = await fetch(`${API_BASE}?key=${key}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`apiLoad(${key}) failed:`, err);
    return null;
  }
}

async function apiSave(key, data) {
  try {
    await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, data }),
    });
  } catch (err) {
    console.error(`apiSave(${key}) failed:`, err);
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
  return localStorage.getItem(ADMIN_KEY) === 'true';
}

export async function adminLogin(username, password) {
  const user = localStorage.getItem(ADMIN_USER_KEY) || DEFAULT_USER;
  const storedPass = localStorage.getItem(ADMIN_PASS_KEY);
  const inputHash = await hashPassword(password);

  if (username === user) {
    if (storedPass) {
      if (inputHash === storedPass) {
        localStorage.setItem(ADMIN_KEY, 'true');
        return true;
      }
      if (password === storedPass) {
        localStorage.setItem(ADMIN_PASS_KEY, inputHash);
        localStorage.setItem(ADMIN_KEY, 'true');
        return true;
      }
    } else {
      if (password === DEFAULT_PASS) {
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

// ── Centralized Data (API-backed) ────────────────────────────────────────────

// Faults
export async function loadAdminFaults() {
  const data = await apiLoad('faults');
  return data || defaultFaults;
}

export async function saveAdminFaults(data) {
  return apiSave('faults', data);
}

// Models
export async function loadAdminModels() {
  const data = await apiLoad('models');
  return data || defaultModelDetails;
}

export async function saveAdminModels(data) {
  return apiSave('models', data);
}

// Forum
export async function loadForum() {
  const data = await apiLoad('forum');
  return data || {};
}

export async function saveForum(data) {
  return apiSave('forum', data);
}

// Pending
export async function loadPending() {
  const data = await apiLoad('pending');
  return data || [];
}

export async function savePending(data) {
  return apiSave('pending', data);
}

// Users
export async function loadUsers() {
  const data = await apiLoad('users');
  return data || [];
}

export async function saveUsers(data) {
  return apiSave('users', data);
}

export function getAdminUsername() {
  return localStorage.getItem(ADMIN_USER_KEY) || DEFAULT_USER;
}
