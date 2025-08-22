// components/AuthLayout.js
import React from 'react';
import {
  View,
  StyleSheet,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Text,
  ScrollView,
  Dimensions,
} from 'react-native';

const BG_PATTERN = require('../assets/bg_pattern.png'); // adjust if your assets path differs

export default function AuthLayout({
  children,
  title,            // optional title at the top
  showBack = false, // show simple back text button (like Register)
  onBack,           // back handler
  footer,           // optional footer node under main content (e.g., Logout button)
  center = false,   // center content vertically (true for simple one-card screens)
}) {
  return (
    <ImageBackground source={BG_PATTERN} style={styles.bg} resizeMode="repeat">
      <KeyboardAvoidingView behavior={Platform.select({ ios: 'padding', android: undefined })} style={{ flex: 1 }}>
        <View style={styles.overlay}>
          <ScrollView
            contentContainerStyle={[styles.scrollBody, center && { justifyContent: 'center' }]}
            keyboardShouldPersistTaps="handled"
            bounces
          >
            {(showBack || title) && (
              <View style={styles.topRow}>
                {showBack ? (
                  <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={styles.backText}>‹ Back</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 60 }} />
                )}

                <View style={{ flex: 1, alignItems: 'center' }}>
                  {title ? <Text style={styles.title}>{title}</Text> : null}
                </View>

                <View style={{ width: 60 }} />{/* spacer to balance back text width */}
              </View>
            )}

            {children}

            {footer ? <View style={{ marginTop: 20 }}>{footer}</View> : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  bg: { flex: 1, width, height },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)', // matches Welcome/Register overlay
    paddingHorizontal: 24,
  },
  scrollBody: {
    flexGrow: 1,
    paddingVertical: 24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  backText: { color: '#4B006E', fontSize: 16, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', color: '#2d2d2d' },
});