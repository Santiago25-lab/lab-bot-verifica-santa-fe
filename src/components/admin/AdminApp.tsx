"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Crud, type Field } from "./Crud";
import { LinkChecker } from "./LinkChecker";
import { Reports } from "./Reports";
import { MetricsView } from "./MetricsView";
import { QuizEditor } from "./QuizEditor";
import { TelegramSetup } from "./TelegramSetup";

interface Session {
  enabled: boolean;
  authed: boolean;
  status?: Record<string, string | boolean>;
}

const CASES = [
  { value: "pago", label: "Pagó" },
  { value: "datos", label: "Dio datos" },
  { value: "extorsion", label: "Extorsión" },
  { value: "clic", label: "Abrió link" },
];

const TABS = [
  "Indicadores",
  "Reportes",
  "Links oficiales",
  "Páginas falsas",
  "Palabras clave",
  "Contactos",
  "Simulacros",
  "Aula virtual",
] as const;
type Tab = (typeof TABS)[number];

const officialFields: Field[] = [
  { key: "domain", label: "Link oficial", type: "text", placeholder: "ej. dian.gov.co", help: "Puedes pegar el link completo: se guarda solo el dominio." },
  { key: "entity", label: "Entidad", type: "text", placeholder: "ej. DIAN" },
  { key: "priority", label: "Prioritaria (⭐)", type: "checkbox" },
];

const fakeFields: Field[] = [
  { key: "domain", label: "Página falsa", type: "text", placeholder: "ej. dian-pagos.com", help: "Puedes pegar el link completo: se guarda solo el dominio." },
  { key: "entity", label: "Nota", type: "text", placeholder: "ej. Imita a la DIAN, reportado el 20/10" },
];

const keywordFields: Field[] = [
  { key: "phrase", label: "Palabra o frase", type: "text", help: "Se compara sin tildes ni mayúsculas." },
  {
    key: "category",
    label: "Categoría",
    type: "select",
    options: [
      { value: "urgencia", label: "Urgencia (+1)" },
      { value: "solicitud", label: "Pide datos o pagos (+2)" },
      { value: "comprobante", label: "Comprobante de pago" },
      { value: "entidad_publica", label: "Entidad pública" },
    ],
  },
];

const contactFields: Field[] = [
  { key: "name", label: "Nombre", type: "text" },
  { key: "phone", label: "Teléfono", type: "text", placeholder: "ej. 165" },
  { key: "url", label: "Página web", type: "text", placeholder: "https://…" },
  { key: "sort", label: "Orden", type: "number" },
  { key: "description", label: "Descripción", type: "textarea" },
  { key: "cases", label: "Se muestra cuando la persona…", type: "multi", options: CASES },
];

const simFields: Field[] = [
  { key: "sender", label: "Remitente", type: "text", placeholder: "ej. +57 321 000 0000" },
  {
    key: "is_phishing",
    label: "¿Es fraude?",
    type: "select",
    options: [
      { value: "true", label: "Sí, es fraude" },
      { value: "false", label: "No, es real" },
    ],
  },
  { key: "message", label: "Mensaje", type: "textarea" },
  { key: "key_signal", label: "Señal clave", type: "text" },
  { key: "active", label: "Activo", type: "checkbox" },
  { key: "explanation", label: "Explicación", type: "textarea" },
];

