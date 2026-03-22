import type { Metadata } from "next";
import TrackingClient from "./TrackingClient";

export const metadata: Metadata = {
  title: "Rastrear Pedido | Jerseys Raw",
  description:
    "Rastrea tu pedido en tiempo real. Sigue tu jersey desde origen hasta tu puerta.",
};

export default function TrackingPage() {
  return (
    <TrackingClient />
  );
}
