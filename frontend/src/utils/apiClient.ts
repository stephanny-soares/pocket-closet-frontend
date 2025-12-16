// src/utils/apiClient.ts
import Constants from "expo-constants";
import { Platform } from "react-native";
import { getToken } from "./storage";

/* ────────────────────────────────── */
/* API BASE */
/* ────────────────────────────────── */

// 1️⃣ Prioridad:
// - EXPO_PUBLIC_API_URL
// - extra.apiUrl (expo config)
// - fallback local
const fromEnv =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl;

const LOCAL_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:5000"
    : "http://localhost:5000";

export const API_BASE = (fromEnv || LOCAL_URL).replace(/\/+$/, "");

/* ────────────────────────────────── */
/* Helpers */
/* ────────────────────────────────── */

// Construye la URL final
function buildUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `${API_BASE}${path}`;
}

// Construye headers automáticamente
async function buildHeaders(
  options: RequestInit,
  isFormData?: boolean
): Promise<Headers> {
  const headers =
    options.headers instanceof Headers
      ? options.headers
      : new Headers(options.headers || {});

  // Content-Type solo si NO es FormData
  if (!isFormData && options.body && !(options.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  const token = await getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

// Parseo seguro de respuesta
async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/* ────────────────────────────────── */
/* Fetch base */
/* ────────────────────────────────── */
export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = buildUrl(path);
  const response = await fetch(url, options);
  return response;
}

/* ────────────────────────────────── */
/* API principal */
/* ────────────────────────────────── */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit & { isFormData?: boolean } = {}
): Promise<T> {
  const { isFormData, ...fetchOptions } = options;

  const headers = await buildHeaders(fetchOptions, isFormData);

  const response = await apiFetch(path, {
    ...fetchOptions,
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    const message =
      (data && (data.message || data.error)) ||
      `Error ${response.status}`;

    throw new Error(message);
  }

  return data as T;
}
