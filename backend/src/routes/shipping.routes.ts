import { Router, Request, Response } from 'express';
import { SHIPPING } from '../config/shipping.js';

const router = Router();

router.get('/shipping/options', (req: Request, res: Response) => {
    const subtotalCents = parseInt(req.query.subtotalCents as string, 10) || 0;
    const hasDropshipItems = req.query.hasDropshipItems === 'true';

    if (hasDropshipItems) {
        return res.json({
            options: [{
                method: 'DROPSHIP',
                label: 'Envío Gratuito (Internacional)',
                costCents: 0,
                isFree: true,
            }],
            freeShippingMinCents: SHIPPING.FREE_SHIPPING_MIN_CENTS,
        });
    }

    const standardFree = subtotalCents >= SHIPPING.FREE_SHIPPING_MIN_CENTS;

    return res.json({
        options: [
            {
                method: 'STANDARD',
                label: 'Envío Rápido (3-7 días)',
                costCents: standardFree ? 0 : SHIPPING.STANDARD_CENTS,
                isFree: standardFree,
            },
            {
                method: 'EXPRESS',
                label: 'Express DHL (1-3 días)',
                costCents: SHIPPING.EXPRESS_CENTS,
                isFree: false,
            },
        ],
        freeShippingMinCents: SHIPPING.FREE_SHIPPING_MIN_CENTS,
    });
});

export default router;
