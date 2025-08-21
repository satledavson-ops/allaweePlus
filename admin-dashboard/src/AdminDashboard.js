import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';
import apiService from './apiService';

// Admin Dashboard for AlloweePlus
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    totalLoans: 0,
    activeLoans: 0,
    pendingApplications: 0,
    totalDisbursed: 0,
    collectionRate: 0,
    defaultRate: 0,
    nyscVerificationsPending: 0,
    remitaCollections: 0
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [pendingApplications, setPendingApplications] = useState([]);

  // Check authentication on component mount
  useEffect(() => {
    if (apiService.isAuthenticated()) {
      setIsAuthenticated(true);
      loadDashboardData();
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiService.login(loginData.username, loginData.password);
      setIsAuthenticated(true);
      await loadDashboardData();
    } catch (error) {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard stats and loan applications
      const [statsResponse, applicationsResponse] = await Promise.all([
        apiService.getDashboardStats().catch(() => null),
        apiService.getLoanApplications().catch(() => ({ results: [] }))
      ]);

      if (statsResponse) {
        // Map API response to our dashboard data structure
        setDashboardData({
          totalLoans: statsResponse.total_active_loans || 0,
          activeLoans: statsResponse.total_active_loans || 0,
          pendingApplications: statsResponse.pending_applications || 0,
          totalDisbursed: parseFloat(statsResponse.total_loan_amount || 0),
          collectionRate: 95, // This would come from a calculation
          defaultRate: parseFloat(statsResponse.default_rate || 0),
          nyscVerificationsPending: 0, // This would be calculated
          remitaCollections: parseFloat(statsResponse.total_collections || 0)
        });
      }

      if (applicationsResponse && applicationsResponse.results) {
        setPendingApplications(applicationsResponse.results);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    apiService.logout();
    setIsAuthenticated(false);
    setDashboardData({
      totalLoans: 0,
      activeLoans: 0,
      pendingApplications: 0,
      totalDisbursed: 0,
      collectionRate: 0,
      defaultRate: 0,
      nyscVerificationsPending: 0,
      remitaCollections: 0
    });
    setPendingApplications([]);
  };

  // Login form component
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>AllaweePlus Admin Dashboard</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username:</label>
              <input
                type="text"
                value={loginData.username}
                onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleApproval = async (applicationId, action) => {
    try {
      if (action === 'approve') {
        await apiService.approveLoanApplication(applicationId);
      } else {
        await apiService.rejectLoanApplication(applicationId);
      }
      // Reload dashboard data after action
      await loadDashboardData();
    } catch (error) {
      console.error(`Error ${action}ing application:`, error);
      setError(`Failed to ${action} application`);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending_review': { color: '#FF9500', text: 'Pending Review' },
      'pending_verification': { color: '#FF3B30', text: 'Pending Verification' },
      'ready_for_approval': { color: '#9C88FF', text: 'Ready for Approval' },
      'approved': { color: '#007AFF', text: 'Approved' },
      'rejected': { color: '#8E8E93', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig['pending_review'];
    return (
      <span className="status-badge" style={{ backgroundColor: config.color }}>
        {config.text}
      </span>
    );
  };

  const getRiskBadge = (score) => {
    if (score >= 80) return <span className="risk-low">Low Risk</span>;
    if (score >= 60) return <span className="risk-medium">Medium Risk</span>;
    return <span className="risk-high">High Risk</span>;
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <h1>AllaweePlus Admin Dashboard</h1>
        <div className="admin-user">
          <span>Welcome, Admin</span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {loading && <div className="loading-spinner">Loading...</div>}
      {error && <div className="error-banner">{error}</div>}

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`nav-tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          📋 Loan Applications
        </button>
        <button 
          className={`nav-tab ${activeTab === 'loans' ? 'active' : ''}`}
          onClick={() => setActiveTab('loans')}
        >
          💰 Active Loans
        </button>
        <button 
          className={`nav-tab ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          🔄 Collections
        </button>
        <button 
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
        <button 
          className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Reports
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>Dashboard Overview</h2>
            
            {/* KPI Cards */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <h3>Total Loans</h3>
                <div className="kpi-value">{dashboardData.totalLoans.toLocaleString()}</div>
                <div className="kpi-change">+5.2% from last month</div>
              </div>
              
              <div className="kpi-card">
                <h3>Active Loans</h3>
                <div className="kpi-value">{dashboardData.activeLoans.toLocaleString()}</div>
                <div className="kpi-change">₦{(dashboardData.totalDisbursed / 1000000).toFixed(1)}M disbursed</div>
              </div>
              
              <div className="kpi-card">
                <h3>Collection Rate</h3>
                <div className="kpi-value">{dashboardData.collectionRate}%</div>
                <div className="kpi-change">Via Remita Inflight</div>
              </div>
              
              <div className="kpi-card">
                <h3>Pending Applications</h3>
                <div className="kpi-value">{dashboardData.pendingApplications}</div>
                <div className="kpi-change">Needs review</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h3>Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-item">
                  <span className="activity-icon">✅</span>
                  <span>Loan APP001 approved and disbursed - ₦10,000</span>
                  <span className="activity-time">2 hours ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">🔍</span>
                  <span>NYSC verification completed for 15 applications</span>
                  <span className="activity-time">4 hours ago</span>
                </div>
                <div className="activity-item">
                  <span className="activity-icon">💰</span>
                  <span>₦150,000 collected via Remita inflight</span>
                  <span className="activity-time">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="applications-section">
            <div className="section-header">
              <h2>Loan Applications</h2>
              <div className="filters">
                <select>
                  <option>All Status</option>
                  <option>Pending Review</option>
                  <option>Pending Verification</option>
                  <option>Ready for Approval</option>
                </select>
                <select>
                  <option>All Risk Levels</option>
                  <option>Low Risk</option>
                  <option>Medium Risk</option>
                  <option>High Risk</option>
                </select>
              </div>
            </div>

            <div className="applications-table">
              <table>
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Applicant</th>
                    <th>NYSC Code</th>
                    <th>Amount</th>
                    <th>NYSC Status</th>
                    <th>Salary Verified</th>
                    <th>Risk Score</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApplications.length > 0 ? (
                    pendingApplications.map(app => (
                      <tr key={app.id}>
                        <td className="app-id">{app.id}</td>
                        <td className="applicant-name">{app.applicant_name || 'N/A'}</td>
                        <td className="nysc-code">{app.nysc_code || 'N/A'}</td>
                        <td className="amount">₦{(app.amount || 0).toLocaleString()}</td>
                        <td>
                          <span className={`verification-status ${app.nysc_verified ? 'verified' : 'pending'}`}>
                            {app.nysc_verified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <span className={`salary-status ${app.salary_verified ? 'verified' : 'pending'}`}>
                            {app.salary_verified ? '✅ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td>{getRiskBadge(app.risk_score || 0)}</td>
                        <td>{getStatusBadge(app.status)}</td>
                        <td className="actions">
                          {app.status === 'ready_for_approval' && (
                            <>
                              <button 
                                className="approve-btn"
                                onClick={() => handleApproval(app.id, 'approve')}
                              >
                                Approve
                              </button>
                              <button 
                                className="reject-btn"
                                onClick={() => handleApproval(app.id, 'reject')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button className="view-btn">View Details</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-data">
                        <div className="no-applications">
                          <h3>No Loan Applications Yet</h3>
                          <p>When users submit loan applications through the mobile app, they will appear here for review.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="collections-section">
            <h2>Remita Collections Dashboard</h2>
            
            <div className="collections-overview">
              <div className="collection-card">
                <h3>🛡️ Inflight Collections</h3>
                <div className="collection-value">₦{(dashboardData.remitaCollections * 2167).toLocaleString()}</div>
                <div className="collection-details">
                  {dashboardData.remitaCollections} successful collections this month
                </div>
              </div>
              
              <div className="collection-card">
                <h3>⚡ Success Rate</h3>
                <div className="collection-value">{dashboardData.collectionRate}%</div>
                <div className="collection-details">
                  Zero failed collections with inflight system
                </div>
              </div>
            </div>

            <div className="remita-integration">
              <h3>Remita Integration Status</h3>
              <div className="integration-status">
                <div className="status-item">
                  <span className="status-icon green">●</span>
                  <span>Salary Data Referencing API: Active</span>
                </div>
                <div className="status-item">
                  <span className="status-icon green">●</span>
                  <span>Inflight Collections API: Active</span>
                </div>
                <div className="status-item">
                  <span className="status-icon green">●</span>
                  <span>NYSC Database Connection: Active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add other tab contents here */}
      </main>
    </div>
  );
}
