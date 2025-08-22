// screens/ProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import { spacing, colors, radius } from '../theme/ui';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { isAuthed, user, logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [bank, setBank] = useState('');
  const [account, setAccount] = useState('');

  useEffect(() => {
    if (!isAuthed) {
      navigation.replace('Welcome');
      return;
    }
    (async () => {
      try {
        const data = await ApiService.getProfile();
        if (data) {
          if (data.full_name) setFullName(String(data.full_name));
          if (data.email) setEmail(String(data.email));
          if (data.phone) setPhone(String(data.phone));
          if (data.bank_name) setBank(String(data.bank_name));
          if (data.account_number) setAccount(String(data.account_number));
        }
      } catch (e) {
        // optional: Alert here if needed
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthed, navigation]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await ApiService.updateProfile({
        full_name: fullName,
        email,
        phone,
        bank_name: bank,
        account_number: account,
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try { if (ApiService.logout) await ApiService.logout(); }
    finally { logout(); }
  };

  if (loading) {
    return (
      <Screen>
        <BrandHeader title="Profile" onBack={() => navigation.goBack()} rightText="Logout" onRightPress={handleLogout} />
        <View style={{ padding: spacing.lg, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <BrandHeader title="Profile" onBack={() => navigation.goBack()} rightText="Logout" onRightPress={handleLogout} />
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.card}>
          <TextField
            label="Full Name"
            placeholder="Your name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <TextField
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextField
            label="Phone"
            placeholder="e.g. 08012345678"
            value={phone}
            onChangeText={(s) => setPhone(s.replace(/\D/g, ''))}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <TextField
            label="Bank Name"
            placeholder="e.g. Access Bank"
            value={bank}
            onChangeText={setBank}
            autoCapitalize="words"
          />
          <TextField
            label="Account Number"
            placeholder="10-digit account"
            value={account}
            onChangeText={(s) => setAccount(s.replace(/\D/g, '').slice(0, 10))}
            keyboardType="number-pad"
            autoCapitalize="none"
          />

          <GradientButton title="Save Changes" onPress={handleSave} loading={saving} />
          <GradientButton title="Logout" onPress={handleLogout} style={{ marginTop: spacing.md }} />
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