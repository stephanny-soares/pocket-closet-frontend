import React from "react";
import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import ErrorBoundary from "../src/logger/ErrorBoundary";
import BottomNavigation from "../src/components/BottomNavigation";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoaderProvider } from "../src/context/LoaderContext"; // 👈 importamos el provider
import { useFonts } from "expo-font";
import { ActivityIndicator } from "react-native";

export default function RootLayout() {
  const pathname = usePathname();

  const showNavbar =
    !pathname.includes("login") &&
    !pathname.includes("register") &&
    !pathname.includes("index");
  const [fontsLoaded] = useFonts({
    "CormorantGaramond-Regular": require("../assets/fonts/CormorantGaramond-Regular.ttf"),
    "CormorantGaramond-Medium": require("../assets/fonts/CormorantGaramond-Medium.ttf"),
    "CormorantGaramond-SemiBold": require("../assets/fonts/CormorantGaramond-SemiBold.ttf"),
    "CormorantGaramond-Bold": require("../assets/fonts/CormorantGaramond-Bold.ttf"),
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <LoaderProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }} />
            {showNavbar && <BottomNavigation />}
            <Toast position="top" topOffset={80} />
            <StatusBar style="dark" translucent />
          </View>
        </LoaderProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
