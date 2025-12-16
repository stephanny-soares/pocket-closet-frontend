import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#C8B6A6" />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="mi-armario" options={{ headerShown: false }} />
          <Stack.Screen name="add-prenda" options={{ headerShown: false }} />
          <Stack.Screen name="mis-eventos" options={{ headerShown: false }} />
          <Stack.Screen name="mis-outfits" options={{ headerShown: false }} />
          <Stack.Screen name="mis-viajes" options={{ headerShown: false }} />
          <Stack.Screen name="perfil" options={{ headerShown: false }} />
          <Stack.Screen name="notificaciones" options={{ headerShown: false }} />
          <Stack.Screen name="questionnaire" options={{ headerShown: false }} />
          <Stack.Screen name="lista-equipaje" options={{ headerShown: false }} />
          <Stack.Screen name="crear-outfit" options={{ headerShown: false }} />
          <Stack.Screen name="editar-outfit" options={{ headerShown: false }} />
          <Stack.Screen name="editar-prenda" options={{ headerShown: false }} />

        </Stack>
        <StatusBar style="dark" translucent />
      </View>
    </SafeAreaProvider>
  );
}
