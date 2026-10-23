"use client";

import { useEffect, useState } from "react";
import { api } from "./api";

interface Report {
  id: string;
  fecha: string;
  canal: string;
  veredicto: string | null;
  texto: string;
  dominios: string[];
  estado: string;
}

interface Data {
  reports: Report[];
  masReportados: { dominio: string; veces: number; enListaNegra: boolean }[];
}

const ESTADOS: Record<string, string> = {
  nuevo: "🆕 Nuevo",
  revisado: "👀 Revisado",
  fraude: "🚫 Fraude confirmado",
  descartado: "✔️ Descartado",
};
const VEREDICTO: Record<string, string> = { peligroso: "🔴", sospechoso: "🟡", sin_senales: "🟢" };

/** Mensajes que reportaron los usuarios, para revisarlos y alimentar la lista de páginas falsas. */
export function Reports({ onBlacklist }: { onBlacklist: (domain: string) => Promise<void> }) {
  const [data, setData] = useState<Data | null>(null);
  const [filter, setFilter] = useState("nuevo");
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api<Data>("/api/admin/reportes")
      .then(setData)
      .catch((e: Error) => setError(e.message));

  useEffect(() => {
    void load();
  }, []);

  async function setEstado(id: string, estado: string) {
    await api(`/api/admin/reportes/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ estado }),
    }).catch((e: Error) => setError(e.message));
    await load();
  }

  async function blacklist(domain: string) {
    await onBlacklist(domain);
    await load();
  }

  if (error) return <p role="alert" className="text-danger">{error}</p>;
  if (!data) return <p className="text-muted">Cargando reportes…</p>;
  const shown = data.reports.filter((r) => filter === "todos" || r.estado === filter);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Mensajes reportados</h2>
        <p className="text-sm text-muted">
          Los usuarios los reportan con 🚩 después de revisarlos. Se guardan sin datos personales
          (sin números, nombres ni rutas de los links).
        </p>
      </div>

      <div className="rounded-2xl border border-black/5 bg-white p-5">
        <h3 className="mb-3 font-semibold">Dominios más reportados</h3>
        {data.masReportados.length ? (
          <ul className="divide-y divide-black/5">
            {data.masReportados.map((d) => (
              <li key={d.dominio} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <strong>{d.dominio}</strong> · {d.veces} {d.veces === 1 ? "reporte" : "reportes"}
                </span>
                {d.enListaNegra ? (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-danger">
                    Ya está en páginas falsas
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => void blacklist(d.dominio)}
                    className="rounded-lg border border-danger px-3 py-1 text-xs font-semibold text-danger hover:bg-red-50"
                  >
                    + Agregar a páginas falsas
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Todavía no hay links reportados.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por estado">
        {["nuevo", "revisado", "fraude", "descartado", "todos"].map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`rounded-full px-3 py-1 text-sm ${filter === f ? "bg-brand-700 text-white" : "border border-black/10 bg-white"}`}
          >
            {f === "todos" ? "Todos" : ESTADOS[f]} ({f === "todos" ? data.reports.length : data.reports.filter((r) => r.estado === f).length})
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {shown.map((r) => (
          <li key={r.id} className="rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <span>
                {VEREDICTO[r.veredicto ?? ""] ?? ""} {new Date(r.fecha).toLocaleString("es-CO")} · {r.canal}
              </span>
              <span className="font-semibold">{ESTADOS[r.estado] ?? r.estado}</span>
            </div>
            <p className="bubble mt-2 rounded-xl bg-[#d9fdd3] p-3 text-sm">{r.texto || "(sin texto)"}</p>
            {r.dominios.length > 0 && (
              <p className="mt-2 text-sm">
                Links: {r.dominios.map((d) => <code key={d} className="mr-2 rounded bg-surface px-1">{d}</code>)}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              {Object.keys(ESTADOS)
                .filter((e) => e !== r.estado)
                .map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => void setEstado(r.id, e)}
                    className="rounded-lg border border-black/10 px-3 py-1 hover:bg-surface"
                  >
                    {ESTADOS[e]}
                  </button>
                ))}
            </div>
          </li>
        ))}
        {!shown.length && <p className="text-sm text-muted">No hay reportes en este estado.</p>}
      </ul>
    </section>
  );
}
