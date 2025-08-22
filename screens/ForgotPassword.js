// screens/ForgotPassword.js
import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import GradientButton from '../components/GradientButton';
import TextField from '../components/TextField';
import { spacing, typography } from '../theme/ui';

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email);

  const submit = () => {
    if (!valid) return;
    // TEMP: pretend we sent email, go back
    navigation.navigate('Welcome');
  };

  return (
    <Screen>
      <BrandHeader title="Reset password" onBack={() => navigation.navigate('Welcome')} />
      <View style={{ marginTop: spacing.md }}>
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={!valid && email ? 'Enter a valid email' : ''}
        />
        <GradientButton title="Send Reset Link" onPress={submit} />
        <View style={{ marginTop: spacing.md }}>
          <Text style={typography.hint}>You’ll receive an email with reset instructions.</Text>
        </View>
      </View>
    </Screen>
  );
}
