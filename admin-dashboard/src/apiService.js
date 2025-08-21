class ApiService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.token = localStorage.getItem('adminToken');
  }

  isAuthenticated() {
    return !!this.token;
  }

  async login(username, password) {
    try {
      const response = await fetch(`${this.baseURL}/accounts/auth/login/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      localStorage.setItem('adminToken', this.token);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('adminToken');
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Token ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.logout();
          throw new Error('Authentication required');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    return this.makeRequest('/accounts/dashboard/stats/');
  }

  async getUserDashboard() {
    return this.makeRequest('/accounts/dashboard/user/');
  }

  async getLoanApplications() {
    return this.makeRequest('/accounts/loan-applications/');
  }

  async getLoans() {
    return this.makeRequest('/accounts/loans/');
  }

  async getLoanProducts() {
    return this.makeRequest('/accounts/loan-products/');
  }

  async approveLoanApplication(applicationId) {
    return this.makeRequest(`/accounts/loan-applications/${applicationId}/approve/`, {
      method: 'POST'
    });
  }

  async rejectLoanApplication(applicationId) {
    return this.makeRequest(`/accounts/loan-applications/${applicationId}/reject/`, {
      method: 'POST'
    });
  }

  async getLoanApplication(applicationId) {
    return this.makeRequest(`/accounts/loan-applications/${applicationId}/`);
  }

  async updateLoanApplication(applicationId, data) {
    return this.makeRequest(`/accounts/loan-applications/${applicationId}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getRepayments() {
    return this.makeRequest('/accounts/payments/');
  }

  async getUserProfile() {
    return this.makeRequest('/accounts/profile/');
  }
}

const apiService = new ApiService();
export default apiService;
