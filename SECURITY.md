# Guía de seguridad — Asados al Barril

## Qué se corrigió

| # | Problema original | Solución aplicada |
|---|---|---|
| 1 | Credenciales Firebase hardcodeadas en `firebase.js` | Placeholders `__FIREBASE_xxx__` inyectados en build via `scripts/inject-env.js` |
| 2 | Clave pública de EmailJS en el código | Mismo mecanismo de inyección |
| 3 | Reglas Firestore — cualquier auth podía escribir productos/config | Función `isAdmin()` que verifica `users/{uid}.role == "admin"` |
| 4 | Cupones con `allow update: if true` | Update solo por admin o incremento de `usos` en +1 (anónimo, sin alterar otros campos) |
| 5 | Config pública exponía el PIN | `config` ahora requiere `isAdmin()` para lectura y escritura |
| 6 | PIN de admin validado en frontend | PIN **eliminado**. Acceso admin solo mediante Firebase Auth (email + contraseña) |
| 7 | PIN por defecto `123456` hardcodeado | Eliminado junto con el sistema de PIN |
| 8 | XSS via `innerHTML` con datos de usuario | Función `esc()` que escapa `&`, `<`, `>`, `"`, `'` aplicada en todos los archivos |
| 9 | Número de pedido predecible (`Date.now().slice(-6)`) | `crypto.getRandomValues()` — criptográficamente aleatorio |
| 10 | Email y teléfono sin validación de formato | Regex de validación en `saveDatos()` |
| 11 | Carrito se perdía al recargar la página | `sessionStorage` — persiste en recarga, se limpia al cerrar pestaña |
| 12 | Cualquiera podía crearse un cupón con el % de descuento que quisiera (ej. 100%) llamando directo a Firestore | La regla ahora exige que el cupón coincida exacto con una promoción real y activa (`promociones/{promoId}.cuponPct`) |
| 13 | El total del pedido se guardaba tal cual lo enviaba el navegador, sin comparar contra el catálogo real | Cloud Function `onNuevoPedido` recalcula subtotal/cupón/total contra el catálogo real y marca `verificacion.ok = false` en el pedido si no cuadra (ver panel de Pedidos en admin) |
| 14 | Cualquiera podía crear pedidos sin límite (spam/bots) sin necesitar login | Firebase App Check (reCAPTCHA v3) — opcional, requiere configurarlo (ver abajo) |
| 15 | Sin aviso de privacidad pese a recoger nombre/teléfono/dirección/ubicación | Página `/privacidad` enlazada desde el formulario de datos del checkout |
| 16 | Sin monitoreo de errores en producción | Sentry (`@sentry/react`), opcional vía `VITE_SENTRY_DSN` |
| 17 | Sin respaldo de la base de datos | Point-in-Time Recovery + protección contra borrado activados en Firestore |
| 18 | Cambios rotos podían llegar a producción sin que nadie los detectara (pasó con el CSP de reCAPTCHA) | CI en GitHub Actions: lint + typecheck + tests + build en cada push/PR a `main` |

---

## Verificación de pedidos (anti-fraude)

Desde la Cloud Function `onNuevoPedido`, cada pedido nuevo se recalcula contra el catálogo real de productos y contra el cupón real (si se usó uno). Si algo no cuadra, el pedido queda con `verificacion.ok: false` y aparece marcado en rojo ("Pedido sospechoso") en el panel de Pedidos del admin, con el motivo específico.

**Importante:** esto NO cancela ni corrige el pedido automáticamente — solo lo marca para que un humano lo revise, porque un falso positivo (ej. un producto que se borró del menú después de hacer el pedido) no debe bloquear a un cliente real. Requiere desplegar la función actualizada: `cd functions && npm run build && firebase deploy --only functions`.

**Limitación conocida:** la verificación cubre precios de productos, subtotal y validez del cupón. No revalida por completo los descuentos de promociones (`compra_lleva`, `compra_descuento`, `domicilio_descuento`) ni la tarifa de domicilio por distancia — replicar ese motor completo del lado del servidor queda pendiente.

## Activar App Check (protección anti-bot, opcional)

Sin esto, cualquiera puede seguir creando pedidos/cupones vía scripts automatizados sin pasar por la tienda. Con App Check activado, Firestore exige un token de reCAPTCHA v3 válido antes de aceptar cualquier lectura/escritura.

