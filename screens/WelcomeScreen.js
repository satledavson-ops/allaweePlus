import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ImageBackground, Dimensions } from 'react-native';

const BG_PATTERN = require('../assets/bg_pattern.png'); // Add your pattern image to assets and use here
const LOGO = require('../assets/AllaweePlus_Logo_Dark.png');

const WelcomeScreen = ({ navigation }) => {
  return (
    <ImageBackground source={BG_PATTERN} style={styles.bg} resizeMode="repeat">
      <View style={styles.container}>
        <Image source={LOGO} style={styles.logo} />
        <Text style={styles.signInText}>Sign in</Text>
        <TextInput style={styles.input} placeholder="User/Email" placeholderTextColor="#888" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#888" secureTextEntry />
        <View style={styles.forgotRow}>
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgotText}>Forgot Password</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>Don’t have an Account?</Text>
          <TouchableOpacity style={styles.registerButton} onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ImageBackground>
  );
};

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  bg: {
    flex: 1,
    width,
    height,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.95)', // Slight overlay for readability
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 32,
    resizeMode: 'contain',
  },
  signInText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#444',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: '#A259C6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  forgotRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#888',
    fontSize: 15,
  },
  loginButton: {
    width: '100%',
    height: 52,
    backgroundColor: '#4B006E',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  registerRow: {
    width: '100%',
    alignItems: 'center',
  },
  registerPrompt: {
    color: '#888',
    fontSize: 15,
    marginBottom: 8,
  },
  registerButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#A259C6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '500'
  }
});

export default WelcomeScreen;