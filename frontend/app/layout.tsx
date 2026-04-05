// 1. IMPORTAR LOS ESTILOS
import "../styles/globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import CartSidebar from "@/components/CartSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { RouteThemeForcer } from "@/components/RouteThemeForcer";
import { AuthProvider } from "@/contexts/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";

export const metadata: Metadata = {
  metadataBase: new URL("https://jerseysraw.com"),
  title: {
    default: "Jerseys Raw | Tienda Deportiva de Jerseys en México",
    template: "%s | Jerseys Raw",
  },
  description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más. Envíos a toda la República Mexicana.",
  keywords: ["jerseys de fútbol", "playeras de fútbol", "jerseys México", "jersey Barcelona", "jersey Real Madrid", "jersey Manchester", "jerseys raw"],
  authors: [{ name: "Jerseys Raw" }],
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://jerseysraw.com/",
    siteName: "Jerseys Raw",
    title: "Jerseys Raw | Tienda Deportiva de Jerseys en México",
    description: "Jerseys auténticos de fútbol. Premier League, La Liga, Champions League y más.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@jerseysraw",
    title: "Jerseys Raw | Tienda Deportiva de Jerseys en México",
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
        "logo": {
          "@type": "ImageObject",
          "@id": "https://jerseysraw.com/#logo",
          "url": "https://jerseysraw.com/favicon.png",
          "width": 512,
          "height": 512,
        },
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
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://jerseysraw.com/catalog?search={search_term_string}",
          },
          "query-input": {
            "@type": "PropertyValueSpecification",
            "valueRequired": true,
            "valueName": "search_term_string",
          },
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
        {/* Google Tag Manager */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-K46NF3VK');`,
          }}
        />
      </head>
      <body className="font-sans bg-theme-bg text-th-primary transition-colors duration-300">
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-K46NF3VK"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          <AuthProvider>
            <ThemeProvider>
              <RouteThemeForcer />
              {children}
              <CartSidebar />
            </ThemeProvider>
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}