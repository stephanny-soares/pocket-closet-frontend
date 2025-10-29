// ===============================
// helpers.ts — utilidades comunes de logging
// ===============================

// Genera un UUID v4 simple (para requestId / correlationId)
export const uuidv4 = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

// Enmascara email antes de registrar (cumple GDPR/LGPD)
export const maskEmail = (email: string = ''): string => {
  const [user, domain] = String(email).split('@');
  if (!domain) return '***';
  const head = user?.slice(0, 2) ?? '';
  return `${head}***@${domain}`;
};

// Determina entorno (para limitar logs de debug)
export const getEnv = (): string =>
  process.env.EXPO_PUBLIC_ENV || process.env.NODE_ENV || 'development';
