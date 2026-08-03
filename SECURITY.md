# Guía de seguridad — Asados al Barril

## Qué se corrigió

| # | Problema original | Solución aplicada |
|---|---|---|
| 1 | Credenciales Firebase hardcodeadas en `firebase.js` | Placeholders `__FIREBASE_xxx__` inyectados en build via `scripts/inject-env.js` (histórico — el proyecto ahora usa Supabase, ver más abajo) |
| 2 | Clave pública de EmailJS en el código | Mismo mecanismo de inyección |
| 3 | Reglas Firestore — cualquier auth podía escribir productos/config | Función `is_admin()` en Postgres (RLS) que verifica `profiles.role == 'admin'` |
| 4 | Cupones con `allow update: if true` | Update solo por admin o incremento de `usos` en +1 (anónimo, sin alterar otros campos) |
| 5 | Config pública exponía el PIN | La fila `config['adminSettings']` (PINs) solo la lee `is_admin()` |
| 6 | PIN de admin validado en frontend | PIN **eliminado**. Acceso admin solo mediante Supabase Auth (email + contraseña) |
| 7 | PIN por defecto `123456` hardcodeado | Eliminado junto con el sistema de PIN |
| 8 | XSS via `innerHTML` con datos de usuario | Función `esc()` que escapa `&`, `<`, `>`, `"`, `'` aplicada en todos los archivos |
| 9 | Número de pedido predecible (`Date.now().slice(-6)`) | `crypto.getRandomValues()` — criptográficamente aleatorio |
| 10 | Email y teléfono sin validación de formato | Regex de validación en `saveDatos()` |
| 11 | Carrito se perdía al recargar la página | `sessionStorage` — persiste en recarga, se limpia al cerrar pestaña |
| 12 | Cualquiera podía crearse un cupón con el % de descuento que quisiera (ej. 100%) llamando directo a la base de datos | La política RLS de `cupones` exige que el cupón coincida exacto con una promoción real y activa (`promociones.cupon_pct`) |
| 13 | El total del pedido se guardaba tal cual lo enviaba el navegador, sin comparar contra el catálogo real | Trigger `on_nuevo_pedido` (Postgres) recalcula subtotal/cupón/total contra el catálogo real y marca `verificacion.ok = false` en el pedido si no cuadra (ver panel de Pedidos en admin) |
| 14 | Cualquiera podía crear pedidos sin límite (spam/bots) sin necesitar login | Sin protección anti-bot activa por ahora — App Check (Firebase) no tiene equivalente directo en Supabase; queda pendiente evaluar Cloudflare Turnstile + verificación en una Edge Function (ver abajo) |
| 15 | Sin aviso de privacidad pese a recoger nombre/teléfono/dirección/ubicación | Página `/privacidad` enlazada desde el formulario de datos del checkout |
| 16 | Sin monitoreo de errores en producción | Sentry (`@sentry/react`), opcional vía `VITE_SENTRY_DSN` |
| 17 | Sin respaldo de la base de datos | Point-in-Time Recovery de Supabase (según el plan del proyecto) |
| 18 | Cambios rotos podían llegar a producción sin que nadie los detectara | CI en GitHub Actions: lint + typecheck + tests + build en cada push/PR a `main` |

---

## Verificación de pedidos (anti-fraude)

Cada pedido nuevo dispara el trigger `on_nuevo_pedido` (definido en
`supabase/migrations/0001_init.sql`), que recalcula el pedido contra el
catálogo real de productos y contra el cupón real (si se usó uno), dentro de
la misma transacción del insert. Si algo no cuadra, el pedido queda con
`verificacion.ok: false` y aparece marcado en rojo ("Pedido sospechoso") en
el panel de Pedidos del admin, con el motivo específico.

**Importante:** esto NO cancela ni corrige el pedido automáticamente — solo
lo marca para que un humano lo revise, porque un falso positivo (ej. un
producto que se borró del menú después de hacer el pedido) no debe bloquear
a un cliente real. El trigger se despliega junto con el resto del esquema
(`supabase db push` o pegando el SQL en el SQL Editor de Supabase).

