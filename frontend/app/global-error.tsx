'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, background: '#0D0D0D', color: '#F2F2F2', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '1.5rem' }}>
          <p style={{ color: '#F8C37C', fontSize: '0.75rem', letterSpacing: '0.4em', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '1rem' }}>
            Error crítico
          </p>
          <h1 style={{ fontSize: '6rem', lineHeight: 1, fontWeight: 'bold', marginBottom: '0.5rem' }}>
            500
          </h1>
          <p style={{ color: '#A0A0A0', fontSize: '1.125rem', marginBottom: '2.5rem', maxWidth: '28rem' }}>
            La aplicación encontró un error crítico. Por favor recarga la página.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              onClick={reset}
              style={{ padding: '0.75rem 2rem', background: '#F8C37C', color: '#0D0D0D', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.875rem', border: 'none', cursor: 'pointer' }}
            >
              Recargar
            </button>
            <a
              href="/"
              style={{ padding: '0.75rem 2rem', border: '1px solid #F8C37C', color: '#F8C37C', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
