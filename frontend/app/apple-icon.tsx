import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0a0a0a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#ffffff', letterSpacing: '-1px', fontFamily: 'sans-serif', lineHeight: 1 }}>
            JR
          </div>
          <div style={{ width: 40, height: 4, background: '#F8C37C', borderRadius: 2 }} />
        </div>
      </div>
    ),
    { ...size }
  );
}
