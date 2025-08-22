// screens/RepaymentDashboardScreen.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import GradientButton from '../components/GradientButton';
import { spacing, colors, radius } from '../theme/ui';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function RepaymentDashboardScreen() {
  const navigation = useNavigation();
  const { isAuthed, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState(null);
  const [repayments, setRepayments] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const data = await ApiService.getRepaymentDashboard();
      setSummary(data?.summary || null);
      setRepayments(data?.repayments || []);
    } catch (e) {
      Alert.alert('Error', 'Failed to load repayment data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthed) {
      navigation.replace('Welcome');
      return;
    }
    fetchData();
  }, [isAuthed, fetchData, navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handlePay = async (repaymentId) => {
    try {
      await ApiService.payInstallment(repaymentId);
      Alert.alert('Success', 'Payment successful.');
      fetchData();
    } catch (e) {
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try { if (ApiService.logout) await ApiService.logout(); }
    finally { logout(); }
  };

  if (loading) {
    return (
      <Screen>
        <BrandHeader title="Repayments" onBack={() => navigation.goBack()} rightText="Logout" onRightPress={handleLogout} />
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: spacing.sm, color: '#666' }}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BrandHeader title="Repayments" onBack={() => navigation.goBack()} rightText="Logout" onRightPress={handleLogout} />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Summary grid */}
        <View style={styles.grid}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Outstanding</Text>
            <Text style={styles.cardValue}>₦{summary?.outstanding || '0'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Next Due</Text>
            <Text style={styles.cardValue}>
              {summary?.next_due_date ? new Date(summary.next_due_date).toLocaleDateString() : '-'}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Paid</Text>
            <Text style={styles.cardValue}>₦{summary?.total_paid || '0'}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Installments</Text>
            <Text style={styles.cardValue}>{summary?.installments || 0}</Text>
          </View>
        </View>

        {/* Repayment list */}
        <View style={{ marginTop: spacing.md }}>
          {repayments.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={{ color: '#666' }}>No repayments yet.</Text>
            </View>
          ) : (
            repayments.map((r) => (
              <View key={r.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>₦{r.amount}</Text>
                  <Text style={styles.rowSub}>
                    Due: {new Date(r.due_date).toLocaleDateString()} • {r.status}
                  </Text>
                </View>
                {r.status === 'due' ? (
                  <GradientButton title="Pay" onPress={() => handlePay(r.id)} style={{ minWidth: 120 }} />
                ) : (
                  <TouchableOpacity style={styles.statusPill} disabled>
                    <Text style={styles.statusText}>{r.status.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 16,
    borderRadius: radius.xl,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardLabel: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '700' },
  cardValue: { fontSize: 16, fontWeight: '800', color: '#444' },

  emptyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: radius.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },

  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  rowTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  rowSub: { fontSize: 13, color: '#666', marginTop: 4 },

  statusPill: {
    backgroundColor: colors.brandSecondary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  statusText: { color: '#fff', fontWeight: '700' },
});