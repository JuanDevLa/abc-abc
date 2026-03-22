import { Router, Request, Response } from 'express';

const router = Router();

const TRACK17_BASE = 'https://api.17track.net/track/v2.2';

interface Track17Event {
  time_iso: string;
  description: string;
  location?: string;
}

interface Track17Provider {
  provider?: { name?: string };
  events?: Track17Event[];
}

interface Track17Info {
  latest_status?: { status?: string; sub_status?: string };
  tracking?: { providers?: Track17Provider[] };
  time_metrics?: {
    estimated_delivery_date?: { from?: string; to?: string };
  };
}

// POST /api/v1/tracking
router.post('/tracking', async (req: Request, res: Response) => {
  const { trackingNumber } = req.body as { trackingNumber?: string };

  if (!trackingNumber?.trim()) {
    return res.status(400).json({ error: 'Se requiere un número de guía.' });
  }

  const apiKey = process.env.TRACK17_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Servicio de rastreo no configurado.' });
  }

  const number = trackingNumber.trim().toUpperCase();
  const headers = {
    '17token': apiKey,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Register (ignorar errores — puede que ya esté registrado)
    await fetch(`${TRACK17_BASE}/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ number }]),
    }).catch(() => {});

    // 2. Get track info
    const response = await fetch(`${TRACK17_BASE}/gettrackinfo`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ number }]),
    });

    if (!response.ok) {
      throw new Error(`17track responded with ${response.status}`);
    }

    const json = await response.json();

    const accepted = json?.data?.accepted as Array<{
      number: string;
      param?: { tracking_type?: string };
      track_info?: Track17Info;
    }>;

    const rejected = json?.data?.rejected as Array<{ number: string; error?: { code?: number; message?: string } }>;

    if (!accepted?.length) {
      const rejectedReason = rejected?.[0]?.error?.message ?? 'Número de guía no encontrado o no reconocido por el transportista.';
      return res.status(404).json({ error: rejectedReason });
    }

    const item = accepted[0];
    const info: Track17Info = item.track_info ?? {};
    const provider = info.tracking?.providers?.[0];
    const events: Track17Event[] = provider?.events ?? [];

    return res.json({
      trackingNumber: number,
      carrier: provider?.provider?.name ?? 'Paquetería',
      status: info.latest_status?.status ?? 'InfoReceived',
      subStatus: info.latest_status?.sub_status ?? '',
      estimatedDelivery: info.time_metrics?.estimated_delivery_date?.from ?? null,
      events: events.map((e) => ({
        time: e.time_iso,
        description: e.description,
        location: e.location ?? '',
      })),
    });
  } catch (err) {
    console.error('[TRACKING]', err);
    return res.status(500).json({ error: 'No se pudo obtener la información de rastreo.' });
  }
});

export default router;
