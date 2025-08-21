# AlloweePlus Admin Dashboard

A comprehensive web-based admin dashboard for managing AlloweePlus loan operations.

## Features

### 📊 Dashboard Overview
- **Real-time KPIs**: Total loans, active loans, collection rates, pending applications
- **Recent Activity Feed**: Live updates on approvals, collections, and verifications
- **Performance Metrics**: Success rates, default rates, and financial summaries

### 📋 Loan Application Management
- **Application Queue**: View all pending loan applications
- **NYSC Verification Status**: Real-time verification through Remita API
- **Risk Assessment**: Automated scoring with manual override capability
- **Bulk Actions**: Approve/reject multiple applications
- **Advanced Filtering**: By status, risk level, NYSC state, date range

### 💰 Active Loan Monitoring
- **Portfolio Overview**: Track all active loans and their status
- **Repayment Tracking**: Monitor payment schedules and collections
- **Default Management**: Early warning system for at-risk loans
- **Loan Performance Analytics**: Portfolio health metrics

### 🔄 Remita Collections Dashboard
- **Inflight Collections Monitoring**: Track automated salary deductions
- **Success Rate Analytics**: 98.5% collection rate tracking
- **Failed Collection Handling**: Manage edge cases and retry logic
- **API Integration Status**: Real-time monitoring of Remita connectivity

### 👥 User Management
- **NYSC Member Profiles**: Complete user information and verification status
- **Account Actions**: Suspend, activate, update user accounts
- **Verification Queue**: Manual review for edge cases
- **User Activity Logs**: Track user actions and loan history

### 📈 Reports & Analytics
- **Financial Reports**: Revenue, disbursements, collections
- **Risk Analytics**: Portfolio risk assessment and trends
- **NYSC Analytics**: Performance by state, batch, service year
- **Operational Reports**: Processing times, approval rates, efficiency metrics

## Technical Implementation

### Architecture
- **Frontend**: React.js with modern hooks and context
- **Styling**: CSS modules with responsive design
- **State Management**: React Context + useReducer for complex state
- **API Integration**: Axios for Django backend communication
- **Real-time Updates**: WebSocket connections for live data

### Key Components

#### 1. Application Review Workflow
```javascript
// Automated workflow with manual override points
const reviewWorkflow = {
  1: 'NYSC Verification (Automated)',
  2: 'Salary Verification (Remita API)',
  3: 'Risk Assessment (ML Algorithm)',
  4: 'Manual Review (If required)',
  5: 'Approval Decision',
  6: 'Disbursement Queue'
};
```

#### 2. Remita Integration Monitoring
```javascript
// Real-time API status monitoring
const remitaStatus = {
  salaryDataAPI: 'active',
  inflightCollections: 'active',
  nyscDatabase: 'active',
  lastSync: '2024-08-06T10:30:00Z'
};
```

#### 3. Risk Scoring Engine
```javascript
// Automated risk assessment
const riskFactors = {
  nyscStatus: 40,      // Active service
  salaryConsistency: 25, // Payment history
  demographics: 20,     // Age, education, location
  previousLoans: 15     // Repayment behavior
};
```

## Admin User Roles

### Super Admin
- Full system access
- User management
- System configuration
- Financial oversight

### Loan Officer
- Application review and approval
- Risk assessment
- Customer communication
- Portfolio monitoring

### Collections Manager
- Remita integration oversight
- Failed collection handling
- Default management
- Recovery operations

### Analyst
- Report generation
- Data analysis
- Performance monitoring
- Business intelligence

## Security Features

### Authentication & Authorization
- **Multi-factor Authentication**: SMS + Email verification
- **Role-based Access Control**: Granular permissions
- **Session Management**: Secure token-based auth
- **Audit Logging**: Complete action history

### Data Protection
- **Encryption**: AES-256 for sensitive data
- **Access Logs**: Track all data access
- **PII Masking**: Protect customer information
- **Compliance**: NDPR and banking regulations

## Deployment Strategy

### Environment Setup
- **Development**: Local React dev server
- **Staging**: Docker container with mock APIs
- **Production**: AWS/Azure deployment with CDN

### Monitoring & Alerts
- **Application Performance**: Response times, error rates
- **Business Metrics**: Approval rates, collection performance
- **System Health**: API connectivity, database performance
- **Alert System**: Email/SMS notifications for critical issues

## Integration Points

### Django Backend APIs
```
GET  /api/admin/dashboard/      # Dashboard metrics
GET  /api/admin/applications/   # Loan applications
POST /api/admin/approve/{id}/   # Approve loan
GET  /api/admin/loans/          # Active loans
GET  /api/admin/collections/    # Collection data
```

### Remita API Integration
```
GET  /remita/salary-data/       # Salary verification
POST /remita/inflight-setup/    # Collection setup
GET  /remita/collection-status/ # Payment status
GET  /remita/nysc-verify/       # NYSC verification
```

## Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Update API endpoints and credentials
   ```

3. **Start Development**
   ```bash
   npm start
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

This admin dashboard provides AlloweePlus with a professional, scalable solution for managing loan operations with full Remita integration support.
