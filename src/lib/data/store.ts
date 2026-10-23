import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  defaultContacts,
  defaultDomains,
  defaultKeywords,
  defaultQuizzes,
  defaultSimulacros,
  SEED_VERSION,
} from "@/lib/data/defaults";
import type {
  AppConfig,
  AttemptRow,
  Contact,
  DomainEntry,
  EventRow,
  KeywordEntry,
  Quiz,
  Simulacro,
} from "@/lib/types";

export type ConfigTable = "domains" | "keywords" | "contacts" | "simulacros" | "quizzes";

interface TableRow {
  domains: DomainEntry;
  keywords: KeywordEntry;
  contacts: Contact;
  simulacros: Simulacro;
  quizzes: Quiz;
}

export const CONFIG_TABLES: ConfigTable[] = [
  "domains",
  "keywords",
  "contacts",
  "simulacros",
  "quizzes",
];

const DEFAULTS: { [K in ConfigTable]: TableRow[K][] } = {
  domains: defaultDomains,
  keywords: defaultKeywords,
  contacts: defaultContacts,
  simulacros: defaultSimulacros,
  quizzes: defaultQuizzes,
};

const ORDER: Record<ConfigTable, string> = {
  domains: "domain",
  keywords: "phrase",
  contacts: "sort",
  simulacros: "id",
  quizzes: "sort",
};

export interface Store {
  readonly kind: "supabase" | "memoria";
  list<T extends ConfigTable>(table: T): Promise<TableRow[T][]>;
  insert<T extends ConfigTable>(table: T, row: TableRow[T]): Promise<void>;
  update<T extends ConfigTable>(table: T, id: string, row: Partial<TableRow[T]>): Promise<void>;
  remove(table: ConfigTable, id: string): Promise<void>;
  logEvent(e: EventRow): Promise<void>;
  saveAttempt(a: AttemptRow): Promise<void>;
  listEvents(limit?: number): Promise<EventRow[]>;
  listAttempts(limit?: number): Promise<AttemptRow[]>;
  getSession(anonId: string): Promise<Record<string, unknown> | null>;
  setSession(anonId: string, state: Record<string, unknown>): Promise<void>;
}

/* ---------- Memoria: para desarrollo local sin base de datos ---------- */

interface MemoryData {
  tables: { [K in ConfigTable]: TableRow[K][] };
  events: EventRow[];
  attempts: AttemptRow[];
  sessions: Map<string, Record<string, unknown>>;
}

const g = globalThis as unknown as { __vsfMemory?: MemoryData };

function memoryStore(): Store {
  g.__vsfMemory ??= {
    tables: structuredClone(DEFAULTS),
    events: [],
    attempts: [],
    sessions: new Map(),
  };
  const m = g.__vsfMemory;
  const now = () => new Date().toISOString();
  return {
    kind: "memoria",
    async list(table) {
      const key = ORDER[table] as never;
      return [...m.tables[table]].sort((a, b) => (a[key] > b[key] ? 1 : -1)) as never;
    },
    async insert(table, row) {
      (m.tables[table] as unknown[]).push(row);
    },
    async update(table, id, row) {
      const list = m.tables[table] as { id: string }[];
      const i = list.findIndex((r) => r.id === id);
      if (i >= 0) list[i] = { ...list[i], ...row, id };
    },
    async remove(table, id) {
      (m.tables[table] as { id: string }[]) = (m.tables[table] as { id: string }[]).filter(
        (r) => r.id !== id,
      ) as never;
    },
    async logEvent(e) {
      m.events.push({ ...e, id: crypto.randomUUID(), created_at: now() });
    },
    async saveAttempt(a) {
      m.attempts.push({ ...a, id: crypto.randomUUID(), created_at: now() });
    },
    async listEvents(limit = 20000) {
      return m.events.slice(-limit);
    },
    async listAttempts(limit = 20000) {
      return m.attempts.slice(-limit);
    },
    async getSession(anonId) {
      return m.sessions.get(anonId) ?? null;
    },
    async setSession(anonId, state) {
      m.sessions.set(anonId, state);
    },
  };
}

