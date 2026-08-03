/**
 * Crea el primer usuario administrador en Supabase.
 * Uso: node scripts/setup-admin.mjs correo@ejemplo.com contraseña123
 *
 * Requiere en .env (o variables de entorno):
 *   VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (Dashboard → Project Settings → API — nunca la anon key, y nunca subir este valor al repo)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createClient } from '@supabase/supabase-js';

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

const SUPABASE_URL = env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌  Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env');
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

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ── 1. Crear usuario en Supabase Auth ───────────────────────────────────────
console.log(`\n🔧  Creando usuario: ${email} …`);
let uid;

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email, password, email_confirm: true,
});

if (createError) {
  if (createError.message.toLowerCase().includes('already')) {
    console.log('   El correo ya existe en Supabase Auth — buscando su usuario…');
    const { data: list, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error('❌  Error al buscar el usuario existente:', listError.message);
      process.exit(1);
    }
    const existing = list.users.find(u => u.email === email);
    if (!existing) {
      console.error('❌  No se encontró el usuario existente con ese correo.');
      process.exit(1);
    }
    uid = existing.id;
    console.log(`   ✅ Usuario existente encontrado. UID: ${uid}`);
  } else {
    console.error('❌  Error al crear usuario:', createError.message);
    process.exit(1);
  }
} else {
  uid = created.user.id;
  console.log(`   ✅ Usuario creado. UID: ${uid}`);
}

// ── 2. Crear profiles/{uid} con role: admin ─────────────────────────────────
console.log('\n🔧  Guardando rol de administrador…');
const { error: profileError } = await admin.from('profiles').upsert({ id: uid, role: 'admin' });
if (profileError) {
  console.error('❌  Error al guardar el perfil de administrador:', profileError.message);
  process.exit(1);
}
console.log(`   ✅ profiles/${uid} guardado con role: admin`);

// ── 3. Crear config['adminReady'] para bloquear futuros bootstraps ─────────
console.log('\n🔧  Bloqueando ventana de bootstrap…');
const { error: lockError } = await admin.from('config').upsert({
  key: 'adminReady',
  data: { at: new Date().toISOString(), email },
});
if (lockError) {
  console.warn('⚠️   No se pudo crear config[adminReady]:', lockError.message);
  console.warn('    Puedes crearlo manualmente en el SQL Editor de Supabase para mayor seguridad.');
} else {
  console.log('   ✅ config[adminReady] creado — bootstrap bloqueado permanentemente');
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
