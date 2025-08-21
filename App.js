

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import AnimationScreen from './screens/AnimationScreen';



export default function App() {
  const [showAnimation, setShowAnimation] = useState(true);

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {showAnimation ? (
        <AnimationScreen onAnimationFinish={() => setShowAnimation(false)} />
      ) : (
        <AppNavigator />
      )}
    </>
  );
}