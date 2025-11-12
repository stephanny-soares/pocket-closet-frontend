import { getToken, removeToken } from "./storage";
import { router } from "expo-router";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

export const API_BASE =
  (process.env.EXPO_PUBLIC_API_URL as string) ||
  (process.env.EXPO_PUBLIC_API_BASE_URL as string) ||
  "http://localhost:5000";


export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  // ✅ Solo aplicar Content-Type si no es FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  try {
    // ✅ Ajuste tipado seguro: evita error “FormData not assignable to BodyInit”
    const safeOptions: RequestInit = {
      ...options,
      headers,
      body: options.body as any, // 👈 aquí el cambio real
    };

    const response = await fetch(url, safeOptions);

    if (response.status === 401) {
      await removeToken();
      Toast.show({
        type: "error",
        text1: "Sesión expirada",
        text2: "Por favor, inicia sesión nuevamente.",
      });
      router.replace("/(auth)/login");
      throw new Error("Sesión expirada");
    }

    return response;
  } catch (error: any) {
    console.error("Error en apiFetch:", error);
    Alert.alert("Error de conexión", "No se pudo conectar con el servidor.");
    throw error;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await apiFetch(path, options);
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : ({} as T);
  } catch {
    return {} as T;
  }
}