export function AdminApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Indicadores");
  const [domainsVersion, setDomainsVersion] = useState(0);

  // Agrega un dominio a las páginas falsas desde Reportes o desde "Probar un link".
  async function blacklist(domain: string) {
    try {
      await api("/api/admin/domains", {
        method: "POST",
        body: JSON.stringify({ domain, entity: "Reportado por usuarios", list: "negra" }),
      });
      setDomainsVersion((v) => v + 1);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  const refresh = () => api<Session>("/api/admin/session").then(setSession).catch(() => setSession({ enabled: false, authed: false }));

  useEffect(() => {
    void refresh();
  }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) });
      setPassword("");
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function logout() {
    await api("/api/admin/session", { method: "DELETE" });
    await refresh();
  }

  if (!session) return <p className="p-8 text-muted">Cargando…</p>;

  if (!session.authed) {
    return (
      <div className="mx-auto max-w-sm px-4 py-16">
        <h1 className="text-2xl font-bold">Panel del equipo</h1>
        {!session.enabled ? (
          <p className="mt-4 rounded-lg bg-amber-50 p-4 text-sm text-amber-900">
            El panel está desactivado. Configura la variable <code>ADMIN_PASSWORD</code> en el
            servidor (ver README).
          </p>
        ) : (
          <form onSubmit={login} className="mt-6 space-y-3">
            <label htmlFor="pw" className="text-sm font-medium">
              Contraseña
            </label>
            <input
              id="pw"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-3 py-2"
            />
            {error && <p role="alert" className="text-sm text-danger">{error}</p>}
            <button type="submit" className="w-full rounded-lg bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">
              Entrar
            </button>
          </form>
        )}
      </div>
    );
  }

  const s = session.status ?? {};
  const chips: [string, boolean][] = [
    [`Base de datos: ${s.baseDeDatos === "supabase" ? "Supabase" : "memoria (temporal)"}`, s.baseDeDatos === "supabase"],
    ["WhatsApp", Boolean(s.whatsapp)],
    ["Telegram", Boolean(s.telegram)],
    ["IA (Gemini)", Boolean(s.ia)],
    ["Safe Browsing", Boolean(s.safeBrowsing)],
    ["Firma de Meta", Boolean(s.firmaWebhook)],
    ["Secreto de IDs", Boolean(s.secretoIds)],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Panel del equipo</h1>
        <div className="flex gap-2">
          <a href="/afiche" target="_blank" rel="noopener" className="w-fit rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            🖨️ Afiche con QR
          </a>
          <button type="button" onClick={() => void logout()} className="w-fit rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
            Cerrar sesión
          </button>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs">
        {chips.map(([label, ok]) => (
          <li key={label} className={`rounded-full px-3 py-1 font-medium ${ok ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-900"}`}>
            {ok ? "✓" : "!"} {label}
            {!ok && " · sin configurar"}
          </li>
        ))}
      </ul>
      <TelegramSetup />
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-black/10">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            type="button"
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium ${
              tab === t ? "border-brand-700 text-brand-800" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Indicadores" && <MetricsView />}
      {tab === "Reportes" && <Reports onBlacklist={blacklist} />}
      {tab === "Links oficiales" && (
        <div className="space-y-6">
          <LinkChecker />
          <Crud
            table="domains"
            title="Links oficiales"
            intro="Las direcciones reales de bancos, billeteras, servicios y entidades. El bot detecta las páginas que se parecen a estas sin serlo."
            fields={officialFields}
            columns={["domain", "entity", "priority"]}
            defaults={{ domain: "", entity: "", priority: false }}
            fixed={{ list: "blanca" }}
            reloadKey={domainsVersion}
          />
        </div>
      )}
      {tab === "Páginas falsas" && (
        <div className="space-y-6">
          <LinkChecker onBlacklist={blacklist} />
          <Crud
            table="domains"
            title="Páginas falsas"
            intro="Dominios ya confirmados como fraude: el bot los marca 🔴 Peligroso de inmediato."
            fields={fakeFields}
            columns={["domain", "entity"]}
            defaults={{ domain: "", entity: "" }}
            fixed={{ list: "negra", priority: false }}
            reloadKey={domainsVersion}
          />
        </div>
      )}
      {tab === "Palabras clave" && (
        <Crud
          table="keywords"
          title="Palabras clave"
          intro="Frases que suman puntos al análisis. Se aplican a WhatsApp y web al instante."
          fields={keywordFields}
          columns={["phrase", "category"]}
          defaults={{ phrase: "", category: "urgencia" }}
        />
      )}
      {tab === "Contactos" && (
        <Crud
          table="contacts"
          title="Contactos de derivación"
          intro="Se muestran en el triage según lo que le pasó a la persona."
          fields={contactFields}
          columns={["sort", "name", "phone", "url", "cases"]}
          defaults={{ name: "", phone: "", url: "", description: "", cases: [], sort: 10 }}
        />
      )}
      {tab === "Simulacros" && (
        <Crud
          table="simulacros"
          title="Simulacros del bot"
          intro="Se envían cuando la persona escribe SIMULACRO (WhatsApp o web)."
          fields={simFields}
          columns={["sender", "message", "is_phishing", "active"]}
          defaults={{ sender: "", message: "", is_phishing: "true", key_signal: "", explanation: "", active: true }}
        />
      )}
      {tab === "Aula virtual" && <QuizEditor />}
    </div>
  );
}
