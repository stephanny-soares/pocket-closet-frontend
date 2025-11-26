// frontend/src/utils/apiClient.ts

import { getToken } from "../utils/storage";  
// ⬆️ Ajusta la ruta si fuera necesario (por ejemplo: "../../utils/storage")

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.0.101:5000";

/**
 * Wrapper para fetch sin romper compatibilidad
 */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url =
    path.startsWith("http://") || path.startsWith("https://")
      ? path
      : `${API_BASE_URL}${path}`;

  const token = await getToken(); // ⬅️ USAMOS TU TOKEN REAL

  const headers: HeadersInit =
    options.headers instanceof Headers
      ? options.headers
      : new Headers(options.headers || {});

  // Añadir token si existe
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const finalOptions: RequestInit = {
    ...options,
    headers,
  };

  console.log("[apiFetch] Iniciando petición:", {
    path,
    method: finalOptions.method || "GET",
    hasToken: !!token,
  });

  const response = await fetch(url, finalOptions);

  console.log("[apiFetch] Respuesta recibida:", {
    status: response.status,
    ok: response.ok,
  });

  return response;
}

/**
 * Envoltura que convierte automáticamente JSON,
 * maneja errores, y soporta FormData.
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { isFormData?: boolean } = {}
): Promise<T> {
  const { isFormData, ...rest } = options;

  const headers: HeadersInit =
    rest.headers instanceof Headers
      ? rest.headers
      : new Headers(rest.headers || {});

  // Solo añadir Content-Type si NO es FormData
  if (!isFormData && rest.body && !(rest.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const response = await apiFetch(path, {
    ...rest,
    headers,
  });

  const text = await response.text();
  let data: any = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Error ${response.status} ${response.statusText}`;

    throw new Error(message);
  }

  return data as T;
}
