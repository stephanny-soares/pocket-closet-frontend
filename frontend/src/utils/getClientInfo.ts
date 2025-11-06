// src/utils/getClientInfo.ts
export interface ClientInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
}

export async function getClientInfo(): Promise<ClientInfo> {
  try {
    const res = await fetch("https://ipapi.co/json");

    // 🔧 Tipar explícitamente el resultado
    const data: any = await res.json();

    return {
      ip: data.ip ?? "unknown",
      city: data.city ?? "unknown",
      region: data.region ?? "unknown",
      country: data.country_name ?? "unknown",
    };
  } catch (err) {
    return { ip: "unknown", city: "unknown", region: "unknown", country: "unknown" };
  }
}
