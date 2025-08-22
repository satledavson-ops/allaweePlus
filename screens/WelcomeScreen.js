// screens/WelcomeScreen.js
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ImageBackground,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../context/AuthContext';

const BG_PATTERN = require('../assets/bg_pattern.png');
const LOGO = require('../assets/AllaweePlus_Logo_Dark.png');

export default function WelcomeScreen() {
  const navigation = useNavigation();
  const { login } = useAuth(); // temp login (accepts any creds, persists token)

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const canSubmit = user.trim().length > 0 && pass.length > 0;

  // Shake animation for invalid input
  const shakeX = useRef(new Animated.Value(0)).current;
  const runShake = () => {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };
  const shakeStyle = {
    transform: [{
      translateX: shakeX.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [-8, 0, 8],
      })
    }],
  };

  const onLogin = async () => {
    if (!canSubmit || loading) {
      if (!canSubmit) runShake();
      return;
    }
    try {
      setLoading(true);
      await login(user, pass); // store dev token + user
      // ✅ go to Home and remove Welcome from history
      navigation.replace('Home');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={BG_PATTERN} style={styles.bg} resizeMode="repeat">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <Image source={LOGO} style={styles.logo} />
          <Text style={styles.signInText}>Sign in</Text>

          <Animated.View style={[styles.field, shakeStyle]}>
            <Text style={styles.label}>User / Email</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. you@example.com"
              placeholderTextColor="#888"
              value={user}
              onChangeText={setUser}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              returnKeyType="next"
            />
          </Animated.View>

          <Animated.View style={[styles.field, shakeStyle]}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Your password"
                placeholderTextColor="#888"
                value={pass}
                onChangeText={setPass}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={onLogin}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Text style={styles.eyeText}>{showPass ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <View style={styles.forgotRow}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.forgotText}>Forgot Password</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onLogin}
            disabled={loading}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={['#6B0AA3', '#4B006E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.loginButton, (!canSubmit || loading) && styles.loginButtonDisabled]}
            >
              {loading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.loginButtonText}>Login</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerPrompt}>Don’t have an account?</Text>
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate('Register')}
            >
              <LinearGradient
                colors={['#A259C6', '#8C3FB3']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.registerButtonInner}
              >
                <Text style={styles.registerButtonText}>Register</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  bg: { flex: 1, width, height },
  container: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, backgroundColor: 'rgba(255,255,255,0.95)',
  },
  logo: { width: 120, height: 120, marginBottom: 28, resizeMode: 'contain' },
  signInText: { fontSize: 24, fontWeight: '700', color: '#2d2d2d', marginBottom: 16 },

  field: { width: '100%', marginBottom: 14 },
  label: { fontSize: 13, color: '#666', marginBottom: 6 },
  input: {
    width: '100%', height: 48, borderWidth: 1, borderColor: '#A259C6',
    borderRadius: 12, paddingHorizontal: 16, marginBottom: 0, fontSize: 16, backgroundColor: '#fff',
  },

  passRow: { flexDirection: 'row', alignItems: 'center' },
  eyeBtn: {
    marginLeft: 8, height: 48, paddingHorizontal: 12, borderRadius: 10,
    borderWidth: 1, borderColor: '#ddd',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fafafa',
  },
  eyeText: { color: '#555', fontSize: 13, fontWeight: '600' },

  forgotRow: { width: '100%', alignItems: 'flex-end', marginTop: 8, marginBottom: 22 },
  forgotText: { color: '#666', fontSize: 15 },

  loginButton: {
    width: '100%', height: 52, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center', marginBottom: 28,
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 2,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  registerRow: { width: '100%', alignItems: 'center' },
  registerPrompt: { color: '#777', fontSize: 15, marginBottom: 10 },
  registerButton: { width: '100%' },
  registerButtonInner: {
    width: '100%', height: 50, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  registerButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});