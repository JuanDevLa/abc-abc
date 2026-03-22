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
