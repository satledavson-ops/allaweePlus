// services/api.js
const BASE_URL = process.env.API_URL || 'http://127.0.0.1:8000/api';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } catch (e) {
    // Fallback mock so screens still work in local/dev
    if (__DEV__) {
      // Minimal mocks used by screens
      if (path.startsWith('/dashboard')) {
        return {
          loanBalance: 0,
          pendingRepayments: 0,
          creditScore: 92,
          total_applications: 2,
          active_loans: 0,
          total_borrowed: 0,
          outstanding_balance: 0,
          pending_applications: 0,
          next_payment_due: null,
        };
      }
      if (path.startsWith('/repayments')) {
        return {
          summary: { outstanding: 0, next_due_date: null, total_paid: 0, installments: 0 },
          repayments: [],
        };
      }
      if (path.startsWith('/profile')) {
        return {
          full_name: 'Allawee User',
          email: 'user@example.com',
          phone: '+234 000 000 0000',
          credit_score: 95,
          loan_status: 'Good Standing',
          salary_verified: true,
          bvn: '12345678901',
          nysc_state_code: 'PL/23C/4567',
          created_at: '2024-02-01',
        };
      }
      if (path.startsWith('/auth/logout')) return { ok: true };
      if (path.startsWith('/salary/verify')) return { status: 'ok' };
    }
    throw e;
  }
}

const ApiService = {
  // HOME
  async getUserDashboard() {
    return await request('/dashboard');
  },

  // REPAYMENTS
  async getRepaymentDashboard() {
    return await request('/repayments');
  },
  async payInstallment(repaymentId) {
    return await request(`/repayments/${repaymentId}/pay`, { method: 'POST' });
  },

  // PROFILE
  async getProfile() {
    return await request('/profile');
  },
  async verifySalary() {
    return await request('/salary/verify', { method: 'POST' });
  },

  // AUTH
  async logout() {
    try { await request('/auth/logout', { method: 'POST' }); } catch (_) {}
    return true;
  },
};

export default ApiService;