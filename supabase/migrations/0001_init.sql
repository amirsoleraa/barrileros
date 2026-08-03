-- ═══════════════════════════════════════════════════════════════════════
-- 0001_init.sql — Esquema Postgres + RLS + trigger para Barrileros
-- Puerto de: firestore.rules + functions/src/index.ts (onNuevoPedido)
--
-- Principio: entidades estructurales -> tablas con columnas propias;
-- datos embebidos que en Firestore vivían como objetos anidados dentro de
-- un doc y nunca se consultaban por separado (items de un pedido, snapshot
-- de cliente/ubicación, snapshots de historial) -> columnas JSONB, para no
-- normalizar de más en esta migración (eso queda para cuando se construya
-- el módulo contable/facturación).
-- ═══════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────────────────────────────────────────────────────────────────
-- TABLAS
-- ───────────────────────────────────────────────────────────────────────

-- Roles (reemplaza users/{uid}). Sin fila = cliente.
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  role            text not null check (role in ('admin', 'domiciliario')),
  domiciliario_id uuid,
  created_at      timestamptz not null default now()
);

-- Configuración de la tienda (reemplaza config/{main,colores,adminSettings,delivery_settings,adminReady})
create table config (
  key        text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table categorias (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null,
  color   text not null default '#F4521E',
  emoji   text,
  img_url text,
  orden   int not null default 0
);

create table adicionales (
  id      uuid primary key default gen_random_uuid(),
  nombre  text not null,
  precio  numeric not null default 0,
  costo   numeric not null default 0,
  activo  boolean not null default true
);

create table productos (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  precio        numeric not null default 0,
  costo         numeric not null default 0,
  emoji         text,
  img_url       text,
  categoria_id  uuid references categorias(id) on delete set null,
  tipo          text not null check (tipo in ('comestible', 'nocomestible')),
  ingredientes  text[] not null default '{}',
  -- [{ adicionalId, cantidadMax }] — config embebida, no se consulta aparte
  adicionales   jsonb not null default '[]'::jsonb,
  activo        boolean not null default true
);

create table novedades (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  img_url     text,
  activa      boolean not null default true,
  created_at  timestamptz not null default now()
);

create table publicidades (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text,
  img_url     text,
  activa      boolean not null default true,
  orden       int not null default 0,
  created_at  timestamptz not null default now()
);

create table barrios (
  id     uuid primary key default gen_random_uuid(),
  nombre text not null,
  activo boolean not null default true,
  orden  int not null default 0
);

create table domiciliarios (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  tel       text,
  activo    boolean not null default true,
  pago_base numeric not null default 0,
  usuario   text unique,
  -- La cuenta de acceso (auth.users) se crea vía Edge Function con service
  -- role — a diferencia de Firebase, no hace falta guardar la contraseña
  -- en texto plano para poder cambiarla después (auth.admin.updateUserById
  -- no requiere reautenticación).
  uid       uuid references auth.users(id) on delete set null
);

alter table profiles
  add constraint profiles_domiciliario_id_fkey
  foreign key (domiciliario_id) references domiciliarios(id) on delete set null;

create table promociones (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  tipo             text not null check (tipo in ('compra_lleva', 'compra_descuento', 'domicilio_descuento', 'compra_cupon')),
  activa           boolean not null default true,
  descripcion      text,
  producto_a_id    uuid references productos(id) on delete set null,
  cantidad_a       int,
  producto_b_id    uuid references productos(id) on delete set null,
  cantidad_b       int,
  descuento_b_pct  numeric,
  domicilio_pct    numeric,
  domicilio_gratis boolean,
  cupon_pct        numeric,
  created_at       timestamptz not null default now()
);

-- El código del cupón ES el id (igual que el doc-id en Firestore)
create table cupones (
  codigo         text primary key,
  tipo           text not null check (tipo in ('porcentaje', 'fijo')),
  valor          numeric not null,
  limite         int not null default 0,
  usos           int not null default 0,
  activo         boolean not null default true,
  origen         text,
  promo_id       uuid references promociones(id) on delete set null,
  cliente_nombre text,
  cliente_tel    text,
  pedido_numero  text,
  promo_nombre   text,
  created_at     timestamptz not null default now()
);

create table pedidos (
  id                   uuid primary key default gen_random_uuid(),
  numero               text not null,
  estado               text not null check (estado in ('activos', 'preparando', 'camino', 'entregado', 'cancelado')),
  -- { nombre, correo?, tel?, dir?, barrio?, comp?, recibe? } — snapshot al momento del pedido
  cliente              jsonb not null,
  cliente_uid          uuid references auth.users(id) on delete set null,
  -- [{ id, nombre, precio, qty, extras }] — snapshot de precios/nombres al momento del pedido
  items                jsonb not null,
  subtotal             numeric not null default 0,
  domicilio            numeric not null default 0,
  descuento            numeric not null default 0,
  total                numeric not null,
  cupon                text references cupones(codigo) on delete set null,
  mensaje_confirmacion text,
  -- { lat, lng, address, barrio, notes, distance_km, delivery_fee }
  location             jsonb,
  created_at           timestamptz not null default now(),
  ruta_nombre          text,
  repartidor_nombre    text,
  domiciliario_id      uuid references domiciliarios(id) on delete set null,
  nota_pendiente       text,
  es_manual            boolean not null default false,
  notas                text,
  promos_aplicadas     jsonb,
  -- { ok, motivo?, subtotalReal?, verificadoEn? } — la escribe el trigger onNuevoPedido
  verificacion         jsonb,
  constraint pedidos_total_check check (total > 0 and total < 10000000),
  constraint pedidos_items_check check (jsonb_array_length(items) > 0 and jsonb_array_length(items) < 50)
);

create table rutas (
  id               uuid primary key default gen_random_uuid(),
  nombre           text not null,
  repartidor       text,
  domiciliario_id  uuid references domiciliarios(id) on delete set null,
  pedido_ids       uuid[] not null default '{}',
  estado           text not null check (estado in ('activa', 'completada')),
  created_at       timestamptz not null default now(),
  completada_en    timestamptz,
  -- snapshot de los pedidos de la ruta al momento de finalizarla
  pedidos_snapshot jsonb
);

create table historial_pedidos (
  id                uuid primary key default gen_random_uuid(),
  fecha             date not null,
  fecha_label       text,
  -- snapshot de pedidos entregados/cancelados del día — es un archivo, no se
  -- vuelve a consultar relacionalmente
  pedidos           jsonb not null default '[]'::jsonb,
  total_entregados  int not null default 0,
  total_cancelados  int not null default 0,
  total_recaudo     numeric not null default 0,
  creado_en         timestamptz not null default now()
);

create table historial_rutas (
  id                  uuid primary key default gen_random_uuid(),
  fecha               date not null,
  fecha_label         text,
  ruta_nombre         text,
  domiciliario_id     uuid references domiciliarios(id) on delete set null,
  domiciliario_nombre text,
  pedidos             jsonb not null default '[]'::jsonb,
  creado_en           timestamptz not null default now()
);

-- Reemplaza la subcolección notificaciones/{domId}/items
create table notificaciones (
  id              uuid primary key default gen_random_uuid(),
  domiciliario_id uuid not null references domiciliarios(id) on delete cascade,
  tipo            text not null check (tipo in ('asignacion_ruta', 'reasignacion', 'nuevo_pedido')),
  mensaje         text not null,
  leida           boolean not null default false,
  ruta_id         uuid references rutas(id) on delete set null,
  pedido_id       uuid references pedidos(id) on delete set null,
  numero          text,
  cliente_nombre  text,
  created_at      timestamptz not null default now()
);

-- Cuenta de comprador (login opcional)
create table clientes (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text,
  correo     text,
  telefono   text,
  favoritos  uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table direcciones (
  id         uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes(id) on delete cascade,
  etiqueta   text,
  direccion  text,
  barrio     text,
  notas      text,
  lat        numeric,
  lng        numeric,
  created_at timestamptz not null default now()
);

create index on productos (categoria_id);
create index on pedidos (estado);
create index on pedidos (cliente_uid);
create index on pedidos (created_at desc);
create index on rutas (estado, domiciliario_id);
create index on notificaciones (domiciliario_id, created_at desc);
create index on historial_pedidos (fecha desc);
create index on historial_rutas (domiciliario_id, fecha desc);
create index on direcciones (cliente_id);

-- ───────────────────────────────────────────────────────────────────────
-- HELPERS (equivalentes a las funciones de firestore.rules)
-- ───────────────────────────────────────────────────────────────────────

create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function is_domiciliario()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'domiciliario');
$$;

create or replace function my_domiciliario_id()
returns uuid language sql stable security definer set search_path = public as $$
  select domiciliario_id from profiles where id = auth.uid();
$$;

-- ───────────────────────────────────────────────────────────────────────
-- RLS
-- ───────────────────────────────────────────────────────────────────────

alter table profiles         enable row level security;
alter table config            enable row level security;
alter table categorias        enable row level security;
alter table productos         enable row level security;
alter table adicionales       enable row level security;
alter table novedades         enable row level security;
alter table publicidades      enable row level security;
alter table barrios           enable row level security;
alter table domiciliarios     enable row level security;
alter table promociones       enable row level security;
alter table cupones           enable row level security;
alter table pedidos           enable row level security;
alter table rutas             enable row level security;
alter table historial_pedidos enable row level security;
alter table historial_rutas   enable row level security;
alter table notificaciones    enable row level security;
alter table clientes          enable row level security;
alter table direcciones       enable row level security;

-- profiles: cada quien lee su propio perfil o admin lee todos; bootstrap de
-- admin solo si no existe config['adminReady'] (en la práctica el primer
-- admin se crea a mano por SQL, esto es solo la red de seguridad equivalente).
create policy "profiles_select" on profiles for select
  using (auth.uid() = id or is_admin());
create policy "profiles_insert" on profiles for insert
  with check (
    is_admin()
    or (auth.uid() = id and role = 'admin' and not exists (select 1 from config where key = 'adminReady'))
  );
create policy "profiles_update" on profiles for update
  using (is_admin());
create policy "profiles_delete" on profiles for delete
  using (is_admin());

-- config: main/colores/delivery_settings públicos; el resto solo admin.
-- adminReady se puede crear una sola vez (bootstrap) por cualquiera.
create policy "config_select" on config for select
  using (key in ('main', 'colores', 'delivery_settings') or is_admin());
create policy "config_insert" on config for insert
  with check (is_admin() or (key = 'adminReady' and not exists (select 1 from config c where c.key = 'adminReady')));
create policy "config_update" on config for update
  using (is_admin());
create policy "config_delete" on config for delete
  using (is_admin());

-- catálogo público, escritura solo admin
create policy "categorias_select" on categorias for select using (true);
create policy "categorias_write"  on categorias for all using (is_admin()) with check (is_admin());

create policy "productos_select" on productos for select using (true);
create policy "productos_write"  on productos for all using (is_admin()) with check (is_admin());

create policy "adicionales_select" on adicionales for select using (true);
create policy "adicionales_write"  on adicionales for all using (is_admin()) with check (is_admin());

create policy "novedades_select" on novedades for select using (true);
create policy "novedades_write"  on novedades for all using (is_admin()) with check (is_admin());

create policy "publicidades_select" on publicidades for select using (true);
create policy "publicidades_write"  on publicidades for all using (is_admin()) with check (is_admin());

create policy "barrios_select" on barrios for select using (true);
create policy "barrios_write"  on barrios for all using (is_admin()) with check (is_admin());

create policy "promociones_select" on promociones for select using (true);
create policy "promociones_write"  on promociones for all using (is_admin()) with check (is_admin());

-- domiciliarios: solo admin y domiciliarios lo leen; solo admin escribe
-- (la cuenta de auth.users se crea vía Edge Function con service role)
create policy "domiciliarios_select" on domiciliarios for select
  using (is_admin() or is_domiciliario());
create policy "domiciliarios_write" on domiciliarios for all
  using (is_admin()) with check (is_admin());

-- cupones: lectura puntual pública solo vía función get_cupon() (abajo);
-- el listado de la tabla completa queda restringido a admin (equivalente a
-- "allow get: if true; allow list: if isAdmin();" de Firestore).
create policy "cupones_select" on cupones for select
  using (is_admin());
create policy "cupones_insert" on cupones for insert
  with check (
    is_admin()
    or (
      origen = 'promo' and activo = true and usos = 0 and limite = 1 and tipo = 'porcentaje'
      and promo_id is not null
      and exists (
        select 1 from promociones pr
        where pr.id = cupones.promo_id and pr.activa = true and pr.tipo = 'compra_cupon'
          and pr.cupon_pct = cupones.valor
      )
    )
  );
create policy "cupones_update" on cupones for update using (true) with check (true);
create policy "cupones_delete" on cupones for delete using (is_admin());

-- Lookup público de un cupón por código (equivalente a "allow get: if true")
create or replace function get_cupon(p_codigo text)
returns setof cupones language sql stable security definer set search_path = public as $$
  select * from cupones where codigo = p_codigo;
$$;

-- pedidos: create abierto (valida forma vía CHECK constraints de la tabla);
-- read según rol/dueño; update de domiciliario restringido a ciertas
-- columnas (ver trigger); delete solo admin.
create policy "pedidos_select" on pedidos for select
  using (is_admin() or is_domiciliario() or (auth.uid() = cliente_uid));
create policy "pedidos_insert" on pedidos for insert
  with check (true);
create policy "pedidos_update" on pedidos for update
  using (is_admin() or is_domiciliario());
create policy "pedidos_delete" on pedidos for delete
  using (is_admin());

-- Domiciliario solo puede tocar estado/ruta_nombre/repartidor_nombre/
-- domiciliario_id/nota_pendiente (equivalente al affectedKeys().hasOnly(...)
-- de firestore.rules — RLS no compara columnas antiguas vs nuevas, se
-- necesita un trigger).
create or replace function enforce_pedido_update_columns()
returns trigger language plpgsql as $$
begin
  if is_admin() then
    return new;
  end if;
  if is_domiciliario() then
    if new.numero               is distinct from old.numero
    or new.cliente               is distinct from old.cliente
    or new.cliente_uid           is distinct from old.cliente_uid
    or new.items                 is distinct from old.items
    or new.subtotal               is distinct from old.subtotal
    or new.domicilio              is distinct from old.domicilio
    or new.descuento              is distinct from old.descuento
    or new.total                  is distinct from old.total
    or new.cupon                  is distinct from old.cupon
    or new.mensaje_confirmacion   is distinct from old.mensaje_confirmacion
    or new.location                is distinct from old.location
    or new.created_at              is distinct from old.created_at
    or new.es_manual                is distinct from old.es_manual
    or new.notas                    is distinct from old.notas
    or new.promos_aplicadas         is distinct from old.promos_aplicadas
    or new.verificacion              is distinct from old.verificacion
    then
      raise exception 'domiciliario solo puede modificar estado/rutaNombre/repartidorNombre/domiciliarioId/notaPendiente';
    end if;
    return new;
  end if;
  raise exception 'sin permisos para actualizar este pedido';
end;
$$;

create trigger trg_enforce_pedido_update_columns
  before update on pedidos
  for each row execute function enforce_pedido_update_columns();

-- rutas: cada domiciliario solo ve/toca sus propias rutas
create policy "rutas_select" on rutas for select
  using (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));
