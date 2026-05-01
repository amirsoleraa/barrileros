/**
 * Crea el primer usuario administrador en Firebase.
 * Uso: node scripts/setup-admin.mjs correo@ejemplo.com contraseña123
 *
 * Requisito previo:
 *   firebase deploy --only firestore:rules
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));

// Leer .env
const envPath = join(__dir, '../.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter(l => l.trim() && !l.startsWith('#') && l.includes('='))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const API_KEY = env.VITE_FIREBASE_API_KEY;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID;

if (!API_KEY || !PROJECT) {
  console.error('❌  No se encontraron VITE_FIREBASE_API_KEY o VITE_FIREBASE_PROJECT_ID en .env');
  process.exit(1);
}

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('Uso: node scripts/setup-admin.mjs correo@ejemplo.com contraseña123');
  process.exit(1);
}
if (password.length < 6) {
  console.error('❌  La contraseña debe tener al menos 6 caracteres');
  process.exit(1);
}

const AUTH_BASE      = 'https://identitytoolkit.googleapis.com/v1/accounts';
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

// ── 1. Crear usuario en Firebase Auth ───────────────────────────────────────
console.log(`\n🔧  Creando usuario: ${email} …`);
let uid, idToken;

const createRes  = await fetch(`${AUTH_BASE}:signUp?key=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, returnSecureToken: true }),
});
const createData = await createRes.json();

if (createData.error) {
  if (createData.error.message === 'EMAIL_EXISTS') {
    console.log('   El correo ya existe en Firebase Auth — iniciando sesión…');
  } else {
    console.error('❌  Error al crear usuario:', createData.error.message);
    process.exit(1);
  }
} else {
  uid     = createData.localId;
  idToken = createData.idToken;
  console.log(`   ✅ Usuario creado. UID: ${uid}`);
}

// ── 2. Iniciar sesión si ya existía ─────────────────────────────────────────
if (!uid) {
  const signInRes  = await fetch(`${AUTH_BASE}:signInWithPassword?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const signInData = await signInRes.json();
  if (signInData.error) {
    console.error('❌  Error al autenticar:', signInData.error.message);
    process.exit(1);
  }
  uid     = signInData.localId;
  idToken = signInData.idToken;
  console.log(`   ✅ Sesión iniciada. UID: ${uid}`);
}

// ── 3. Crear documento users/{uid} con role: admin ──────────────────────────
console.log('\n🔧  Guardando rol de administrador en Firestore…');
const userDocRes = await fetch(`${FIRESTORE_BASE}/users/${uid}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({
    fields: {
      role:      { stringValue: 'admin' },
      email:     { stringValue: email },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  }),
});
const userDocData = await userDocRes.json();
if (userDocData.error) {
  console.error('❌  Error al guardar el documento de usuario:', userDocData.error.message);
  console.error('   Asegúrate de haber desplegado las reglas: firebase deploy --only firestore:rules');
  process.exit(1);
}
console.log('   ✅ Documento users/' + uid + ' guardado con role: admin');

// ── 4. Crear config/adminReady para bloquear futuros bootstraps ─────────────
console.log('\n🔧  Bloqueando ventana de bootstrap…');
const lockRes  = await fetch(`${FIRESTORE_BASE}/config/adminReady`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
  body: JSON.stringify({
    fields: {
      at:    { timestampValue: new Date().toISOString() },
      email: { stringValue: email },
    },
  }),
});
const lockData = await lockRes.json();
if (lockData.error) {
  console.warn('⚠️   No se pudo crear config/adminReady:', lockData.error.message);
  console.warn('    Puedes crearlo manualmente en la consola de Firebase para mayor seguridad.');
} else {
  console.log('   ✅ config/adminReady creado — bootstrap bloqueado permanentemente');
}

console.log(`
╔══════════════════════════════════════════════╗
║  ✅  Admin creado exitosamente               ║
║                                              ║
║  Correo:    ${email.padEnd(32)}║
║  UID:       ${uid.padEnd(32)}║
║                                              ║
║  Ingresa en: /admin/login                    ║
╚══════════════════════════════════════════════╝
`);
