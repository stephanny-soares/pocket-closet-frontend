// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { router } from "expo-router";
import { storage } from "../utils/storage";
import { logEvent } from "../logger/logEvent";
import { Platform } from "react-native";

// 🧩 Decodificar JWT sin dependencias (compatible web/móvil)
function decodeJWT(token: string): { exp?: number } | null {
  try {
    const [, payloadBase64] = token.split(".");
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");

    // ✅ Compatibilidad multiplataforma
    const decodedString =
      typeof atob !== "undefined"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");

    return JSON.parse(decodedString);
  } catch (err) {
    console.error("Error decodificando JWT:", err);
    return null;
  }
}

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
    try {
      let token: string | null = null;
      let userName: string | null = null;
      let userId: string | null = null;

      // 🔹 Primero intenta obtener del storage principal (AsyncStorage o localStorage)
      token = await storage.getItem("authToken");
      userName = await storage.getItem("userName");
      userId = await storage.getItem("userId");

      // 🔹 Si estamos en web y no hay token, intentar recuperar de sessionStorage
      if (Platform.OS === "web" && !token) {
        try {
          token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
          userName = sessionStorage.getItem("userName") || localStorage.getItem("userName");
          userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");
        } catch (err) {
          console.warn("No se pudo acceder a sessionStorage:", err);
        }
      }

      // 🕒 Verificar si el token ya expiró
      if (token) {
        const decoded = decodeJWT(token);
        if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
          console.warn("Token expirado, cerrando sesión automáticamente");
          
          // Limpiar completamente
          await storage.removeItem("authToken");
          await storage.removeItem("userName");
          await storage.removeItem("userId");
          
          if (Platform.OS === "web") {
            try {
              sessionStorage.removeItem("authToken");
              sessionStorage.removeItem("userName");
              sessionStorage.removeItem("userId");
              localStorage.removeItem("authToken");
              localStorage.removeItem("userName");
              localStorage.removeItem("userId");
            } catch {}
          }
          
          token = null;
          userName = null;
          userId = null;
        }
      }

      console.log("📱 [loadSession] Token encontrado:", !!token);
      setAuth({ token, userName, userId });
    } catch (error) {
      console.error("Error en loadSession:", error);
      setAuth({ token: null, userName: null, userId: null });
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚀 Llama a loadSession al montar el hook
  useEffect(() => {
    loadSession();
  }, [loadSession]);

  // ✅ Inicia sesión guardando los datos en storage
  const login = async (
    token: string,
    userName?: string,
    userId?: string,
    rememberMe: boolean = false
  ) => {
    try {
      console.log("🔐 [login] Guardando token...", { platform: Platform.OS, rememberMe });

      if (Platform.OS === "web") {
        // Guardar según preferencia en la web
        const storageMethod = rememberMe ? localStorage : sessionStorage;
        storageMethod.setItem("authToken", token);
        if (userName) storageMethod.setItem("userName", userName);
        if (userId) storageMethod.setItem("userId", userId);
      }
      
      // 🔹 SIEMPRE guardar en AsyncStorage/localStorage (para compatibilidad)
      await storage.setItem("authToken", token);
      if (userName) await storage.setItem("userName", userName);
      if (userId) await storage.setItem("userId", userId);

      setAuth({ token, userName: userName || null, userId: userId || null });

      // ⏳ Programar cierre automático según exp del JWT
      const decoded = decodeJWT(token);
      if (decoded?.exp) {
        const expiresInMs = decoded.exp * 1000 - Date.now();
        if (expiresInMs > 0) {
          setTimeout(async () => {
            await logEvent({
              level: "info",
              event: "TokenExpired",
              message: "El token JWT expiró automáticamente",
              userId,
            });
            await logout();
          }, expiresInMs);
        }
      }

      console.log("✅ [login] Token guardado correctamente");
      router.replace("/(protected)/home");
    } catch (err) {
      console.error("❌ Error al guardar sesión:", err);
    }
  };

  // 🚪 Cierra sesión completamente
  const logout = async () => {
    console.log("🚪 [logout] Cerrando sesión...");
    
    // Desactivado porque el endpoint de logs no existe y rompe el flujo de logout
    // if (auth.userId) {
    //   logEvent({
    //     event: "UserLogout",
    //     message: "Usuario cerró sesión desde el cliente",
    //     userId: auth.userId,
    //   });
    // }


    // 🔒 Limpiar storage en web y móvil
    try {
      if (Platform.OS === "web") {
        // Eliminar de ambos: localStorage y sessionStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("userName");
        localStorage.removeItem("userId");
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("userName");
        sessionStorage.removeItem("userId");
      }

      // Limpieza también en AsyncStorage
      await storage.removeItem("authToken");
      await storage.removeItem("userName");
      await storage.removeItem("userId");
    } catch (err) {
      console.warn("Error limpiando almacenamiento durante logout:", err);
    }

    // Resetear estado en memoria
    setAuth({ token: null, userName: null, userId: null });

    // Redirigir siempre al login (grupo auth)
    router.replace("/(auth)/login");
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