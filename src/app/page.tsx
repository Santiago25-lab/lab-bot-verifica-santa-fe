import Link from "next/link";
import { ChatDemo } from "@/components/ChatDemo";
import { PoliceMascot } from "@/components/PoliceMascot";
import { KIT } from "@/lib/kit";

const WA = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const waLink = WA ? `https://wa.me/${WA}?text=${encodeURIComponent("Hola")}` : null;
const TG = (process.env.NEXT_PUBLIC_TELEGRAM_BOT || "").replace(/^@/, "");
const tgLink = TG ? `https://t.me/${TG}` : null;

const casos = [
  { icon: "🏛️", title: "Suplantan a la DIAN o al Gobierno", text: "Multas, embargos o «actualice su RUT» con links que no terminan en .gov.co." },
  { icon: "🏦", title: "Se hacen pasar por tu banco", text: "«Tu cuenta fue bloqueada», links falsos o llamadas pidiendo el código del SMS." },
  { icon: "💸", title: "Pagos falsos de Nequi o Daviplata", text: "Pantallazos de «envío exitoso» que nunca llegaron a tu cuenta." },
  { icon: "👨‍👩‍👧", title: "«Mamá, cambié de número»", text: "Alguien finge ser un familiar o conocido y te pide plata con urgencia." },
  { icon: "🎁", title: "Premios, bonos y préstamos", text: "Te «ganaste» algo o te «aprobaron» un crédito que nunca pediste." },
  { icon: "🧾", title: "Recibos y proveedores", text: "Cobros falsos de luz, gas o agua, o un proveedor que «cambió de cuenta»." },
];

const semaforo = [
  {
    color: "bg-red-50 border-red-200",
    dot: "bg-danger",
    title: "Peligroso",
    text: "No abras el link, no pagues y no respondas.",
  },
  {
    color: "bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
    title: "Sospechoso",
    text: "No actúes todavía. Confirma llamando a un número que tú busques.",
  },
  {
    color: "bg-green-50 border-green-200",
    dot: "bg-ok",
    title: "Sin señales evidentes",
    text: "Igual, si te piden dinero o datos, confirma por otro canal.",
  },
];


