-- Verifica Santa Fe · esquema de base de datos (Supabase / PostgreSQL)
-- Ejecútalo una vez en Supabase → SQL Editor → New query → Run.
-- Los datos iniciales (lista blanca, palabras clave, simulacros, pruebas) los carga
-- la app automáticamente la primera vez que arranca.

-- Configuración editable desde el panel ------------------------------------

create table if not exists domains (
  id text primary key default gen_random_uuid()::text,
  domain text not null,
  entity text not null default '',
  list text not null check (list in ('blanca', 'negra')),
  priority boolean not null default false
);
create unique index if not exists domains_domain_list on domains (domain, list);

create table if not exists keywords (
  id text primary key default gen_random_uuid()::text,
  phrase text not null,
  category text not null check (category in ('urgencia', 'solicitud', 'comprobante', 'entidad_publica'))
);

create table if not exists contacts (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  phone text not null default '',
  url text not null default '',
  description text not null default '',
  cases text[] not null default '{}',
  sort integer not null default 10
);

create table if not exists simulacros (
  id text primary key default gen_random_uuid()::text,
  sender text not null default '',
  message text not null,
  is_phishing boolean not null,
  key_signal text not null default '',
  explanation text not null default '',
  active boolean not null default true
);

create table if not exists quizzes (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  title text not null,
  description text not null default '',
  kind text not null check (kind in ('prueba', 'encuesta')),
  published boolean not null default false,
  sort integer not null default 10,
  questions jsonb not null default '[]'
);

-- Datos anónimos ----------------------------------------------------------
-- Nunca se guarda el texto de los mensajes ni números de teléfono:
-- solo el ID anónimo (WA-xxxx / WEB-xxxx) y datos agregables.

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  channel text not null check (channel in ('whatsapp', 'web', 'aula')),
  type text not null,
  verdict text,
  data jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index if not exists events_created_at on events (created_at desc);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  anon_id text not null,
  quiz_id text not null,
  quiz_slug text not null,
  kind text not null,
  score integer not null default 0,
  total integer not null default 0,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index if not exists attempts_created_at on attempts (created_at desc);

-- Estado corto de la conversación de WhatsApp (en qué paso va cada ID anónimo).
create table if not exists bot_sessions (
  anon_id text primary key,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists app_meta (
  key text primary key,
  value text not null
);

-- Seguridad: nadie entra con la llave pública. La app usa la llave de servicio
-- (SUPABASE_SERVICE_ROLE_KEY) solo desde el servidor.
alter table domains enable row level security;
alter table keywords enable row level security;
alter table contacts enable row level security;
alter table simulacros enable row level security;
alter table quizzes enable row level security;
alter table events enable row level security;
alter table attempts enable row level security;
alter table bot_sessions enable row level security;
alter table app_meta enable row level security;
