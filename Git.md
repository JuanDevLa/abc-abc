# Git — Historial de Versiones

Registro de cambios por versión. Para volver a cualquier punto:

```bash
git checkout vX.X          # ver ese estado
git checkout v1.2 -- archivo.tsx   # restaurar un archivo específico
git diff v1.2 v1.3 --name-only     # ver qué cambió entre versiones
```

---

## v1.3 — 2026-03-29 · 23:09
**Commit:** `566aef3`
**Tipo:** Feature + Bug fix + Performance

### Cambios
| Área | Archivo | Cambio |
|------|---------|--------|
| Admin | `admin/products/[id]/page.tsx` | Reescritura completa — form idéntico al de creación (club selector con ligas/búsqueda/paginación, tags, género chips, color chips, categoría dropdown, temporada, badge Var X, borrar variantes sin límite) |
| Admin | `admin/products/new/page.tsx` | Stock default 1, precio personalización $50, permite borrar todas las variantes |
| Store | `product/[id]/ProductDetailClient.tsx` | Fix puntos verdes: versión y corte ahora filtran por talla seleccionada (Fan no muestra punto verde si solo Player tiene stock en esa talla) |
| SEO/Perf | `catalog/page.tsx` | `cache: no-store` → `revalidate: 60` (ISR) |
| SEO/Perf | `leagues/[slug]/page.tsx` | `cache: no-store` → `revalidate: 60` (ISR) |
| SEO/Perf | `teams/[slug]/page.tsx` | `cache: no-store` → `revalidate: 60` (ISR) |
| SEO/Perf | `collections/[slug]/page.tsx` | `cache: no-store` → `revalidate: 60` (ISR) |
| UX | `checkout/page.tsx` | `text-base` en todos los inputs (fix iOS auto-zoom) |
| SEO | `sitemap.ts` | Agregadas rutas `/reviews` y `/account-benefits` |
| Seguridad | `backend/src/server.ts` | `express.json` limit 10mb → 100kb |

### Revertir a v1.2
```bash
git checkout v1.2
```

---

## v1.3.1 — 2026-03-30
**Commit:** `7423475`
**Tipo:** Hotfix

### Cambios
| Área | Archivo | Cambio |
|------|---------|--------|
| Admin | `admin/products/[id]/page.tsx` | Fix 400 al guardar producto con etiquetas — `ProductTag` no tiene campo `.id` (PK compuesta), se usaba `product.tagIds` que ya viene calculado correctamente desde la API |
| API | `lib/api.ts` | Fix `[object Object]` en mensajes de error — ahora stringifica objetos Zod en lugar de mostrar `[object Object]` |

### Revertir a v1.3
```bash
git checkout v1.3
```

---

## v1.2 — 2026-03-29
**Commit:** `3b27f45`
**Tipo:** Bug fix + Backend hardening

Estado estable anterior a v1.3. Sprint A+C completado.

---

<!-- PLANTILLA PARA PRÓXIMAS VERSIONES

## vX.X — YYYY-MM-DD · HH:MM
**Commit:** ``
**Tipo:** Feature | Bug fix | Performance | Refactor | Hotfix

### Cambios
| Área | Archivo | Cambio |
|------|---------|--------|
|  |  |  |

-->
