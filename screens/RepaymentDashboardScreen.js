import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import ApiService from '../services/api';

export default function RepaymentDashboardScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeLoan, setActiveLoan] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [loansData, paymentsData] = await Promise.all([
        ApiService.getUserLoans(),
        ApiService.getPaymentHistory()
      ]);
      
      setLoans(loansData);
      setPayments(paymentsData);
      
      // Find the most recent active loan
      const active = loansData.find(loan => loan.status === 'approved' || loan.status === 'active');
      setActiveLoan(active);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const calculateProgress = () => {
    if (!activeLoan) return 0;
    const totalAmount = parseFloat(activeLoan.total_amount);
    const paidAmount = payments
      .filter(payment => payment.loan === activeLoan.id && payment.status === 'completed')
      .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleMakePayment = async () => {
    if (!activeLoan) {
      Alert.alert('No Active Loan', 'You don\'t have any active loans to make payments for.');
      return;
    }

    try {
      const result = await ApiService.initiatePayment({
        loan_id: activeLoan.id,
        amount: activeLoan.monthly_payment || activeLoan.total_amount
      });
      
      Alert.alert('Payment Initiated', 'Your payment has been initiated through Remita. You will receive a confirmation shortly.');
      loadDashboardData(); // Refresh data
    } catch (error) {
      Alert.alert('Payment Failed', error.message || 'Failed to initiate payment');
    }
  };

  const handleRemitaVerification = async () => {
    try {
      const result = await ApiService.verifySalary();
      Alert.alert('Verification Complete', 'Your salary has been verified successfully with Remita.');
      loadDashboardData();
    } catch (error) {
      Alert.alert('Verification Failed', error.message || 'Failed to verify salary');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading repayment dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Repayment Dashboard</Text>
      
      {/* Active Loan Summary */}
      {activeLoan ? (
        <View style={styles.activeLoanCard}>
          <Text style={styles.cardTitle}>Active Loan</Text>
          
          <View style={styles.loanSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Loan Amount:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(activeLoan.amount)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Repayment:</Text>
              <Text style={styles.summaryValue}>{formatCurrency(activeLoan.total_amount)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Start Date:</Text>
              <Text style={styles.summaryValue}>{formatDate(activeLoan.created_at)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Text style={[styles.summaryValue, styles.statusActive]}>{activeLoan.status}</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Repayment Progress</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${calculateProgress()}%` }]} />
            </View>
            <Text style={styles.progressText}>{calculateProgress().toFixed(1)}% Complete</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noLoanCard}>
          <Text style={styles.noLoanText}>No active loans</Text>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={() => navigation.navigate('LoanApplication')}
          >
            <Text style={styles.applyButtonText}>Apply for Loan</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment Actions */}
      {activeLoan && (
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.paymentButton} onPress={handleMakePayment}>
            <Text style={styles.paymentButtonText}>Make Payment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.verifyButton} onPress={handleRemitaVerification}>
            <Text style={styles.verifyButtonText}>Verify Salary with Remita</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Payment History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        
        {payments.length > 0 ? (
          payments.map((payment, index) => (
            <View key={index} style={styles.paymentCard}>
              <View style={styles.paymentRow}>
                <View style={styles.paymentInfo}>
                  <Text style={styles.paymentDate}>{formatDate(payment.payment_date)}</Text>
                  <Text style={styles.paymentAmount}>{formatCurrency(payment.amount)}</Text>
                </View>
                <View style={styles.paymentStatus}>
                  <Text style={[
                    styles.statusText, 
                    payment.status === 'completed' ? styles.statusCompleted : styles.statusPending
                  ]}>
                    {payment.status}
                  </Text>
                </View>
              </View>
              
              {payment.remita_rrr && (
                <Text style={styles.referenceText}>RRR: {payment.remita_rrr}</Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No payment history available</Text>
        )}
      </View>

      {/* Loan History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Loan History</Text>
        
        {loans.length > 0 ? (
          loans.map((loan, index) => (
            <View key={index} style={styles.loanCard}>
              <View style={styles.loanRow}>
                <View style={styles.loanInfo}>
                  <Text style={styles.loanAmount}>{formatCurrency(loan.amount)}</Text>
                  <Text style={styles.loanDate}>{formatDate(loan.created_at)}</Text>
                </View>
                <View style={styles.loanStatus}>
                  <Text style={[
                    styles.statusText,
                    loan.status === 'approved' ? styles.statusActive :
                    loan.status === 'completed' ? styles.statusCompleted :
                    loan.status === 'pending' ? styles.statusPending : styles.statusRejected
                  ]}>
                    {loan.status}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No loan history available</Text>
        )}
      </View>

      {/* Remita Integration Info */}
      <View style={styles.remitaCard}>
        <Text style={styles.remitaTitle}>🔒 Secured by Remita</Text>
        <Text style={styles.remitaText}>
          Your payments are automatically processed through Remita's inflight collection system, 
          ensuring secure and timely loan repayments directly from your NYSC salary.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4B006E',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 30,
  },
  activeLoanCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#A259C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noLoanCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 30,
    marginBottom: 20,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#A259C6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  noLoanText: {
    fontSize: 18,
    color: '#888',
    marginBottom: 20,
  },
  applyButton: {
    backgroundColor: '#4B006E',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  loanSummary: {
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#A259C6',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#888',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B006E',
  },
  statusActive: {
    color: '#4B006E',
    textTransform: 'uppercase',
  },
  progressSection: {
    marginTop: 20,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 10,
  },
  progressBar: {
    height: 10,
    backgroundColor: '#A259C6',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4B006E',
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#888',
  },
  actionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  paymentButton: {
    backgroundColor: '#4B006E',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 0.48,
  },
  paymentButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#A259C6',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    flex: 0.48,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  historySection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 15,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#A259C6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#A259C6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loanRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentInfo: {
    flex: 1,
  },
  loanInfo: {
    flex: 1,
  },
  paymentDate: {
    fontSize: 14,
    color: '#888',
  },
  loanDate: {
    fontSize: 14,
    color: '#888',
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B006E',
  },
  paymentStatus: {
    alignItems: 'flex-end',
  },
  loanStatus: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusCompleted: {
    backgroundColor: '#A259C6',
    color: '#fff',
  },
  statusPending: {
    backgroundColor: '#A259C6',
    color: '#fff',
  },
  statusRejected: {
    backgroundColor: '#A259C6',
    color: '#fff',
  },
  referenceText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 16,
    marginTop: 20,
  },
  remitaCard: {
    backgroundColor: '#A259C6',
    padding: 20,
    borderRadius: 15,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#4B006E',
  },
  remitaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  remitaText: {
    fontSize: 14,
    color: '#0d47a1',
    lineHeight: 20,
  },
});
