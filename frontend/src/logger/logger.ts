// =========================================
// logger.ts — versión corregida
// =========================================
import { getEnv } from './helpers';

const ENV = getEnv();

// Define niveles activos por entorno
const LEVELS: Record<string, string[]> = {
  development: ['debug', 'info', 'warn', 'error'],
  staging: ['info', 'warn', 'error'],
  production: ['info', 'warn', 'error'],
};

// Mapa explícito de métodos válidos de consola
const consoleMethods: Record<'debug' | 'info' | 'warn' | 'error', (...args: any[]) => void> = {
  debug: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// =========================================
//  Logger local tipado y sin errores
// =========================================
export const logger = {
  log(level: 'debug' | 'info' | 'warn' | 'error', ...args: unknown[]): void {
    if (LEVELS[ENV]?.includes(level)) {
      const ts = new Date().toISOString();
      consoleMethods[level](`[${ts}] [${level.toUpperCase()}]`, ...args);
    }
  },
  info: (...args: unknown[]) => logger.log('info', ...args),
  warn: (...args: unknown[]) => logger.log('warn', ...args),
  error: (...args: unknown[]) => logger.log('error', ...args),
  debug: (...args: unknown[]) => logger.log('debug', ...args),
};