/* ---------- Supabase (PostgreSQL) ---------- */

function supabaseStore(client: SupabaseClient): Store {
  let seeded: Promise<void> | null = null;
  // Cada vez que cambian los datos iniciales sube SEED_VERSION: se agregan los registros
  // nuevos sin tocar los que el equipo ya editó.
  const ensureSeeded = () =>
    (seeded ??= (async () => {
      const { data } = await client
        .from("app_meta")
        .select("value")
        .eq("key", "seed_version")
        .maybeSingle();
      if (data?.value === SEED_VERSION) return;
      for (const table of CONFIG_TABLES) {
        const { data: rows, error } = await client.from(table).select("id");
        if (error) throw new Error(`No se pudo leer ${table}: ${error.message}`);
        const existing = new Set((rows ?? []).map((r: { id: string }) => r.id));
        for (const row of DEFAULTS[table].filter((r) => !existing.has(r.id))) {
          // Un registro que choca con uno creado a mano (mismo dominio) simplemente se omite.
          await client.from(table).insert(row as never);
        }
      }
      await client.from("app_meta").upsert({ key: "seed_version", value: SEED_VERSION });
    })().catch((err) => {
      seeded = null;
      throw err;
    }));
  const check = (error: { message: string } | null) => {
    if (error) throw new Error(error.message);
  };
  return {
    kind: "supabase",
    async list(table) {
      await ensureSeeded();
      const { data, error } = await client.from(table).select("*").order(ORDER[table]);
      check(error);
      return (data ?? []) as never;
    },
    async insert(table, row) {
      check((await client.from(table).insert(row as never)).error);
    },
    async update(table, id, row) {
      check((await client.from(table).update(row as never).eq("id", id)).error);
    },
    async remove(table, id) {
      check((await client.from(table).delete().eq("id", id)).error);
    },
    async logEvent(e) {
      const { error } = await client.from("events").insert(e);
      if (error) console.warn("No se pudo guardar el evento:", error.message);
    },
    async saveAttempt(a) {
      check((await client.from("attempts").insert(a)).error);
    },
    async listEvents(limit = 20000) {
      const { data, error } = await client
        .from("events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      check(error);
      return (data ?? []) as EventRow[];
    },
    async listAttempts(limit = 20000) {
      const { data, error } = await client
        .from("attempts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      check(error);
      return (data ?? []) as AttemptRow[];
    },
    async getSession(anonId) {
      const { data } = await client
        .from("bot_sessions")
        .select("state")
        .eq("anon_id", anonId)
        .maybeSingle();
      return (data?.state as Record<string, unknown>) ?? null;
    },
    async setSession(anonId, state) {
      const { error } = await client
        .from("bot_sessions")
        .upsert({ anon_id: anonId, state, updated_at: new Date().toISOString() });
      if (error) console.warn("No se pudo guardar la sesión:", error.message);
    },
  };
}

let cached: Store | null = null;

export function getStore(): Store {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  cached =
    url && key
      ? supabaseStore(createClient(url, key, { auth: { persistSession: false } }))
      : memoryStore();
  return cached;
}

/* ---------- Configuración del motor, con caché corta ---------- */

let configCache: { at: number; value: AppConfig } | null = null;

export async function getConfig(): Promise<AppConfig> {
  if (configCache && Date.now() - configCache.at < 30_000) return configCache.value;
  const store = getStore();
  const [domains, keywords, contacts, simulacros] = await Promise.all([
    store.list("domains"),
    store.list("keywords"),
    store.list("contacts"),
    store.list("simulacros"),
  ]);
  configCache = { at: Date.now(), value: { domains, keywords, contacts, simulacros } };
  return configCache.value;
}

export function invalidateConfig() {
  configCache = null;
}
