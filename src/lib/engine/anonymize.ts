/**
 * Quita datos personales antes de enviar un texto a la IA (Ley 1581).
 * Conserva lo necesario para analizar: palabras y dominios de los links.
 */
export function anonymize(text: string): string {
  return (
    text
      // Correos: se conserva solo el dominio, que es una señal útil.
      .replace(/[a-z0-9._%+-]+@([a-z0-9-]+(?:\.[a-z0-9-]+)+)/gi, "[correo]@$1")
      // Links: solo esquema y dominio; la ruta puede llevar códigos personales.
      .replace(/\b(https?:\/\/)?((?:[a-z0-9-]+\.)+[a-z]{2,})(\/[^\s]*)?/gi, (_m, s, host) =>
        `${s ?? ""}${host}`,
      )
      // Teléfonos, cédulas, cuentas y tarjetas: 6 o más dígitos seguidos o separados.
      .replace(/\+?\d[\d\s.-]{4,}\d/g, (m) =>
        m.replace(/\D/g, "").length >= 6 ? "[número]" : m,
      )
      // Nombres tras un saludo o tratamiento.
      .replace(
        /\b([Ss]ra?\.?|[Ss]eñora?|[Ee]stimad[oa]|[Hh]ola|[Dd]oña|[Dd]on)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+){0,2})/g,
        "$1 [nombre]",
      )
  );
}
