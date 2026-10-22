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

export const defaultQuizzes: Quiz[] = [
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
