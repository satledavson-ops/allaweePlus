// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPassword from '../screens/ForgotPassword';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import HomeScreen from '../screens/HomeScreen';

// ⬇️ make sure these paths match your file locations
import LoanApplicationScreen from '../screens/LoanApplicationScreen';
import RepaymentDashboardScreen from '../screens/RepaymentDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { AuthProvider, useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

function AuthedStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="LoanApplication" component={LoanApplicationScreen} />
      <Stack.Screen name="RepaymentDashboard" component={RepaymentDashboardScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
      {/* add more authenticated screens here */}
    </Stack.Navigator>
  );
}

function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen} />
    </Stack.Navigator>
  );
}

function Root() {
  const { isAuthed } = useAuth();
  return isAuthed ? <AuthedStack /> : <PublicStack />;
}

export default function AppNavigator() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <Root />
      </NavigationContainer>
    </AuthProvider>
  );
}
