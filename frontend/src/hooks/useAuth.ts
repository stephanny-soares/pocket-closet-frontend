// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { storage } from "../utils/storage";

interface AuthState {
  token: string | null;
  userName: string | null;
  userId: string | null;
}

export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    userName: null,
    userId: null,
  });

  const [loading, setLoading] = useState(true);

  // 🔍 Verifica si existe un token en storage
  const loadSession = useCallback(async () => {
    const token = await storage.getItem("authToken");
    const userName = await storage.getItem("userName");
    const userId = await storage.getItem("userId");

    setAuth({ token, userName, userId });
    setLoading(false);
  }, []);

  // 🚀 Llama a loadSession al montar el hook
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ✅ Inicia sesión guardando los datos en storage
  const login = async (token: string, userName?: string, userId?: string) => {
    await storage.setItem("authToken", token);
    if (userName) await storage.setItem("userName", userName);
    if (userId) await storage.setItem("userId", userId);

    setAuth({ token, userName: userName || null, userId: userId || null });
    router.replace("/home");
  };

  // 🚪 Cierra sesión completamente
  const logout = async () => {
    await storage.removeItem("authToken");
    await storage.removeItem("userName");
    await storage.removeItem("userId");
    setAuth({ token: null, userName: null, userId: null });
    router.replace("/login");
  };

  // 🧾 Devuelve si el usuario está autenticado
  const isAuthenticated = !!auth.token;

  return {
    auth,
    loading,
    isAuthenticated,
    login,
    logout,
    reload: loadSession,
  };
}
