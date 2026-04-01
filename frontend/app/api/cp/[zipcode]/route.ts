import { NextResponse } from 'next/server';

export async function GET(
    _req: Request,
    { params }: { params: { zipcode: string } }
) {
    const { zipcode } = params;
    if (!/^\d{5}$/.test(zipcode)) {
        return NextResponse.json({ zip_codes: [] });
    }

    // Intento 1: icalialabs (datos SEPOMEX completos)
    try {
        const res = await fetch(
            `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zipcode}`,
            { next: { revalidate: 86400 } }
        );
        if (res.ok) {
            const data = await res.json();
            if (data.zip_codes?.length > 0) {
                return NextResponse.json(data);
            }
        }
    } catch { /* continúa al fallback */ }

    // Intento 2: zippopotam.us (fallback público, sin bloqueo de IPs de Vercel)
    try {
        const res = await fetch(
            `https://api.zippopotam.us/mx/${zipcode}`,
            { next: { revalidate: 86400 } }
        );
        if (!res.ok) return NextResponse.json({ zip_codes: [] });
        const d = await res.json();
        const place = d.places?.[0];
        if (!place) return NextResponse.json({ zip_codes: [] });
        return NextResponse.json({
            zip_codes: [{
                d_ciudad: place['place name'] ?? '',
                D_mnpio:  place['place name'] ?? '',
                d_estado: place['state']       ?? '',
            }],
        });
    } catch {
        return NextResponse.json({ zip_codes: [] });
    }
}
