// screens/LoanApplicationScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import { spacing, typography, colors, radius } from '../theme/ui';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function LoanApplicationScreen() {
  const navigation = useNavigation();
  const { isAuthed, logout } = useAuth();

  const [amount, setAmount] = useState('');
  const [tenor, setTenor] = useState('12'); // months
  const [purpose, setPurpose] = useState('');

  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const errors = {
    amount: /^\d+$/.test(amount) && Number(amount) > 0 ? '' : 'Enter a valid amount',
    tenor: /^\d+$/.test(tenor) && Number(tenor) > 0 ? '' : 'Enter a valid tenor (months)',
    purpose: purpose.trim().length ? '' : 'Purpose is required',
  };
  const valid = !errors.amount && !errors.tenor && !errors.purpose;

  useEffect(() => {
    if (!isAuthed) navigation.replace('Welcome');
  }, [isAuthed, navigation]);

  const markTouched = (k) => setTouched((t) => ({ ...t, [k]: true }));

  const handleSubmit = async () => {
    setTouched({ amount: true, tenor: true, purpose: true });
    if (!valid || submitting) return;

    try {
      setSubmitting(true);
      await ApiService.applyForLoan({
        amount: Number(amount),
        tenor: Number(tenor),
        purpose: purpose.trim(),
      });
      Alert.alert('Success', 'Your loan application has been submitted.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Error', 'Unable to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try { if (ApiService.logout) await ApiService.logout(); }
    finally { logout(); }
  };

  return (
    <Screen>
      <BrandHeader title="Apply for Loan" onBack={() => navigation.goBack()} rightText="Logout" onRightPress={handleLogout} />

      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.card}>
          <TextField
            label="Amount (₦)"
            placeholder="e.g. 150000"
            value={amount}
            onChangeText={(s) => setAmount(s.replace(/\D/g, ''))}
            onBlur={() => markTouched('amount')}
            keyboardType="number-pad"
            error={touched.amount && errors.amount}
          />

          <TextField
            label="Tenor (months)"
            placeholder="e.g. 12"
            value={tenor}
            onChangeText={(s) => setTenor(s.replace(/\D/g, ''))}
            onBlur={() => markTouched('tenor')}
            keyboardType="number-pad"
            error={touched.tenor && errors.tenor}
          />

          <TextField
            label="Purpose"
            placeholder="e.g. Rent, relocation, business..."
            value={purpose}
            onChangeText={setPurpose}
            onBlur={() => markTouched('purpose')}
            autoCapitalize="sentences"
            error={touched.purpose && errors.purpose}
          />

          <GradientButton title="Submit Application" onPress={handleSubmit} loading={submitting} />
          {submitting && (
            <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
              <ActivityIndicator color={colors.brandPrimary} />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
});