**Limitación conocida:** la verificación cubre precios de productos,
subtotal y validez del cupón. No revalida por completo los descuentos de
promociones (`compra_lleva`, `compra_descuento`, `domicilio_descuento`) ni
la tarifa de domicilio por distancia — replicar ese motor completo del lado
del servidor queda pendiente.

## Protección anti-bot (pendiente)

Sin esto, cualquiera puede seguir creando pedidos/cupones vía scripts
automatizados sin pasar por la tienda — igual que en la versión anterior
sin App Check configurado. Supabase no tiene un equivalente directo a
Firebase App Check. Si se quiere esta capa, la opción recomendada es:

1. Agregar [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) al formulario de checkout (widget invisible o gestionado).
2. Verificar el token en una Edge Function de Supabase antes de aceptar el insert (o exigirlo desde una RLS policy que llame a esa función).

---

## Activar Sentry (monitoreo de errores, opcional)

Sin esto, si algo se rompe en producción, nadie se entera hasta que un
cliente se queja.

1. Crea una cuenta gratis en [sentry.io](https://sentry.io) y un proyecto tipo "React".
2. Copia el DSN que te da (una URL tipo `https://xxx@oXXXXXX.ingest.us.sentry.io/XXXXXX`).
3. Agrega `VITE_SENTRY_DSN=` con ese valor en tus variables de entorno (Vercel/Netlify) y en tu `.env` local.
4. Vuelve a desplegar — los errores no capturados del navegador empezarán a aparecer en tu dashboard de Sentry.

## CI (GitHub Actions)

En cada push o PR a `main` corre automáticamente: `eslint`, `tsc --noEmit`,
`vitest` y `vite build`. Si algo de esto falla, se ve directamente en la
pestaña "Checks" del commit/PR en GitHub — no hace falta correrlo a mano.

**Pendiente:** el despliegue de `supabase/migrations` (esquema + RLS +
trigger) y de `supabase/functions` (Edge Functions) todavía es manual
(`supabase db push`, `supabase functions deploy`). Automatizarlo desde CI
requiere el token/project-ref de Supabase guardado como secreto en GitHub.

## Respaldo de la base de datos

Los planes pagos de Supabase incluyen Point-in-Time Recovery — actívalo
desde el dashboard del proyecto (Settings → Add-ons → Point in Time
Recovery) según el plan que uses.

## Cómo configurar el proyecto de Supabase

### 1. Crear el proyecto y correr el esquema

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, corre `supabase/migrations/0001_init.sql` y luego (opcional) `supabase/seed.sql`.
3. En **Authentication → Providers**, habilita el proveedor **Google** si vas a usar login social de clientes.
4. Despliega la Edge Function `supabase/functions/admin-domiciliarios` (`supabase functions deploy admin-domiciliarios`) — la usa el panel admin para crear/actualizar el acceso de los domiciliarios.

### 2. Variables de entorno

En tu panel de Netlify/Vercel → **Environment Variables**, agrega:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key

# Opcionales (para confirmación por email)
VITE_EMAILJS_PUBLIC_KEY=tu_public_key
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
```

### 3. Crear el usuario admin

En **Authentication → Users** del dashboard de Supabase, crea el usuario
del administrador (o usa "Invite user"). Luego, en el **SQL Editor**:

```sql
insert into profiles (id, role) values ('<uid-del-usuario>', 'admin');
```

> ⚠️ **Nunca** asignes el rol `admin` desde el cliente. Solo desde el SQL
> Editor de Supabase (usa la service role, que bypassa RLS) o una Edge
> Function de confianza.

---

## Recomendaciones adicionales (no implementadas en este código)

- **Paginación**: usar `.range()` en las consultas de Supabase para no cargar todas las filas de una vez en tablas que puedan crecer mucho (ej. `pedidos`, `historial_pedidos`).
- **Motor de promociones server-side**: portar `evaluatePromos` al trigger `on_nuevo_pedido` para verificar también `compra_lleva`/`compra_descuento`/`domicilio_descuento`, no solo precios de catálogo y cupón.
- **Protección anti-bot**: ver sección "Protección anti-bot (pendiente)" arriba.
