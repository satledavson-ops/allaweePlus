// components/BrandHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, radius, spacing, typography } from '../theme/ui';

export default function BrandHeader({
  title = '',
  onBack,
  rightText,
  onRightPress,
}) {
  return (
    <LinearGradient colors={[colors.brandPrimary, colors.brandSecondary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      <View style={styles.bar}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.backText}>‹ Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text numberOfLines={1} style={styles.title}>{title}</Text>

        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          {rightText ? (
            <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.rightText}>{rightText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Platform.select({ ios: 54, android: 24 }),
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  bar: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 80, justifyContent: 'center' },
  backText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '800' },
  rightText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
