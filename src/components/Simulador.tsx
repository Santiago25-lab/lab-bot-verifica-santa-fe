"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { calificarCaso, casosDeSesion, type Caso } from "@/lib/data/casos";
import { KIT, type KitId } from "@/lib/kit";

type Resultado = ReturnType<typeof calificarCaso> & { clic: boolean };
type Fase = "cargando" | "consentimiento" | "inicio" | "caso" | "fin";

const CONSENT_KEY = "vsf_sim_consentimiento";

function leerConsentimiento(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "1";
  } catch {
    return false;
  }
}

/** Simulador de casos: el comerciante revisa un mensaje con el kit de 5 puntos y decide si es fraude. */
export function Simulador() {
  // "cargando" hasta saber si hay modo taller: así nadie empieza sin pasar por el consentimiento.
  const [fase, setFase] = useState<Fase>("cargando");
  const yaRespondio = useRef(false);
  const [taller, setTaller] = useState<string | null>(null);
  const [acepto, setAcepto] = useState(false);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [i, setI] = useState(0);
  const [marcadas, setMarcadas] = useState<KitId[]>([]);
  const [clic, setClic] = useState(false);
  const [trampa, setTrampa] = useState<null | "link" | "adjunto">(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [historial, setHistorial] = useState<(Resultado & { caso: Caso })[]>([]);
  const [sesion, setSesion] = useState("");

  useEffect(() => {
    let vivo = true;
    fetch("/api/taller")
      .then((r) => r.json())
      .then((d: { code: string | null }) => {
        if (!vivo) return;
        setTaller(d.code);
        // Sin modo taller pedimos el consentimiento digital una sola vez.
        setFase(!d.code && !leerConsentimiento() ? "consentimiento" : "inicio");
      })
      .catch(() => vivo && setFase(leerConsentimiento() ? "inicio" : "consentimiento"));
    return () => {
      vivo = false;
    };
  }, []);

  function empezar() {
    setCasos(casosDeSesion());
    setSesion(Math.random().toString(36).slice(2, 10));
    setI(0);
    setHistorial([]);
    nuevoCaso();
    setFase("caso");
  }

  function nuevoCaso() {
    yaRespondio.current = false;
    setMarcadas([]);
    setClic(false);
    setTrampa(null);
    setResultado(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function aceptar() {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {
      /* sin almacenamiento: se pedirá de nuevo la próxima vez */
    }
    setFase("inicio");
  }

  const caso = casos[i];

  async function responder(fraude: boolean) {
    if (!caso || yaRespondio.current) return;
    yaRespondio.current = true;
    const local = calificarCaso(caso, marcadas, fraude);
    const r = { ...local, clic };
    setResultado(r);
    setHistorial((h) => [...h, { ...r, caso }]);
    try {
      await fetch("/api/simulador", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ caso: caso.id, marcadas, fraude, clic, sesion }),
      });
    } catch {
      /* el ejercicio sigue aunque no se pueda guardar */
    }
  }

  function siguiente() {
    if (i + 1 >= casos.length) {
      setFase("fin");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setI(i + 1);
    nuevoCaso();
  }

  if (fase === "cargando") return <p className="text-muted">Cargando…</p>;

  if (fase === "consentimiento") {
    return (
      <section className="mx-auto max-w-2xl rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Antes de empezar</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6 text-muted">
          <li>Es un <strong className="text-ink">ejercicio de práctica</strong> con mensajes inventados: las empresas y los links son ficticios.</li>
          <li>Ningún link ni archivo se abre de verdad y <strong className="text-ink">no te pedimos datos personales</strong>.</li>
          <li>Solo guardamos tus aciertos con un código anónimo, para medir cuánto ayuda el proyecto.</li>
          <li>Participar es voluntario y puedes salir cuando quieras.</li>
        </ul>
        <label className="mt-5 flex items-start gap-3 text-base">
          <input type="checkbox" className="mt-1 h-5 w-5" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} />
          <span>
            Acepto participar de forma voluntaria y autorizo el uso anónimo de mis respuestas según el{" "}
            <Link href="/privacidad" className="text-brand-700 underline">aviso de privacidad</Link>.
          </span>
        </label>
        <button
          type="button"
          disabled={!acepto}
          onClick={aceptar}
          className="mt-5 w-full rounded-xl bg-brand-700 px-5 py-3 text-lg font-semibold text-white disabled:opacity-50"
        >
          Continuar
        </button>
      </section>
    );
  }

  if (fase === "inicio") {
    return (
      <section className="mx-auto max-w-3xl space-y-6">
        {taller && (
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900">
            👥 Modo taller · participante <strong>{taller}</strong>
          </p>
        )}
        <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Cómo funciona</h2>
          <ol className="mt-3 list-decimal space-y-1 pl-6 text-muted">
            <li>Te llegan <strong className="text-ink">5 mensajes</strong>, como en tu celular.</li>
            <li>Revísalos con el <strong className="text-ink">kit de 5 puntos</strong> y marca las señales que veas.</li>
            <li>Decide: <strong className="text-ink">¿es fraude o es real?</strong></li>
            <li>Te mostramos qué encontraste y qué se te pasó.</li>
          </ol>
          <p className="mt-3 text-sm text-muted">Ojo: si tocas un link o un archivo del mensaje, verás qué habría pasado. Nada se abre de verdad.</p>
          <button type="button" onClick={empezar} className="mt-5 w-full rounded-xl bg-brand-700 px-5 py-4 text-lg font-bold text-white hover:bg-brand-800">
            🎯 Empezar el simulador
          </button>
        </div>
      </section>
    );
  }

  if (fase === "fin") {
    const correctas = historial.filter((h) => h.correcto).length;
    const presentes = historial.reduce((s, h) => s + h.presentes.length, 0);
    const encontradas = historial.reduce((s, h) => s + h.encontradas.length, 0);
    const clics = historial.filter((h) => h.clic).length;
    const principal = historial.find((h) => h.caso.principal);
    // Lo que más se le pasó, para darle un consejo concreto.
    const omitidas = historial.flatMap((h) => h.omitidas);
    const masOmitida = KIT.map((k) => ({ k, n: omitidas.filter((o) => o === k.id).length })).sort((a, b) => b.n - a.n)[0];
    return (
      <section className="mx-auto max-w-2xl space-y-5">
        <div className="rounded-3xl bg-brand-800 p-6 text-white">
          <p className="text-brand-100">Tu resultado</p>
          <p className="text-5xl font-extrabold">{correctas}/{historial.length}</p>
          <p className="mt-1">mensajes clasificados correctamente</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          <li className="rounded-2xl border border-black/10 bg-white p-4">
            <p className="text-sm text-muted">Señales encontradas</p>
            <p className="text-2xl font-bold">{encontradas} de {presentes}</p>
          </li>
          {principal && (
            <li className="rounded-2xl border border-black/10 bg-white p-4">
              <p className="text-sm text-muted">En la falsa factura</p>
              <p className="text-2xl font-bold">
                {principal.encontradas.length} de {principal.presentes.length} {principal.encontradas.length >= 3 ? "✅" : "⚠️"}
              </p>
            </li>
          )}
          <li className="rounded-2xl border border-black/10 bg-white p-4 sm:col-span-2">
            <p className="text-sm text-muted">Links o archivos tocados</p>
            <p className="text-2xl font-bold">{clics === 0 ? "Ninguno 👏" : `${clics} ⚠️`}</p>
          </li>
        </ul>
        {masOmitida && masOmitida.n > 0 && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="font-semibold">
              {masOmitida.k.icon} Para la próxima, fíjate más en: {masOmitida.k.title}
            </p>
            <p className="mt-1 text-sm">{masOmitida.k.tip}</p>
          </div>
        )}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={empezar} className="flex-1 rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white">
            🔁 Practicar otra vez
          </button>
          {taller ? (
            <Link href="/taller" className="flex-1 rounded-xl border-2 border-brand-700 px-5 py-3 text-center font-semibold text-brand-800">
              👥 Volver al taller
            </Link>
          ) : (
            <Link href="/aula" className="flex-1 rounded-xl border-2 border-brand-700 px-5 py-3 text-center font-semibold text-brand-800">
              📚 Ir al aula virtual
            </Link>
          )}
        </div>
      </section>
    );
  }

  if (!caso) return null;
  const respondido = resultado !== null;

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-3 text-sm text-muted">
          <span>Caso {i + 1} de {casos.length}</span>
          <div className="h-2 flex-1 rounded-full bg-black/10">
            <div className="h-2 rounded-full bg-brand-600" style={{ width: `${((i + (respondido ? 1 : 0)) / casos.length) * 100}%` }} />
          </div>
        </div>
        <Telefono
          caso={caso}
          onTrampa={(t) => {
            setClic(true);
            setTrampa(t);
          }}
        />
        <p className="mt-2 text-center text-xs text-muted">Mensaje de práctica · entidades ficticias</p>
      </div>

      <div className="min-w-0 space-y-4">
        {!respondido ? (
          <>
            <div className="rounded-3xl border border-black/10 bg-white p-5">
              <h2 className="text-xl font-bold">1. Revisa con el kit: ¿qué señales ves?</h2>
              <p className="text-sm text-muted">Toca todas las que encuentres. Si no ves ninguna, no marques nada.</p>
              <div className="mt-4 grid gap-2">
                {KIT.map((k) => {
                  const on = marcadas.includes(k.id);
                  return (
                    <button
                      key={k.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setMarcadas((m) => (on ? m.filter((x) => x !== k.id) : [...m, k.id]))}
                      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left ${
                        on ? "border-danger bg-red-50" : "border-black/10 bg-white hover:border-brand-300"
                      }`}
                    >
                      <span className="text-2xl" aria-hidden="true">{k.icon}</span>
                      <span className="flex-1">
                        <span className="block font-semibold">{k.title}</span>
                        <span className="block text-sm text-muted">{k.question}</span>
                      </span>
                      <span className={`text-sm font-bold ${on ? "text-danger" : "text-muted"}`}>{on ? "🚩 Señal" : "Marcar"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="rounded-3xl border border-black/10 bg-white p-5">
              <h2 className="text-xl font-bold">2. ¿Qué es este mensaje?</h2>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <button type="button" onClick={() => void responder(true)} className="rounded-2xl bg-danger px-4 py-4 text-lg font-bold text-white">
                  🚩 Es fraude
                </button>
                <button type="button" onClick={() => void responder(false)} className="rounded-2xl bg-ok px-4 py-4 text-lg font-bold text-white">
                  ✅ Es real
                </button>
              </div>
            </div>
          </>
        ) : (
          <Retroalimentacion caso={caso} r={resultado} onSiguiente={siguiente} ultimo={i + 1 >= casos.length} />
        )}
      </div>

      {trampa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="trampa-titulo">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
            <p className="text-5xl" aria-hidden="true">🚨</p>
            <h2 id="trampa-titulo" className="mt-2 text-2xl font-extrabold text-danger">
              {trampa === "link" ? "¡Tocaste el link!" : "¡Abriste el archivo!"}
            </h2>
            <p className="mt-3 text-muted">
              {trampa === "link"
                ? "En un mensaje real, aquí se abriría una página falsa idéntica a la original para pedirte claves, datos de tu tarjeta o un pago."
                : "En un mensaje real, este archivo podría instalar un programa que roba tus claves o toma control de tu celular."}
            </p>
            <p className="mt-3 rounded-xl bg-brand-50 p-3 text-sm text-brand-900">
              🛡️ Tranquilo: es un simulacro. No se abrió nada ni se guardó ningún dato.
            </p>
            <button type="button" onClick={() => setTrampa(null)} className="mt-5 w-full rounded-xl bg-brand-700 px-5 py-3 font-semibold text-white">
              Entendido, sigo revisando
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function Retroalimentacion({ caso, r, onSiguiente, ultimo }: { caso: Caso; r: Resultado; onSiguiente: () => void; ultimo: boolean }) {
  return (
    <div className="space-y-4">
      <div className={`rounded-3xl p-5 ${r.correcto ? "bg-green-50 ring-2 ring-green-300" : "bg-red-50 ring-2 ring-red-300"}`}>
        <p className="text-2xl font-extrabold">{r.correcto ? "✅ ¡Correcto!" : "❌ Esta vez no"}</p>
        <p className="mt-1 text-lg">
          Este mensaje <strong>{caso.fraude ? "es FRAUDE" : "es REAL"}</strong>.
        </p>
        {r.clic && <p className="mt-2 text-sm font-semibold text-danger">⚠️ Tocaste un link o archivo. En la vida real ese es el momento del robo.</p>}
      </div>
      <div className="rounded-3xl border border-black/10 bg-white p-5">
        <h3 className="font-bold">Revisión con el kit</h3>
        <ul className="mt-3 space-y-3">
          {KIT.map((k) => {
            const presente = r.presentes.includes(k.id);
            const marcada = r.encontradas.includes(k.id) || r.falsasAlarmas.includes(k.id);
            const estado = presente ? (marcada ? "ok" : "omitida") : marcada ? "falsa" : "nada";
            const etiqueta = { ok: "✅ La encontraste", omitida: "⚠️ Se te pasó", falsa: "➖ No estaba", nada: "✔️ No estaba" }[estado];
            return (
              <li key={k.id} className="flex gap-3">
                <span className="text-xl" aria-hidden="true">{k.icon}</span>
                <div>
                  <p className="font-semibold">
                    {k.title} · <span className={estado === "omitida" ? "text-amber-700" : estado === "ok" ? "text-ok" : "text-muted"}>{etiqueta}</span>
                  </p>
                  {presente && <p className="text-sm text-muted">{caso.senales[k.id]}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="rounded-3xl bg-brand-50 p-5 text-brand-900">
        <p className="font-bold">💡 Lo que debes recordar</p>
        <p className="mt-1">{caso.cierre}</p>
      </div>
      <button type="button" onClick={onSiguiente} className="w-full rounded-xl bg-brand-700 px-5 py-4 text-lg font-bold text-white hover:bg-brand-800">
        {ultimo ? "Ver mi resultado →" : "Siguiente caso →"}
      </button>
    </div>
  );
}

/** Maqueta de celular: SMS, WhatsApp o correo. Los links y adjuntos no abren nada. */
function Telefono({ caso, onTrampa }: { caso: Caso; onTrampa: (t: "link" | "adjunto") => void }) {
  const link = caso.link;
  const partes = link && caso.mensaje.includes(link) ? caso.mensaje.split(link) : null;
  const enlace = link ? (
    <button type="button" onClick={() => onTrampa("link")} className="break-all text-left text-sky-700 underline">
      {link}
    </button>
  ) : null;
  const cuerpo = (
    <p className="whitespace-pre-line break-words">
      {partes ? (
        <>
          {partes[0]}
          {enlace}
          {partes[1]}
        </>
      ) : (
        caso.mensaje
      )}
    </p>
  );
  const enlaceAparte = link && !partes && (
    <p className="mt-3">
      👉 Ingrese aquí: {enlace}
    </p>
  );
  const adjunto = caso.adjunto && (
    <button type="button" onClick={() => onTrampa("adjunto")} className="mt-3 flex w-full items-center gap-2 rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-left text-sm">
      <span aria-hidden="true">{/\.(jpe?g|png)$/i.test(caso.adjunto) ? "🖼️" : "📎"}</span>
      <span className="flex-1 truncate font-medium">{caso.adjunto}</span>
      <span className="text-xs text-muted">Abrir</span>
    </button>
  );

  const header =
    caso.canal === "whatsapp" ? (
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">👤</span>
        <div className="min-w-0">
          <p className="truncate font-semibold">{caso.de}</p>
          {caso.detalleDe && <p className="truncate text-xs text-white/80">{caso.detalleDe}</p>}
        </div>
      </div>
    ) : caso.canal === "sms" ? (
      <div className="border-b border-black/10 bg-white px-4 py-3 text-center">
        <p className="font-semibold">{caso.de}</p>
        <p className="text-xs text-muted">{caso.detalleDe ?? "Mensaje de texto"}</p>
      </div>
    ) : (
      <div className="border-b border-black/10 bg-white px-4 py-3">
        <p className="text-xs text-muted">Correo · Bandeja de entrada</p>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2.2rem] border-[10px] border-ink bg-white shadow-xl">
      {header}
      <div className={`min-h-[22rem] p-4 text-[0.95rem] ${caso.canal === "correo" ? "bg-white" : caso.canal === "whatsapp" ? "bg-[#efeae2]" : "bg-[#f3f4f6]"}`}>
        {caso.canal === "correo" ? (
          <div>
            <p className="text-lg font-bold leading-snug">{caso.asunto}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 font-bold text-brand-800">{caso.de[0]}</span>
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{caso.de}</p>
                <p className="truncate text-muted">{caso.detalleDe}</p>
              </div>
            </div>
            <div className="mt-4">{cuerpo}{enlaceAparte}{adjunto}</div>
          </div>
        ) : (
          <div className={`max-w-[90%] rounded-2xl p-3 shadow-sm ${caso.canal === "whatsapp" ? "rounded-tl-sm bg-white" : "rounded-bl-sm bg-white"}`}>
            {cuerpo}
            {enlaceAparte}
            {adjunto}
            <p className="mt-1 text-right text-[0.7rem] text-muted">6:42 p. m.</p>
          </div>
        )}
      </div>
    </div>
  );
}
