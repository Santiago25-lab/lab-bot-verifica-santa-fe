"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { Crud, type Field } from "./Crud";
import { MetricsView } from "./MetricsView";
import { QuizEditor } from "./QuizEditor";

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

const TABS = ["Indicadores", "Dominios", "Palabras clave", "Contactos", "Simulacros", "Aula virtual"] as const;
type Tab = (typeof TABS)[number];

const domainFields: Field[] = [
  { key: "domain", label: "Dominio", type: "text", placeholder: "ej. dian.gov.co", help: "Sin https:// ni www." },
  { key: "entity", label: "Entidad", type: "text", placeholder: "ej. DIAN" },
  {
    key: "list",
    label: "Lista",
    type: "select",
    options: [
      { value: "blanca", label: "Blanca (oficial)" },
      { value: "negra", label: "Negra (fraude reportado)" },
    ],
  },
  { key: "priority", label: "Prioritaria (⭐)", type: "checkbox" },
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
    ["IA (Gemini)", Boolean(s.ia)],
    ["Safe Browsing", Boolean(s.safeBrowsing)],
    ["Firma de Meta", Boolean(s.firmaWebhook)],
    ["Secreto de IDs", Boolean(s.secretoIds)],
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Panel del equipo</h1>
        <button type="button" onClick={() => void logout()} className="w-fit rounded-lg border border-black/10 bg-white px-3 py-2 text-sm">
          Cerrar sesión
        </button>
      </div>
      <ul className="flex flex-wrap gap-2 text-xs">
        {chips.map(([label, ok]) => (
          <li key={label} className={`rounded-full px-3 py-1 font-medium ${ok ? "bg-brand-100 text-brand-800" : "bg-amber-100 text-amber-900"}`}>
            {ok ? "✓" : "!"} {label}
            {!ok && " · sin configurar"}
          </li>
        ))}
      </ul>
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
      {tab === "Dominios" && (
        <Crud
          table="domains"
          title="Lista blanca y lista negra"
          intro="Blanca: dominios oficiales. Negra: dominios ya reportados como fraude (veredicto peligroso inmediato)."
          fields={domainFields}
          columns={["domain", "entity", "list", "priority"]}
          defaults={{ domain: "", entity: "", list: "blanca", priority: false }}
        />
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