1. En [Firebase Console → App Check](https://console.firebase.google.com/), registra la app web con el proveedor **reCAPTCHA v3** y copia la clave de sitio.
2. Agrega `VITE_RECAPTCHA_SITE_KEY=` con esa clave en tus variables de entorno (Netlify/Vercel/Firebase Hosting) y en tu `.env` local.
3. Prueba primero en modo **monitoreo** (sin "Enforce") para confirmar que no bloquea tráfico legítimo.
4. Cuando confirmes que todo funciona, activa **"Enforce"** para Cloud Firestore en la consola — recién ahí Firestore empieza a rechazar requests sin token válido.

---

## Activar Sentry (monitoreo de errores, opcional)

Sin esto, si algo se rompe en producción (como pasó con el CSP de reCAPTCHA), nadie se entera hasta que un cliente se queja.

1. Crea una cuenta gratis en [sentry.io](https://sentry.io) y un proyecto tipo "React".
2. Copia el DSN que te da (una URL tipo `https://xxx@oXXXXXX.ingest.us.sentry.io/XXXXXX`).
3. Agrega `VITE_SENTRY_DSN=` con ese valor en tus variables de entorno (Vercel/Netlify) y en tu `.env` local.
4. Vuelve a desplegar — los errores no capturados del navegador empezarán a aparecer en tu dashboard de Sentry.

## CI (GitHub Actions)

En cada push o PR a `main` corre automáticamente: `eslint`, `tsc --noEmit`, `vitest` y `vite build` (además de compilar `functions/`). Si algo de esto falla, se ve directamente en la pestaña "Checks" del commit/PR en GitHub — no hace falta correrlo a mano.

**Pendiente opcional:** hoy el deploy de `firestore.rules` y `functions` sigue siendo manual (`firebase deploy`). Para automatizarlo desde CI también, hace falta un token de Firebase (`firebase login:ci`, requiere iniciar sesión interactivamente una vez) guardado como secreto en GitHub (`gh secret set FIREBASE_TOKEN`), y agregar un job de deploy al workflow.

## Respaldo de Firestore

Activado vía `firebase firestore:databases:update "(default)" --point-in-time-recovery ENABLED --delete-protection ENABLED`:
- **Point-in-Time Recovery**: permite recuperar el estado de la base de datos de hasta 7 días atrás si algo se borra o corrompe por error.
- **Delete protection**: bloquea que la base de datos completa se borre por accidente (ej. desde un script mal escrito o un clic equivocado en la consola).

## Cómo configurar el despliegue seguro en Netlify

### 1. Variables de entorno
En tu panel de Netlify → **Site Settings → Environment Variables**, agrega:

```
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=1234567890
FIREBASE_APP_ID=1:1234...:web:abc123

# Opcionales (para confirmación por email)
EMAILJS_PUBLIC_KEY=tu_public_key
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID=template_xxx
```

### 2. Crear el usuario admin en Firebase

En la **consola Firebase → Authentication → Users**, crea el usuario del administrador.
Luego, en **Firestore → users**, crea un documento con el UID del usuario:

```json
{
  "role": "admin",
  "email": "admin@tudominio.com"
}
```

> ⚠️ **Nunca** asignes el rol `admin` desde el cliente. Solo desde la consola de Firebase o una Cloud Function de confianza.

### 3. Aplicar reglas de Firestore

En **Firebase Console → Firestore → Reglas**, pega el contenido de `firestore.rules`.

### 4. Verificar que firebase.js NO tiene credenciales reales

Antes de hacer push al repo, confirma que `js/firebase.js` contiene:
```js
apiKey: "__FIREBASE_API_KEY__",
```
y NO el valor real. El script `inject-env.js` solo reemplaza en el servidor de Netlify durante el build.

---

## Recomendaciones adicionales (no implementadas en este código)

- **Paginación**: Usar `limit()` y `startAfter()` en las consultas de Firestore para no cargar todos los documentos.
- **Motor de promociones server-side**: portar `evaluatePromos` a la Cloud Function para verificar también `compra_lleva`/`compra_descuento`/`domicilio_descuento`, no solo precios de catálogo y cupón.
- **Soporte offline**: Usar `enableIndexedDbPersistence()` de Firebase para caché local.
