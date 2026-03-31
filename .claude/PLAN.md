# Plan de Ejecución — PLayera v2

## Context

La plataforma está ~70% completa. El flujo core (catálogo → carrito → checkout → pago → confirmación) funciona end-to-end. Lo que falta son: páginas stub sin datos reales, features de backend no implementadas (password reset, email admin), forms de admin no verificados, y deuda técnica (console.logs, mock data expuesta).

---

## FRONTEND (Next.js / Tailwind)

### F1 — Conectar `/app/reviews/page.tsx` a la API
**Archivos:** `frontend/app/reviews/page.tsx`
**Complejidad:** Baja
**Depende de backend:** No (endpoints `/api/v1/reviews` y `/api/v1/reviews/stats` ya existen)

Eliminar `MOCK_STATS` y `MOCK_REVIEWS` hardcodeados. Reemplazar con fetch real a los endpoints. Conectar el form `onSubmit` a `POST /api/v1/reviews` (actualmente solo llama `setShowForm(false)`). El componente `ReviewsSection` ya tiene esta implementación como referencia.

---

### F2 — Eliminar mock data del Tracking page
**Archivos:** `frontend/app/tracking/TrackingClient.tsx`
**Complejidad:** Baja
**Depende de backend:** No (endpoint `/api/v1/tracking` ya existe)

Eliminar `MOCK_DATA` (líneas 35–63) y el modo "DEMO" (línea 374). Dejar solo el flujo real: `POST /api/v1/tracking` con manejo de errores claro.

---

### F3 — Refactorizar raw `fetch()` en Register y Account
**Archivos:**
- `frontend/app/register/RegisterClient.tsx` (líneas 31, 52)
- `frontend/app/account/AccountClient.tsx` (línea 65, catch silencioso línea 70)

**Complejidad:** Baja
**Depende de backend:** No

Reemplazar `fetch()` directo con el módulo centralizado `api` de `lib/api.ts`. Eliminar el `.catch(() => {})` silencioso en Account y añadir manejo de error visible al usuario.

---

### F4 — Actualizar `sitemap.ts` con rutas dinámicas faltantes
**Archivos:** `frontend/app/sitemap.ts`
**Complejidad:** Baja
**Depende de backend:** Sí (necesita endpoints GET /leagues, GET /clubs, GET /categories)

Agregar fetchs dinámicos para ligas (`/leagues/[slug]`), equipos (`/teams/[slug]`), y colecciones (`/collections/[slug]`). Los endpoints de backend ya existen.

---

### F5 — Verificar y completar páginas dinámicas de contenido
**Archivos:**
- `frontend/app/leagues/[slug]/page.tsx`
- `frontend/app/teams/[slug]/page.tsx`
- `frontend/app/collections/[slug]/page.tsx`

**Complejidad:** Media
**Depende de backend:** Sí (endpoints `/api/v1/leagues/:slug`, `/api/v1/clubs/:slug`, `/api/v1/categories/:slug` deben retornar productos)

Verificar que estas páginas hacen fetch real. Si son stubs, implementar SSR con los endpoints disponibles. El patrón de `catalog/page.tsx` puede reutilizarse.

---

### F6 — Verificar Homepage (secciones dinámicas)
**Archivos:**
- `frontend/app/page.tsx`
- `frontend/components/TrendingSection.tsx` (o similar)
- `frontend/components/FootballSlider.tsx`

**Complejidad:** Media
**Depende de backend:** Sí (productos trending, ligas y clubes)

Confirmar que `TrendingSection` y `FootballSlider` hacen fetch real. Si usan data hardcodeada, conectar a los endpoints existentes de products y leagues.

---

### F7 — Limpiar deuda técnica frontend
**Archivos:**
- `frontend/app/product/[id]/ProductDetailClient.tsx` (línea 118 — `console.error`)
- `frontend/app/product/[id]/ProductDetailClient.tsx` (línea 131-140 — función `getDeliveryDates()` local, debería importar de `lib/shipping.ts`)

**Complejidad:** Baja
**Depende de backend:** No

---

## BACKEND (Node.js / Express / Prisma)

### B1 — Implementar Password Reset completo
**Archivos:**
- `backend/src/routes/auth.routes.ts`
- `backend/src/lib/mailer.ts`

**Complejidad:** Media
**Requiere migración Prisma:** No (enum `VerificationType.PASSWORD_RESET` ya existe, modelo `VerificationToken` ya existe)

Agregar dos endpoints:
1. `POST /api/v1/auth/forgot-password` — genera token, envía email con código 6 dígitos
2. `POST /api/v1/auth/reset-password` — valida token, actualiza password con bcrypt

Reusar el patrón de `verify-email` que ya funciona.

---

### B2 — Email de notificación al admin en nueva orden
**Archivos:**
- `backend/src/routes/order.routes.ts` (línea 281 tiene TODO)
- `backend/src/lib/mailer.ts`

**Complejidad:** Baja
**Requiere migración Prisma:** No

Agregar `sendAdminOrderNotification()` en mailer.ts. Llamarlo en el webhook handler (`checkout.session.completed`) después de actualizar el estado a `PAID`, no en el POST de creación de orden (para evitar notificaciones por órdenes no pagadas).

---

### B3 — Manejar `checkout.session.expired` en webhook
**Archivos:** `backend/src/routes/webhook.routes.ts` (líneas 107-112)
**Complejidad:** Baja
**Requiere migración Prisma:** No

Cuando Stripe emite `checkout.session.expired`, la orden debe cambiar a `CANCELLED` y restaurar el stock de los items con `fulfillmentType = LOCAL`. Actualmente solo se loguea sin acción. El cron job de expiración hace algo similar — reusar esa lógica.

---

### B4 — ✅ Limpiar 37+ `console.log` en producción
**Archivos:**
- `backend/src/routes/webhook.routes.ts` (9 logs)
- `backend/src/routes/order.routes.ts` (5 logs)
- `backend/src/routes/tracking.routes.ts` (3 logs)
- `backend/src/lib/mailer.ts` (logs excesivos líneas 209-240)
- Otros routes menores

