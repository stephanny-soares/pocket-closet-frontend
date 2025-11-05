
import React, { useEffect, useState } from "react";
import { Slot, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { storage } from "../../src/utils/storage";

export default function ProtectedLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const verifyToken = async () => {
      const token = await storage.getItem("authToken");
      setIsAuthenticated(!!token);
    };
    verifyToken();
  }, []);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Slot />;
}
