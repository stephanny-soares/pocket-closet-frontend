import { getToken, removeToken } from "./storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import Constants from "expo-constants";
import { Platform } from "react-native";

const fromEnv = process.env.EXPO_PUBLIC_API_URL || Constants.expoConfig?.extra?.apiUrl;
const LOCAL_URL = Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000";

export const API_BASE = (fromEnv || LOCAL_URL).replace(/\/+$/, "");

console.log("🔧 API_BASE configurado:", API_BASE);

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  
  console.log("🌐 [apiFetch] Iniciando petición:", {
    path,
    method: options.method || "GET",
    hasToken: !!token,
    tokenPreview: token ? token.substring(0, 20) + "..." : "NO_TOKEN"
  });

  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
    console.log("✅ [apiFetch] Header Authorization añadido");
  } else {
    console.warn("⚠️ [apiFetch] NO SE ENCONTRÓ TOKEN - La petición fallará");
  }

  // ✅ Solo aplicar Content-Type si no es FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  console.log("🔗 [apiFetch] URL completa:", url);

  try {
    const safeOptions: RequestInit = {
      ...options,
      headers,
      body: options.body as any,
    };

    const response = await fetch(url, safeOptions);
    
    console.log("📡 [apiFetch] Respuesta recibida:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (response.status === 401) {
      console.error("🚫 [apiFetch] Error 401 - Token inválido o expirado");
      
      await removeToken();
      
      Toast.show({
        type: "error",
        text1: "Sesión expirada",
        text2: "Por favor, inicia sesión nuevamente.",
        position: "bottom",
        visibilityTime: 3000,
        bottomOffset: 70,
      });
      
      // Usar setTimeout para evitar problemas de navegación
      setTimeout(() => {
        router.replace("/(auth)/login?expired=true");
      }, 100);
      
      throw new Error("Sesión expirada");
    }

    return response;
  } catch (error: any) {
    console.error("❌ [apiFetch] Error en petición:", {
      message: error.message,
      url,
      path
    });
    
    // No mostrar alert si es error 401 (ya mostramos Toast)
    if (!error.message?.includes("Sesión expirada")) {
      Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
    }
    
    throw error;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const text = await response.text();
  
  try {
    const parsed = text ? JSON.parse(text) : ({} as T);
    console.log("✅ [apiRequest] Respuesta parseada correctamente");
    return parsed;
  } catch (error) {
    console.warn("⚠️ [apiRequest] Error parseando JSON, retornando objeto vacío");
    return {} as T;
  }
}