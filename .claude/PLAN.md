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

## Sprint 5 — Rediseño Sistema de Puntos (PENDIENTE — 2026-03-26)

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

### Notas de implementación

- **No tocar** la lógica de `RewardConfig` (admin ya puede ajustar multiplicadores) — solo adaptar los valores por defecto.
- El cupón de jersey gratis debe ser tipo `FREE_JERSEY` con descuento del 100% hasta cierto monto máximo.
- El sistema de cupones ya existe (`coupon.service.ts`, `coupon.routes.ts`) — reutilizar.
- Considerar añadir campo `pointsEarned` a `Order` para mostrar en el historial cuántos puntos dio cada orden.
- Email de notificación cuando el usuario llega al umbral (opcional, Fase 2+).
