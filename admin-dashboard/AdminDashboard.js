import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

// Sample Admin Dashboard for AlloweePlus
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    totalLoans: 1250,
    activeLoans: 890,
    pendingApplications: 45,
    totalDisbursed: 12500000,
    collectionRate: 98.5,
    defaultRate: 1.2,
    nyscVerificationsPending: 23,
    remitaCollections: 847
  });

  const [pendingApplications, setPendingApplications] = useState([
    {
      id: 'APP001',
      applicantName: 'John Doe',
      nyscCode: 'LA/23C/4567',
      amount: 10000,
      submittedDate: '2024-08-05',
      nyscStatus: 'verified',
      salaryVerified: true,
      riskScore: 85,
      status: 'pending_review'
    },
    {
      id: 'APP002',
      applicantName: 'Jane Smith',
      nyscCode: 'AB/23B/1234',
      amount: 10000,
      submittedDate: '2024-08-04',
      nyscStatus: 'pending',
      salaryVerified: false,
      riskScore: 92,
      status: 'pending_verification'
    },
    {
      id: 'APP003',
      applicantName: 'Mike Johnson',
      nyscCode: 'KD/23A/7890',
      amount: 10000,
      submittedDate: '2024-08-03',
      nyscStatus: 'verified',
      salaryVerified: true,
      riskScore: 78,
      status: 'ready_for_approval'
    }
  ]);

  const handleApproval = (applicationId, action) => {
    // Update application status
    setPendingApplications(prev => 
      prev.map(app => 
        app.id === applicationId 
          ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' }
          : app
      )
    );
    
    // In production, this would call your Django API
    console.log(`${action} application ${applicationId}`);
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
        <h1>AlloweePlus Admin Dashboard</h1>
        <div className="admin-user">
          <span>Welcome, Admin</span>
          <button className="logout-btn">Logout</button>
        </div>
      </header>

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
                  {pendingApplications.map(app => (
                    <tr key={app.id}>
                      <td className="app-id">{app.id}</td>
                      <td className="applicant-name">{app.applicantName}</td>
                      <td className="nysc-code">{app.nyscCode}</td>
                      <td className="amount">₦{app.amount.toLocaleString()}</td>
                      <td>
                        <span className={`verification-status ${app.nyscStatus}`}>
                          {app.nyscStatus === 'verified' ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>
                        <span className={`salary-status ${app.salaryVerified ? 'verified' : 'pending'}`}>
                          {app.salaryVerified ? '✅ Verified' : '⏳ Pending'}
                        </span>
                      </td>
                      <td>{getRiskBadge(app.riskScore)}</td>
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
                  ))}
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
