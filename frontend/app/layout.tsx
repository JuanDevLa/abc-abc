// 1. IMPORTAR LOS ESTILOS
import "../styles/globals.css";
import type { Metadata } from "next";
import { Inter, Bebas_Neue, Jost } from "next/font/google";
import CartSidebar from "@/components/CartSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RouteThemeForcer } from "@/components/RouteThemeForcer";
import { AuthProvider } from "@/contexts/AuthContext";

// Fuentes
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-heading" });
const jost = Jost({ weight: ["800"], subsets: ["latin"], variable: "--font-jost" });

export const metadata: Metadata = {
  metadataBase: new URL("https://jerseysraw.com"),
  title: {
    default: "Jerseys Raw — Official Gear",
    template: "%s | Jerseys Raw",
  },
  description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más. Envíos a toda la República Mexicana.",
  keywords: ["jerseys de fútbol", "playeras de fútbol", "jerseys México", "jersey Barcelona", "jersey Real Madrid", "jersey Manchester", "jerseys raw"],
  authors: [{ name: "Jerseys Raw" }],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://jerseysraw.com",
    siteName: "Jerseys Raw",
    title: "Jerseys Raw — Official Gear",
    description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: "Jerseys Raw" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@jerseysraw",
    title: "Jerseys Raw — Official Gear",
    description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
};

// 2. ESTRUCTURA BÁSICA (HTML y BODY)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Setea data-theme antes del primer paint: "/" → dark, lo demás → light */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){document.documentElement.setAttribute('data-theme',location.pathname==='/'?'dark':'light')})()` }} />
      </head>
      <body className={`${inter.variable} ${bebasNeue.variable} ${jost.variable} font-sans bg-theme-bg text-th-primary transition-colors duration-300`}>
        <AuthProvider>
          <ThemeProvider>
            <RouteThemeForcer />
            {children}
            <CartSidebar />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}