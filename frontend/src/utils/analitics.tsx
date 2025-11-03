// utils/analytics.ts
// Archivo temporal hasta que se implemente analytics real

export const logEvent = (eventName: string, params?: Record<string, any>) => {
  console.log(`[Analytics] ${eventName}`, params || {});
};
