import type {
  Contact,
  DomainEntry,
  KeywordCategory,
  KeywordEntry,
  Quiz,
  Simulacro,
} from "@/lib/types";

/**
 * Datos iniciales. Se cargan en la base de datos la primera vez que arranca la app
 * y después se editan desde el panel de administración.
 * Los dominios se deben confirmar en la página oficial de cada entidad antes del piloto.
 */

/** Súbelo al agregar datos iniciales: la app los añade a una base ya cargada. */
export const SEED_VERSION = "4";

const white: [string, string, boolean][] = [
  ["dian.gov.co", "DIAN", true],
  ["nequi.com.co", "Nequi", true],
  ["daviplata.com", "Daviplata", true],
  ["bancolombia.com", "Bancolombia", true],
  ["davivienda.com", "Davivienda", true],
  ["enel.com.co", "Enel", true],
  ["grupovanti.com", "Vanti", true],
  ["acueducto.com.co", "Acueducto de Bogotá", true],
  ["haciendabogota.gov.co", "Secretaría de Hacienda de Bogotá", true],
  ["policia.gov.co", "Policía Nacional", true],
  ["bancodebogota.com", "Banco de Bogotá", false],
  ["bbva.com.co", "BBVA", false],
  ["bancodeoccidente.com.co", "Banco de Occidente", false],
  ["avvillas.com.co", "AV Villas", false],
  ["bancocajasocial.com", "Banco Caja Social", false],
  ["pse.com.co", "PSE", false],
  ["ccb.org.co", "Cámara de Comercio de Bogotá", false],
  ["fiscalia.gov.co", "Fiscalía", false],
  ["sic.gov.co", "Superintendencia de Industria y Comercio", false],
  ["superfinanciera.gov.co", "Superintendencia Financiera", false],
];

export const defaultDomains: DomainEntry[] = [
  ...white.map(([domain, entity, priority]) => ({
    id: `d-${domain}`,
    domain,
    entity,
    list: "blanca" as const,
    priority,
  })),
  {
    id: "d-dian-col.com",
    domain: "dian-col.com",
    entity: "Imita a la DIAN (ejemplo)",
    list: "negra",
    priority: false,
  },
];

const kw: Record<KeywordCategory, string[]> = {
  urgencia: [
    "ultimo aviso",
    "24 horas",
    "48 horas",
    "inmediatamente",
    "hoy mismo",
    "urgente",
    "embargo",
    "embargada",
    "bloqueo",
    "bloqueada",
    "bloqueado",
    "suspendida",
    "vence hoy",
    "evite",
    "sancion",
    "multa",
    "proceso judicial",
    "citacion",
  ],
  solicitud: [
    "actualice",
    "actualiza tus datos",
    "actualizar sus datos",
    "verifique su cuenta",
    "verifica tu cuenta",
    "ingrese su clave",
    "clave",
    "contrasena",
    "codigo de verificacion",
    "pague aqui",
    "realice el pago",
    "consigne",
    "consignanos",
    "transfiera",
    "reclame",
    "reclamalo",
    "haga clic",
    "clic aqui",
    "ingrese aqui",
    "descargue",
    "datos bancarios",
    "numero de tarjeta",
    "nueva cuenta",
    "el codigo que te llego",
    "codigo que te llego",
    "me regalas el codigo",
    "dame el codigo",
    "enviame el codigo",
    "codigo de seguridad",
    "clave dinamica",
    "soy del banco",
    "te llamamos del banco",
  ],
  comprobante: [
    "comprobante",
    "transferencia exitosa",
    "envio exitoso",
    "ya te transferi",
    "ya le transferi",
    "ya te consigne",
    "te envie el pago",
    "pago realizado",
    "te mande la plata",
    "mira el pantallazo",
    "envio realizado",
    "transferencia realizada",
    "transaccion exitosa",
    "pago exitoso",
    "detalle del movimiento",
  ],
  entidad_publica: [
    "dian",
    "fiscalia",
    "policia",
    "gobierno",
    "alcaldia",
    "sisben",
    "registraduria",
    "simit",
    "hacienda",
    "rut",
    "procuraduria",
    "contraloria",
    "juzgado",
  ],
};

