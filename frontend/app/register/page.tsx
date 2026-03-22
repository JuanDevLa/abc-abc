import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Crear Cuenta",
  description: "Crea tu cuenta en Jerseys Raw para rastrear tus pedidos y más.",
};

export default function RegisterPage() {
  return <RegisterClient />;
}