create policy "rutas_insert" on rutas for insert
  with check (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));
create policy "rutas_update" on rutas for update
  using (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));
create policy "rutas_delete" on rutas for delete
  using (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));

create policy "historial_pedidos_select" on historial_pedidos for select
  using (is_admin() or is_domiciliario());
create policy "historial_pedidos_write" on historial_pedidos for all
  using (is_admin()) with check (is_admin());

create policy "historial_rutas_select" on historial_rutas for select
  using (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));
create policy "historial_rutas_insert" on historial_rutas for insert
  with check (is_admin() or (is_domiciliario() and domiciliario_id = my_domiciliario_id()));
create policy "historial_rutas_delete" on historial_rutas for delete
  using (is_admin());

-- notificaciones: cualquier admin/domiciliario puede leer, crear y marcar
-- como leída CUALQUIER notificación (así estaban las reglas de Firestore
-- originales — no restringen por domiciliario_id propio; se preserva tal
-- cual para no cambiar comportamiento).
create policy "notificaciones_select" on notificaciones for select
  using (is_admin() or is_domiciliario());
create policy "notificaciones_insert" on notificaciones for insert
  with check (is_admin() or is_domiciliario());
create policy "notificaciones_update" on notificaciones for update
  using (is_admin() or is_domiciliario());
