import AsyncStorage from "@react-native-async-storage/async-storage";

const isWeb = typeof window !== "undefined";

export const storage = {
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error guardando ${key}:`, error);
    }
  },

  async getItem(key: string): Promise<string | null> {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error obteniendo ${key}:`, error);
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error eliminando ${key}:`, error);
    }
  },

  async clear(): Promise<void> {
    try {
      if (isWeb && typeof localStorage !== "undefined") {
        localStorage.clear();
      } else {
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error("Error limpiando almacenamiento:", error);
    }
  },
};

// -------------------------------------------------------------
// 🧩 Helpers específicos para el token de autenticación
// -------------------------------------------------------------

export async function getToken(): Promise<string | null> {
  try {
    // 🔹 En web, primero intenta sessionStorage, luego localStorage
    if (typeof window !== "undefined") {
      const ss = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("authToken") : null;
      if (ss) {
        console.log("🔑 [getToken] Token encontrado en sessionStorage:", ss.substring(0, 20) + "...");
        return ss;
      }
      
      const ls = typeof localStorage !== "undefined" ? localStorage.getItem("authToken") : null;
      if (ls) {
        console.log("🔑 [getToken] Token encontrado en localStorage:", ls.substring(0, 20) + "...");
        return ls;
      }
    }

    // 🔹 En móvil/nativo, usa AsyncStorage (solo clave "authToken")
    const token = await AsyncStorage.getItem("authToken");
    
    if (token) {
      console.log("🔑 [getToken] Token encontrado en AsyncStorage:", token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ [getToken] No se encontró token en AsyncStorage");
    }
    
    return token;
  } catch (error) {
    console.error("❌ [getToken] Error obteniendo token:", error);
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (typeof window !== "undefined") {
      try { sessionStorage.removeItem("authToken"); } catch {}
      try { localStorage.removeItem("authToken"); } catch {}
      console.log("🗑️ [removeToken] Token eliminado de web storage");
      return;
    }

    await AsyncStorage.removeItem("authToken");
    console.log("🗑️ [removeToken] Token eliminado de AsyncStorage");
  } catch (error) {
    console.error("❌ Error al eliminar el token:", error);
  }
}