export default function Home() {
  return (
    <>
      {/* 1. Qué es y qué hacer, en una pantalla de celular */}
      <section className="bg-gradient-to-b from-brand-50 to-surface">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-10 pt-6 md:grid-cols-[1.1fr_1fr] md:py-16">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-sm font-semibold text-brand-800">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-600" aria-hidden="true" />
              Gratis · 24 horas · Comerciantes de Santa Fe
            </p>
            <h1 className="text-[2rem] font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
              ¿Te llegó un mensaje raro?
              <span className="block text-brand-700">Revísalo antes de pagar.</span>
            </h1>
            <p className="mt-3 max-w-xl text-lg text-muted">
              Te decimos en segundos si tiene señales de fraude. No guardamos tus mensajes ni tu
              número.
            </p>

            <div className="mt-6 grid gap-3">
              <ActionCard
                href="/verificar"
                icon="🔍"
                title="Revisar un mensaje"
                text="Pega el mensaje o sube una captura"
                tone="primary"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <ActionCard href="/simulador" icon="🎯" title="Simulador" text="¿Caerías? Practica con casos" tone="light" />
                <ActionCard href="/ayuda" icon="🆘" title="Ya caí" text="Qué hacer y a quién llamar" tone="danger" />
              </div>
              {waLink && (
                <a
                  href={waLink}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#25d366] bg-white px-5 py-3 text-lg font-semibold text-[#128c4a] hover:bg-green-50"
                >
                  <span aria-hidden="true">💬</span> Usar por WhatsApp
                </a>
              )}
              {tgLink && (
                <a
                  href={tgLink}
                  className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-[#229ed9] bg-white px-5 py-3 text-lg font-semibold text-[#1a6fa0] hover:bg-sky-50"
                >
                  <span aria-hidden="true">✈️</span> Usar por Telegram
                </a>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <PoliceMascot />
            <ChatDemo />
          </div>
        </div>
      </section>

      {/* 2. En qué casos ayuda */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="text-2xl font-bold">¿En qué casos te ayuda?</h2>
        <p className="mt-1 text-muted">Estas son las trampas más comunes en Colombia. El bot las reconoce.</p>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {casos.map((c) => (
            <li key={c.title} className="flex gap-4 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <span className="text-3xl" aria-hidden="true">
                {c.icon}
              </span>
              <div>
                <p className="font-bold">{c.title}</p>
                <p className="text-sm text-muted">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link
          href="/verificar"
          className="mt-6 flex min-h-14 items-center justify-center rounded-2xl bg-brand-700 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-800 sm:inline-flex"
        >
          🔍 ¿Te llegó algo así? Revísalo aquí
        </Link>
      </section>

      {/* 3. Cómo se usa y qué significa cada color */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">Así de fácil</h2>
            <ol className="mt-5 space-y-4">
              {[
                ["Copia", "el mensaje, el link o toma una captura de pantalla."],
                ["Pégalo", "en «Revisar un mensaje» o envíalo por WhatsApp."],
                ["Mira el color", "y sigue el consejo. Si ya caíste, toca «Ya caí»."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white">
                    {i + 1}
                  </span>
                  <p className="pt-2 text-lg">
                    <strong>{t}</strong> {d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold">Qué significa cada color</h2>
            <ul className="mt-5 space-y-3">
              {semaforo.map((s) => (
                <li key={s.title} className={`flex gap-4 rounded-2xl border p-4 ${s.color}`}>
                  <span className={`mt-1 h-6 w-6 shrink-0 rounded-full ${s.dot}`} aria-hidden="true" />
                  <div>
                    <p className="text-lg font-bold">{s.title}</p>
                    <p className="text-muted">{s.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Kit de verificación de 5 puntos (el mismo del sticker del taller) */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-sm font-semibold text-brand-700">📚 Aprende</p>
        <h2 className="text-2xl font-bold">Kit de verificación: revisa estos 5 puntos</h2>
        <p className="mt-1 max-w-2xl text-muted">
          Antes de pagar, abrir un link o descargar un archivo, hazte estas cinco preguntas. Con una
          sola señal, desconfía.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {KIT.map((k, i) => (
            <li key={k.id} className="flex flex-col rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700 text-sm font-bold text-white">{i + 1}</span>
                <span className="text-2xl" aria-hidden="true">{k.icon}</span>
              </span>
              <p className="mt-2 font-bold">{k.title}</p>
              <p className="font-medium text-brand-800">{k.question}</p>
              <p className="mt-1 text-sm text-muted">{k.tip}</p>
              <p className="mt-auto pt-2 text-xs italic text-muted">Ej.: {k.example}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/simulador"
            className="flex min-h-14 items-center justify-center rounded-2xl bg-ink px-6 py-3 text-lg font-semibold text-white hover:bg-black"
          >
            🎯 Ponte a prueba en el simulador
          </Link>
          <Link
            href="/kit"
            className="flex min-h-14 items-center justify-center rounded-2xl border-2 border-ink px-6 py-3 text-lg font-semibold hover:bg-white"
          >
            🖨️ Imprime el kit para tu caja
          </Link>
        </div>
      </section>

      {/* 5. Capacitación */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-bold">Capacitación para tu negocio</h2>
          <ul className="mt-5 grid gap-3 md:grid-cols-3">
            {[
              { href: "/simulador", icon: "🎯", title: "Simulador de casos", text: "Revisa mensajes como los que llegan a tu negocio y descubre si caerías. Nada se abre de verdad." },
              { href: "/aula", icon: "📚", title: "Aula virtual", text: "Pruebas cortas sin registro: mide cuánto sabes antes y después." },
              { href: "/taller", icon: "👥", title: "Taller móvil", text: "Para facilitadores: códigos por participante, consentimiento y lista de observación." },
            ].map((c) => (
              <li key={c.href}>
                <Link href={c.href} className="flex h-full flex-col rounded-2xl border border-black/10 p-5 hover:border-brand-500">
                  <span className="text-3xl" aria-hidden="true">{c.icon}</span>
                  <span className="mt-2 text-lg font-bold">{c.title}</span>
                  <span className="mt-1 text-sm text-muted">{c.text}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6. Ayuda urgente siempre a mano */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl bg-brand-900 p-6 text-white sm:p-10">
          <h2 className="text-2xl font-bold">¿Ya pagaste o diste datos?</h2>
          <p className="mt-2 text-brand-100">
            Actúa en los primeros minutos: llama a tu banco, guarda las pruebas y denuncia.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <a href="tel:165" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-lg font-bold text-brand-900">
              📞 Llamar al 165
            </a>
            <a href="tel:123" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-lg font-bold">
              🚨 Emergencia 123
            </a>
            <Link href="/ayuda" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-lg font-bold">
              Ver qué hacer →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
  tone,
}: {
  href: string;
  icon: string;
  title: string;
  text: string;
  tone: "primary" | "light" | "danger";
}) {
  const styles = {
    primary: "bg-brand-700 text-white hover:bg-brand-800 shadow-lg shadow-brand-700/20",
    light: "bg-white text-ink border border-black/10 hover:border-brand-500",
    danger: "bg-white text-ink border-2 border-red-200 hover:border-danger",
  }[tone];
  return (
    <Link
      href={href}
      className={`flex min-h-16 items-center gap-4 rounded-2xl px-5 py-4 transition active:scale-[0.99] motion-reduce:transition-none ${styles}`}
    >
      <span className="text-3xl" aria-hidden="true">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-lg font-bold leading-tight">{title}</span>
        <span className={`block text-sm ${tone === "primary" ? "text-brand-100" : "text-muted"}`}>{text}</span>
      </span>
      <span aria-hidden="true" className="text-xl">
        →
      </span>
    </Link>
  );
}