create policy "notificaciones_delete" on notificaciones for delete
  using (is_admin());

-- clientes: cada quien lee/escribe su propio perfil
create policy "clientes_select" on clientes for select using (auth.uid() = id);
create policy "clientes_insert" on clientes for insert with check (auth.uid() = id);
create policy "clientes_update" on clientes for update using (auth.uid() = id);

create policy "direcciones_select" on direcciones for select
  using (exists (select 1 from clientes c where c.id = direcciones.cliente_id and c.id = auth.uid()));
create policy "direcciones_write" on direcciones for all
  using (exists (select 1 from clientes c where c.id = direcciones.cliente_id and c.id = auth.uid()))
  with check (exists (select 1 from clientes c where c.id = direcciones.cliente_id and c.id = auth.uid()));

-- ───────────────────────────────────────────────────────────────────────
-- TRIGGER onNuevoPedido (puerto de functions/src/index.ts)
-- Corre SECURITY DEFINER: necesita leer productos/cupones/domiciliarios sin
-- las restricciones de RLS que aplican al cliente que crea el pedido —
-- igual que la Cloud Function corría con privilegios de Admin SDK.
-- ───────────────────────────────────────────────────────────────────────

create or replace function on_nuevo_pedido()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  tolerancia  constant numeric := 1;
  item        jsonb;
  precio_real numeric;
  subtotal_real numeric := 0;
  total_esperado numeric;
  motivo      text;
  cup         cupones%rowtype;
  verif       jsonb;
