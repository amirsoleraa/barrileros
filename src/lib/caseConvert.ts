// ═══════════════════════════════════════════════
// lib/caseConvert.ts — snake_case (Postgres) <-> camelCase (app)
//
// Los tipos de src/types/index.ts y todo el JSX de la app quedan en
// camelCase intactos; esta es la única frontera que traduce hacia/desde
// Supabase, para no tener que tocar cientos de usos de `p.categoriaId`,
// `cat.imgUrl`, etc. al migrar cada punto de lectura/escritura.
// ═══════════════════════════════════════════════

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && !(v instanceof Date);
}

function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function camelToSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/** Convierte recursivamente las llaves de un valor leído de Supabase a camelCase. */
export function toCamel<T = Record<string, unknown>>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => toCamel(v)) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[snakeToCamelKey(k)] = toCamel(v);
    return out as T;
  }
  return value as T;
}

/** Convierte recursivamente las llaves de un valor de la app a snake_case para escribir en Supabase. */
export function toSnake<T = Record<string, unknown>>(value: unknown): T {
  if (Array.isArray(value)) return value.map((v) => toSnake(v)) as unknown as T;
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[camelToSnakeKey(k)] = toSnake(v);
    return out as T;
  }
  return value as T;
}

/**
 * Re-empaqueta un timestamp de Postgres (string ISO) en la forma
 * { seconds, nanoseconds } que ya usa toda la app (heredada de
 * Firestore Timestamp), para no tocar los `p.createdAt?.seconds` regados
 * en los componentes.
 */
export function toFirestoreLikeTimestamp(iso: string | null | undefined): { seconds: number; nanoseconds: number } | undefined {
  if (!iso) return undefined;
  const ms = new Date(iso).getTime();
  return { seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 };
}

/**
 * toCamel() de una fila de Supabase + re-empaquetado de las columnas de
 * timestamp indicadas (ya en camelCase, ej. ['createdAt', 'completadaEn'])
 * a la forma { seconds, nanoseconds } que espera la app.
 */
export function rowToApp<T>(row: Record<string, unknown>, timestampKeys: string[] = []): T {
  const camel = toCamel<Record<string, unknown>>(row);
  for (const key of timestampKeys) {
    if (key in camel) camel[key] = toFirestoreLikeTimestamp(camel[key] as string | null);
  }
  return camel as T;
}
