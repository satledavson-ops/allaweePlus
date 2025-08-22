// screens/RepaymentDashboardScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';

export default function RepaymentDashboardScreen() {
  const navigation = useNavigation();
  const [summary, setSummary] = useState(null);
  const [repayments, setRepayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await ApiService.getRepaymentDashboard();
      setSummary(data?.summary || null);
      setRepayments(Array.isArray(data?.repayments) ? data.repayments : []);
    } catch (e) {
      console.error('load repayments', e);
      Alert.alert('Error', 'Failed to load repayments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };

  const dueRepayments = useMemo(() => repayments.filter(r => String(r.status).toLowerCase() === 'due'), [repayments]);
  const paidRepayments = useMemo(() => repayments.filter(r => String(r.status).toLowerCase() === 'paid'), [repayments]);

  const handlePay = async (id) => {
    try {
      await ApiService.payInstallment(id);
      Alert.alert('Success', 'Payment successful.'); 
      onRefresh();
    } catch {
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, paddingTop: 60, alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10, color: '#666' }}>Loading repayments…</Text>
      </View>
    );
  }

  const hasAny = repayments.length > 0;
  const hasAnyDue = dueRepayments.length > 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <Text style={styles.title}>Repayments</Text>

      <View style={styles.grid}>
        <View style={styles.card}><Text style={styles.cardLabel}>Outstanding</Text><Text style={styles.cardValue}>₦{summary?.outstanding ?? 0}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Next Due</Text><Text style={styles.cardValue}>{summary?.next_due_date ? new Date(summary.next_due_date).toLocaleDateString() : '-'}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Paid</Text><Text style={styles.cardValue}>₦{summary?.total_paid ?? 0}</Text></View>
        <View style={styles.card}><Text style={styles.cardLabel}>Installments</Text><Text style={styles.cardValue}>{summary?.installments ?? 0}</Text></View>
      </View>

      <View style={{ marginTop: 10, paddingHorizontal: 20 }}>
        {!hasAny && (
          <View style={styles.emptyBigCard}>
            <Text style={styles.emptyIcon}>🪙</Text>
            <Text style={styles.emptyTitle}>No loans yet</Text>
            <Text style={styles.emptyText}>When you apply and get approved, your repayment schedule will appear here.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('LoanApplication')}>
              <Text style={styles.primaryBtnText}>Apply for Loan</Text>
            </TouchableOpacity>
          </View>
        )}

        {hasAny && !hasAnyDue && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>You’re all caught up!</Text>
            <Text style={styles.successText}>No pending repayments at the moment.</Text>
            {paidRepayments.slice(0, 3).map((r) => (
              <View key={r.id} style={styles.rowCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>₦{r.amount}</Text>
                  <Text style={styles.rowSub}>Paid: {new Date(r.paid_at || r.due_date).toLocaleDateString()}</Text>
                </View>
                <View style={styles.statusPill}><Text style={styles.statusText}>PAID</Text></View>
              </View>
            ))}
          </View>
        )}

        {hasAnyDue && dueRepayments.map((r) => (
          <View key={r.id} style={styles.rowCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>₦{r.amount}</Text>
              <Text style={styles.rowSub}>Due: {new Date(r.due_date).toLocaleDateString()} • {r.status}</Text>
            </View>
            <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(r.id)}>
              <Text style={styles.payBtnText}>Pay</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#4B006E', textAlign: 'center', marginTop: 50, marginBottom: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 20 },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', width: '48%', padding: 16, borderRadius: 15, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  cardLabel: { fontSize: 13, color: '#888', marginBottom: 6, fontWeight: '700' },
  cardValue: { fontSize: 16, fontWeight: '800', color: '#444' },
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 15, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  rowTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  rowSub: { fontSize: 13, color: '#666', marginTop: 4 },
  payBtn: { backgroundColor: '#A259C6', paddingVertical: 10, paddingHorizontal: 18, borderRadius: 12 },
  payBtnText: { color: '#fff', fontWeight: '700' },
  statusPill: { backgroundColor: '#A259C6', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999 },
  statusText: { color: '#fff', fontWeight: '700' },
  emptyBigCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 15, padding: 22, alignItems: 'center', marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#333' },
  emptyText: { marginTop: 6, color: '#666', textAlign: 'center' },
  primaryBtn: { marginTop: 14, backgroundColor: '#A259C6', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
  successCard: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 15, padding: 22, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2 },
  successIcon: { fontSize: 30, textAlign: 'center' },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#333', textAlign: 'center', marginTop: 6 },
  successText: { marginTop: 4, color: '#666', textAlign: 'center', marginBottom: 10 },
});