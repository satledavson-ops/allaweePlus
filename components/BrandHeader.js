// components/BrandHeader.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BrandHeader({ title = '', onBack, rightText, onRightPress }) {
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 12); // respect notch; minimum 12

  return (
    <LinearGradient
      colors={['#6B0AA3', '#4B006E']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.wrap, { paddingTop: topPad }]}
    >
      <View style={styles.bar}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sideText}>‹ Back</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text numberOfLines={1} style={styles.title}>{title}</Text>

        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          {rightText ? (
            <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.sideText}>{rightText}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  bar: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 80, justifyContent: 'center' },
  sideText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  title: { flex: 1, textAlign: 'center', color: '#fff', fontSize: 18, fontWeight: '800' },
});