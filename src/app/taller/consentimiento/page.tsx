import type { Metadata } from "next";
import { Logo } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "Consentimiento informado",
  robots: { index: false, follow: false },
};

const Linea = ({ label }: { label: string }) => (
  <p className="flex items-end gap-2">
    <span className="whitespace-nowrap">{label}</span>
    <span className="mb-1 flex-1 border-b border-black/60" />
  </p>
);

/** Formato imprimible: se firma ANTES del taller y del simulacro. */
export default function ConsentimientoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 print:max-w-none print:p-0">
      <div className="mb-4 flex items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted">Imprime una copia por participante (tamaño carta).</p>
        <PrintButton />
      </div>
      <article className="space-y-4 rounded-2xl border border-black/10 bg-white p-6 text-[0.95rem] leading-relaxed print:rounded-none print:border-0 print:p-0">
        <header className="flex items-center gap-3 border-b border-black/10 pb-3">
          <Logo className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold">Consentimiento informado</h1>
            <p className="text-sm text-muted">Taller móvil anti-phishing · Proyecto académico «Escuela Móvil Anti-Phishing + Bot Verifica Santa Fe»</p>
          </div>
        </header>

        <section>
          <h2 className="font-bold">1. ¿De qué se trata?</h2>
          <p>
            Lo invitamos a participar en un taller de unos 60 minutos para aprender a reconocer mensajes
            fraudulentos (phishing) que llegan por SMS, WhatsApp o correo a los comercios de la localidad
            de Santa Fe. Es parte de un proyecto académico de prevención y no es un procedimiento policial.
          </p>
        </section>
        <section>
          <h2 className="font-bold">2. ¿Qué haré si acepto?</h2>
          <ul className="list-disc pl-6">
            <li>Responder una prueba corta al inicio y otra al final (6 preguntas cada una).</li>
            <li>
              Practicar en un <strong>simulador</strong> con mensajes de ejemplo. <strong>Algunos mensajes son falsos a
              propósito</strong> (simulacro) y usan empresas inventadas. Ningún link ni archivo se abre de verdad y en
              ningún momento se le pedirán claves, datos bancarios ni dinero.
            </li>
            <li>Al terminar, el facilitador le explicará cada caso y qué señales tenía (cierre explicativo).</li>
            <li>Si lo desea, responder una encuesta de opinión y probar el bot Verifica Santa Fe.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-bold">3. Riesgos y beneficios</h2>
          <p>
            El ejercicio no tiene riesgos para su dinero ni para su información. Puede sentir incomodidad si
            «cae» en un mensaje del simulacro: es normal y es la forma de aprender. El beneficio es reconocer a
            tiempo los fraudes más comunes y saber a quién acudir.
          </p>
        </section>
        <section>
          <h2 className="font-bold">4. Sus datos (Ley 1581 de 2012)</h2>
          <p>
            En la plataforma no se registra su nombre, cédula ni teléfono: sus respuestas quedan con un
            <strong> código de participante</strong>. Este formato firmado lo guarda el equipo del proyecto solo como
            evidencia del consentimiento. Los resultados se presentan de forma agregada, sin identificar a nadie.
            Puede conocer, actualizar o pedir que se eliminen sus datos escribiendo al equipo responsable.
          </p>
        </section>
        <section>
          <h2 className="font-bold">5. Participación voluntaria</h2>
          <p>Participar es voluntario. Puede negarse o retirarse en cualquier momento, sin dar explicaciones y sin ninguna consecuencia.</p>
        </section>

        <section className="space-y-2 rounded-xl border border-black/20 p-4">
          <p className="font-bold">Declaro que:</p>
          <p>☐ Me explicaron el propósito del taller y del simulacro, y resolvieron mis dudas.</p>
          <p>☐ Entiendo que algunos mensajes del simulador son falsos a propósito y que al final me explicarán cada caso.</p>
          <p>☐ Autorizo el uso anónimo de mis respuestas con fines académicos.</p>
          <p>☐ Acepto participar de forma voluntaria.</p>
        </section>

        <section className="grid gap-5 pt-2 sm:grid-cols-2 print:grid-cols-2">
          <Linea label="Nombre del participante:" />
          <Linea label="Código asignado (ej. T1-P01):" />
          <Linea label="Firma:" />
          <Linea label="Fecha y hora:" />
          <Linea label="Facilitador:" />
          <Linea label="Firma del facilitador:" />
        </section>
        <p className="pt-2 text-xs text-muted">
          Contactos: Policía línea 165 (gratis, 24 h) · Emergencias 123. Aviso de privacidad completo:
          lab-bot-verifica-santa-fe.vercel.app/privacidad
        </p>
      </article>
    </div>
  );
}
