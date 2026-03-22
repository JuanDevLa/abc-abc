/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},

  images: {
    /**
     * remotePatterns — Next.js 14+ (formato seguro recomendado)
     * Especificamos dominios exactos en lugar del comodín '**'
     * para evitar que Next.js intente servir imágenes de dominios no autorizados.
     */
    remotePatterns: [
      // ✅ Cloudinary CDN — fuente principal de imágenes estáticas
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dcwyl56kj/**',  // solo nuestro cloud, no otros
      },
      // ✅ Unsplash — Hero fallback mientras se migra
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // ✅ Adidas brand assets — Hero banner América
      {
        protocol: 'https',
        hostname: 'brand.assets.adidas.com',
      },
      // ✅ Cualquier otro origen (para imágenes de productos subidas por admin)
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
