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
    // Soporte multiplataforma: usar Buffer en lugar de atob()
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
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
   let token = await storage.getItem("authToken");
   let userName = await storage.getItem("userName");
   let userId = await storage.getItem("userId");

  // 🕒 Verificar si el token ya expiró
  if (token) {
    const decoded = decodeJWT(token);
    if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
      console.warn("Token expirado, cerrando sesión automáticamente");
      await storage.removeItem("authToken");
      await storage.removeItem("userName");
      await storage.removeItem("userId");
      token = null;
      userName = null;
      userId = null;
    }
  }


// 🔍 Si no hay token en AsyncStorage/localStorage, intenta sessionStorage
// 🔍 Si estamos en web y no hay token, intenta sessionStorage
if (Platform.OS === "web" && !token) {
  try {
    token = sessionStorage.getItem("authToken");
    userName = sessionStorage.getItem("userName");
    userId = sessionStorage.getItem("userId");
  } catch (err) {
    console.warn("No se pudo acceder a sessionStorage:", err);
  }
}


    setAuth({ token, userName, userId });
    setLoading(false);
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
    if (Platform.OS === "web") {
      // Guardar según preferencia en la web
      const storageMethod = rememberMe ? localStorage : sessionStorage;
      storageMethod.setItem("authToken", token);
      if (userName) storageMethod.setItem("userName", userName);
      if (userId) storageMethod.setItem("userId", userId);
    } else {
      // En móvil usa AsyncStorage
      await storage.setItem("authToken", token);
      if (userName) await storage.setItem("userName", userName);
      if (userId) await storage.setItem("userId", userId);
    }

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

    router.replace("/home");
  } catch (err) {
    console.error("Error al guardar sesión:", err);
  }
};


  // 🚪 Cierra sesión completamente
  const logout = async () => {
    if (auth.userId) {
      await logEvent({
        event: "UserLogout",
        message: "Usuario cerró sesión desde el cliente",
        userId: auth.userId,
      });
    }

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
