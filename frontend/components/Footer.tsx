import Link from 'next/link';

const Footer = () => (
  <footer className="bg-[#FAF5EF] text-[#B8977E] pt-10 pb-6 transition-colors duration-300">
    <div className="container mx-auto px-6">

      {/* ── 4 Columnas de info ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">

        {/* Compra en línea */}
        <div>
          <h4 className="text-[#B8977E] font-bold text-sm uppercase tracking-wider mb-4">Compra en línea</h4>
          <ul className="space-y-2 text-xs text-[#C8AE96]">
            <li><Link href="/shipping" className="hover:text-[#8B6D56] transition-colors">Envío a todo México</Link></li>
            <li><Link href="/help" className="hover:text-[#8B6D56] transition-colors">Centro de ayuda</Link></li>
            <li><Link href="/privacy" className="hover:text-[#8B6D56] transition-colors">Seguridad</Link></li>
            <li><Link href="/payment-methods" className="hover:text-[#8B6D56] transition-colors">Formas de pago</Link></li>
          </ul>
        </div>

        {/* Pedidos */}
        <div>
          <h4 className="text-[#B8977E] font-bold text-sm uppercase tracking-wider mb-4">Pedidos</h4>
          <ul className="space-y-2 text-xs text-[#C8AE96]">
            <li><Link href="/tracking" className="hover:text-[#8B6D56] transition-colors">Rastrear pedido</Link></li>
            <li><Link href="/help#facturacion" className="hover:text-[#8B6D56] transition-colors">Facturación</Link></li>
            <li><Link href="/returns" className="hover:text-[#8B6D56] transition-colors">Cambios y devoluciones</Link></li>
          </ul>
        </div>

        {/* Raw */}
        <div>
          <h4 className="text-[#B8977E] font-bold text-sm uppercase tracking-wider mb-4">Raw</h4>
          <ul className="space-y-2 text-xs text-[#C8AE96]">
            <li><Link href="/privacy" className="hover:text-[#8B6D56] transition-colors">Aviso de privacidad y términos</Link></li>
            <li><Link href="/terms" className="hover:text-[#8B6D56] transition-colors">Condiciones de compra en línea</Link></li>
          </ul>
        </div>



        {/* Mi cuenta */}
        <div>
          <h4 className="text-[#B8977E] font-bold text-sm uppercase tracking-wider mb-4">Mi cuenta</h4>
          <ul className="space-y-2 text-xs text-[#C8AE96]">
            <li><Link href="/login" className="hover:text-[#8B6D56] transition-colors">¿Cómo crear una cuenta?</Link></li>
            <li><Link href="/account-benefits" className="hover:text-[#8B6D56] transition-colors">Beneficios de tener una cuenta</Link></li>
            <li><Link href="/checkout" className="hover:text-[#8B6D56] transition-colors">Comprar como invitado</Link></li>
          </ul>
        </div>

      </div>

      {/* ── Línea divisora ── */}
      <div className="border-t-2 border-[#B8977E]/30" />

      {/* ── Fila central: Ventajas | Contacto | Redes ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-stretch">

        {/* Ventajas (Izquierda) */}
        <div className="flex flex-wrap justify-between gap-4 pr-6 py-4 w-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 bg-[#F5EDE4] border border-[#B8977E]/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#B8977E]"><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>
            </div>
            <span className="text-[10px] text-[#B8977E] leading-tight underline">Envío a todo<br />México</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 bg-[#F5EDE4] border border-[#B8977E]/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#B8977E]"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <span className="text-[10px] text-[#B8977E] leading-tight underline">Pago seguro</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 bg-[#F5EDE4] border border-[#B8977E]/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#B8977E]"><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" /></svg>
            </div>
            <span className="text-[10px] text-[#B8977E] leading-tight underline">Devolución<br />fácil</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="w-14 h-14 bg-[#F5EDE4] border border-[#B8977E]/30 rounded-lg flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#B8977E]"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
            </div>
            <span className="text-[10px] text-[#B8977E] leading-tight underline">Pagos a<br />meses</span>
          </div>
        </div>

        {/* Contacto (Centro) */}
        <div className="flex flex-col items-center justify-center py-8 md:py-4 px-6 md:border-l-2 md:border-r-2 border-[#B8977E]/30 h-full">
          <p className="text-xs text-[#B8977E] font-light underline mb-1">Atención a clientes</p>
          <p className="text-[#B8977E] font-light text-xl tracking-wider underline">55 1234 5678</p>
        </div>

        {/* Redes sociales (Derecha) */}
        <div className="flex items-center gap-8 justify-center md:justify-end pl-6 py-6 md:py-0">
          {/* Facebook */}
          <a href="#" aria-label="Facebook" className="w-12 h-12 border border-[#B8977E]/50 rounded-full flex items-center justify-center text-[#B8977E] hover:border-[#B8977E] hover:bg-[#B8977E]/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          {/* Instagram */}
          <a href="#" aria-label="Instagram" className="w-12 h-12 border border-[#B8977E]/50 rounded-full flex items-center justify-center text-[#B8977E] hover:border-[#B8977E] hover:bg-[#B8977E]/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
          </a>
          {/* X / Twitter */}
          <a href="#" aria-label="X" className="w-12 h-12 border border-[#B8977E]/50 rounded-full flex items-center justify-center text-[#B8977E] hover:border-[#B8977E] hover:bg-[#B8977E]/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          {/* YouTube */}
          <a href="#" aria-label="YouTube" className="w-12 h-12 border border-[#B8977E]/50 rounded-full flex items-center justify-center text-[#B8977E] hover:border-[#B8977E] hover:bg-[#B8977E]/10 transition-colors">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
        </div>

      </div>

      {/* ── Línea divisora final ── */}
      <div className="border-t-2 border-[#B8977E]/30 mb-4" />

      {/* ── Barra inferior: copyright + métodos de pago ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">

        {/* Copyright + links legales */}
        <div className="flex items-center gap-3 text-xs text-[#B8977E] font-bold">
          <span>© 2026 RAW</span>
          <span className="text-[#B8977E]/40">|</span>
          <Link href="/terms" className="hover:text-[#8B6D56] transition-colors">Términos y condiciones</Link>
          <span className="text-[#B8977E]/40">|</span>
          <Link href="/privacy" className="hover:text-[#8B6D56] transition-colors">Cuidamos tu privacidad</Link>
        </div>

        {/* Métodos de pago */}
        <div className="flex items-center gap-6 flex-wrap justify-end">
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898213/visa-10_wyt5i3.svg" alt="Visa" className="w-full h-full object-contain" />
          </div>
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772897874/oxxo-logo_dm1spz.svg" alt="OXXO" className="w-full h-full object-contain" />
          </div>
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898212/mastercard-modern-design-_gsyd1p.svg" alt="Mastercard" className="w-full h-full object-contain" />
          </div>
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898212/american-express-1_v71nnx.svg" alt="AMEX" className="w-full h-full object-contain" />
          </div>
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898211/paypal-3_ai1tll.svg" alt="PayPal" className="w-full h-full object-contain" />
          </div>
          <div className="w-12 h-7 bg-white border border-gray-200 rounded flex items-center justify-center p-1">
            <img src="https://res.cloudinary.com/dcwyl56kj/image/upload/v1772898211/spei-1_zdinhs.svg" alt="SPEI" className="w-full h-full object-contain" />
          </div>
        </div>

      </div>
    </div>
  </footer>
);

export default Footer;