**Complejidad:** Baja
**Requiere migración Prisma:** No

Reemplazar `console.log` de debug con comentarios o eliminar. Mantener solo logs de startup en `server.ts` y errores críticos con `console.error`.

---

### B5 — ✅ Añadir rate limiting específico a POST `/orders`
**Archivos:** `backend/src/routes/order.routes.ts` o `backend/src/server.ts`
**Complejidad:** Baja
**Requiere migración Prisma:** No

Crear un rate limiter dedicado (10 órdenes / 10 minutos por IP) aplicado solo al endpoint de creación de orden. Reusar `express-rate-limit` que ya está instalado.

---

### B6 — ✅ Agregar Zod validation a endpoints sin schema
**Archivos:**
- `backend/src/routes/review.routes.ts` (POST /reviews — validación manual, sin Zod)
- `backend/src/validators/` (crear `review.validator.ts`)

**Complejidad:** Baja
**Requiere migración Prisma:** No

Crear `CreateReviewSchema` con Zod. El patrón de `order.validator.ts` es la referencia. `POST /products` ya tiene schema según los agents.

---

### B7 — Agregar índices de DB faltantes
**Archivos:** `backend/prisma/schema.prisma`
**Complejidad:** Baja
**Requiere migración Prisma:** Sí (solo `--create-only`, sin cambios destructivos)

Agregar:
```prisma
@@index([categoryId])   // en Product
@@index([productId])    // en ProductView
```

---

### B8 — ✅ Completar validación de variables de entorno
**Archivos:** `backend/src/lib/env.ts`
**Complejidad:** Baja
**Requiere migración Prisma:** No