export const defaultKeywords: KeywordEntry[] = Object.entries(kw).flatMap(
  ([category, phrases]) =>
    phrases.map((phrase) => ({
      id: `k-${category}-${phrase.replace(/\s+/g, "-")}`,
      phrase,
      category: category as KeywordCategory,
    })),
);

export const defaultContacts: Contact[] = [
  {
    id: "c-165",
    name: "Línea 165 – Policía Nacional",
    phone: "165",
    url: "",
    description: "Extorsión, fraudes y amenazas. Gratis, 24 horas.",
    cases: ["pago", "datos", "extorsion", "clic"],
    sort: 1,
  },
  {
    id: "c-banco",
    name: "Tu banco o billetera digital",
    phone: "",
    url: "",
    description:
      "Llama YA a la línea oficial (detrás de tu tarjeta o dentro de la app) para bloquear la cuenta y pedir reversión.",
    cases: ["pago", "datos"],
    sort: 2,
  },
  {
    id: "c-caivirtual",
    name: "CAI Virtual – Policía",
    phone: "",
    url: "https://caivirtual.policia.gov.co",
    description: "Denuncia en línea de delitos informáticos.",
    cases: ["pago", "datos", "clic"],
    sort: 3,
  },
  {
    id: "c-123",
    name: "Línea 123 – Emergencias",
    phone: "123",
    url: "",
    description: "Si hay un riesgo inmediato para ti o tu negocio.",
    cases: ["extorsion"],
    sort: 4,
  },
];

export const defaultSimulacros: Simulacro[] = [
  {
    id: "s-dian-embargo",
    sender: "+57 321 456 7890",
    message:
      "DIAN: Su RUT presenta inconsistencias. Evite el embargo de su cuenta en 24 horas actualizando aquí: https://dian-col.com/actualizar",
    is_phishing: true,
    key_signal: "El link no termina en .gov.co y hay urgencia (24 horas, embargo).",
    explanation:
      "La DIAN solo usa dian.gov.co y no notifica embargos por WhatsApp. Entra tú mismo a dian.gov.co si tienes dudas.",
    active: true,
  },
  {
    id: "s-nequi-comprobante",
    sender: "Cliente nuevo",
    message:
      "Ya te transferí los $85.000 por Nequi, mira el comprobante 👇 [pantallazo de 'Envío exitoso']. ¿Me despachas ya?",
    is_phishing: true,
    key_signal: "Un pantallazo no prueba que el dinero llegó.",
    explanation:
      "Los comprobantes se falsifican fácil. Antes de entregar, abre TU app de Nequi y confirma que el dinero está en tu saldo.",
    active: true,
  },
  {
    id: "s-bancolombia-bitly",
    sender: "SMS 89xxx",
    message:
      "Bancolombia le informa: su clave dinámica fue bloqueada. Desbloquéela en bit.ly/bancol-seguro",
    is_phishing: true,
    key_signal: "Link acortado y pide tu clave.",
    explanation:
      "Los bancos no envían links acortados para desbloquear claves. Llama a la línea que aparece detrás de tu tarjeta.",
    active: true,
  },
  {
    id: "s-enel-real",
    sender: "Enel Colombia",
    message:
      "Enel Colombia: tu factura de octubre ya está disponible. Consúltala en enel.com.co o en la app Enel Clientes.",
    is_phishing: false,
    key_signal: "Dominio oficial, sin urgencia y sin pedir datos.",
    explanation:
      "Este mensaje es informativo y usa el dominio oficial. Aun así, lo más seguro es escribir tú la dirección en el navegador.",
    active: true,
  },
  {
    id: "s-proveedor-cuenta",
    sender: "Distribuidora El Sol",
    message:
      "Hola, cambiamos de cuenta. Consígnanos el pedido hoy mismo a esta nueva cuenta de ahorros para no perder el descuento.",
    is_phishing: true,
    key_signal: "Cambio de cuenta + urgencia.",
    explanation:
      "Antes de pagar a una cuenta nueva, llama al proveedor al número que YA tenías (segundo canal), no al del mensaje.",
    active: true,
  },
  {
    id: "s-premio-ccb",
    sender: "+57 310 000 1122",
    message:
      "¡Felicidades! Tu negocio ganó un bono de $500.000 de la Cámara de Comercio. Reclámalo con tus datos en camara-comercio-bonos.com",
    is_phishing: true,
    key_signal: "Premio que no pediste y dominio que no es ccb.org.co.",
    explanation:
      "Nadie regala dinero por WhatsApp. La Cámara de Comercio de Bogotá usa ccb.org.co.",
    active: true,
  },
  {
    id: "s-davivienda-real",
    sender: "Davivienda",
    message:
      "Davivienda: realizaste una compra por $45.900 en Éxito. Si no la reconoces, comunícate a la línea que aparece en tu tarjeta.",
    is_phishing: false,
    key_signal: "No trae link y te manda a la línea de tu tarjeta.",
    explanation:
      "Un aviso real no te pide claves ni te da un link: te remite a un canal que ya conoces.",
    active: true,
  },
  {
    id: "s-fiscalia",
    sender: "notificaciones@fiscalia-citaciones.online",
    message:
      "FISCALÍA GENERAL: usted tiene una citación judicial pendiente. Descargue el documento: https://fiscalia-citaciones.online/doc",
    is_phishing: true,
    key_signal: "Entidad pública con dominio que no termina en .gov.co.",
    explanation:
      "Estos links suelen instalar virus. La Fiscalía usa fiscalia.gov.co y no cita por correos desconocidos.",
    active: true,
  },
];

