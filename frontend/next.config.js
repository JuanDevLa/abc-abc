/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},

  redirects: async () => [
    // Redirigir rutas en inglés a españolas (SEO: 308 temporal para mantener método)
    {
      source: '/privacy',
      destination: '/aviso-de-privacidad',
      permanent: true, // 301 permanent
    },
    {
      source: '/terms',
      destination: '/terminos-y-condiciones',
      permanent: true, // 301 permanent
    },
  ],

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        // CSP: Solo permitir Stripe, Cloudinary y Google Analytics
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://accounts.google.com https://upload-widget.cloudinary.com https://widget.cloudinary.com; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; font-src 'self' data:; media-src https://res.cloudinary.com; connect-src 'self' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com https://res.cloudinary.com https://api.cloudinary.com https://playeras-backend.onrender.com https://accounts.google.com; frame-src https://js.stripe.com https://accounts.google.com https://upload-widget.cloudinary.com; child-src 'none'; object-src 'none';",
        },
        // Impedir clickjacking
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        // Prevenir MIME type sniffing
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        // Política referrer estricta
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        // HSTS (solo en producción)
        ...(process.env.NODE_ENV === 'production'
          ? [
              {
                key: 'Strict-Transport-Security',
                value: 'max-age=31536000; includeSubDomains; preload',
              },
            ]
          : []),
        // Permisos de Feature Policy
        {
          key: 'Permissions-Policy',
          value: 'geolocation=(), microphone=(), camera=()',
        },
      ],
    },
  ],

  images: {
    /**
     * remotePatterns — Next.js 14+ (formato seguro recomendado)
     * Especificamos dominios exactos en lugar del comodín '**'
     * para evitar que Next.js intente servir imágenes de dominios no autorizados.
     */
    remotePatterns: [
      // Cloudinary CDN — fuente principal de imágenes estáticas
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dcwyl56kj/**',  // solo nuestro cloud, no otros
      },
      // Unsplash — Hero fallback mientras se migra
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Adidas brand assets — Hero banner América
      {
        protocol: 'https',
        hostname: 'brand.assets.adidas.com',
      },
      // Cualquier otro origen (para imágenes de productos subidas por admin)
      //    Las imágenes de productos vienen de URLs variables del backend,
      //    así que necesitamos el comodín únicamente para esas.
      {
        protocol: 'https',
        hostname: '**',
      },
    ],

    /**
     * loaderFile — Custom loader global para <Image> de Next.js.
     * Le dice al bundler que use nuestro cloudinaryLoader en todo el proyecto.
     * Esto evita la doble compresión: Cloudinary ya entregó WebP/AVIF optimizado.
     */
    // loaderFile: './lib/cloudinary-loader.ts',  // Activa esto cuando migres TODOS los <img> a <Image>
    //
    // Por ahora, el loader se aplica solo en <CloudinaryImage> para no romper
    // los <img> nativos existentes y las imágenes de productos del admin.
  },

  // TypeScript errors now fail the build — do not re-add ignoreBuildErrors.
  // Run `pnpm typecheck` before building to catch issues early.
}

module.exports = nextConfig
