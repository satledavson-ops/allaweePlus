import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
// Automatically detect platform and use appropriate URL
import { Platform } from 'react-native';
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

const getApiBaseUrl = () => {
  if (__DEV__) {
    return Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://127.0.0.1:8000';
  } else {
    return ENV_API_BASE_URL || 'https://api.allaweeplus.com';
  }
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    console.log('🏗️  API Service initialized with baseURL:', this.baseURL);
    setTimeout(() => {
      console.warn('🚨 TESTING: API Service Constructor Called!');
      console.warn('🚨 TESTING: Base URL is:', this.baseURL);
      // Debug API connectivity
      fetch(this.baseURL)
        .then(res => console.warn('🚨 API reachable:', res.status))
        .catch(err => console.error('🚨 API unreachable:', err));
    }, 1000);
  }

  // Get stored auth token
  async getAuthToken() {
    try {
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Set auth token
  async setAuthToken(token) {
    try {
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
    }
  }

  // Remove auth token
  async removeAuthToken() {
    try {
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing auth token:', error);
    }
  }

  // Generic API request method
  async makeRequest(endpoint, options = {}) {
    console.log('🌐 makeRequest called with endpoint:', endpoint);
    console.log('🌐 makeRequest options:', options);
    
    const token = await this.getAuthToken();
    console.log('🔑 Current auth token:', token ? 'EXISTS' : 'NONE');
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Token ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
      console.log('📦 Request body:', config.body);
    }

    const fullUrl = `${this.baseURL}${endpoint}`;
    console.log('🌍 Making request to:', fullUrl);
    console.log('⚙️  Request config:', JSON.stringify(config, null, 2));

    try {
      console.log('📡 Starting fetch request...');
      const response = await fetch(fullUrl, config);
      console.log('📨 Response received with status:', response.status);
      console.log('📨 Response headers:', response.headers);
      
      let data;
      try {
        console.log('📋 Parsing JSON response...');
        data = await response.json();
        console.log('📋 Parsed response data:', JSON.stringify(data, null, 2));
      } catch (jsonError) {
        console.error('❌ JSON parse error:', jsonError);
        throw new Error('Invalid response format');
      }
      
      if (!response.ok) {
        console.error('❌ Response not OK. Status:', response.status);
        console.error('❌ Error data:', data);
        throw new Error(data.error || data.detail || data.message || `HTTP ${response.status}`);
      }
      
      console.log('✅ Request successful, returning data');
      return data;
    } catch (error) {
      console.error('💥 API Request Error:', error);
      console.error('💥 Error details:', error.message);
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and ensure the server is running.');
      }
      throw error;
    }
  }

  // Test connectivity
  async testConnection() {
    try {
      console.log('🔍 Testing connection to:', this.baseURL);
      const response = await fetch(`${this.baseURL}/api/accounts/loan-products/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      console.log('🔍 Test response status:', response.status);
      const data = await response.json();
      console.log('🔍 Test response data:', data);
      return { success: true, data };
    } catch (error) {
      console.error('🔍 Test connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Authentication Methods
  async login(username, password) {
    try {
      console.log('🚀 Login attempt started');
      console.log('📱 Username:', username);
      console.log('🔗 API URL:', `${this.baseURL}/api/accounts/auth/login/`);
      console.log('🌐 Base URL from constructor:', this.baseURL);
      
      // Add alert for debugging since console may not show
      const debugInfo = `Login attempt:
Username: ${username}
API URL: ${this.baseURL}/api/accounts/auth/login/`;
      
      console.warn('🚨 DEBUG INFO:', debugInfo);
      
      // Test connection first
      const testResult = await this.testConnection();
      console.log('🔍 Connection test result:', testResult);
      
      const data = await this.makeRequest('/api/accounts/auth/login/', {
        method: 'POST',
        body: { username, password },
      });
      
      console.log('✅ Login response received:', data);
      
      if (data.token) {
        await this.setAuthToken(data.token);
        console.log('💾 Token saved successfully:', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      const errorInfo = `Login failed:
Username: ${username}
Error: ${error.message}
URL: ${this.baseURL}/api/accounts/auth/login/`;
      console.warn('🚨 ERROR INFO:', errorInfo);
      throw error;
    }
  }

  async register(userData) {
    const formData = new FormData();
    
    // Handle file upload for NYSC certificate
    if (userData.nysc_certificate) {
      formData.append('nysc_certificate', {
        uri: userData.nysc_certificate.uri,
        type: userData.nysc_certificate.type || 'image/jpeg',
        name: userData.nysc_certificate.fileName || 'certificate.jpg',
      });
    }

    // Add other fields
    Object.keys(userData).forEach(key => {
      if (key !== 'nysc_certificate' && userData[key]) {
        formData.append(key, userData[key]);
      }
    });

    const data = await this.makeRequest('/api/accounts/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });

    if (data.token) {
      await this.setAuthToken(data.token);
    }

    return data;
  }

  async logout() {
    try {
      await this.makeRequest('/api/accounts/auth/logout/', { method: 'POST' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  // User Profile Methods
  async getUserProfile() {
    return await this.makeRequest('/api/accounts/profile/');
  }

  async updateUserProfile(profileData) {
    return await this.makeRequest('/api/accounts/profile/', {
      method: 'PUT',
      body: profileData,
    });
  }

  // Loan Product Methods
  async getLoanProducts() {
    const response = await this.makeRequest('/api/accounts/loan-products/');
    return response.results || response;
  }

  async getLoanProduct(id) {
    return await this.makeRequest(`/api/accounts/loan-products/${id}/`);
  }

  // Loan Application Methods
  async getLoanApplications() {
    return await this.makeRequest('/api/accounts/loan-applications/');
  }

  async createLoanApplication(applicationData) {
    return await this.makeRequest('/api/accounts/loan-applications/', {
      method: 'POST',
      body: applicationData,
    });
  }

  // Alias for createLoanApplication
  async applyForLoan(applicationData) {
    return await this.createLoanApplication(applicationData);
  }

  async getLoanApplication(id) {
    return await this.makeRequest(`/api/accounts/loan-applications/${id}/`);
  }

  // Loan Methods
  async getLoans() {
    return await this.makeRequest('/api/accounts/loans/');
  }

  async getLoan(id) {
    return await this.makeRequest(`/api/accounts/loans/${id}/`);
  }

  async getRepaymentSchedule(loanId) {
    return await this.makeRequest(`/api/accounts/loans/${loanId}/repayment-schedule/`);
  }

  // Payment Methods
  async getPayments() {
    return await this.makeRequest('/api/accounts/payments/');
  }

  // Dashboard Methods
  async getUserDashboard() {
    return await this.makeRequest('/api/accounts/dashboard/user/');
  }

  // Remita Integration Methods
  async verifySalary() {
    return await this.makeRequest('/api/accounts/remita/verify-salary/', {
      method: 'POST',
    });
  }

  async setupMandate(loanId) {
    return await this.makeRequest('/api/accounts/remita/setup-mandate/', {
      method: 'POST',
      body: { loan_id: loanId },
    });
  }
}

export default new ApiService();
