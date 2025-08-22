import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius, shadow } from '../theme/ui';

export default function GradientButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} disabled={loading || disabled} style={style}>
      <LinearGradient
        colors={[colors.brandPrimary, colors.brandSecondary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.btn, (loading || disabled) && { opacity: 0.7 }]}
      >
        {loading
          ? <ActivityIndicator size="small" color="#fff" />
          : <Text style={styles.text}>{title}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.button,
  },
  text: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
