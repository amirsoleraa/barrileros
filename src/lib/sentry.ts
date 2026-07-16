import * as Sentry from '@sentry/react';

/** Monitoreo de errores en producción — opcional, sin VITE_SENTRY_DSN la app funciona igual. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
  });
}