begin
  -- 1. Incremento atómico del cupón
  if new.cupon is not null then
    update cupones set usos = usos + 1 where codigo = new.cupon;
  end if;

  -- 2. Notificaciones a domiciliarios activos
  insert into notificaciones (domiciliario_id, tipo, pedido_id, numero, cliente_nombre, leida)
  select id, 'nuevo_pedido', new.id, new.numero, coalesce(new.cliente->>'nombre', '')
  from domiciliarios where activo = true;

  -- 3. Verificación anti-manipulación: recalcula contra el catálogo real
  motivo := null;

  for item in select * from jsonb_array_elements(new.items)
  loop
    select precio into precio_real from productos where id = (item->>'id')::uuid;
    if precio_real is null then
      motivo := format('El producto "%s" (%s) ya no existe en el catálogo', item->>'nombre', item->>'id');
      exit;
    end if;
    if abs(precio_real - (item->>'precio')::numeric) > tolerancia then
      motivo := format('Precio de "%s" no coincide: catálogo dice %s, el pedido dice %s', item->>'nombre', precio_real, item->>'precio');
      exit;
    end if;
    subtotal_real := subtotal_real + precio_real * (item->>'qty')::numeric;
  end loop;

  if motivo is null and abs(subtotal_real - new.subtotal) > tolerancia then
    motivo := format('Subtotal no coincide: real %s, el pedido dice %s', subtotal_real, new.subtotal);
  end if;

  if motivo is null and new.cupon is not null then
    select * into cup from cupones where codigo = new.cupon;
    if not found then
      motivo := format('El cupón "%s" no existe', new.cupon);
    elsif cup.activo is not true then
      motivo := format('El cupón "%s" está inactivo', new.cupon);
    elsif cup.usos >= greatest(cup.limite, 1) then
      motivo := format('El cupón "%s" ya se agotó', new.cupon);
    end if;
  end if;

  if motivo is null then
    total_esperado := subtotal_real + coalesce(new.domicilio, 0) - coalesce(new.descuento, 0);
    if abs(total_esperado - new.total) > tolerancia then
      motivo := format('Total no cuadra: subtotal %s + domicilio %s - descuento %s = %s, pero el pedido dice %s',
        subtotal_real, new.domicilio, new.descuento, total_esperado, new.total);
    end if;
  end if;

  verif := jsonb_build_object(
    'ok', motivo is null,
    'subtotalReal', subtotal_real,
    'verificadoEn', to_jsonb(now())
  );
  if motivo is not null then
    verif := verif || jsonb_build_object('motivo', motivo);
  end if;

  update pedidos set verificacion = verif where id = new.id;

  return new;
end;
$$;

create trigger trg_on_nuevo_pedido
  after insert on pedidos
  for each row execute function on_nuevo_pedido();

-- ───────────────────────────────────────────────────────────────────────
-- REALTIME — habilitar postgres_changes para las tablas con onSnapshot hoy
-- ───────────────────────────────────────────────────────────────────────

alter publication supabase_realtime add table
  pedidos, rutas, notificaciones, categorias, productos, adicionales,
  novedades, publicidades, barrios, domiciliarios, promociones, config, clientes;
