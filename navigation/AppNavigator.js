// navigation/AppNavigator.js
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from './routes';

// Screens
import AnimationScreen from '../screens/AnimationScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPassword from '../screens/ForgotPassword';
import HomeScreen from '../screens/HomeScreen';
import LoanApplicationScreen from '../screens/LoanApplicationScreen';
import RepaymentDashboardScreen from '../screens/RepaymentDashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#ffffff' },
};

// Splash wrapper: decide where to go after animation
function AnimationGate({ navigation }) {
  const { isAuthed } = useAuth();
  return (
    <AnimationScreen
      onAnimationFinish={() => {
        navigation.replace(isAuthed ? ROUTES.Home : ROUTES.Welcome);
      }}
    />
  );
}

function RootStack() {
  const { isAuthed, bootstrapped } = useAuth();

  // Wait for AsyncStorage bootstrap (briefly)
  if (!bootstrapped) return null;

  return (
    <Stack.Navigator
      initialRouteName={ROUTES.Animation}
      screenOptions={{ headerShown: false, animation: 'slide_from_right', gestureEnabled: true }}
    >
      <Stack.Screen name={ROUTES.Animation} component={AnimationGate} />

      {!isAuthed ? (
        <>
          <Stack.Screen name={ROUTES.Welcome} component={WelcomeScreen} />
          <Stack.Screen name={ROUTES.Register} component={RegisterScreen} />
          <Stack.Screen name={ROUTES.ForgotPassword} component={ForgotPassword} />
        </>
      ) : (
        <>
          <Stack.Screen name={ROUTES.Home} component={HomeScreen} />
          <Stack.Screen name={ROUTES.LoanApplication} component={LoanApplicationScreen} />
          <Stack.Screen name={ROUTES.RepaymentDashboard} component={RepaymentDashboardScreen} />
          <Stack.Screen name={ROUTES.Profile} component={ProfileScreen} />
          <Stack.Screen name={ROUTES.ProfileSetup} component={ProfileSetupScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <RootStack />
    </NavigationContainer>
  );
}