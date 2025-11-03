// ===============================
// logEvent.ts — Envío de eventos al backend (PocketCloset Logging Spec)
// ===============================

import { logger } from './logger';
import { uuidv4 } from './helpers';

// Tipado del evento de log
interface LogEventInput {
  level?: 'debug' | 'info' | 'warn' | 'error';
  event: string;
  message: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  extra?: Record<string, unknown>;
}

// URL base
const API_BASE = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api').replace(/\/+$/, '');
const LOG_ENDPOINT = `${API_BASE}/v1/logs`;

// ===============================
//  Función principal
// ===============================
export const logEvent = async ({
  level = 'info',
  event,
  message,
  userId,
  requestId,
  correlationId,
  extra = {},
}: LogEventInput): Promise<void> => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    userId: userId ?? undefined, // ✅ null -> undefined
    requestId: requestId || uuidv4(),
    correlationId: correlationId || uuidv4(),
    message,
    ...extra,
  };

  // Log local
  logger.debug('[LOG-EVENT]', payload);

  try {
    await fetch(LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err: any) {
    logger.warn('⚠️ Error enviando log al backend:', err?.message);
  }
};
