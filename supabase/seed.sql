-- ═══════════════════════════════════════════════════════════════════════
-- seed.sql — Datos mínimos para que `npm run dev` muestre algo apenas se
-- conecte un proyecto de Supabase nuevo. Corre después de 0001_init.sql.
-- No incluye datos reales de negocio (pre-lanzamiento, sin datos que migrar).
-- ═══════════════════════════════════════════════════════════════════════

insert into config (key, data) values
  ('main', jsonb_build_object(
    'nombreComercio', 'Barrileros',
    'logoEmoji', '🔥',
    'logoUrl', '',
    'domicilioActivo', true,
    'domicilioTipo', 'fijo',
    'domicilioValor', 5000,
    'mensajeConfirmacion', 'Tu pedido está siendo preparado. ¡Gracias por tu compra!',
    'whatsappNumero', '',
    'camposFormulario', jsonb_build_object(
      'correo', true, 'tel', true, 'dir', true, 'barrio', true, 'comp', true, 'recibe', true
    )
  )),
  ('colores', '{}'::jsonb)
on conflict (key) do nothing;

with cat as (
  insert into categorias (nombre, color, emoji, orden)
  values ('Asados', '#F4521E', '🍖', 0)
  returning id
)
insert into productos (nombre, descripcion, precio, costo, emoji, categoria_id, tipo, ingredientes, activo)
select 'Combo Barril Clásico', 'Carne, chorizo, papa criolla y arepa', 28000, 15000, '🍖', cat.id, 'comestible', array['Carne', 'Chorizo', 'Papa criolla', 'Arepa'], true
from cat;
