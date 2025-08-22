// screens/ProfileSetupScreen.js
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import GradientButton from '../components/GradientButton';
import TextField from '../components/TextField';
import StepperDots from '../components/StepperDots';
import { colors, radius, shadow, spacing, typography } from '../theme/ui';

const NG_ACCOUNT_LEN = 10;
const NG_BVN_LEN = 11;

export default function ProfileSetupScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState(0);
  const [nyscStateCode, setNyscStateCode] = useState('');
  const [certificateName, setCertificateName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bvn, setBvn] = useState('');
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState({});

  const shakeX = useRef(new Animated.Value(0)).current;
  const runShake = () => {
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };
  const shakeStyle = {
    transform: [{ translateX: shakeX.interpolate({ inputRange: [-1, 0, 1], outputRange: [-8, 0, 8] }) }],
  };

  const errors = {
    nyscStateCode: nyscStateCode.trim().length ? '' : 'NYSC State Code is required',
    certificateName: certificateName.trim().length ? '' : 'Attach your NYSC certificate',
    bankName: bankName.trim().length ? '' : 'Bank name is required',
    accountNumber: accountNumber.trim().length === NG_ACCOUNT_LEN ? '' : `Must be ${NG_ACCOUNT_LEN} digits`,
    bvn: bvn.trim().length === NG_BVN_LEN ? '' : `Must be ${NG_BVN_LEN} digits`,
  };

  const stepValid = () => {
    if (step === 0) return !errors.nyscStateCode;
    if (step === 1) return !errors.certificateName;
    return !errors.bankName && !errors.accountNumber && !errors.bvn;
  };

  const markTouched = () => {
    if (step === 0) setTouched((t) => ({ ...t, nyscStateCode: true }));
    if (step === 1) setTouched((t) => ({ ...t, certificateName: true }));
    if (step === 2) setTouched((t) => ({ ...t, bankName: true, accountNumber: true, bvn: true }));
  };

  const next = () => {
    markTouched();
    if (!stepValid()) return runShake();
    if (step < 2) setStep(step + 1);
  };
  const back = () => (step > 0 ? setStep(step - 1) : navigation.goBack());
  const attach = () => setCertificateName('NYSC_Certificate.pdf'); // placeholder
  const finish = () => {
    markTouched();
    if (!stepValid()) return runShake();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      navigation.navigate('Home');
    }, 800);
  };

  return (
    <Screen>
      <BrandHeader title="Profile setup" onBack={() => navigation.goBack()} />
      <StepperDots current={step} total={3} />

      <Animated.View style={[styles.card, shakeStyle]}>
        {step === 0 && (
          <>
            <Text style={typography.h2}>NYSC Details</Text>
            <TextField
              label="NYSC State Code"
              placeholder="e.g. AB/20A/1234"
              value={nyscStateCode}
              onChangeText={setNyscStateCode}
              onBlur={() => setTouched((t) => ({ ...t, nyscStateCode: true }))}
              autoCapitalize="characters"
              error={touched.nyscStateCode && errors.nyscStateCode}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Text style={typography.h2}>NYSC Certificate</Text>
            <Text style={[typography.label, { marginBottom: spacing.sm, marginTop: spacing.md }]}>
              Upload your certificate
            </Text>
            <TouchableOpacity activeOpacity={0.9} onPress={attach} style={styles.attachBox}>
              <Text style={{ color: '#555', fontSize: 14, fontWeight: '600' }}>
                {certificateName ? `Attached: ${certificateName}` : 'Tap to attach (PDF/Image)'}
              </Text>
            </TouchableOpacity>
            {!!touched.certificateName && !!errors.certificateName && (
              <Text style={styles.err}>{errors.certificateName}</Text>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <Text style={typography.h2}>Bank & BVN</Text>
            <TextField
              label="Bank Name"
              placeholder="e.g. Access Bank"
              value={bankName}
              onChangeText={setBankName}
              onBlur={() => setTouched((t) => ({ ...t, bankName: true }))}
              autoCapitalize="words"
              error={touched.bankName && errors.bankName}
            />
            <TextField
              label="Account Number"
              placeholder={`${NG_ACCOUNT_LEN}-digit account number`}
              value={accountNumber}
              onChangeText={(s) => setAccountNumber(s.replace(/\D/g, '').slice(0, NG_ACCOUNT_LEN))}
              onBlur={() => setTouched((t) => ({ ...t, accountNumber: true }))}
              keyboardType="number-pad"
              autoCapitalize="none"
              error={touched.accountNumber && errors.accountNumber}
            />
            <TextField
              label="BVN"
              placeholder={`${NG_BVN_LEN}-digit BVN`}
              value={bvn}
              onChangeText={(s) => setBvn(s.replace(/\D/g, '').slice(0, NG_BVN_LEN))}
              onBlur={() => setTouched((t) => ({ ...t, bvn: true }))}
              keyboardType="number-pad"
              autoCapitalize="none"
              error={touched.bvn && errors.bvn}
            />
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity onPress={back} style={styles.ghostBtn}>
            <Text style={styles.ghostText}>Back</Text>
          </TouchableOpacity>

          {step < 2 ? (
            <GradientButton title="Next" onPress={next} />
          ) : (
            <GradientButton title="Finish" onPress={finish} loading={saving} />
          )}
        </View>
      </Animated.View>

      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text style={typography.hint}>You can update these later in Profile.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: '#fff',
    ...shadow.card,
  },
  attachBox: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  err: { color: colors.danger, marginTop: spacing.xs, fontSize: 13 },
  actions: { flexDirection: 'row', marginTop: spacing.lg, alignItems: 'center' },
  ghostBtn: {
    paddingHorizontal: spacing.lg,
    height: 52,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  ghostText: { color: '#555', fontSize: 15, fontWeight: '700' },
});
