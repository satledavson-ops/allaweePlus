import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/ui';

export default function TextField({
  label,
  error,
  style,
  inputStyle,
  ...inputProps
}) {
  return (
    <View style={[styles.wrap, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor="#888"
        {...inputProps}
      />
      {!!error && <Text style={styles.err}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', marginBottom: spacing.md },
  label: { ...typography.label, marginBottom: spacing.xs },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  err: { color: colors.danger, marginTop: spacing.xs, fontSize: 13 },
});
