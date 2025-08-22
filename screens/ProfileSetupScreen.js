import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../services/api';
import { useAuth } from '../context/AuthContext';

// helpers
const safe = (v, fb = '') => (v === undefined || v === null ? fb : String(v));
const trimObj = (o) =>
  Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  const { setUser, user } = useAuth();

  const [bootLoading, setBootLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state (grouped to mirror Profile screen)
  const [personal, setPersonal] = useState({
    full_name: '',
    email: '',
    phone: '',
    dob: '',
    address: '',
  });
  const [nysc, setNysc] = useState({
    nysc_callup_no: '',
    nysc_state_code: '',
    nysc_year: '',
    nysc_batch: '',
    nysc_start: '',
    nysc_end: '',
    nysc_ppa: '',
    nysc_cds: '',
    nysc_orientation_status: '',
  });
  const [bank, setBank] = useState({
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
    bvn: '',
  });
  const [nok, setNok] = useState({
    nok_name: '',
    nok_relationship: '',
    nok_phone: '',
    nok_address: '',
  });

  // Prefill on mount
  useEffect(() => {
    (async () => {
      try {
        const p = (await ApiService.getProfile?.()) || {};
        setPersonal({
          full_name: safe(p.full_name || `${safe(p.first_name)} ${safe(p.last_name)}`.trim()),
          email: safe(p.email || user?.email),
          phone: safe(p.phone),
          dob: safe(p.dob),
          address: safe(p.address),
        });
        setNysc({
          nysc_callup_no: safe(p.nysc_callup_no),
          nysc_state_code: safe(p.nysc_state_code),
          nysc_year: safe(p.nysc_year),
          nysc_batch: safe(p.nysc_batch),
          nysc_start: safe(p.nysc_start),
          nysc_end: safe(p.nysc_end),
          nysc_ppa: safe(p.nysc_ppa),
          nysc_cds: safe(p.nysc_cds),
          nysc_orientation_status: safe(p.nysc_orientation_status),
        });
        setBank({
          bank_account_name: safe(p.bank_account_name || (p.full_name || '').trim()),
          bank_account_number: safe(p.bank_account_number),
          bank_name: safe(p.bank_name),
          bvn: safe(p.bvn),
        });
        setNok({
          nok_name: safe(p.nok_name),
          nok_relationship: safe(p.nok_relationship),
          nok_phone: safe(p.nok_phone),
          nok_address: safe(p.nok_address),
        });
      } catch (e) {
        // minimal fallback
        setPersonal((prev) => ({ ...prev, email: safe(user?.email) }));
      } finally {
        setBootLoading(false);
      }
    })();
  }, [user]);

  // Validation
  const errors = useMemo(() => {
    const e = {};
    if (!personal.full_name) e.full_name = 'Full name is required';
    if (!personal.email) e.email = 'Email is required';
    if (personal.email && !/^\S+@\S+\.\S+$/.test(personal.email)) e.email = 'Invalid email';

    if (bank.bvn && bank.bvn.length !== 11) e.bvn = 'BVN must be 11 digits';
    if (bank.bank_account_number && bank.bank_account_number.length !== 10)
      e.bank_account_number = 'Acct No. must be 10 digits';

    return e;
  }, [personal, bank]);

  const hasErrors = Object.keys(errors).length > 0;

  // Save
  const onSave = async () => {
    if (hasErrors) {
      Alert.alert('Fix form', 'Please correct the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const payload = trimObj({
        ...personal,
        ...nysc,
        ...bank,
        ...nok,
      });

      await ApiService.updateProfile?.(payload);

      // reflect in auth context (name/email)
      if (payload.full_name || payload.email) {
        setUser?.({
          ...(user || {}),
          name: payload.full_name || user?.name,
          email: payload.email || user?.email,
        });
      }

      Alert.alert('Saved', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Field component (matching Welcome/Register style)
  const Field = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType,
    secureTextEntry,
    error,
    editable = true,
  }) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          !!error && styles.inputError,
          !editable && styles.inputDisabled,
        ]}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        editable={editable}
      />
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );

  if (bootLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#4B006E" />
        <Text style={{ marginTop: 8, color: '#666' }}>Loading profile…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 28 }}
          style={styles.scroll}
        >
          {/* Title (top-aligned like your Register screen) */}
          <Text style={styles.title}>Edit Profile</Text>

          {/* Personal */}
          <Section title="Personal Information">
            <Field
              label="Full Name"
              placeholder="e.g. Davson George Satle"
              value={personal.full_name}
              onChangeText={(v) => setPersonal((s) => ({ ...s, full_name: v }))}
              error={errors.full_name}
            />
            <Field
              label="Email"
              placeholder="you@example.com"
              value={personal.email}
              onChangeText={(v) => setPersonal((s) => ({ ...s, email: v }))}
              keyboardType="email-address"
              error={errors.email}
            />
            <Field
              label="Phone"
              placeholder="+234 80 1234 5678"
              value={personal.phone}
              onChangeText={(v) => setPersonal((s) => ({ ...s, phone: v }))}
              keyboardType="phone-pad"
            />
            <Field
              label="Date of Birth"
              placeholder="YYYY-MM-DD"
              value={personal.dob}
              onChangeText={(v) => setPersonal((s) => ({ ...s, dob: v }))}
              keyboardType="numbers-and-punctuation"
            />
            <Field
              label="Address"
              placeholder="Residential address"
              value={personal.address}
              onChangeText={(v) => setPersonal((s) => ({ ...s, address: v }))}
            />
          </Section>

          {/* NYSC */}
          <Section title="NYSC Information">
            <Field
              label="Call-up Number"
              placeholder="NYSC/FCT/2023/1234567"
              value={nysc.nysc_callup_no}
              onChangeText={(v) => setNysc((s) => ({ ...s, nysc_callup_no: v }))}
            />
            <Field
              label="State Code"
              placeholder="PL/23C/4567"
              value={nysc.nysc_state_code}
              onChangeText={(v) => setNysc((s) => ({ ...s, nysc_state_code: v }))}
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field
                  label="Service Year"
                  placeholder="2023"
                  value={nysc.nysc_year}
                  onChangeText={(v) => setNysc((s) => ({ ...s, nysc_year: v }))}
                  keyboardType="number-pad"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Field
                  label="Batch"
                  placeholder="A / B / C"
                  value={nysc.nysc_batch}
                  onChangeText={(v) => setNysc((s) => ({ ...s, nysc_batch: v }))}
                />
              </View>
            </View>
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field
                  label="Start Date"
                  placeholder="YYYY-MM-DD"
                  value={nysc.nysc_start}
                  onChangeText={(v) => setNysc((s) => ({ ...s, nysc_start: v }))}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Field
                  label="End Date"
                  placeholder="YYYY-MM-DD"
                  value={nysc.nysc_end}
                  onChangeText={(v) => setNysc((s) => ({ ...s, nysc_end: v }))}
                  keyboardType="numbers-and-punctuation"
                />
              </View>
            </View>
            <Field
              label="PPA"
              placeholder="Place of Primary Assignment"
              value={nysc.nysc_ppa}
              onChangeText={(v) => setNysc((s) => ({ ...s, nysc_ppa: v }))}
            />
            <Field
              label="CDS Group"
              placeholder="e.g. Education"
              value={nysc.nysc_cds}
              onChangeText={(v) => setNysc((s) => ({ ...s, nysc_cds: v }))}
            />
            <Field
              label="Orientation Status"
              placeholder="Completed / Pending"
              value={nysc.nysc_orientation_status}
              onChangeText={(v) =>
                setNysc((s) => ({ ...s, nysc_orientation_status: v }))
              }
            />
          </Section>

          {/* Bank */}
          <Section title="Bank Information">
            <Field
              label="Account Name"
              placeholder="e.g. John Doe"
              value={bank.bank_account_name}
              onChangeText={(v) => setBank((s) => ({ ...s, bank_account_name: v }))}
            />
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Field
                  label="Account Number"
                  placeholder="10 digits"
                  value={bank.bank_account_number}
                  onChangeText={(v) =>
                    setBank((s) => ({ ...s, bank_account_number: v }))
                  }
                  keyboardType="number-pad"
                  error={errors.bank_account_number}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Field
                  label="Bank"
                  placeholder="e.g. First Bank"
                  value={bank.bank_name}
                  onChangeText={(v) => setBank((s) => ({ ...s, bank_name: v }))}
                />
              </View>
            </View>
            <Field
              label="BVN"
              placeholder="11 digits"
              value={bank.bvn}
              onChangeText={(v) => setBank((s) => ({ ...s, bvn: v.replace(/\D/g, '') }))}
              keyboardType="number-pad"
              error={errors.bvn}
            />
          </Section>

          {/* Next of Kin */}
          <Section title="Next of Kin">
            <Field
              label="Full Name"
              placeholder="e.g. Jane Doe"
              value={nok.nok_name}
              onChangeText={(v) => setNok((s) => ({ ...s, nok_name: v }))}
            />
            <Field
              label="Relationship"
              placeholder="e.g. Sister"
              value={nok.nok_relationship}
              onChangeText={(v) =>
                setNok((s) => ({ ...s, nok_relationship: v }))
              }
            />
            <Field
              label="Phone"
              placeholder="+234 80 9876 5432"
              value={nok.nok_phone}
              onChangeText={(v) => setNok((s) => ({ ...s, nok_phone: v }))}
              keyboardType="phone-pad"
            />
            <Field
              label="Address"
              placeholder="Address"
              value={nok.nok_address}
              onChangeText={(v) => setNok((s) => ({ ...s, nok_address: v }))}
            />
          </Section>

          {/* Save button (gradient) */}
          <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onSave}
              disabled={saving}
              style={{ width: '100%' }}
            >
              <LinearGradient
                colors={['#6B0AA3', '#4B006E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.primaryButton, saving && { opacity: 0.7 }]}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Save Changes</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/* --------------------------- styles --------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // same base as Welcome/Register
  },
  scroll: {
    paddingHorizontal: 20,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#4B006E',
    marginTop: 10,       // top-aligned (SafeArea) with subtle spacing like Register
    marginBottom: 10,
  },

  section: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4B006E',
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  field: { marginBottom: 12 },
  label: { fontSize: 13, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  inputError: { borderColor: '#d93025' },
  inputDisabled: { backgroundColor: '#f6f6f6', color: '#999' },
  errorText: { marginTop: 6, color: '#d93025', fontSize: 12.5 },

  primaryButton: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  center: { justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row' },
});