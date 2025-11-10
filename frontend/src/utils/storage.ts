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
    const token = await storage.getItem("token");
    return token || null;
  } catch {
    return null;
  }
}

export async function removeToken(): Promise<void> {
  try {
    await storage.removeItem("token");
  } catch (error) {
    console.error("Error al eliminar el token:", error);
  }
}
