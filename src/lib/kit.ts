/** Kit de verificación de 5 puntos del taller (el mismo del sticker de la caja registradora). */
export type KitId = "remitente" | "url" | "urgencia" | "adjunto" | "ortografia";

export interface KitPoint {
  id: KitId;
  icon: string;
  title: string;
  /** Pregunta que se hace el comerciante al revisar un mensaje. */
  question: string;
  /** Cómo reconocer la señal, en una frase. */
  tip: string;
  example: string;
}

export const KIT: KitPoint[] = [
  {
    id: "remitente",
    icon: "👤",
    title: "Remitente",
    question: "¿Quién lo envía?",
    tip: "Desconfía de números desconocidos, correos de Gmail o Hotmail y nombres que no coinciden con la entidad.",
    example: "«Banco» que escribe desde +57 321… o desde banco.seguro@gmail.com",
  },
  {
    id: "url",
    icon: "🔗",
    title: "URL o link",
    question: "¿El link es el oficial?",
    tip: "Lee la dirección completa: guiones, letras cambiadas o terminaciones como .xyz o .top delatan la trampa.",
    example: "bancocordillera-seguro.co en lugar de bancocordillera.com",
  },
  {
    id: "urgencia",
    icon: "⏰",
    title: "Urgencia",
    question: "¿Te apuran o te amenazan?",
    tip: "«Solo hoy», «en 2 horas», «embargo» o «bloqueo» buscan que actúes sin pensar.",
    example: "«Pague hoy o su cuenta será embargada»",
  },
  {
    id: "adjunto",
    icon: "📎",
    title: "Adjunto",
    question: "¿Trae un archivo para abrir?",
    tip: "Facturas, citaciones o comprobantes en .zip, .exe, .apk o PDF que no esperabas pueden robar tu información.",
    example: "Factura_pendiente.zip · Citacion.pdf.exe",
  },
  {
    id: "ortografia",
    icon: "✍️",
    title: "Ortografía",
    question: "¿Tiene errores o se ve raro?",
    tip: "Las entidades revisan sus mensajes. Faltas, mayúsculas de más y frases extrañas son señal de fraude.",
    example: "«Estimado cliente su cuenta a sido suspendida, ingrese sus datos»",
  },
];

export const KIT_IDS = KIT.map((k) => k.id);
