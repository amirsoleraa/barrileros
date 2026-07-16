import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { initSentry } from '@/lib/sentry';
import './styles/globals.css';

initSentry();

function ErrorFallback() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, textAlign: 'center', fontFamily: 'inherit' }}>
      <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Algo salió mal</p>
      <p style={{ fontSize: 14, color: '#6B6460', marginBottom: 20 }}>Refresca la página para intentar de nuevo.</p>
      <button
        onClick={() => window.location.reload()}
        style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#F4521E', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Recargar
      </button>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>
);