const fraudeOReal = ["🚩 Es fraude", "✅ Es real"];
const likert = [
  "1 · Totalmente en desacuerdo",
  "2 · En desacuerdo",
  "3 · Ni de acuerdo ni en desacuerdo",
  "4 · De acuerdo",
  "5 · Totalmente de acuerdo",
];

const fr = (prompt: string, scenario: string, fraude: boolean, explanation: string) => ({
  prompt,
  scenario,
  options: fraudeOReal,
  correct_index: fraude ? 0 : 1,
  explanation,
});

/** Slugs fijos: el panel compara la prueba de entrada con la de salida de cada persona. */
export const PRE_SLUG = "prueba-de-entrada";
export const POST_SLUG = "prueba-de-salida";
export const SEGUIMIENTO_SLUG = "encuesta-de-seguimiento";

export const defaultQuizzes: Quiz[] = [
  {
    id: "q-entrada",
    slug: PRE_SLUG,
    title: "Prueba de entrada",
    description: "Empieza aquí: 6 preguntas para saber cuánto reconoces hoy. Al final haz la prueba de salida.",
    kind: "prueba",
    published: true,
    sort: 0,
    questions: [
      { id: "pe-1", ...fr("Te llega este SMS. ¿Qué es?", "Bancolombia: su cuenta fue bloqueada. Ingrese aquí para desbloquearla: bancolombia-seguridad.co", true, "El dominio no es bancolombia.com y te apura con un bloqueo.") },
      { id: "pe-2", ...fr("Te llega esta notificación. ¿Qué es?", "Nequi: recibiste $50.000 de JUAN P. Consulta tu saldo en la app.", false, "No trae link ni pide nada: solo te invita a revisar en tu app.") },
      {
        id: "pe-3",
        prompt: "¿Cómo termina la dirección de una página del Gobierno de Colombia?",
        options: [".com", ".gov.co", ".co", ".net"],
        correct_index: 1,
        explanation: "Todas las páginas del Gobierno terminan en .gov.co.",
      },
      { id: "pe-4", ...fr("Te escriben de un número nuevo. ¿Qué es?", "Hola tía, soy tu sobrino, cambié de número. Préstame 200 mil que mañana te devuelvo.", true, "Llámalo a su número de siempre antes de enviar dinero.") },
      {
        id: "pe-5",
        prompt: "Te llaman «del banco» y te piden el código que te llegó por SMS. ¿Qué haces?",
        options: ["Se lo doy, es del banco", "Cuelgo y llamo yo al número de mi tarjeta", "Le doy solo una parte"],
        correct_index: 1,
        explanation: "Ningún banco te pide ese código. Es la llave de tu cuenta.",
      },
      {
        id: "pe-6",
        prompt: "¿A qué línea llamas para denunciar un fraude o una extorsión?",
        options: ["165", "911", "018000"],
        correct_index: 0,
        explanation: "La línea 165 de la Policía es gratuita y atiende 24 horas.",
      },
    ],
  },
  {
    id: "q-salida",
    slug: POST_SLUG,
    title: "Prueba de salida",
    description: "Hazla después de usar el bot o de la Escuela Móvil para ver cuánto mejoraste.",
    kind: "prueba",
    published: true,
    sort: 4,
    questions: [
      { id: "ps-1", ...fr("Te llega este mensaje. ¿Qué es?", "DIAN: tiene una sanción pendiente. Pague hoy para evitar el embargo: dian-sanciones.com", true, "No termina en .gov.co y te amenaza con embargo.") },
      { id: "ps-2", ...fr("Te llega este SMS. ¿Qué es?", "Davivienda: compra por $32.000 en Olímpica. Si no la reconoces, llama a la línea de tu tarjeta.", false, "No trae link y te manda a un canal que ya conoces.") },
      {
        id: "ps-3",
        prompt: "Un link dice ser de Bancolombia. ¿Cuál es el oficial?",
        options: ["bancolombia-pagos.com", "bancolombia.com", "bancolonbia.com"],
        correct_index: 1,
        explanation: "Un guion o una letra cambiada es la trampa más común.",
      },
      { id: "ps-4", ...fr("Te llega este WhatsApp. ¿Qué es?", "¡Felicidades! Ganaste un bono de $300.000. Reclámalo con tus datos en premios-colombia.online", true, "Nadie regala dinero por WhatsApp.") },
      {
        id: "ps-5",
        prompt: "Un cliente te muestra un pantallazo de pago. ¿Qué haces antes de entregar?",
        options: ["Entrego, el pantallazo basta", "Reviso en MI app que el dinero llegó", "Le pido otro pantallazo"],
        correct_index: 1,
        explanation: "Solo tu propia app confirma el pago.",
      },
      {
        id: "ps-6",
        prompt: "Si ya le diste tus claves a un estafador, ¿qué haces primero?",
        options: ["Esperar a ver qué pasa", "Llamar al banco para bloquear y denunciar al 165", "Borrar los mensajes"],
        correct_index: 1,
        explanation: "Bloquear rápido evita más pérdidas; los mensajes son tus pruebas.",
      },
    ],
  },
  {
    id: "q-fraude-o-real",
    slug: "fraude-o-real",
    title: "¿Fraude o real?",
    description: "6 mensajes reales de Colombia. Decide en segundos cuál es una trampa.",
    kind: "prueba",
    published: true,
    sort: 1,
    questions: defaultSimulacros.slice(0, 6).map((s, i) => ({
      id: `q1-${i + 1}`,
      prompt: `Te escribe ${s.sender}. ¿Qué es?`,
      scenario: s.message,
      options: fraudeOReal,
      correct_index: s.is_phishing ? 0 : 1,
      explanation: `${s.key_signal} ${s.explanation}`,
    })),
  },
  {
    id: "q-habitos",
    slug: "habitos-de-verificacion",
    title: "Hábitos de verificación",
    description: "¿Sabes qué hacer antes de abrir un link o entregar un pedido?",
    kind: "prueba",
    published: true,
    sort: 2,
    questions: [
      {
        id: "q2-1",
        prompt: "Te llega un link «de la DIAN». ¿Cómo debe terminar la dirección?",
        options: ["dian.com", "dian.gov.co", "dian-col.com", "dian.co"],
        correct_index: 1,
        explanation: "Las entidades del Gobierno de Colombia usan direcciones que terminan en .gov.co.",
      },
      {
        id: "q2-2",
        prompt: "Un cliente te muestra un pantallazo de pago de Nequi. ¿Qué haces?",
        options: [
          "Entrego el pedido, el pantallazo es prueba",
          "Reviso en MI app que el dinero llegó",
          "Le pido que me reenvíe el pantallazo",
        ],
        correct_index: 1,
        explanation: "Solo tu propia app confirma el pago. Los pantallazos se editan fácil.",
      },
      {
        id: "q2-3",
        prompt: "¿Qué es «verificar por un segundo canal»?",
        options: [
          "Responder el mismo mensaje preguntando si es real",
          "Llamar a la entidad a un número que YO busqué",
          "Reenviar el mensaje a un amigo",
        ],
        correct_index: 1,
        explanation: "El número o link del mensaje puede ser falso. Busca tú el contacto oficial.",
      },
      {
        id: "q2-4",
        prompt: "Un link empieza por bit.ly o tinyurl. ¿Qué significa?",
        options: [
          "Que es seguro",
          "Que esconde la dirección real",
          "Que viene de un banco",
        ],
        correct_index: 1,
        explanation: "Los links acortados ocultan a dónde te llevan. Verifícalos antes de abrir.",
      },
      {
        id: "q2-5",
        prompt: "Pagaste a un estafador hace 10 minutos. ¿Qué haces primero?",
        options: [
          "Esperar a ver si devuelve el dinero",
          "Llamar a mi banco y a la línea 165",
          "Borrar la conversación",
        ],
        correct_index: 1,
        explanation:
          "Actuar rápido aumenta la posibilidad de bloquear la cuenta. Guarda la conversación como prueba.",
      },
    ],
  },
  {
    id: "q-encuesta",
    slug: "encuesta-de-percepcion",
    title: "Encuesta de percepción",
    description: "2 minutos. Tus respuestas son anónimas y nos ayudan a evaluar el proyecto.",
    kind: "encuesta",
    published: true,
    sort: 3,
    questions: [
      { id: "e-1", prompt: "Sé reconocer un mensaje de phishing.", options: likert },
      {
        id: "e-2",
        prompt: "Antes de abrir un link reviso el remitente y la dirección (dominio).",
        options: likert,
      },
      {
        id: "e-3",
        prompt: "Cuando dudo, confirmo por otro canal (llamo al número oficial).",
        options: likert,
      },
      { id: "e-4", prompt: "Sé a dónde denunciar un fraude (línea 165).", options: likert },
      {
        id: "e-5",
        prompt: "¿El bot o el aula te ayudaron a evitar un posible fraude?",
        options: ["Sí", "No", "Todavía no lo he usado"],
      },
      { id: "e-6", prompt: "Recomendaría Verifica Santa Fe a otro comerciante.", options: likert },
    ],
  },
  {
    // Instrumento del criterio de uso del bot: se aplica al terminar los 15 días de pilotaje.
    id: "q-seguimiento",
    slug: SEGUIMIENTO_SLUG,
    title: "Encuesta de seguimiento (día 15)",
    description: "Para quienes participaron en el taller: 7 preguntas sobre los últimos 15 días.",
    kind: "encuesta",
    published: true,
    sort: 5,
    questions: [
      { id: "s-1", prompt: "¿Usaste el bot Verifica Santa Fe en los últimos 15 días?", options: ["Sí", "No"] },
      { id: "s-2", prompt: "¿Cuántas veces lo usaste?", options: ["Ninguna", "1 vez", "De 2 a 5 veces", "Más de 5 veces"] },
      { id: "s-3", prompt: "¿Por dónde lo usaste más?", options: ["Página web", "Telegram", "WhatsApp", "No lo usé"] },
      { id: "s-4", prompt: "La respuesta del bot fue fácil de entender.", options: likert },
      {
        id: "s-5",
        prompt: "¿Te llegó algún mensaje sospechoso en estos 15 días?",
        options: ["Sí, y no hice lo que pedía", "Sí, y alcancé a abrir, responder o pagar", "No me llegó ninguno"],
      },
      { id: "s-6", prompt: "Revisé los 5 puntos del kit antes de pagar, abrir un link o descargar un archivo.", options: likert },
      { id: "s-7", prompt: "¿El kit de 5 puntos sigue pegado en tu caja?", options: ["Sí", "No", "No lo recibí"] },
    ],
  },
];

export const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "is.gd",
  "cutt.ly",
  "rebrand.ly",
  "shorturl.at",
  "tiny.cc",
  "rb.gy",
  "acortar.link",
  "bit.do",
  "s.id",
  "t.ly",
  "buff.ly",
  "tr.im",
  "v.gd",
];

export const FREE_MAIL = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "live.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
];
