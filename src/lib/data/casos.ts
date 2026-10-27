import type { KitId } from "@/lib/kit";

/**
 * Casos del simulador. Todas las entidades son FICTICIAS y los links no funcionan:
 * es una maqueta para practicar, sin suplantar marcas reales ni capturar datos
 * (ver art. 269G de la Ley 1273 de 2009).
 */
export interface Caso {
  id: string;
  /** Caso de la simulación en vivo del taller; se usa para medir el criterio de reconocimiento. */
  principal?: boolean;
  canal: "sms" | "whatsapp" | "correo";
  de: string;
  /** Dirección o número completo del remitente. */
  detalleDe?: string;
  asunto?: string;
  mensaje: string;
  link?: string;
  adjunto?: string;
  fraude: boolean;
  /** Señales del kit presentes en el mensaje y por qué. */
  senales: Partial<Record<KitId, string>>;
  /** Cierre explicativo que se muestra al terminar el caso. */
  cierre: string;
}

export const CASOS: Caso[] = [
  {
    id: "factura-tributos",
    principal: true,
    canal: "correo",
    de: "Tributos Nacionales",
    detalleDe: "notificaciones@tributos-nacionales-co.com",
    asunto: "URGENTE: Su factura electronica fue RECHAZADA – sancion pendiente",
    mensaje:
      "Estimado contribuyente, su factura electronica fue rechazada por inconsistensias. Si no regulariza en las proximas 24 horas se aplicara una sancion y el embargo de sus cuentas. Descargue el detalle adjunto e ingrese al portal para pagar.",
    link: "tributos-nacionales-co.com/pago-sancion",
    adjunto: "Detalle_sancion_factura.zip",
    fraude: true,
    senales: {
      remitente: "El correo termina en «-co.com»: una entidad pública escribe desde un dominio .gov.co.",
      url: "El link no es oficial: tiene guiones y termina en .com en lugar de .gov.co.",
      urgencia: "Amenaza con sanción y embargo «en las próximas 24 horas».",
      adjunto: "Trae un archivo .zip: puede instalar un programa que roba tus claves.",
      ortografia: "«electronica», «inconsistensias», «sancion»: faltan tildes y hay errores.",
    },
    cierre:
      "Esta es la «falsa factura» que más usan contra comercios. Ninguna entidad te cobra por un link en un correo. Si tienes dudas, entra tú mismo a la página oficial (.gov.co) o llama a su línea.",
  },
  {
    id: "banco-bloqueo",
    canal: "sms",
    de: "+57 321 908 4471",
    mensaje:
      "Banco Cordillera: su cuenta fue BLOQUEADA por seguridad. Ingrese aqui sus datos en las proximas 2 horas para evitar la cancelacion: bancocordillera-seguro.co",
    link: "bancocordillera-seguro.co",
    fraude: true,
    senales: {
      remitente: "Un banco no escribe desde un celular común de 10 dígitos.",
      url: "«bancocordillera-seguro.co» agrega una palabra y un guion al nombre del banco.",
      urgencia: "«Bloqueada», «2 horas» y «cancelación» buscan que actúes sin pensar.",
      ortografia: "«aqui», «proximas», «cancelacion»: faltan tildes.",
    },
    cierre:
      "Ningún banco te pide datos por un link. Si te preocupa tu cuenta, abre la app del banco o llama al número que está detrás de tu tarjeta.",
  },
  {
    id: "proveedor-cuenta",
    canal: "whatsapp",
    de: "Distribuidora La Montaña",
    detalleDe: "+57 312 447 1093 (número nuevo)",
    mensaje:
      "Buenas tardes don Carlos 👋 le cuento que cambiamos de cuenta por un tema con el banco. Le envío la nueva cuenta en la foto. Por favor consigne HOY el pedido de esta semana para no perder el descuento 🙏",
    adjunto: "nueva_cuenta.jpg",
    fraude: true,
    senales: {
      remitente: "Es un número nuevo que dice ser tu proveedor de siempre.",
      urgencia: "Pide consignar «HOY» para no perder el descuento.",
      adjunto: "La «nueva cuenta» llega en una foto que no puedes comprobar.",
    },
    cierre:
      "El cambio de cuenta por mensaje es una de las estafas más comunes a comercios. Llama al proveedor al número que ya tenías guardado antes de consignar.",
  },
  {
    id: "banco-compra-real",
    canal: "sms",
    de: "BancoCordillera",
    detalleDe: "Mensaje del código corto 89123",
    mensaje:
      "Banco Cordillera: compra aprobada por $45.900 en Supermercado La Esquina con tu tarjeta *4821. Si no la reconoces, comunícate con la línea que aparece detrás de tu tarjeta.",
    fraude: false,
    senales: {},
    cierre:
      "Este es un aviso real: no trae link, no pide datos ni te apura, y te manda a un canal que ya conoces (la línea de tu tarjeta).",
  },
  {
    id: "energia-real",
    canal: "correo",
    de: "Energía Capital",
    detalleDe: "facturacion@energiacapital.com.co",
    asunto: "Tu factura de octubre ya está disponible",
    mensaje:
      "Hola, tu factura de octubre ya está disponible. Puedes consultarla y pagarla desde la app Energía Capital o en la sección «Mi cuenta» de nuestra página oficial. Recuerda que nunca te pediremos claves por correo.",
    fraude: false,
    senales: {},
    cierre:
      "Es un aviso real: viene del dominio oficial de la empresa, no tiene adjuntos ni urgencia y te invita a entrar por la app.",
  },
  {
    id: "bono-supermercado",
    canal: "whatsapp",
    de: "Promociones Ahorro",
    detalleDe: "+57 300 118 5520",
    mensaje:
      "🎉 FELISIDADES!! Su negocio fue seleccionado para un BONO de $500.000 de Supermercados Ahorro. Reclamelo SOLO HOY registrando sus datos y los de su tarjeta en bonos-ahorro.xyz 🎁",
    link: "bonos-ahorro.xyz",
    fraude: true,
    senales: {
      remitente: "Una empresa grande no escribe desde un número personal.",
      url: "Termina en .xyz, una terminación muy usada en páginas falsas.",
      urgencia: "«SOLO HOY» para que no te detengas a pensar.",
      ortografia: "«FELISIDADES», «Reclamelo» y muchas mayúsculas.",
    },
    cierre:
      "No puedes ganar un premio en algo en lo que no participaste, y nadie regala dinero pidiendo los datos de tu tarjeta.",
  },
  {
    id: "paquete-retenido",
    canal: "sms",
    de: "+57 318 664 2017",
    mensaje:
      "Envios Rapidos: su paquete esta retenido por direccion incompleta. Pague $4.900 hoy para reprogramar la entrega: envios-rapidos-co.top/pago",
    link: "envios-rapidos-co.top/pago",
    fraude: true,
    senales: {
      remitente: "Llega de un celular común, no del nombre de la empresa.",
      url: "Termina en .top y tiene guiones: no es una página oficial.",
      urgencia: "Pide pagar «hoy» para no perder el paquete.",
      ortografia: "«Envios», «Rapidos», «esta», «direccion»: faltan tildes.",
    },
    cierre:
      "Cobran poco para que no lo pienses y así roban los datos de tu tarjeta. Si esperas un paquete, consulta la guía en la página oficial de la transportadora.",
  },
  {
    id: "citacion-judicial",
    canal: "correo",
    de: "Oficina Judicial Virtual",
    detalleDe: "citaciones.juzgado@gmail.com",
    asunto: "CITACION JUDICIAL N° 2026-4471 – comparecer en 48 horas",
    mensaje:
      "Señor(a) comerciante: usted tiene una demanda en su contra. Debe presentarse en 48 horas o se emitira orden de captura. Descargue la citacion adjunta para conocer los detalles del proceso.",
    adjunto: "Citacion_2026_4471.pdf.exe",
    fraude: true,
    senales: {
      remitente: "Un juzgado no escribe desde un Gmail.",
      urgencia: "Amenaza con «orden de captura» en 48 horas.",
      adjunto: "El archivo termina en «.pdf.exe»: es un programa disfrazado de PDF.",
      ortografia: "«CITACION», «emitira», «citacion»: faltan tildes.",
    },
    cierre:
      "Las citaciones judiciales no llegan como archivos para descargar desde un Gmail. Nunca abras archivos que terminen en .exe, .zip o .apk que no esperabas.",
  },
];

