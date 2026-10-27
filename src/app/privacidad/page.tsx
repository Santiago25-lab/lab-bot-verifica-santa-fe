import type { Metadata } from "next";

export const metadata: Metadata = { title: "Aviso de privacidad" };

const responsable = {
  nombre: process.env.NEXT_PUBLIC_RESPONSABLE_NOMBRE,
  correo: process.env.NEXT_PUBLIC_RESPONSABLE_CORREO,
  ciudad: process.env.NEXT_PUBLIC_RESPONSABLE_CIUDAD || "Bogotá D.C.",
};

export default function PrivacidadPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 px-4 py-10 leading-relaxed">
      <h1 className="text-3xl font-bold">Aviso de privacidad</h1>
      <p className="text-muted">Ley 1581 de 2012 y Decreto 1377 de 2013 (Habeas Data).</p>

      <h2 className="pt-2 text-xl font-semibold">Qué hacemos con tu información</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>
          <strong>Mensajes, links y capturas:</strong> se analizan en el momento y se descartan. No
          guardamos su contenido.
        </li>
        <li>
          <strong>Número de WhatsApp o usuario de Telegram:</strong> se convierte en un código
          anónimo e irreversible. El número o usuario no se guarda.
        </li>
        <li>
          <strong>Web y aula virtual:</strong> no pedimos nombre, correo ni cédula. Tu navegador
          recibe un código anónimo para ordenar tus respuestas.
        </li>
        <li>
          <strong>Estadísticas:</strong> guardamos datos agregados (por ejemplo, cuántos mensajes
          resultaron peligrosos) para evaluar el proyecto académico.
        </li>
        <li>
          <strong>Mensajes reportados:</strong> solo si tú tocas «🚩 Reportar», guardamos el
          mensaje para que el equipo lo revise y alerte a otros. Antes de guardarlo le quitamos
          números, nombres y las rutas de los links.
        </li>
        <li>
          <strong>Simulador y modo taller:</strong> guardamos qué señales encontraste y si acertaste,
          con un código anónimo o con el código de participante que asigna el facilitador. Nunca tu
          nombre. Los mensajes del simulador son inventados y ningún link se abre de verdad.
        </li>
        <li>
          <strong>Mensajes que reenvías:</strong> pueden traer datos de otras personas (nombres,
          números). Por eso no los guardamos y, si los reportas, los anonimizamos antes.
        </li>
      </ul>

      <h2 className="pt-2 text-xl font-semibold">Uso de inteligencia artificial</h2>
      <p>
        Para explicar algunos resultados usamos un servicio de IA generativa (Google Gemini). La IA
        recibe el texto <strong>sin números, nombres, correos ni rutas de links</strong>, solo puede
        hacer más estricta la alerta (nunca la baja) y no toma decisiones sobre personas. Las reglas
        del sistema deciden el resultado. Declaramos este uso conforme a los lineamientos
        institucionales sobre IA aplicables al proyecto.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Autorización</h2>
      <p>
        Al usar el bot, el simulador o el aula virtual autorizas el tratamiento anónimo descrito en
        este aviso para fines académicos y de prevención. En los talleres presenciales, además, se
        firma un consentimiento informado antes del simulacro. Puedes dejar de participar en
        cualquier momento.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Naturaleza del proyecto</h2>
      <p>
        Verifica Santa Fe es un <strong>proyecto académico de prevención</strong>. No es un canal
        oficial de la Policía Nacional ni de ninguna entidad, y no recibe denuncias. Para denunciar,
        llama a la línea 165 o usa el CAI Virtual.
      </p>

      <h2 className="pt-2 text-xl font-semibold">Finalidad</h2>
      <p>
        Orientar sobre posibles fraudes digitales y medir, de forma anónima, el aporte del proyecto
        Escuela Móvil Anti-Phishing + Bot Verifica Santa Fe. El bot solo orienta: no reemplaza una
        denuncia ante las autoridades.
      </p>

      {responsable.nombre && (
        <>
          <h2 className="pt-2 text-xl font-semibold">Responsable del tratamiento</h2>
          <p>
            {responsable.nombre} · {responsable.ciudad}, Colombia
            {responsable.correo && (
              <>
                {" · "}
                <a href={`mailto:${responsable.correo}`} className="text-brand-700 underline">
                  {responsable.correo}
                </a>
              </>
            )}
          </p>
        </>
      )}

      <h2 className="pt-2 text-xl font-semibold">Tus derechos</h2>
      <p>
        Puedes conocer, actualizar, rectificar y pedir la supresión de tus datos. Como no
        guardamos datos que te identifiquen, basta con dejar de usar el servicio o borrar los datos
        de tu navegador. Para consultas, escribe
        {responsable.correo ? (
          <>
            {" a "}
            <a href={`mailto:${responsable.correo}`} className="text-brand-700 underline">
              {responsable.correo}
            </a>
            .
          </>
        ) : (
          " al equipo responsable del proyecto."
        )}
      </p>
    </article>
  );
}
