// components/Screen.js
import React from 'react';
import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen({ children, style }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      {/* Ensure content isn't hidden behind the status bar */}
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#ffffff"
        translucent={false}
      />
      <View style={[styles.body, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F7FB' }, // light brand backdrop
  body: { flex: 1, paddingHorizontal: 20, paddingBottom: 16 },
});