Agregar al schema de Zod las variables opcionales que se usan sin validar: `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `TRACK17_API_KEY`, `FRONTEND_URL`. Agregar mensajes de error claros si faltan en producción.

---

## FULLSTACK (cambios en ambos lados)

### FS1 — Verificar y completar Admin CRUD de Productos
**Backend:** `backend/src/routes/product.routes.ts` — endpoints ya existen
**Frontend:** `frontend/app/admin/products/new/page.tsx`, `frontend/app/admin/products/[id]/page.tsx`
**Complejidad:** Alta
**Orden:** Leer backend primero → verificar contratos de API → implementar/arreglar forms frontend

Los endpoints de backend ya existen. Leer los dos archivos de admin para determinar si los forms ya llaman a la API. Si están incompletos, implementar: form de creación con `ImageUploadWidget` (Cloudinary), variant manager, y wiring a `POST /api/v1/products` y `POST /api/v1/variants`.

---

### FS2 — Admin CRUD de Órdenes (status transitions)
**Backend:** `backend/src/routes/order.routes.ts` — `PUT /orders/:id/status` existe
**Frontend:** `frontend/app/admin/orders/page.tsx` (o similar)
**Complejidad:** Media
**Orden:** Backend primero (ya está), verificar frontend

Asegurar que la admin orders page permite: filtrar por status, cambiar status (PAID → PROCESSING → SHIPPED → DELIVERED), y agregar número de tracking. El backend ya soporta esto.

---

### FS3 — Admin CRUD de Clubs, Leagues, Tags
**Backend:** Routes existen (`club.routes.ts`, `league.routes.ts`, `tag.routes.ts`)
**Frontend:** `frontend/app/admin/clubs/`, `frontend/app/admin/leagues/`, `frontend/app/admin/tags/`
**Complejidad:** Media
**Orden:** Verificar backend → implementar frontend

Verificar que los endpoints retornan datos correctos, luego asegurar que las páginas admin hacen fetch y tienen forms de creación/edición/borrado.

---

### FS4 — Admin moderación de Reviews
**Backend:** Endpoints de aprobación/borrado ya existen en `review.routes.ts`
**Frontend:** `frontend/app/admin/reviews/page.tsx`
**Complejidad:** Baja
**Orden:** Backend listo, solo verificar frontend

Verificar que la página admin de reviews lista todas las reviews pendientes y permite aprobar/rechazar. El backend tiene `PATCH /reviews/:id/approve` y `DELETE /reviews/:id`.

---

### FS5 — Página de cuenta de usuario con historial de órdenes
**Backend:** `GET /api/v1/orders/mine` ya existe
**Frontend:** `frontend/app/account/AccountClient.tsx` (parcialmente implementado según audit)
**Complejidad:** Baja
**Orden:** Backend listo, refinar frontend

Según el audit el AccountClient ya fetchea `/orders/mine` pero usa raw fetch. Después de F3 (usar módulo api), verificar que muestra correctamente los estados de orden con badges de color y detalles expandibles.

---

## Orden de Ejecución Sugerido

**Sprint 1 — Deuda técnica rápida (1-2 días)**
B4, F7, F3, B5, B6, B8

**Sprint 2 — Features de usuario faltantes (2-3 días)**
F1, F2, B1 (password reset), B2 (admin email), B3 (webhook expired)

**Sprint 3 — Páginas dinámicas y SEO (1-2 días)**
F4, F5, F6, B7

**Sprint 4 — Admin panel completo (3-5 días)**
FS1 (más complejo), FS2, FS3, FS4, FS5

---

## Verificación

Tras cada tarea:
- Backend: `cd backend && npm run build` (TypeScript sin errores)
- Frontend: `cd frontend && npm run typecheck && npm run lint`
- Integración: Iniciar ambos servidores y probar el flujo manualmente
- DB migrations: `npm run prisma:migrate` solo en B7

---

## Tareas Extra (Post-Sprint 4)

### ✅ Ya Implementadas (sin acción)

| Tarea | Verificación |
|-------|-------------|
| **Responsive mobile general** | Tailwind responsive (sm:, md:, lg:, xl:) en todas las páginas: Hero.tsx, ProductListing.tsx (grid + overlay mobile), ProductDetailClient.tsx, Navbar.tsx (hamburger `md:hidden`), CartSidebar.tsx (`w-full md:w-[450px]`), checkout. |
| **Filtro de color funcional** | Frontend: 9 swatches en ProductListing.tsx (líneas 91-101, 297-314), sync URL params `colors=`. Backend: product.routes.ts (líneas 33, 66-69) filtra case-insensitive en `ProductVariant.color`. |

---

### FRONTEND

---

#### ✅ EX1 — Dropdown navbar theme-aware (blanco/negro según página)
**Estado:** Completo — Navbar.tsx líneas 360 y 448 ya usan `bg-theme-card`, `text-th-primary`, `border-th-border/10`.

---

#### ✅ EX2 — Recuperar contraseña (frontend)
**Estado:** Completo — `/forgot-password` y `/reset-password` existen, link en LoginClient.tsx línea 100.

---

#### ✅ EX5-F — Buscador optimizado (parte frontend)
**Estado:** Completo — `searchHistory` con localStorage, función `highlight()` con `<mark>` ya implementados en Navbar.tsx.

---

### BACKEND

---

#### ✅ EX3-B — Admin Clientes (endpoints)
**Estado:** Completo — superado por EX9 (CRM). `crm.routes.ts` cubre todo esto y más.

---

#### ✅ EX4-B — Panel usuario Settings (endpoint + migración)
**Estado:** Completo — `phone` en schema, `PUT /api/v1/auth/me` en auth.routes.ts línea 147.

---

#### ✅ EX5-B — Buscador optimizado (parte backend)
**Estado:** Completo — `search.routes.ts` ya splitea por palabras con `translate()` accent-insensitive y `AND` por palabra.

---

#### ❌ EX6 — PDF de orden — DESCARTADO
**Decisión:** No se implementará. El botón de descarga PDF en la cuenta de usuario no es requerido.

---

#### ✅ EX8 — Sistema de recompensas
**Estado:** Completo (Fases 1, 2 y 3)
- **Fase 1** ✅ — Earn: webhook llama `earnPoints`, rutas balance/historial, página `/account/rewards`
- **Fase 2** ✅ — Redeem: integrado en `POST /orders`, checkout UI con selector de puntos
- **Fase 3** ✅ — Admin config: modelo `RewardConfig` (singleton), `GET/PUT /admin/rewards/config`, `GET /admin/rewards/stats`, página `/admin/rewards`

---

#### ✅ EX9 — CRM interno
**Estado:** Completo (Fases 1-6)
- **Fase 1** ✅ — Schema: `CustomerNote`, `customerTags String[]` en User, migración
- **Fase 2** ✅ — Analytics backend: top-viewed, top-sold, least-viewed, least-sold, conversion, revenue/timeline, orders/summary, customers/summary (en `analytics.routes.ts`)
- **Fase 3** ✅ — CRM routes: `crm.routes.ts` con GET /customers (enriquecido, sort, tag filter), GET /customers/:id (stats completas, orders, notes, rewards), POST/DELETE notes, PUT tags
- **Fase 4** ✅ — Dashboard admin: `/admin/page.tsx` con RevenueChart SVG + MiniBarList, KPIs, orders summary, customers summary
- **Fase 5** ✅ — Analytics page: `/admin/analytics` con period selector (7d/30d/90d) y 3 tabs (Vistas/Ventas/Conversión)
- **Fase 6** ✅ — CRM clientes frontend: `/admin/customers` tabla enriquecida con gasto/tags/sort, `/admin/customers/[id]` detalle con stats, tabs órdenes/notas/puntos, CRUD notas, edición de tags

---

### FULLSTACK (requieren cambios en ambos lados simultáneamente)

---

#### ✅ EX3-F — Admin Clientes (página frontend)
**Estado:** Completo — superado por EX9 Fase 6. Tabla enriquecida + detalle completo.

---

#### ✅ EX4-F — Panel usuario Settings (página frontend)
**Estado:** Completo — `/account/settings/page.tsx` existe con layout.

---

### Orden de Implementación Recomendado

| Fase | Tareas | Justificación |
|------|--------|---------------|
| **Fase 1** | EX1, EX2, EX7 | Rápidas, solo frontend, alto impacto visual |
| **Fase 2** | EX3-B → EX3-F, EX4-B → EX4-F | Core admin + usuario, backend primero |
| **Fase 3** | EX5-B + EX5-F, EX6 | Mejoras de experiencia, independientes |
| **Fase 4** | EX8, EX9 | Features avanzados, subdividir en sub-sprints |

---

## Sprint 5 — Responsive Tablet (iPad) ✅ COMPLETO (2026-03-30)

### ✅ EX-TAB1 — Product Carousel: cards muy altas en tablet
**Archivos:** `frontend/components/ProductCarousel.tsx`
**Fix aplicado:** Altura `h-[340px] md:h-[380px] lg:h-[440px]`, ancho `md:w-[calc(33%-11px)]`, heading `text-3xl md:text-4xl`, botón `py-2 lg:py-2.5`. 2026-03-30.

---

## Sprint 5 — Rediseño Sistema de Puntos ✅ COMPLETO (2026-03-25)

### Contexto y decisión de negocio

El sistema actual permite **canjear puntos como descuento en cada compra**. Eso es malo para el negocio:
- El cliente compra 2 jerseys, aplica descuento, y se va feliz. Nunca acumula suficiente para la recompensa grande.
- **Objetivo real:** Que el cliente compre 5 jerseys y se lleve la 6ª gratis. El incentivo debe ser la jersey GRATIS al final, no descuentos parciales en cada compra.

### Números finales (CONFIRMADOS)

| Concepto | Valor | Razón |
|----------|-------|-------|
| Bono de registro | **300 pts** | = 25% del umbral inmediatamente, el cliente siente progreso desde el día 1 |
| Fórmula de puntos | **`round(priceCents / 200)`** | 1 pt por cada $2 MXN — proporcional al precio, transparente |
| Jersey $350 | 175 pts | |
| Jersey $550 | 275 pts | |
| Jersey $750 | 375 pts | |
| Jersey $1,000 | 500 pts | |
| Umbral para jersey gratis | **1,200 pts** | |
| Tope de precio de la jersey gratis | **$699 MXN** | Decidir si se sube/baja |

**Progresión psicológica (jersey estándar $550):**

| Momento | Puntos | % | Mensaje motivacional |
|---------|--------|---|---------------------|
| Registro | 300 | 25% | "¡Ya empezaste tu camino a la jersey gratis!" |
| 1ª compra | 575 | 47% | "¡Casi a la mitad!" |
| 2ª compra | 850 | 70% | "¡Más de la mitad!" |
| 3ª compra | 1,125 | 93% | "¡Ya casi tienes la tuya gratis!" |
| 4ª compra | 1,400 | ✅ | "¡JERSEY GRATIS DESBLOQUEADA!" |

Jerseys más caras ($750) llegan en 3 compras. Jerseys baratas ($350) en 5-6. Justo y proporcional.

---

### Fase 1 — Backend: Rediseño del sistema de puntos

**Archivos a modificar:**
- `backend/src/services/rewards.service.ts`
- `backend/src/routes/rewards.routes.ts`
- `backend/src/routes/webhook.routes.ts` (earn on purchase)
- `backend/src/routes/order.routes.ts` (QUITAR lógica de redeem-as-discount)
- `backend/prisma/schema.prisma` (nuevo modelo `RewardRedemption`)
- Nueva migración

**Cambios:**

1. **Quitar** `redeemPoints` del flujo de `POST /orders`. Actualmente el checkout acepta `?pointsToRedeem` y aplica descuento. Eliminar completamente esa lógica del backend.

2. **Quitar** del frontend checkout el selector de puntos (`frontend/app/checkout/page.tsx`).

3. **Agregar bono de registro** en `POST /auth/register` (o en el webhook de verificación de email): llamar `earnPoints(userId, 500, 'REGISTRATION_BONUS', 'Bono de bienvenida')`.

4. **Nuevo modelo `RewardRedemption`** en schema.prisma:
   ```prisma
   model RewardRedemption {
     id          String   @id @default(uuid())
     userId      String
     user        User     @relation(fields: [userId], references: [id])
     couponId    String?  // cupón generado automáticamente
     pointsUsed  Int
     status      String   @default("PENDING") // PENDING | USED | EXPIRED
     createdAt   DateTime @default(now())
     expiresAt   DateTime
   }
   ```

5. **Nuevo endpoint `POST /api/v1/rewards/redeem`**: cuando el usuario tiene ≥ umbral de puntos, puede solicitar su jersey gratis. El sistema:
   - Verifica que tiene suficientes puntos
   - Descuenta los puntos (`earnPoints(userId, -1500, 'REDEMPTION', 'Jersey gratis canjeada')`)
   - Genera un cupón único de tipo `FREE_JERSEY` (usando el sistema de cupones existente)
   - Devuelve el código del cupón
   - Envía email de confirmación

6. **Ajustar `earnPoints`** en webhook: fórmula dinámica `Math.round(order.totalCents / 200)`. No puntos fijos — proporcional al gasto real. Si la orden tiene cupón aplicado, calcular sobre el `totalCents` final pagado (no el precio original).

---

### Fase 2 — Frontend: Página `/account/rewards` rediseñada

**Archivos a modificar:**
- `frontend/app/account/rewards/page.tsx` (reescritura completa)

**Nueva UI — debe ser visualmente impactante y motivacional:**

1. **Hero promocional** en la parte superior:
   - Fondo degradado (dorado/negro o morado oscuro)
   - Texto grande: **"¡Regístrate y obtén 500 puntos gratis!"**
   - Subtítulo: **"Acumula 1,500 puntos y llévate una jersey totalmente GRATIS"**
   - Badge animado o ilustración de jersey

2. **Barra de progreso hacia la jersey gratis:**
   - Barra horizontal grande con marcadores: 0 → 300 (registro) → 600 → 900 → 1200 (meta)
   - Puntos actuales destacados + porcentaje: "**70% completado**"
   - Texto motivacional dinámico según el % (ver tabla de mensajes arriba)
   - Mostrar también: "¡Te faltan solo X puntos!" — número concreto, no abstracto
   - Ícono de jersey al final de la barra (candado si no ha llegado, animación de confetti si sí)
   - Mostrar equivalencia en jerseys: "= aproximadamente X jerseys más"

3. **Cómo ganar puntos** — 3 cards:
   - 🎁 Registro: +300 pts (gratis solo por registrarte)
   - 🛒 Cada compra: 1 pt por cada $2 MXN (jersey de $550 = 275 pts)
   - ⭐ (Espacio reservado para futura forma de ganar, ej. reseña verificada)

4. **Botón de canjear** (solo visible cuando tiene ≥ 1500 pts):
   - CTA prominente: "¡Canjear mi jersey gratis!"
   - Modal de confirmación con detalles
   - Muestra el código de cupón generado

5. **Historial de puntos** (colapsable, al fondo)

---

### Fase 3 — Frontend: Página pública de promoción `/rewards` (store)

**Archivo:** `frontend/app/rewards/page.tsx` (nuevo) o integrar en homepage

Landing page pública (sin login requerido para ver) que explica el programa:
- Hero visual con la propuesta de valor
- Steps: "Cómo funciona" (1. Regístrate → 2. Compra → 3. Acumula → 4. ¡Jersey gratis!)
- CTA: "Regístrate gratis" / "Iniciar sesión"
- Esta página se puede linkear desde el navbar o un banner en homepage

---

### Fase 4 — Admin: Gestión de canjes

**Archivos:** `frontend/app/admin/rewards/page.tsx` (extender)

Agregar sección de **Canjes pendientes** en el panel admin de rewards:
- Lista de `RewardRedemption` con status PENDING
- Ver qué usuario, cuántos puntos usó, cuándo
- Botón "Marcar como entregado" (cambia status a USED)
- El cupón generado aparece con su código

---

### ✅ Implementado (2026-03-25)

| Fase | Archivos | Estado |
|------|---------|--------|
| Backend: schema + migración | `schema.prisma` — `RewardRedemption`, `discountCents` en Coupon, defaults 275/1200 | ✅ |
| Backend: rewards.service | `redeemForFreeJersey`, earn con `Math.round`, sin redeem-as-discount | ✅ |
| Backend: rewards.routes | `POST /rewards/redeem`, `GET/PUT /admin/rewards/redemptions` | ✅ |
| Backend: order.routes | Sin lógica de puntos en checkout | ✅ |
| Backend: webhook.routes | Sin `applyRedeem` | ✅ |
| Backend: auth.routes | +500 pts al registrarse | ✅ |
| Backend: coupon.service | Soporta `discountCents` fijo además de porcentaje | ✅ |
| Frontend: checkout | Quitado selector de puntos | ✅ |
| Frontend: /account/rewards | Rediseño completo — barra 0→1200, canje, código cupón, progresión típica | ✅ |
| Frontend: /admin/rewards | Tabla de canjes con botones USED/EXPIRED | ✅ |

**Nota migración:** SQL aplicado manualmente en Neon (la DB no era accesible vía CLI). Pendiente registrar en historial de Prisma con `prisma migrate resolve`.

---

## 🎨 Updates Landing Page (2026-03-25)

### ✅ Completed

| Tarea | Descripción | Archivos | Status |
|-------|----------|---------|--------|
| **LP1** | Cambiar "Trending Now" → "Novedades" | `frontend/app/page.tsx` | ✅ |
| **LP2** | Cambiar sección 1 de "Street Style" → "Mundial 2026" | `frontend/components/TrendingSection.tsx` | ✅ |
| **LP3** | Cambiar subtítulo "Del estadio a las calles" → "Lucete en esta Justa mundialista" | `frontend/components/TrendingSection.tsx` | ✅ |
| **LP4** | Hacer cards de "Más Vendidos" redondas (`rounded-lg`) | `frontend/components/ProductCarousel.tsx` | ✅ |

---

## Sprint 6 — Auditoría Pre-Producción (2026-03-26)

Auditoría completa con 4 agentes especializados: Security, Backend Production, SEO/Indexing, Frontend UX/CRO.

**Resumen ejecutivo:**

| Área | CRITICAL | HIGH | MEDIUM | LOW |
|------|----------|------|--------|-----|
| Seguridad | 0 | 4 | 4 | 2 |
| Backend Production | 4 | 7 | 9 | 7 |
| SEO & Indexing | 3 | 5 | 8 | 5 |
| Frontend UX/CRO | 3 | 12 | 10 | 1 |
| **TOTAL** | **10** | **28** | **31** | **15** |

---

### 6A — SEGURIDAD ❌ Pendiente

#### ✅ 6A-1 [HIGH] Rate limiting en login/register
**Fix aplicado:** `loginLimiter` (10/15min), `registerLimiter` (5/hora), `adminLoginLimiter` (5/15min) ya presentes en `auth.routes.ts` y `admin.routes.ts`. Verificado 2026-03-28.

#### ✅ 6A-2 [HIGH] IDOR en descarga PDF de orden
**Fix aplicado:** `order.routes.ts:607` usa `order.userId === req.user!.sub` + `role === 'admin'` correctamente. Verificado 2026-03-28.

#### ✅ 6A-3 [HIGH] Analytics views sin admin check
**Archivo:** `analytics.routes.ts:75`
**Fix aplicado:** Agregado `if (!adminOnly(req, res)) return;` — (2026-03-26)

#### ✅ 6A-4 [HIGH] Endpoint /api/revalidate sin autenticación
**Fix aplicado:** `app/api/revalidate/route.ts` ya verifica `x-revalidate-token` contra `REVALIDATE_SECRET`. Verificado 2026-03-28.

#### ✅ 6A-5 [MEDIUM] Math.random() en número de orden
**Fix aplicado:** `order.routes.ts` usa `crypto.randomBytes(3).toString('hex')` — 6 chars hex, ~16.7M combinaciones/día, criptográficamente seguro. 2026-03-28.

#### 6A-6 [MEDIUM] CORS permite requests sin Origin en producción
**Archivo:** `corsConfig.ts:23-26`
**Fix:** Rechazar requests sin Origin cuando `NODE_ENV === 'production'`.

#### ✅ 6A-7 [MEDIUM] express.json limit 10mb excesivo
**Archivo:** `server.ts:70`
**Fix aplicado:** Reducido a `100kb`. 2026-03-29.

#### 6A-8 [MEDIUM] DATE_TRUNC con param de usuario en raw SQL
**Archivo:** `analytics.routes.ts:458-467`
**Fix:** Usar `Prisma.sql` literal map en lugar de interpolación directa.

---

### 6B — BACKEND PRODUCTION READINESS ❌ Pendiente

#### ✅ 6B-1 [CRITICAL] No graceful shutdown
**Fix aplicado:** `server.ts` ya captura `http.Server` y maneja SIGTERM/SIGINT con `server.close()` + `prisma.$disconnect()`. Verificado 2026-03-28.

#### ✅ 6B-2 [CRITICAL] No unhandledRejection handler
**Fix aplicado:** `server.ts` ya tiene `process.on('unhandledRejection', ...)` y `process.on('uncaughtException', ...)`. Verificado 2026-03-28.

#### 6B-3 [CRITICAL] Stock race condition
**Archivo:** `order.routes.ts:173-272`
**Problema:** Prisma transactions usan READ COMMITTED sin `FOR UPDATE`. Dos órdenes concurrentes pueden decrementar stock a negativo.
**Fix:** Usar `WHERE stock >= quantity` en el decrement atómico y verificar rowcount, o usar `isolationLevel: 'Serializable'`.

#### 6B-4 [CRITICAL] Stripe/SMTP env vars opcionales — fallo silencioso
**Archivo:** `env.ts:46-48`
**Problema:** Si `STRIPE_SECRET_KEY` falta en producción, el server arranca OK pero pagos fallan.
**Fix:** Log WARN al startup si vars de pago/email faltan, o hacerlas required en production.

#### ✅ 6B-5 [HIGH] Mailer leaks reset codes a stdout
**Fix aplicado:** `mailer.ts` solo loguea `[MAIL-DEV] Para: email | Asunto: subject` cuando no hay API key — nunca imprime códigos. Verificado 2026-03-28.

#### ✅ 6B-6 [HIGH] Prisma query logging en producción
**Fix aplicado:** `prisma.ts:9` ya tiene logging condicional por `NODE_ENV`. Verificado 2026-03-28.

#### ✅ 6B-7 [HIGH] Cron job usa createdAt en vez de expiresAt
**Fix aplicado:** `releaseAbandonedStock.ts` ahora usa `expiresAt: { lt: new Date() }`. 2026-03-28.

#### ✅ 6B-8 [HIGH] CORS permite localhost en producción
**Fix aplicado:** `corsConfig.ts` excluye `localhost:3000` cuando `NODE_ENV === 'production'`. 2026-03-28.

#### ✅ 6B-9 [HIGH] Admin config sin validación
**Fix aplicado:** `admin.routes.ts` — `RewardConfigSchema` con Zod valida tipos y rangos (min 1, max 100,000) antes del upsert. 2026-03-30.

#### ✅ 6B-10 [HIGH] POST/PUT/DELETE /products sin admin check
**Fix aplicado:** `product.routes.ts` ya tiene `requireAuth` + `role !== 'admin'` → 403 en todas las rutas write. Verificado 2026-03-28.

#### ✅ 6B-11 [HIGH] stock.routes.ts sin admin check
**Fix aplicado:** `stock.routes.ts` ya tiene `requireAuth` + `role !== 'admin'` → 403 en todos los handlers. Verificado 2026-03-28.

#### 6B-12 [MEDIUM] Webhook idempotency — duplicate reward points
**Archivos:** `webhook.routes.ts:100-113`, `rewards.service.ts`
**Fix:** Verificar si ya existe `RewardTransaction` con mismo `orderId` antes de acreditar.

#### 6B-13 [MEDIUM] GET /orders/:orderNumber sin auth (enumerable)
**Archivo:** `order.routes.ts:337-401`
**Fix:** Agregar rate limiting dedicado + extender parte aleatoria del order number.

#### ✅ 6B-14 [MEDIUM] Missing DB indexes
**Fix aplicado:** `schema.prisma` — agregados `@@index([leagueId])` en Club, `@@index([productId])` en ProductImage, `@@index([purchaseOrderId])` y `@@index([variantId])` en PurchaseOrderItem, `@@index([orderId])` en RewardTransaction. Requiere `prisma migrate dev`. 2026-03-30.

#### ✅ 6B-15 [MEDIUM] morgan('dev') en producción
**Fix aplicado:** `server.ts` usa `morgan('combined')` en producción y `morgan('dev')` en desarrollo. 2026-03-28.

#### 6B-16 [LOW] JWT 7-day expiry sin refresh
**Archivo:** `auth.ts:21`
**Acción:** Considerar reducir a 1-2 días + implementar refresh tokens.

#### 6B-17 [LOW] Inconsistent error response formats
**Acción:** Estandarizar en `{ error: string, code?: string }`.

#### ✅ 6B-18 [LOW] Mailer from addresses inconsistentes
**Fix aplicado:** `mailer.ts` ya centraliza el remitente en `SENDER_EMAIL = process.env.SMTP_FROM ?? 'ayuda@jerseysraw.com'`. Sin duplicación real. Verificado 2026-03-30.

---

### 6C — SEO & INDEXING ❌ Pendiente

#### ✅ 6C-1 [CRITICAL] Zero JSON-LD structured data
**Fix aplicado:** `layout.tsx` tiene `Organization` + `WebSite`. `product/[id]/page.tsx` tiene `Product` + `BreadcrumbList`. Verificado 2026-03-28.

#### 6C-2 [CRITICAL] No listo para Google Merchant Center
**Problema:** Sin Product structured data con `offers` (price, currency MXN, availability, condition), sin GTIN/MPN/SKU, sin brand.
**Fix:** Incluir en el JSON-LD de producto: `offers.price`, `offers.priceCurrency: "MXN"`, `offers.availability`, `brand.name`, `sku`.

#### 6C-3 [CRITICAL] og-image.jpg y apple-touch-icon.png faltan
**Archivo:** `frontend/public/`
**Fix:** Crear `og-image.jpg` (1200x630px) y `apple-touch-icon.png` (180x180px) con branding de Jerseys Raw.

#### ✅ 6C-4 [HIGH] Collections pages sin metadata
**Fix aplicado:** `collections/[slug]/page.tsx` ya tiene `generateMetadata` con canonical. Verificado 2026-03-28.

#### ✅ 6C-5 [HIGH] No canonical URLs en ninguna página
**Fix aplicado:** `alternates.canonical` presente en product, collections, wishlist y otras páginas públicas. Verificado 2026-03-28.

#### ✅ 6C-6 [HIGH] lang="es" → debería ser "es-MX"
**Fix aplicado:** `layout.tsx` ya tiene `lang="es-MX"`. Verificado 2026-03-28.

#### ✅ 6C-7 [HIGH] Wishlist page sin metadata
**Fix aplicado:** `app/wishlist/layout.tsx` ya existe con metadata y canonical. Verificado 2026-03-28.

#### ✅ 6C-8 [MEDIUM] Product OG type "website" → "product"
**Fix aplicado:** `product/[id]/page.tsx` usa `type: "product" as any` (Next.js no tipifica "product" en su unión, pero el meta tag OG es válido). 2026-03-30.

#### 6C-9 [MEDIUM] Reviews page client-rendered (invisible a crawlers)
**Fix:** Fetch inicial server-side en un Server Component wrapper.

#### 6C-10 [MEDIUM] 30+ raw `<img>` sin next/image
**Archivos:** Hero, ProductCarousel, FootballSlider, Footer, CartSidebar, checkout
**Fix:** Reemplazar con `next/image` o `CldImage` para optimización automática.

#### 6C-11 [MEDIUM] No generateStaticParams en rutas dinámicas
**Fix:** Agregar `generateStaticParams` en product, teams, leagues, collections para pre-build.

#### ✅ 6C-12 [MEDIUM] Sitemap incompleto
**Archivo:** `frontend/app/sitemap.ts`
**Fix aplicado:** Agregadas `/reviews` (weekly, 0.5) y `/account-benefits` (monthly, 0.4). 2026-03-29.

#### ✅ 6C-13 [MEDIUM] Catalog usa `cache: 'no-store'`
**Fix aplicado:** `{ next: { revalidate: 60 } }` en `catalog/page.tsx`. 2026-03-29.

#### 6C-14 [LOW] Product URLs usan UUIDs en vez de slugs
**Acción:** Considerar cambiar `/product/[id]` a `/product/[slug]` para URLs SEO-friendly.

---

### 6D — FRONTEND UX, CRO & MARKETING ❌ Pendiente

#### ✅ 6D-1 [CRITICAL] Newsletter form no funciona
**Fix aplicado:** `Newsletter.tsx` ya tiene `handleSubmit` que llama a `POST /api/v1/newsletter`. Backend tiene endpoint completo con Zod. Verificado 2026-03-28.

#### 6D-2 [CRITICAL] Zero conversion tracking (GA4, GTM, Facebook Pixel)
**Archivo:** `frontend/app/layout.tsx`
**Problema:** Sin tracking = sin medición de ROAS, sin bid optimization, sin audiences.
**Fix:** Agregar GTM via `next/script` en layout. Disparar evento `purchase` en confirmation page.

#### ✅ 6D-3 [CRITICAL] Checkout sin labels en inputs
**Fix aplicado:** `checkout/page.tsx` ya tiene `<label>` en todos los inputs (email, nombre, apellido, dirección, ciudad, estado, CP, teléfono). Verificado 2026-03-28.

#### ✅ 6D-4 [HIGH] No indicadores de escasez/urgencia en producto
**Fix aplicado:** `ProductDetailClient.tsx` muestra pill ámbar animada "¡Solo quedan X unidades — Envío rápido!" cuando `localStock <= 5 && !isDropshippable`. 2026-03-28.

#### ✅ 6D-5 [HIGH] Cart sin progress bar de envío gratis
**Fix aplicado:** Barra de progreso en `CartSidebar.tsx` y `checkout/page.tsx`. Umbral $999 MXN. Badge verde al alcanzarlo. 2026-03-28.

#### 6D-6 [HIGH] Checkout sin inline validation
**Archivo:** `checkout/page.tsx`
**Fix:** Validación per-field en onBlur con feedback visual (borde verde/rojo + helper text).

#### ✅ 6D-7 [HIGH] Hero botón "Más Vendidos" muerto
**Archivo:** `Hero.tsx:71`
**Fix aplicado:** Convertido a `<Link href="/catalog">` — (2026-03-26)

#### ✅ 6D-8 [HIGH] iOS auto-zoom en inputs de checkout
**Fix aplicado:** `text-base` añadido a `inputClass` (línea 213) y coupon input (línea 561) cambiado de `text-sm` a `text-base`. 2026-03-29.

#### ✅ 6D-9 [HIGH] Cart delete button invisible en mobile
**Fix aplicado:** `CartSidebar.tsx` usa `opacity-100 sm:opacity-0 sm:group-hover:opacity-100`. 2026-03-28.

#### 6D-10 [HIGH] No loading.tsx en ninguna ruta
**Fix:** Crear `loading.tsx` con skeletons para: `/catalog`, `/checkout`, `/product/[id]`, `/account`.

#### 6D-11 [HIGH] Hero/ProductCarousel usan raw `<img>`
**Fix:** Usar `next/image` con `priority` en primer slide del Hero, `loading="lazy"` en el resto.

#### ✅ 6D-12 [HIGH] Links sociales placeholder href="#"
**Estado:** Instagram ya tiene URL real. Facebook/Twitter/YouTube sin cuentas activas — descartado por el usuario. 2026-03-28.

#### ✅ 6D-13 [HIGH] Teléfono placeholder en footer
**Fix aplicado:** `Footer.tsx` ya tiene número real `+52 965 138 6865`. Verificado 2026-03-30.

#### 6D-14 [HIGH] No welcome/post-purchase email al cliente
**Fix:** Implementar email de confirmación de orden al cliente en el webhook handler + email de review request 7 días después.

#### ✅ 6D-15 [HIGH] No prompt de crear cuenta en confirmation
**Fix aplicado:** `confirmation/[orderNumber]/page.tsx` importa `useAuth` y muestra bloque CTA "Crear cuenta y ganar puntos" solo cuando `!user`, con el email de la orden pre-llenado en la URL de registro. 2026-03-30.

#### ✅ 6D-16 [HIGH] Missing noindex en checkout/confirmation
**Archivos:** `checkout/layout.tsx`, `confirmation/[orderNumber]/layout.tsx`
**Fix aplicado:** Ya existía `robots: { index: false, follow: false }` en ambos layouts — verificado (2026-03-26)

#### ✅ 6D-17 [HIGH] Missing autocomplete en checkout
**Archivo:** `checkout/page.tsx`
**Fix aplicado:** Agregado `autoComplete` en los 8 inputs: email, given-name, family-name, street-address, address-level2, address-level1, postal-code, country-name, tel — (2026-03-26)

#### 6D-18 [MEDIUM] No abandoned cart email / exit-intent
**Acción:** En email blur en checkout, guardar email → cron envía reminder si orden no se completa en 1hr.

#### ✅ 6D-19 [MEDIUM] Cart quantity buttons touch targets pequeños
**Fix aplicado:** `CartSidebar.tsx` botones `-`/`+` cambiados de `p-1 px-2` a `p-3` (~44×44px). 2026-03-30.

#### 6D-20 [MEDIUM] Search escondido en mobile
**Archivo:** `Navbar.tsx:414`
**Fix:** Agregar ícono de búsqueda en mobile que abra overlay full-screen.

#### ❌ 6D-21 [MEDIUM] No return policy visible en producto/checkout
**Descartado por el usuario** (2026-03-30) — no se quiere mostrar badge de devoluciones.

---

### Orden de ejecución recomendado Sprint 6

**Fase 6.1 — Seguridad CRÍTICA (bloquea deploy)**
`6A-1` `6A-2` `6A-3` `6A-4` `6B-1` `6B-2` `6B-3` `6B-4` `6B-10` `6B-11`

**Fase 6.2 — SEO fundacional (bloquea indexación)**
`6C-1` `6C-2` `6C-3` `6C-5` `6C-6` `6C-4`

**Fase 6.3 — CRO crítico (bloquea conversiones)**
`6D-1` `6D-2` `6D-3` `6D-7` `6D-12` `6D-13` `6D-16` `6D-17`

**Fase 6.4 — Backend hardening**
`6B-5` `6B-6` `6B-7` `6B-8` `6B-9` `6B-12` `6B-14` `6B-15` `6A-5` `6A-6` `6A-7`

**Fase 6.5 — UX & Performance**
`6D-4` `6D-5` `6D-6` `6D-8` `6D-9` `6D-10` `6D-11` `6D-14` `6D-15`

**Fase 6.6 — SEO avanzado + optimización**
`6C-7` `6C-8` `6C-9` `6C-10` `6C-11` `6C-12` `6C-13`

**Fase 6.7 — Polish & nice-to-have**
`6D-18` `6D-19` `6D-20` `6D-21` `6B-16` `6B-17` `6B-18` `6C-14`

---

## Sprint 7 — Google OAuth Login

### Contexto

Reducir fricción en el registro/login. Google OAuth cubre el 90% del caso de uso sin coste. Apple Sign In descartado por ahora (requiere Apple Developer $99/año y solo vale si hay app iOS).

---

### EX10-B — Backend: endpoint Google OAuth
**Archivos:**
- `backend/src/routes/auth.routes.ts` (agregar `POST /auth/google`)
- `backend/src/lib/auth.ts` (sin cambios, reusar `generateToken`)
- `backend/prisma/schema.prisma` (agregar `googleId String? @unique` en User)
- Nueva migración Prisma

**Complejidad:** Media
**Requiere migración:** Sí (campo `googleId` en User)

**Flujo:**
1. Frontend recibe el `credential` (ID token JWT) de Google tras el popup
2. Llama `POST /api/v1/auth/google` con `{ credential }`
3. Backend verifica el ID token con Google: `GET https://oauth2.googleapis.com/tokeninfo?id_token=<token>`
4. Extrae `email`, `name`, `sub` (Google ID) de la respuesta
5. Busca usuario por `googleId` o `email`:
   - Si existe por `googleId` → login directo
   - Si existe por `email` (cuenta manual) → vincular `googleId` y login
   - Si no existe → crear usuario nuevo con `emailVerifiedAt = now()` (Google ya verificó el email), sin `passwordHash`
