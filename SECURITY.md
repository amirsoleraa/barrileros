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

---

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
- **Rate limiting en pedidos**: Implementar una Cloud Function que valide la tasa de creación de pedidos por IP.
- **CAPTCHA**: Agregar Google reCAPTCHA v3 al formulario de pedido.
- **Soporte offline**: Usar `enableIndexedDbPersistence()` de Firebase para caché local.
