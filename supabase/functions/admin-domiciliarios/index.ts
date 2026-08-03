// ═══════════════════════════════════════════════════════════════════════
// admin-domiciliarios — Edge Function
//
// Firebase permitía crear la cuenta de Auth de un domiciliario desde el
// panel admin usando una segunda "app" del SDK cliente (ver
// DomiciliariosPanel.tsx original: getSecondaryAuth() + createUserWithEmailAndPassword).
// El SDK cliente de Supabase no tiene ese atajo: crear la cuenta de otra
// persona sin sacar al admin de su propia sesión requiere la service role
// key, que nunca puede vivir en el navegador. Esta función la reemplaza:
// corre server-side con la service role key y expone dos acciones que el
// admin invoca desde el panel (supabase.functions.invoke('admin-domiciliarios', ...)).
//
// A diferencia de Firebase, no hace falta guardar la contraseña en texto
// plano en la tabla domiciliarios: auth.admin.updateUserById cambia la
// contraseña de cualquier usuario sin necesitar reautenticarse como él.
// ═══════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

const DOM_EMAIL_DOMAIN = '@dom.barrileros.co';

Deno.serve(async (req: Request) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verifica que quien llama es el admin autenticado (no la service role)
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await callerClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'No autenticado' }), { status: 401 });
    }

    const admin = createClient(url, serviceKey);
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Solo un admin puede administrar domiciliarios' }), { status: 403 });
    }

    const body = await req.json();

    if (body.action === 'create') {
      const { usuario, password } = body as { usuario: string; password: string };
      const email = `${usuario.trim().toLowerCase()}${DOM_EMAIL_DOMAIN}`;
      const { data, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (error) {
        const code = error.message.includes('already') ? 'email-already-in-use' : 'unknown';
        return new Response(JSON.stringify({ error: error.message, code }), { status: 400 });
      }
      return new Response(JSON.stringify({ uid: data.user.id }), { status: 200 });
    }

    if (body.action === 'set-password') {
      const { uid, password } = body as { uid: string; password: string };
      const { error } = await admin.auth.admin.updateUserById(uid, { password });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Acción desconocida' }), { status: 400 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
