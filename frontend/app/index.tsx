import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { storage } from "../src/utils/storage";

export default function Index() {
  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getItem("authToken");
      setAuthenticated(!!token);
      setReady(true);
    };
    checkAuth();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4B0082" />
      </View>
    );
  }

  return <Redirect href={authenticated ? "/home" : "/login"} />;
}
