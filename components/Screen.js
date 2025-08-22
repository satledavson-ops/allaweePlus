import React from 'react';
import { ImageBackground, View, StyleSheet, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { colors, spacing } from '../theme/ui';

const BG_PATTERN = require('../assets/bg_pattern.png');
const { width, height } = Dimensions.get('window');

export default function Screen({ children, padded = true }) {
  return (
    <ImageBackground source={BG_PATTERN} style={styles.bg} resizeMode="repeat">
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={[styles.overlay, padded && { paddingHorizontal: spacing.xl }]}>
          {children}
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: { flex: 1, backgroundColor: colors.bgOverlay, justifyContent: 'center' },
});
