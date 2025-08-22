import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme/ui';

export default function StepperDots({ current = 0, total = 3 }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.dot, i === current && styles.active]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  dot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#d7c5e6', marginHorizontal: 5,
  },
  active: { backgroundColor: colors.brandPrimary },
});
