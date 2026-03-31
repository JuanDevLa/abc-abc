// 1. IMPORTAR LOS ESTILOS
import "../styles/globals.css";
import type { Metadata } from "next";
import CartSidebar from "@/components/CartSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RouteThemeForcer } from "@/components/RouteThemeForcer";
import { AuthProvider } from "@/contexts/AuthContext";

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
  },
  twitter: {
    card: "summary_large_image",
    site: "@jerseysraw",
    title: "Jerseys Raw — Official Gear",
    description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// 2. ESTRUCTURA BÁSICA (HTML y BODY)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://jerseysraw.com/#organization",
        "name": "Jerseys Raw",
        "url": "https://jerseysraw.com",
        "logo": "https://jerseysraw.com/favicon.png",
        "sameAs": ["https://www.instagram.com/JERSEYS_RAW"],
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+52-965-138-6865",
          "contactType": "customer service",
          "areaServed": "MX",
          "availableLanguage": "Spanish",
        },
      },
      {
        "@type": "WebSite",
        "@id": "https://jerseysraw.com/#website",
        "url": "https://jerseysraw.com",
        "name": "Jerseys Raw",
        "publisher": { "@id": "https://jerseysraw.com/#organization" },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://jerseysraw.com/catalog?search={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="es-MX" suppressHydrationWarning>
      <head>
        {/* Setea data-theme antes del primer paint: "/" → dark, lo demás → light */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){document.documentElement.setAttribute('data-theme',location.pathname==='/'?'dark':'light')})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans bg-theme-bg text-th-primary transition-colors duration-300">
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