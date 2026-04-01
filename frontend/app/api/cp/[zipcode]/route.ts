import { NextResponse } from 'next/server';

export async function GET(
    _req: Request,
    { params }: { params: { zipcode: string } }
) {
    const { zipcode } = params;
    if (!/^\d{5}$/.test(zipcode)) {
        return NextResponse.json({ zip_codes: [] });
    }
    try {
        const res = await fetch(
            `https://sepomex.icalialabs.com/api/v1/zip_codes?zip_code=${zipcode}`,
            { next: { revalidate: 86400 } } // cache 24h — los CPs no cambian
        );
        const data = await res.json();
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ zip_codes: [] });
    }
}
