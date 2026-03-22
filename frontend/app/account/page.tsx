import type { Metadata } from "next";
import AccountClient from "./AccountClient";

export const metadata: Metadata = {
  title: "Mi Cuenta",
  description: "Gestiona tu cuenta y revisa tu historial de pedidos en Jerseys Raw.",
};

export default function AccountPage() {
  return <AccountClient />;
}
