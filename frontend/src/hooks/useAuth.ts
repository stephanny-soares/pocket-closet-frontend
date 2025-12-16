// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";

import { storage } from "../utils/storage";
import { logEvent } from "../logger/logEvent";

/* ────────────────────────────────── */
/* Types */
/* ────────────────────────────────── */
interface AuthState {
  token: string | null;
  userName: string | null;
  userId: string | null;
}

interface DecodedJWT {
  exp?: number;
}

/* ────────────────────────────────── */
/* Utils */
/* ────────────────────────────────── */

// Decodifica JWT sin dependencias (web + native)
function decodeJWT(token: string): DecodedJWT | null {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");

    const decoded =
      typeof atob !== "undefined"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Limpia storage completamente
async function clearSessionStorage() {
  try {
    if (Platform.OS === "web") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("userId");
    }

    await storage.removeItem("authToken");
    await storage.removeItem("userName");
    await storage.removeItem("userId");
  } catch {
    // silencioso
  }
}

// Carga sesión desde storage
async function loadStoredSession(): Promise<AuthState> {
  let token = await storage.getItem("authToken");
  let userName = await storage.getItem("userName");
  let userId = await storage.getItem("userId");

  // Fallback web
  if (Platform.OS === "web" && !token) {
    token =
      sessionStorage.getItem("authToken") ||
      localStorage.getItem("authToken");

    userName =
      sessionStorage.getItem("userName") ||
      localStorage.getItem("userName");

    userId =
      sessionStorage.getItem("userId") ||
      localStorage.getItem("userId");
  }

  // Verificar expiración
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      await clearSessionStorage();
      return { token: null, userName: null, userId: null };
    }
  }

  return { token, userName, userId };
}

/* ────────────────────────────────── */
/* Hook */
/* ────────────────────────────────── */
export function useAuth() {
  const [auth, setAuth] = useState<AuthState>({
    token: null,
    userName: null,
    userId: null,
  });

  const [loading, setLoading] = useState(true);

  /* ──────────────────────────────── */
  /* Load session */
  /* ──────────────────────────────── */
  const loadSession = useCallback(async () => {
    try {
      const session = await loadStoredSession();
      setAuth(session);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  /* ──────────────────────────────── */
  /* Login */
  /* ──────────────────────────────── */
  const login = async (
    token: string,
    userName?: string,
    userId?: string,
    rememberMe: boolean = false
  ) => {
    try {
      // Web: session / local
      if (Platform.OS === "web") {
        const storageTarget = rememberMe
          ? localStorage
          : sessionStorage;

        storageTarget.setItem("authToken", token);
        if (userName) storageTarget.setItem("userName", userName);
        if (userId) storageTarget.setItem("userId", userId);
      }

      // Siempre guardar en storage unificado
      await storage.setItem("authToken", token);
      if (userName) await storage.setItem("userName", userName);
      if (userId) await storage.setItem("userId", userId);

      setAuth({
        token,
        userName: userName ?? null,
        userId: userId ?? null,
      });

      // Expiración automática
      const decoded = decodeJWT(token);
      if (decoded?.exp) {
        const ms = decoded.exp * 1000 - Date.now();
        if (ms > 0) {
          setTimeout(async () => {
            await logEvent({
              event: "TokenExpired",
              message: "JWT expirado automáticamente",
              userId,
            });
            await logout();
          }, ms);
        }
      }

      router.replace("/(protected)/home");
    } catch {
      // silencioso
    }
  };

  /* ──────────────────────────────── */
  /* Logout */
  /* ──────────────────────────────── */
  const logout = async () => {
    await clearSessionStorage();
    setAuth({ token: null, userName: null, userId: null });
    router.replace("/(auth)/login");
  };

  /* ──────────────────────────────── */
  /* API pública */
  /* ──────────────────────────────── */
  return {
    auth,
    loading,
    isAuthenticated: !!auth.token,
    login,
    logout,
    reload: loadSession,
  };
}
