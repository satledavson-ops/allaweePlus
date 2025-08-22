// screens/RegisterScreen.js
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import GradientButton from '../components/GradientButton';
import TextField from '../components/TextField';
import { spacing, typography } from '../theme/ui';

const emailOk = (s) => /^\S+@\S+\.\S+$/.test(s);
const strongPass = (s) => s.length >= 8;

export default function RegisterScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState({});

  const errors = {
    name: name.trim().length ? '' : 'Full name is required',
    email: emailOk(email) ? '' : 'Enter a valid email',
    pass: strongPass(pass) ? '' : 'Min 8 characters',
    confirm: confirm === pass && confirm.length ? '' : 'Passwords do not match',
  };
  const valid = !errors.name && !errors.email && !errors.pass && !errors.confirm;

  const onSubmit = () => {
    setTouched({ name: true, email: true, pass: true, confirm: true });
    if (!valid || submitting) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      navigation.navigate('ProfileSetup');
    }, 900);
  };

  return (
    <Screen>
      <View style={{}}>
        <Text style={typography.h1}>Create account</Text>

        <TextField
          label="Full Name"
          placeholder="e.g. Davson George Satle"
          value={name}
          onChangeText={setName}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          autoCapitalize="words"
          error={touched.name && errors.name}
        />

        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          keyboardType="email-address"
          autoCapitalize="none"
          error={touched.email && errors.email}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: spacing.sm }}>
            <TextField
              label="Password"
              placeholder="Min 8 characters"
              value={pass}
              onChangeText={setPass}
              onBlur={() => setTouched((t) => ({ ...t, pass: true }))}
              secureTextEntry
              autoCapitalize="none"
              error={touched.pass && errors.pass}
            />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <TextField
              label="Confirm"
              placeholder="Repeat password"
              value={confirm}
              onChangeText={setConfirm}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              secureTextEntry
              autoCapitalize="none"
              error={touched.confirm && errors.confirm}
            />
          </View>
        </View>

        <GradientButton title="Create Account" onPress={onSubmit} loading={submitting} />

        <View style={styles.loginRow}>
          <Text style={typography.p}>Already have an account?</Text>
          <Text style={typography.link} onPress={() => navigation.navigate('Welcome')}>  Log in here</Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: spacing.md },
  loginRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg },
});
