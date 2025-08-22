// screens/ForgotPassword.js
import React, { useState } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import Screen from '../components/Screen';
import BrandHeader from '../components/BrandHeader';
import TextField from '../components/TextField';
import GradientButton from '../components/GradientButton';
import { spacing, colors, radius } from '../theme/ui';

export default function ForgotPassword() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const valid = /^\S+@\S+\.\S+$/.test(email);

  const submit = () => {
    if (!valid) return;
    // TEMP: pretend we sent email → back to Welcome
    navigation.navigate('Welcome');
  };

  return (
    <Screen>
      <BrandHeader title="Reset password" onBack={() => navigation.goBack()} />
      <View
        style={{
          marginTop: spacing.md,
          padding: spacing.lg,
          backgroundColor: '#fff',
          borderRadius: radius.xl,
          shadowColor: '#000',
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: 4 },
          shadowRadius: 10,
          elevation: 2,
        }}
      >
        <TextField
          label="Email"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          error={!valid && email ? 'Enter a valid email' : ''}
        />
        <GradientButton title="Send Reset Link" onPress={submit} disabled={!valid} />
      </View>
    </Screen>
  );
}