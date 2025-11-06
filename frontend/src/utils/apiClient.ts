// =============================================
// apiClient.ts — Middleware global de autenticación y manejo de errores
// =============================================

import { storage } from "./storage";
import { logEvent } from "../logger/logEvent";
import Toast from "react-native-toast-message";
import { Platform } from "react-native";

declare const window: any;
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");

// =============================================
// Helper para recuperar token de forma segura
// =============================================
async function getToken(): Promise<string | null> {
  try {
    let token = await storage.getItem("authToken");
    if (Platform.OS === "web" && !token) {
      token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
    }
    return token;
  } catch {
    return null;
  }
}

// =============================================
// Cliente principal — con manejo de errores global
// =============================================
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  logContext?: Record<string, any>
): Promise<Response> {
  const token = await getToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (networkError: any) {
    Toast.show({
      type: "error",
      text1: "Error de conexión",
      text2: "No se pudo conectar con el servidor. Verifica tu red.",
    });

    await logEvent({
      level: "error",
      event: "NetworkError",
      message: networkError?.message || "Error de conexión",
      extra: { path, ...logContext },
    });
    throw networkError;
  }

  // 🔒 401 — Token expirado o inválido
  if (response.status === 401) {
    await storage.clear();
    await logEvent({
      level: "warn",
      event: "SessionExpired",
      message: "Token expirado o inválido. Se forzó cierre de sesión.",
      extra: { path, ...logContext },
    });

    if (Platform.OS === "web") {
      window.location.href = "/(auth)/login?expired=true";
    } else {
      Toast.show({
        type: "info",
        text1: "Tu sesión ha expirado",
        text2: "Por favor inicia sesión nuevamente.",
      });
    }
    throw new Error("401 Unauthorized");
  }

  // 🚫 403 — Sin permisos
  if (response.status === 403) {
    Toast.show({
      type: "error",
      text1: "Acceso denegado",
      text2: "No tienes permisos para realizar esta acción.",
    });
    await logEvent({
      level: "warn",
      event: "ForbiddenAccess",
      message: "Intento de acceso no autorizado (403)",
      extra: { path, ...logContext },
    });
  }

  // ❌ 404 — Recurso no encontrado
  if (response.status === 404) {
    Toast.show({
      type: "error",
      text1: "No encontrado",
      text2: "El recurso solicitado no existe o fue movido.",
    });
  }

  // 💥 5xx — Errores del servidor
  if (response.status >= 500) {
    Toast.show({
      type: "error",
      text1: "Error del servidor",
      text2: "Ocurrió un error interno. Intenta más tarde.",
    });
    await logEvent({
      level: "error",
      event: "ServerError",
      message: `Error ${response.status} en ${path}`,
      extra: { path, ...logContext },
    });
  }

  return response;
}

// =============================================
// Helper JSON simplificado
// =============================================
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {},
  logContext?: Record<string, any>
): Promise<T> {
  const response = await apiFetch(path, options, logContext);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;

  }

  throw new Error(`Respuesta inesperada (${response.status})`);
}
