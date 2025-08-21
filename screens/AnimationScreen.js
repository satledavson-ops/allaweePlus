// AnimationScreen.js
import React, { useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar } from "react-native";
import LottieView from "lottie-react-native";

export default function AnimationScreen({ onAnimationFinish }) {
  const lottieRef = useRef(null);
  const finishedOnce = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!finishedOnce.current && onAnimationFinish) {
        finishedOnce.current = true;
        onAnimationFinish();
      }
    }, 3000); // adjust to your animation length
    return () => clearTimeout(timer);
  }, [onAnimationFinish]);

  const handleFinish = () => {
    if (!finishedOnce.current && onAnimationFinish) {
      finishedOnce.current = true;
      onAnimationFinish();
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <LottieView
        ref={lottieRef}
        source={require("../assets/AllaweePlus_Animation.json")}
        autoPlay
        loop={false}
        onAnimationFinish={handleFinish}
        style={StyleSheet.absoluteFill}  // fill parent
        resizeMode="cover"               // full-bleed
        renderMode="AUTOMATIC"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#3D0052", // your brand purple behind transparent pixels
  },
});
