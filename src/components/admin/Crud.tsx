"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "./api";

export interface Field {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "multi";
  options?: { value: string; label: string }[];
  placeholder?: string;
  help?: string;
}

type Row = Record<string, unknown> & { id: string };

interface Props {
  table: string;
  title: string;
  intro: string;
  fields: Field[];
  columns: string[];
  defaults: Record<string, unknown>;
  /** Valores fijos: solo se muestran las filas con esos valores y se guardan siempre así. */
  fixed?: Record<string, unknown>;
  /** Para recargar la tabla cuando otra parte del panel la cambia. */
  reloadKey?: number;
}

function show(v: unknown, field?: Field): string {
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (Array.isArray(v)) return v.join(", ");
  if (field?.options) return field.options.find((o) => o.value === v)?.label ?? String(v ?? "");
  return String(v ?? "");
}

export function Crud({ table, title, intro, fields, columns, defaults, fixed, reloadKey }: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () =>
    api<Row[]>(`/api/admin/${table}`)
      .then(setRows)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, reloadKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scoped = (rows ?? []).filter((r) =>
      Object.entries(fixed ?? {}).every(([k, v]) => r[k] === v),
    );
    if (!q) return scoped;
    return scoped.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query, fixed]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError(null);
    try {
      const id = editing.id as string | undefined;
      await api(id ? `/api/admin/${table}/${encodeURIComponent(id)}` : `/api/admin/${table}`, {
        method: id ? "PUT" : "POST",
        body: JSON.stringify({ ...editing, ...fixed }),
      });
      setEditing(null);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row: Row) {
    if (!confirm("¿Eliminar este registro? No se puede deshacer.")) return;
    try {
      await api(`/api/admin/${table}/${encodeURIComponent(row.id)}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  const fieldByKey = Object.fromEntries(fields.map((f) => [f.key, f]));

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted">{intro}</p>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar"
            className="w-40 rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => setEditing({ ...defaults })}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            + Agregar
          </button>
        </div>
      </div>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-danger">{error}</p>}

      {editing && (
        <form onSubmit={save} className="grid gap-4 rounded-2xl border border-brand-200 bg-brand-50 p-5 sm:grid-cols-2">
          {fields.map((f) => (
            <FieldInput
              key={f.key}
              field={f}
              value={editing[f.key]}
              onChange={(v) => setEditing({ ...editing, [f.key]: v })}
            />
          ))}
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-black/10 bg-white px-4 py-2 text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c} className="px-4 py-3 font-semibold">
                  {fieldByKey[c]?.label ?? c}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {!rows && (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={columns.length + 1}>
                  Cargando…
                </td>
              </tr>
            )}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-black/5 align-top">
                {columns.map((c) => (
                  <td key={c} className="max-w-md px-4 py-3">
                    <span className="line-clamp-3">{show(r[c], fieldByKey[c])}</span>
                  </td>
                ))}
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => setEditing({ ...r })}
                    className="rounded px-2 py-1 text-brand-700 hover:bg-brand-50"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(r)}
                    className="rounded px-2 py-1 text-danger hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {rows && !filtered.length && (
              <tr>
                <td className="px-4 py-6 text-muted" colSpan={columns.length + 1}>
                  No hay registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  const id = `f-${field.key}`;
  const base = "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm";
  const wide = field.type === "textarea" ? "sm:col-span-2" : "";
  let input: React.ReactNode;
  switch (field.type) {
    case "textarea":
      input = (
        <textarea id={id} rows={3} className={base} value={String(value ?? "")} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case "select":
      input = (
        <select id={id} className={base} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
          {field.label}
        </label>
      );
    case "multi": {
      const current = Array.isArray(value) ? (value as string[]) : [];
      input = (
        <div className="flex flex-wrap gap-3">
          {field.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={current.includes(o.value)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...current, o.value] : current.filter((x) => x !== o.value))
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      );
      break;
    }
    default:
      input = (
        <input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          className={base}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(field.type === "number" ? Number(e.target.value) : e.target.value)}
        />
      );
  }
  return (
    <div className={`space-y-1 ${wide}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {field.label}
      </label>
      {input}
      {field.help && <p className="text-xs text-muted">{field.help}</p>}
    </div>
  );
}
