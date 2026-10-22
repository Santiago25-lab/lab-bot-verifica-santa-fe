import Link from "next/link";

const WA = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const waLink = WA ? `https://wa.me/${WA}?text=${encodeURIComponent("Hola")}` : null;

const roles = [
  {
    icon: "🔍",
    title: "Verifica",
    text: "Reenvía el mensaje, el link o una captura. En segundos te decimos si tiene señales de fraude y por qué.",
  },
  {
    icon: "🎯",
    title: "Entrena",
    text: "Escribe SIMULACRO y practica con mensajes reales en 30 segundos. Así reconoces la trampa antes de que llegue.",
  },
  {
    icon: "🆘",
    title: "Orienta",
    text: "Si ya pagaste o diste datos, te decimos qué hacer y a quién llamar: tu banco, la línea 165 o el CAI Virtual.",
  },
];

const senales = [
  ["El link no es el oficial", "La DIAN usa dian.gov.co, no dian-col.com ni dian-pagos.com."],
  ["Te apuran o amenazan", "«Embargo en 24 horas», «último aviso», «cuenta bloqueada»."],
  ["Te piden claves o pagos", "Ninguna entidad te pide la clave ni el código por mensaje."],
  ["Links acortados", "bit.ly, tinyurl y similares esconden a dónde te llevan."],
  ["Pantallazos de pago", "Un comprobante se edita fácil. Confirma en tu propia app."],
];

export default function Home() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <p className="mb-3 inline-block rounded-full bg-brand-100 px-3 py-1 text-sm font-medium text-brand-800">
              Gratis · 24/7 · Para comerciantes de Santa Fe
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              ¿Te llegó un mensaje raro? <span className="text-brand-700">Verifícalo antes de pagar.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Verifica Santa Fe revisa el remitente, el dominio, los links acortados y la urgencia
              falsa de cualquier mensaje. No guardamos tus mensajes ni tu número.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/verificar"
                className="rounded-xl bg-brand-700 px-6 py-3 text-center font-semibold text-white shadow-sm hover:bg-brand-800"
              >
                Verificar un mensaje aquí
              </Link>
              {waLink ? (
                <a
                  href={waLink}
                  className="rounded-xl border border-brand-700 bg-white px-6 py-3 text-center font-semibold text-brand-800 hover:bg-brand-50"
                >
                  Escribir por WhatsApp
                </a>
              ) : (
                <span className="rounded-xl border border-dashed border-brand-300 px-6 py-3 text-center text-sm text-muted">
                  WhatsApp: muy pronto
                </span>
              )}
            </div>
          </div>
          <ChatPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-bold">Un bot, tres ayudas</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roles.map((r) => (
            <div key={r.title} className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
              <div className="text-3xl" aria-hidden="true">
                {r.icon}
              </div>
              <h3 className="mt-3 text-lg font-semibold">{r.title}</h3>
              <p className="mt-2 text-muted">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-2xl font-bold">5 señales de que es una trampa</h2>
            <p className="mt-3 text-muted">
              Son las que más usan los estafadores en Colombia: suplantan a la DIAN, a los bancos,
              a Nequi o Daviplata y a las empresas de servicios.
            </p>
            <Link
              href="/aula"
              className="mt-6 inline-block rounded-xl bg-ink px-5 py-3 font-semibold text-white hover:bg-black"
            >
              Ponte a prueba en el aula virtual →
            </Link>
          </div>
          <ol className="space-y-3">
            {senales.map(([t, d], i) => (
              <li key={t} className="flex gap-4 rounded-xl border border-black/5 bg-surface p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-700 font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="rounded-2xl bg-brand-900 p-8 text-white md:p-10">
          <h2 className="text-2xl font-bold">¿Ya pagaste o diste datos?</h2>
          <p className="mt-2 max-w-2xl text-brand-100">
            Actúa en los primeros minutos: llama a tu banco para bloquear, guarda las pruebas y
            denuncia.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Contact title="Línea 165" text="Policía Nacional. Extorsión y fraudes. Gratis, 24 h." />
            <Contact title="Línea 123" text="Emergencias si hay riesgo inmediato." />
            <Contact
              title="CAI Virtual"
              text="Denuncia delitos informáticos en caivirtual.policia.gov.co"
            />
          </div>
        </div>
      </section>
    </>
  );
}

function Contact({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-4">
      <p className="text-xl font-bold">{title}</p>
      <p className="mt-1 text-sm text-brand-100">{text}</p>
    </div>
  );
}

function ChatPreview() {
  return (
    <div className="mx-auto w-full max-w-sm rounded-[2rem] border border-black/10 bg-white p-3 shadow-xl">
      <div className="flex items-center gap-2 rounded-t-[1.5rem] bg-brand-800 px-4 py-3 text-white">
        <span className="h-8 w-8 rounded-full bg-white/20" aria-hidden="true" />
        <div>
          <p className="text-sm font-semibold">Verifica Santa Fe</p>
          <p className="text-xs text-brand-100">en línea</p>
        </div>
      </div>
      <div className="space-y-3 bg-[#efeae2] p-4 text-sm">
        <div className="ml-auto max-w-[85%] rounded-xl rounded-tr-sm bg-[#d9fdd3] p-3 shadow-sm">
          DIAN: Evite el embargo de su cuenta en 24 horas. Actualice aquí: dian-col.com/rut
        </div>
        <div className="max-w-[90%] rounded-xl rounded-tl-sm bg-white p-3 shadow-sm">
          <p className="font-bold">🔴 PELIGROSO</p>
          <p className="mt-1">Encontré 2 señales:</p>
          <p>• dian-col.com se hace pasar por la DIAN. El sitio oficial es dian.gov.co.</p>
          <p>• Usa urgencia («embargo», «24 horas»).</p>
          <p className="mt-2">👉 No abras el link ni pagues.</p>
        </div>
      </div>
    </div>
  );
}
