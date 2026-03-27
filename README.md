# 🔥 Asados al Barril — Guía de lanzamiento

Sigue estos pasos en orden. No necesitas saber programar.

---

## PASO 1 — Configura Firebase (5 minutos)

1. Ve a **https://console.firebase.google.com**
2. Haz clic en **"Crear un proyecto"**
3. Ponle un nombre (ej: `asados-barril`) y sigue los pasos
4. Una vez dentro del proyecto, haz clic en el ícono **`</>`** (Web) para registrar tu app
5. Firebase te mostrará un bloque de código. Copia los valores de:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

6. Abre el archivo **`js/firebase.js`** con cualquier editor de texto
7. Reemplaza los textos `PEGA_AQUI_TU_...` con los valores que copiaste

---

## PASO 2 — Activa Firestore y Storage

Dentro de tu proyecto en Firebase:

### Firestore (base de datos):
1. Menú izquierdo → **"Build" → "Firestore Database"**
2. Clic en **"Create database"**
3. Selecciona **"Start in test mode"** (por ahora)
4. Elige la región más cercana (ej: `us-central1`) → Listo

### Storage (para fotos):
1. Menú izquierdo → **"Build" → "Storage"**
2. Clic en **"Get started"**
3. Selecciona **"Start in test mode"** → Listo

---

## PASO 3 — Sube el proyecto a GitHub (3 minutos)

1. Ve a **https://github.com** y crea una cuenta si no tienes
2. Haz clic en **"New repository"** (botón verde)
3. Ponle nombre (ej: `asados-barril`) y clic en **"Create repository"**
4. En la pantalla siguiente verás instrucciones. Sigue la opción **"upload an existing file"**
5. Arrastra toda la carpeta del proyecto (o selecciona todos los archivos)
6. Clic en **"Commit changes"** → tu código ya está en GitHub

---

## PASO 4 — Despliega en Netlify (2 minutos)

1. Ve a **https://netlify.com** y crea una cuenta (puedes usar tu cuenta de GitHub)
2. Clic en **"Add new site" → "Import an existing project"**
3. Elige **"GitHub"** y selecciona tu repositorio
4. Deja todas las opciones por defecto y clic en **"Deploy site"**
5. Netlify te dará una URL tipo `https://nombre-random.netlify.app` — ¡eso es tu tienda!

---

## PASO 5 — Personaliza tu tienda

1. Abre la URL de tu tienda
2. Toca el botón **⚙️ Admin** (abajo a la derecha)
3. Ingresa el PIN por defecto: **`123456`**
4. Ve a **Configuración** para:
   - Cambiar el nombre del negocio
   - Subir tu logo
   - Cambiar el PIN (¡hazlo pronto!)
5. Ve a **Categorías** para crear tus categorías
6. Ve a **Productos** para agregar tus platos

---

## Estructura de archivos

```
asados-al-barril/
├── index.html          ← La página principal (no tocar)
├── netlify.toml        ← Config de Netlify (no tocar)
├── css/
│   └── styles.css      ← Todos los estilos visuales
└── js/
    ├── firebase.js     ← ⚠️ AQUÍ van tus credenciales de Firebase
    ├── state.js        ← Variables globales (no tocar)
    ├── ui.js           ← Navegación y modales (no tocar)
    ├── products.js     ← Catálogo y búsqueda (no tocar)
    ├── cart.js         ← Carrito y pedidos (no tocar)
    ├── admin.js        ← Panel de administración (no tocar)
    └── app.js          ← Punto de entrada (no tocar)
```

---

## Preguntas frecuentes

**¿Cómo cambio los colores de la tienda?**
Abre `css/styles.css` y cambia los valores en la sección `:root` al inicio del archivo.

**¿Cómo actualizo la tienda después de hacer cambios?**
Sube los archivos modificados a GitHub (mismo proceso que el Paso 3). Netlify los publica automáticamente en menos de 1 minuto.

**¿Cómo le comparto la tienda a mis clientes?**
Comparte la URL de Netlify. También puedes conectar un dominio propio desde el panel de Netlify.

**¿Cuánto cuesta?**
- Firebase: gratis hasta cierto límite (suficiente para un negocio pequeño)
- Netlify: gratis para sitios estáticos
- Total: **$0** para empezar
