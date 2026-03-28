import type { Metadata } from "next";
import { Suspense } from "react";
import TrackingClient from "./TrackingClient";

export const metadata: Metadata = {
  title: "Rastrear Pedido | Jerseys Raw",
  description: "Rastrea tu pedido en tiempo real. Sigue tu jersey desde origen hasta tu puerta.",
  alternates: { canonical: "https://jerseysraw.com/tracking" },
};

export default function TrackingPage() {
  return (
    <Suspense>
      <TrackingClient />
    </Suspense>
  );
}
