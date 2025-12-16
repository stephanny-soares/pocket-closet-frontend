// src/utils/storage.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

/* ────────────────────────────────── */
/* Utils */
/* ────────────────────────────────── */

const isWeb = Platform.OS === "web";

/* ────────────────────────────────── */
/* Storage base */
/* ────────────────────────────────── */

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch {
      // silencioso
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb) {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb) {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch {
      // silencioso
    }
  },

  async clear(): Promise<void> {
    try {
      if (isWeb) {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch {
      // silencioso
    }
  },
};

/* ────────────────────────────────── */
/* Auth helpers */
/* ────────────────────────────────── */

const AUTH_TOKEN_KEY = "authToken";

/**
 * Obtiene el token JWT (web / móvil)
 */
export async function getToken(): Promise<string | null> {
  try {
    // Web: sessionStorage → localStorage
    if (isWeb) {
      return (
        sessionStorage.getItem(AUTH_TOKEN_KEY) ||
        localStorage.getItem(AUTH_TOKEN_KEY)
      );
    }

    // Native
    return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Elimina completamente el token
 */
export async function removeToken(): Promise<void> {
  try {
    if (isWeb) {
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }

    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // silencioso
  }
}
