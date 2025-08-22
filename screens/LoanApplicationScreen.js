// screens/LoanApplicationScreen.js
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

// ----- Adjust these to your real product terms -----
const MONTHLY_INTEREST_RATE = 0.03;   // 3% per month (example)
const PROCESSING_FEE_RATE   = 0.015;  // 1.5% one-time (example)
// ---------------------------------------------------

export default function LoanApplicationScreen() {
  const navigation = useNavigation();
  const { isAuthed } = useAuth();

  const [amount, setAmount] = useState('');   // ₦
  const [tenor, setTenor]   = useState('1');  // default term = 1
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (!isAuthed) navigation.replace('Welcome');
  }, [isAuthed, navigation]);

  const errors = {
    amount: /^\d+$/.test(amount) && Number(amount) > 0 ? '' : 'Enter a valid amount',
    tenor: /^\d+$/.test(tenor) && Number(tenor) > 0 ? '' : 'Enter a valid tenor (months)',
    purpose: purpose.trim().length ? '' : 'Purpose is required',
  };
  const valid = !errors.amount && !errors.tenor && !errors.purpose;
  const mark = (k) => setTouched((t) => ({ ...t, [k]: true }));

  // ---- Breakdown (live) -----------------------------------------------------
  const {
    amountNum,
    months,
    interest,
    processingFee,
    totalPayable,
    monthlyInstallment,
  } = useMemo(() => {
    const amt = Number(amount || 0);
    const m   = Math.max(1, Number(tenor || 1));
    const intr = amt * MONTHLY_INTEREST_RATE * m;   // simple interest
    const fee  = amt * PROCESSING_FEE_RATE;
    const total = amt + intr + fee;
    const monthly = total / m;
    return {
      amountNum: amt,
      months: m,
      interest: intr,
      processingFee: fee,
      totalPayable: total,
      monthlyInstallment: monthly,
    };
  }, [amount, tenor]);

  const fmt = (n) =>
    `₦${(Number.isFinite(n) ? n : 0).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

  const handleSubmit = async () => {
    setTouched({ amount: true, tenor: true, purpose: true });
    if (!valid || submitting) return;

    try {
      setSubmitting(true);
      await ApiService.applyForLoan({
        amount: amountNum,
        tenor: months,
        purpose: purpose.trim(),
        // (Optional) send breakdown so backend can echo/verify
        breakdown: {
          monthly_interest_rate: MONTHLY_INTEREST_RATE,
          processing_fee_rate: PROCESSING_FEE_RATE,
          interest,
          processing_fee: processingFee,
          total_payable: totalPayable,
          monthly_installment: monthlyInstallment,
        },
      });
      Alert.alert('Success', 'Your loan application has been submitted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert('Error', 'Unable to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      <Text style={styles.title}>Apply for Loan</Text>

      <View style={styles.card}>
        {/* Amount */}
        <Text style={styles.label}>Amount (₦)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 150000"
          value={amount}
          onChangeText={(s) => setAmount(s.replace(/\D/g, ''))}
          onBlur={() => mark('amount')}
          keyboardType="number-pad"
        />
        {!!touched.amount && !!errors.amount && <Text style={styles.err}>{errors.amount}</Text>}

        {/* Tenor */}
        <Text style={styles.label}>Tenor (months)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 1"
          value={tenor}
          onChangeText={(s) => setTenor(s.replace(/\D/g, ''))}
          onBlur={() => mark('tenor')}
          keyboardType="number-pad"
        />
        {!!touched.tenor && !!errors.tenor && <Text style={styles.err}>{errors.tenor}</Text>}

        {/* Purpose */}
        <Text style={styles.label}>Purpose</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="e.g. Rent, relocation, business..."
          value={purpose}
          onChangeText={setPurpose}
          onBlur={() => mark('purpose')}
          multiline
        />
        {!!touched.purpose && !!errors.purpose && <Text style={styles.err}>{errors.purpose}</Text>}

        {/* Repayment breakdown (live) */}
        <View style={styles.breakdownCard}>
          <Text style={styles.breakdownTitle}>Repayment breakdown</Text>

          <Row label="Principal" value={fmt(amountNum)} />
          <Row label={`Interest (${(MONTHLY_INTEREST_RATE * 100).toFixed(1)}% × ${months} mo)`} value={fmt(interest)} />
          <Row label={`Processing fee (${(PROCESSING_FEE_RATE * 100).toFixed(1)}%)`} value={fmt(processingFee)} />

          <View style={styles.divider} />

          <Row bold label="Total payable" value={fmt(totalPayable)} />
          <Row label={`Monthly installment × ${months}`} value={fmt(monthlyInstallment)} />
        </View>

        {/* Submit */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.btn, submitting && { opacity: 0.7 }]}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit Application</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Row({ label, value, bold }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && { fontWeight: '800', color: '#333' }]}>{label}</Text>
      <Text style={[styles.rowValue, bold && { fontWeight: '800', color: '#333' }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#4B006E',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: { fontSize: 14, color: '#666', marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#fff',
  },
  err: { marginTop: 6, color: '#c62828', fontSize: 13 },

  breakdownCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  breakdownTitle: { fontSize: 16, fontWeight: '800', color: '#444', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  rowLabel: { fontSize: 14, color: '#666' },
  rowValue: { fontSize: 14, color: '#444', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 6 },

  btn: {
    marginTop: 18,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#A259C6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});