export const CASOS_POR_SESION = 5;
export const casoById = (id: string) => CASOS.find((c) => c.id === id);

/** Elige los casos de una sesión: primero el caso principal y luego otros, con al menos uno real. */
export function casosDeSesion(random: () => number = Math.random): Caso[] {
  const principal = CASOS.find((c) => c.principal)!;
  const resto = CASOS.filter((c) => !c.principal).sort(() => random() - 0.5);
  const reales = resto.filter((c) => !c.fraude);
  const elegidos = resto.slice(0, CASOS_POR_SESION - 1);
  if (!elegidos.some((c) => !c.fraude) && reales.length) elegidos[elegidos.length - 1] = reales[0];
  return [principal, ...elegidos.sort(() => random() - 0.5)];
}

/** Califica un caso respondido: cuántas señales encontró, cuáles se le pasaron y si acertó. */
export function calificarCaso(caso: Caso, marcadas: KitId[], decisionFraude: boolean) {
  const presentes = Object.keys(caso.senales) as KitId[];
  const set = new Set(marcadas);
  const encontradas = presentes.filter((s) => set.has(s));
  return {
    presentes,
    encontradas,
    omitidas: presentes.filter((s) => !set.has(s)),
    falsasAlarmas: marcadas.filter((s) => !presentes.includes(s)),
    correcto: decisionFraude === caso.fraude,
  };
}
