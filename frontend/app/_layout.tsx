import React from "react";
import { Stack, usePathname } from "expo-router";
import { View } from "react-native";
import ErrorBoundary from "../src/logger/ErrorBoundary";
import BottomNavigation from "../src/components/BottomNavigation";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LoaderProvider } from "../src/context/LoaderContext"; // 👈 importamos el provider

export default function RootLayout() {
  const pathname = usePathname();

  const showNavbar =
    !pathname.includes("login") &&
    !pathname.includes("register") &&
    !pathname.includes("index");

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
