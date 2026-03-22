export const SHIPPING = {
  STANDARD_CENTS: 9900,          // $99 MXN
  EXPRESS_CENTS: 19900,          // $199 MXN
  FREE_SHIPPING_MIN_CENTS: 99900, // $999 MXN — envío gratis si subtotal >= esto
} as const;
