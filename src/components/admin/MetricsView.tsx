"use client";

import { useEffect, useState } from "react";
import type { Metrics } from "@/lib/admin/metrics";
import { api } from "./api";

const SIGNAL_LABEL: Record<string, string> = {
  lista_negra: "Dominio en lista negra",
  reputacion: "Reportado por Google",
  imitacion: "Dominio que imita a una entidad",
  gov_sin_govco: "Entidad pública sin .gov.co",
  entidad_link_no_oficial: "Entidad con link no oficial",
  link_acortado: "Link acortado",
  ip: "Link con IP",
  sin_https: "Link sin https",
  remitente_no_oficial: "Remitente no oficial",
  solicitud: "Pide datos o pagos",
  urgencia: "Urgencia artificial",
  comprobante: "Comprobante de pago",
  ia: "Detectado por IA",
};

const CASE_LABEL: Record<string, string> = {
  pago: "Pagó o transfirió",
  datos: "Dio claves o datos",
  extorsion: "Extorsión",
  clic: "Solo abrió el link",
};

function download(type: string) {
  // Es una descarga de archivo (CSV), no una página.
  window.location.assign(new URL(`/api/admin/export?type=${type}`, window.location.origin));
}

function Tile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Barras horizontales de una sola serie, con etiqueta y valor visibles. */
function Bars({ rows, color = "var(--color-series)" }: { rows: { label: string; n: number; color?: string }[]; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (!rows.length) return <p className="text-sm text-muted">Sin datos todavía.</p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,10rem)_1fr_2.5rem] items-center gap-3 text-sm" title={`${r.label}: ${r.n}`}>
          <span className="truncate text-muted">{r.label}</span>
          <span className="h-4 rounded-r bg-black/[0.04]">
            <span className="block h-full rounded-r" style={{ width: `${(r.n / max) * 100}%`, background: r.color ?? color, minWidth: r.n ? 4 : 0 }} />
          </span>
          <span className="text-right font-medium tabular-nums">{r.n}</span>
        </li>
      ))}
    </ul>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-black/5 bg-white p-5">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </div>
  );
}

export function MetricsView() {
  const [m, setM] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    api<Metrics>("/api/admin/metrics").then(setM).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-danger">{error}</p>;
  if (!m) return <p className="text-muted">Cargando indicadores…</p>;

  const t = m.totales;
  const maxDay = Math.max(1, ...m.porDia.map((d) => d.verificaciones));
  const hovered = hover !== null ? m.porDia[hover] : null;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Indicadores</h2>
          <p className="text-sm text-muted">Datos anónimos y agregados de WhatsApp, web y aula.</p>
        </div>
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => download("eventos")} className="rounded-lg border border-black/10 bg-white px-3 py-2 hover:bg-surface">
            ⬇ Eventos del bot (CSV)
          </button>
          <button type="button" onClick={() => download("respuestas")} className="rounded-lg border border-black/10 bg-white px-3 py-2 hover:bg-surface">
            ⬇ Respuestas del aula (CSV)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Personas (IDs anónimos)" value={t.personas} />
        <Tile label="Mensajes verificados" value={t.verificaciones} />
        <Tile label="Aciertos en simulacros" value={`${t.aciertoSimulacros}%`} hint={`${t.simulacros} simulacros respondidos`} />
        <Tile label="Derivaciones y alertas" value={t.triage + t.alertas} hint={`${t.triage} triage · ${t.alertas} alertas vecinales`} />
      </div>

      <Card title="Verificaciones por día (últimos 30 días)">
        <div className="relative">
          <p className="mb-2 h-5 text-sm text-muted" aria-live="polite">
            {hovered ? `${hovered.date}: ${hovered.verificaciones} verificaciones · ${hovered.simulacros} simulacros` : "Pasa el cursor sobre una barra"}
          </p>
          <div className="flex h-36 items-end gap-[2px] border-b border-black/10" onMouseLeave={() => setHover(null)}>
            {m.porDia.map((d, i) => (
              <div
                key={d.date}
                className="flex h-full flex-1 items-end"
                onMouseEnter={() => setHover(i)}
                title={`${d.date}: ${d.verificaciones}`}
              >
                <div
                  className="w-full max-w-6 rounded-t"
                  style={{
                    height: `${(d.verificaciones / maxDay) * 100}%`,
                    minHeight: d.verificaciones ? 3 : 0,
                    background: "var(--color-series)",
                    opacity: hover === null || hover === i ? 1 : 0.45,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-xs text-muted">
            <span>{m.porDia[0].date}</span>
            <span>{m.porDia.at(-1)!.date}</span>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Resultado de las verificaciones">
          <Bars
            rows={[
              { label: "🔴 Peligroso", n: m.porVeredicto.peligroso ?? 0, color: "var(--color-danger)" },
              { label: "🟡 Sospechoso", n: m.porVeredicto.sospechoso ?? 0, color: "var(--color-warn)" },
              { label: "🟢 Sin señales", n: m.porVeredicto.sin_senales ?? 0, color: "var(--color-ok)" },
            ]}
          />
        </Card>
        <Card title="Uso por canal">
          <Bars
            rows={[
              { label: "WhatsApp", n: m.porCanal.whatsapp ?? 0 },
              { label: "Web", n: m.porCanal.web ?? 0 },
            ]}
          />
        </Card>
        <Card title="Señales más frecuentes">
          <Bars rows={m.senales.slice(0, 8).map((s) => ({ label: SIGNAL_LABEL[s.id] ?? s.id, n: s.n }))} />
        </Card>
        <Card title="Triage: qué le pasó a la persona">
          <Bars rows={Object.entries(m.triagePorCaso).map(([k, n]) => ({ label: CASE_LABEL[k] ?? k, n }))} />
        </Card>
      </div>

      <Card title="Pruebas del aula">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-muted">
            <tr>
              <th className="py-2">Prueba</th>
              <th className="py-2 text-right">Intentos</th>
              <th className="py-2 text-right">Puntaje promedio</th>
            </tr>
          </thead>
          <tbody>
            {m.pruebas.map((p) => (
              <tr key={p.slug} className="border-t border-black/5">
                <td className="py-2">{p.title}</td>
                <td className="py-2 text-right tabular-nums">{p.intentos}</td>
                <td className="py-2 text-right tabular-nums">{p.intentos ? `${p.promedio}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {m.encuestas.map((e) => (
        <Card key={e.slug} title={`${e.title} · ${e.respuestas} respuestas`}>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted">
              <tr>
                <th className="py-2">Pregunta</th>
                <th className="py-2 text-right">Promedio (1–5) o distribución</th>
              </tr>
            </thead>
            <tbody>
              {e.preguntas.map((p) => (
                <tr key={p.prompt} className="border-t border-black/5 align-top">
                  <td className="py-2 pr-4">{p.prompt}</td>
                  <td className="py-2 text-right tabular-nums">
                    {p.promedio !== null
                      ? p.promedio
                      : p.distribucion.length === 5 || !p.distribucion.some((d) => d.count)
                        ? "—"
                        : p.distribucion.map((d) => `${d.option}: ${d.count}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </section>
  );
}
