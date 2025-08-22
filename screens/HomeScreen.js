// screens/HomeScreen.js
import React, { useState, useEffect } from 'react';
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
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext'; // <-- integrate framework (Auth)

export default function HomeScreen({ navigation }) {
  const { logout } = useAuth(); // <-- use framework logout
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      const data = await ApiService.getUserDashboard();
      setDashboardData(data);
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
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              // If your API has a logout endpoint, keep this:
              if (ApiService.logout) {
                await ApiService.logout();
              }
            } finally {
              // With gated navigator, this flips you back to the public stack automatically
              logout();
              // No need for navigation.reset({ routes: [{ name: 'Welcome' }] })
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2E86AB" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.welcomeBubble}>
          <Text style={styles.welcomeText}>Welcome to AllaweePlus</Text>
        </View>

        {/* Keep your existing logout button placement & style */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Dashboard Cards */}
      <View style={styles.dashboardGrid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Applications</Text>
          <Text style={styles.cardValue}>{dashboardData?.total_applications || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Active Loans</Text>
          <Text style={styles.cardValue}>{dashboardData?.active_loans || 0}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Borrowed</Text>
          <Text style={styles.cardValue}>₦{dashboardData?.total_borrowed || '0'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Outstanding Balance</Text>
          <Text style={styles.cardValue}>₦{dashboardData?.outstanding_balance || '0'}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
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

      {/* Loan Status */}
      {dashboardData?.pending_applications > 0 && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Pending Applications</Text>
          <Text style={styles.alertText}>
            You have {dashboardData.pending_applications} loan application(s) under review.
          </Text>
        </View>
      )}

      {/* Next Payment Due */}
      {dashboardData?.next_payment_due && (
        <View style={styles.alertCard}>
          <Text style={styles.alertTitle}>Next Payment Due</Text>
          <Text style={styles.alertText}>
            Due Date: {new Date(dashboardData.next_payment_due.due_date).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Remita Integration Status */}
      <View style={styles.remitaCard}>
        <Text style={styles.cardTitle}>Salary Verification</Text>
        <TouchableOpacity 
          style={styles.verifyButton}
          onPress={async () => {
            try {
              const result = await ApiService.verifySalary();
              Alert.alert('Success', 'Salary verification completed!');
              loadDashboardData();
            } catch (error) {
              Alert.alert('Error', 'Salary verification failed');
            }
          }}
        >
          <Text style={styles.verifyButtonText}>Verify Salary with Remita</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#888',
    fontSize: 16,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  welcomeBubble: {
    backgroundColor: '#4B006E',
    borderRadius: 25,
    paddingVertical: 18,
    paddingHorizontal: 50,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#c62828',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  logoutButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    width: '48%',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#444',
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#A259C6',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B006E',
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: '#A259C6',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  alertCard: {
    backgroundColor: '#fff3e0',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#A259C6',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#A259C6',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#888',
  },
  remitaCard: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    margin: 20,
    padding: 20,
    borderRadius: 15,
    marginBottom: 25,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  verifyButton: {
    backgroundColor: '#A259C6',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
