import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Jerseys Raw | Tienda Deportiva de Jerseys';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Accent line top */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: '#F8C37C' }} />

        {/* Logo text */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: '#ffffff', letterSpacing: '-2px', lineHeight: 1 }}>
            JERSEYS RAW
          </div>
          <div style={{ fontSize: 28, color: '#F8C37C', fontWeight: 700, letterSpacing: '6px', textTransform: 'uppercase' }}>
            Tienda Deportiva
          </div>
          <div style={{ fontSize: 20, color: '#888888', marginTop: 8, letterSpacing: '2px' }}>
            Premier League · La Liga · Champions League
          </div>
        </div>

        {/* Accent line bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: '#F8C37C' }} />
      </div>
    ),
    { ...size }
  );
}
