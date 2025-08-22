// screens/HomeScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';

export default function HomeScreen() {
  const navigation = useNavigation();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const loadDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await ApiService.getUserDashboard?.();
      setDashboardData(data || {});
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData(true);
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // If you want it to refresh when you come back to Home from other screens
  useFocusEffect(
    useCallback(() => {
      // pull latest silently
      loadDashboardData(true);
    }, [])
  );

  const onVerifySalary = async () => {
    try {
      setVerifying(true);
      await ApiService.verifySalary?.();
      Alert.alert('Success', 'Salary verification completed!');
      loadDashboardData(true);
    } catch (error) {
      Alert.alert('Error', 'Salary verification failed');
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#4B006E" />
        <Text style={styles.loadingText}>Loading your dashboard…</Text>
      </View>
    );
  }

  const totalApplications = dashboardData?.total_applications || 0;
  const activeLoans = dashboardData?.active_loans || 0;
  const totalBorrowed = dashboardData?.total_borrowed || 0;
  const outstandingBalance = dashboardData?.outstanding_balance || 0;
  const pendingApps = dashboardData?.pending_applications || 0;
  const nextDue = dashboardData?.next_payment_due;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 28 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header bubble */}
      <View style={styles.header}>
        <View style={styles.welcomeBubble}>
          <Text style={styles.welcomeText}>Welcome to AllaweePlus</Text>
        </View>
      </View>

      {/* KPI grid */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeader}>Overview</Text>
      </View>
      <View style={styles.dashboardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Applications</Text>
          <Text style={styles.cardValue}>{totalApplications}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Loans</Text>
          <Text style={styles.cardValue}>{activeLoans}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Borrowed</Text>
          <Text style={styles.balanceAmount}>₦{Number(totalBorrowed).toLocaleString()}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outstanding Balance</Text>
          <Text style={styles.balanceAmount}>₦{Number(outstandingBalance).toLocaleString()}</Text>
        </View>
      </View>

      {/* Important alerts */}
      {pendingApps > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Pending Applications</Text>
          <Text style={styles.alertText}>
            You have {pendingApps} loan application(s) under review.
          </Text>
        </View>
      )}

      {nextDue?.due_date && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Next Payment Due</Text>
          <Text style={styles.alertText}>
            Due Date: {new Date(nextDue.due_date).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Remita */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeader}>Salary Verification</Text>
      </View>
      <View style={styles.remitaCard}>
        <Text style={styles.cardTitle}>Keep your salary details up-to-date.</Text>
        <TouchableOpacity
          style={[styles.verifyButton, verifying && { opacity: 0.7 }]}
          onPress={onVerifySalary}
          disabled={verifying}
        >
          <Text style={styles.verifyButtonText}>
            {verifying ? 'Verifying…' : 'Verify with Remita'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions at the very bottom */}
      <View style={styles.sectionHeaderWrap}>
        <Text style={styles.sectionHeader}>Quick Actions</Text>
      </View>
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('LoanApplication')}
        >
          <Text style={styles.actionButtonText}>Apply for Loan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('RepaymentDashboard')}
        >
          <Text style={styles.actionButtonText}>View Repayments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.actionButtonText}>Manage Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/* --------------------------- styles --------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: { marginTop: 10, color: '#666', fontSize: 15 },

  header: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  welcomeBubble: {
    backgroundColor: '#4B006E',
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  sectionHeaderWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B006E',
  },

  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    width: '48%',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 13,
    color: '#7a7a7a',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3d3d3d',
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#A259C6',
  },

  alertCard: {
    backgroundColor: '#fff8f1',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderLeftColor: '#A259C6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#A259C6',
    marginBottom: 6,
  },
  alertText: { fontSize: 13.5, color: '#6a6a6a' },

  remitaCard: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  verifyButton: {
    backgroundColor: '#A259C6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 15.5,
    fontWeight: '700',
  },

  actionsContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
  },
  actionButton: {
    backgroundColor: '#4B006E',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});