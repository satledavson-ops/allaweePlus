// services/api.js
// Unified API service for AllaweePlus (React Native)
// - Default export: ApiService
// - Includes all methods used across screens
// - Works on iOS Simulator (127.0.0.1) and Android Emulator (10.0.2.2)
// - Has safe fallbacks so UI won’t crash if backend is offline

import { Platform } from 'react-native';

// ---- Base URL detection ------------------------------------------------------
const LOCALHOST =
  Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';

// Optionally override via global (e.g., set in dev menu) or env shim
const BASE_URL =
  (global && global.API_BASE_URL) ||
  // @ts-ignore (in case you have env shim)
  (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) ||
  LOCALHOST;

// If your Django routes are namespaced, set here (keep '' if not)
const API_PREFIX = '/api';

// ---- Fetch helper ------------------------------------------------------------
async function request(path, { method = 'GET', body, headers = {}, timeoutMs = 15000 } = {}) {
  const url = `${BASE_URL}${API_PREFIX}${path}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const opts = {
    method,
    signal: controller.signal,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(url, opts);
    clearTimeout(id);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} — ${text}`);
    }

    if (res.status === 204) return null;

    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) return res.json();

    // fallback for non-JSON endpoints
    return res.text();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// ---- DASHBOARD (HomeScreen) --------------------------------------------------
async function getUserDashboard() {
  // Expected by HomeScreen:
  // {
  //   total_applications, active_loans, total_borrowed, outstanding_balance,
  //   pending_applications, next_payment_due: { due_date }
  // }
  try {
    return await request('/dashboard/', { method: 'GET' });
  } catch (e) {
    // Fallback mock so UI stays usable in dev
    const today = new Date();
    return {
      total_applications: 3,
      active_loans: 1,
      total_borrowed: 250000,
      outstanding_balance: 180000,
      pending_applications: 0,
      next_payment_due: { due_date: today.toISOString() },
    };
  }
}

async function verifySalary() {
  // Kick off Remita verification; you can adapt to your real route
  // Caller only checks success/failure.
  try {
    return await request('/salary/verify/', { method: 'POST' });
  } catch (e) {
    // Bubble up so UI shows an error toast/alert
    throw e;
  }
}

// ---- LOANS (LoanApplicationScreen) ------------------------------------------
async function applyForLoan(payload) {
  // payload = { amount:Number, tenor:Number, purpose:String }
  return request('/loans/apply/', { method: 'POST', body: payload });
}

// ---- REPAYMENTS (RepaymentDashboardScreen) -----------------------------------
async function getRepaymentDashboard() {
  // Should return:
  // {
  //   summary: { outstanding, next_due_date, total_paid, installments },
  //   repayments: [{ id, amount, due_date, status: 'due'|'paid'|'overdue' }]
  // }
  try {
    return await request('/repayments/', { method: 'GET' });
  } catch (e) {
    // Fallback mock
    const now = Date.now();
    return {
      summary: {
        outstanding: 180000,
        next_due_date: new Date(now + 7 * 86400000).toISOString(),
        total_paid: 70000,
        installments: 12,
      },
      repayments: [
        { id: 1, amount: 15000, due_date: new Date(now + 1 * 86400000).toISOString(), status: 'due' },
        { id: 2, amount: 15000, due_date: new Date(now - 7 * 86400000).toISOString(), status: 'paid' },
      ],
    };
  }
}

async function payInstallment(repaymentId) {
  return request(`/repayments/${encodeURIComponent(repaymentId)}/pay/`, { method: 'POST' });
}

// ---- PROFILE (ProfileScreen) -------------------------------------------------
async function getProfile() {
  try {
    return await request('/profile/', { method: 'GET' });
  } catch (_e) {
    // Fallback mock; screens tolerate this
    return { full_name: 'Guest User', email: 'guest@demo.local', phone: '', bank_name: '', account_number: '' };
  }
}

async function updateProfile(payload) {
  // payload = { full_name, email, phone, bank_name, account_number }
  return request('/profile/', { method: 'PATCH', body: payload });
}

// ---- AUTH (used by Logout buttons; Welcome uses AuthContext) -----------------
async function logout() {
  try {
    await request('/auth/logout/', { method: 'POST' });
  } catch (_e) {
    // ok to ignore in dev
  }
  return true;
}

// ---- Export -----------------------------------------------------------------
const ApiService = {
  getUserDashboard,
  verifySalary,
  applyForLoan,
  getRepaymentDashboard,
  payInstallment,
  getProfile,
  updateProfile,
  logout,
};

export default ApiService;

/*
Usage:
import ApiService from '../services/api';

await ApiService.getUserDashboard();
await ApiService.verifySalary();
await ApiService.applyForLoan({ amount: 150000, tenor: 12, purpose: 'Relocation' });
await ApiService.getRepaymentDashboard();
await ApiService.payInstallment(1);
await ApiService.getProfile();
await ApiService.updateProfile({ full_name: 'Jane Doe', email: 'jane@ex.com', ... });
await ApiService.logout();
*/