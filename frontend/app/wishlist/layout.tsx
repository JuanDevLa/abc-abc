import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lista de Deseos | Jerseys Raw",
  description: "Tus jerseys guardados. Revisa tu lista de deseos y completa tu compra.",
  alternates: { canonical: "https://jerseysraw.com/wishlist" },
  robots: { index: false, follow: false },
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