6. Devuelve el mismo shape que `POST /auth/login`: `{ user, token }`

**Variables de entorno necesarias:** Ninguna en backend (la verificación es pública vía tokeninfo endpoint). El `GOOGLE_CLIENT_ID` solo se necesita en frontend.

---

### EX10-F — Frontend: botón "Continuar con Google"
**Archivos:**
- `frontend/app/login/LoginClient.tsx`
- `frontend/app/register/RegisterClient.tsx`
- `frontend/lib/api.ts` (agregar `loginWithGoogle()`)

**Complejidad:** Baja-Media
**Dependencia:** EX10-B completado

**Pasos:**
1. Instalar `@react-oauth/google`: `npm install @react-oauth/google`
2. Envolver el layout en `<GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>` en `app/layout.tsx`
3. Agregar variable `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en Vercel
4. En LoginClient y RegisterClient: agregar botón `<GoogleLogin onSuccess={handleGoogleSuccess} />` con estilos del sitio
5. `handleGoogleSuccess` llama `POST /api/v1/auth/google` con el credential y guarda el JWT en AuthContext

**Variable de entorno frontend:** `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (obtenida de Google Cloud Console)

---

### Configuración Google Cloud Console (manual, una sola vez)

1. Crear proyecto en [console.cloud.google.com](https://console.cloud.google.com)
2. Habilitar **Google Identity API**
3. Crear credencial **OAuth 2.0 Client ID** tipo "Web application"
4. Agregar en "Authorized JavaScript origins":
   - `https://www.jerseysraw.com`
   - `http://localhost:3000` (para dev)
5. No se necesitan "Authorized redirect URIs" (flujo con popup, no redirect)
6. Copiar el **Client ID** → agregar como `NEXT_PUBLIC_GOOGLE_CLIENT_ID` en Vercel y en `.env.local`

---

### Estado

| Fase | Tarea | Estado |
|------|-------|--------|
| Backend | `POST /auth/google` + migración `googleId` | ❌ Pendiente |
| Frontend | Botón Google en Login y Register | ❌ Pendiente |
| Config | Google Cloud Console + env vars | ❌ Pendiente |
