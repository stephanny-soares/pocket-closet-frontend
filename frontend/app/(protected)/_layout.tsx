// app/(protected)/_layout.tsx
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../../src/hooks/useAuth";

export default function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // 🚪 Solo redirige si terminó de cargar y NO está autenticado
    if (!loading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [loading, isAuthenticated]);

  // ⏳ Mientras se verifica la sesión, muestra loader
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  // ✅ Si está autenticado, renderiza las pantallas protegidas
  return (
    <Stack>
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen name="mi-armario" options={{ headerShown: false }} />
      <Stack.Screen name="agregar-prenda" options={{ headerShown: false }} />
    </Stack>
  );
}
