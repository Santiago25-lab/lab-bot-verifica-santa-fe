import { analyzeMessage, vocabFor } from "@/lib/engine/analyze";
import { aiEnabled } from "@/lib/engine/ai";
import { anonymize } from "@/lib/engine/anonymize";
import { ocrImage } from "@/lib/engine/ocr";
import { normalize } from "@/lib/text";
import { correctTypos } from "@/lib/typos";
import type {
  Analysis,
  Signal,
  AppConfig,
  Channel,
  EventRow,
  Simulacro,
  TriageCase,
} from "@/lib/types";

export interface BotButton {
  id: string;
  /** Máximo 20 caracteres (límite de WhatsApp). */
  title: string;
}

export interface BotReply {
  text: string;
  buttons?: BotButton[];
  list?: { button: string; rows: { id: string; title: string; description?: string }[] };
}

export interface BotState {
  welcomed?: boolean;
  step?: "idle" | "triage_ask" | "simulacro";
  simId?: string;
  lastSims?: string[];
  alert?: { entities: string[]; domains: string[] };
  /** Último mensaje revisado, ya sin datos personales, por si la persona decide reportarlo. */
  lastReport?: { text: string; verdict: Analysis["verdict"]; signals: string[]; domains: string[] };
  /** La última respuesta del bot aún se puede valorar (👍/👎) una sola vez. */
  canRate?: boolean;
}

const VERDICTS: Analysis["verdict"][] = ["peligroso", "sospechoso", "sin_senales"];
const strList = (v: unknown, max: number, len: number) =>
  (Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string").slice(0, max).map((x) => x.slice(0, len));

/**
 * El bot web guarda el estado en el navegador: antes de usarlo se valida, para que nadie pueda
 * inventar un reporte con datos personales o textos falsos.
 */
export function sanitizeState(raw: unknown): BotState {
  if (!raw || typeof raw !== "object") return {};
  const s = raw as Record<string, unknown>;
  const out: BotState = {};
  if (s.welcomed === true) out.welcomed = true;
  if (s.step === "idle" || s.step === "triage_ask" || s.step === "simulacro") out.step = s.step;
  if (typeof s.simId === "string") out.simId = s.simId.slice(0, 80);
  const sims = strList(s.lastSims, 3, 80);
  if (sims.length) out.lastSims = sims;
  if (s.canRate === true) out.canRate = true;
  const alert = s.alert as Record<string, unknown> | undefined;
  if (alert && typeof alert === "object") {
    out.alert = { entities: strList(alert.entities, 2, 80), domains: strList(alert.domains, 2, 120) };
  }
  const r = s.lastReport as Record<string, unknown> | undefined;
  if (r && typeof r === "object" && typeof r.text === "string" && VERDICTS.includes(r.verdict as Analysis["verdict"])) {
    out.lastReport = {
      text: anonymize(r.text).slice(0, 1500),
      verdict: r.verdict as Analysis["verdict"],
      signals: strList(r.signals, 20, 40),
      domains: strList(r.domains, 5, 120),
    };
  }
  return out;
}

export type BotInput =
  | { kind: "text"; text: string }
  | { kind: "button"; id: string }
  | { kind: "image"; image: Buffer; caption?: string }
  | { kind: "unsupported" };

export interface BotContext {
  channel: Channel;
  config: AppConfig;
  log: (e: Omit<EventRow, "anon_id" | "channel">) => Promise<void>;
}

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
const WA_NUMBER = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");
const TG_BOT = (process.env.NEXT_PUBLIC_TELEGRAM_BOT || "").replace(/^@/, "");

const B = {
  verificar: { id: "menu_verificar", title: "🔍 Verificar" },
  simulacro: { id: "menu_simulacro", title: "🎯 Simulacro" },
  cai: { id: "menu_triage", title: "🆘 Ya caí" },
  menu: { id: "menu", title: "📋 Menú" },
  otroSim: { id: "menu_simulacro", title: "🎯 Otro simulacro" },
  otraVerif: { id: "menu_verificar", title: "🔍 Verificar otro" },
  reportar: { id: "reportar", title: "🚩 Reportar" },
  util: { id: "util_si", title: "👍 Me sirvió" },
  noUtil: { id: "util_no", title: "👎 No entendí" },
};

const MENU_BUTTONS = [B.verificar, B.simulacro, B.cai];

const GREETINGS = new Set([
  "hola",
  "holi",
  "menu",
  "inicio",
  "empezar",
  "buenas",
  "buenos dias",
  "buenas tardes",
  "buenas noches",
  "hi",
  "hello",
]);

function menu(text = "¿Qué quieres hacer?"): BotReply {
  return { text, buttons: MENU_BUTTONS };
}

function welcome(): BotReply {
  return {
    text:
      "👋 Hola, soy *Verifica Santa Fe*.\n" +
      "Reenvíame un mensaje, un link o una captura de pantalla que te parezca raro y te digo si tiene señales de fraude.\n\n" +
      "🔒 No guardo tus mensajes ni tu número: los analizo y los descarto (solo si tú lo reportas con 🚩, guardo el mensaje sin tus datos). " +
      "Al escribirme autorizas este uso anónimo (Ley 1581 de 2012). Para explicar mejor, uso reglas y una IA de apoyo que recibe el texto sin datos personales." +
      (SITE ? ` Aviso de privacidad: ${SITE}/privacidad` : "") +
      "\n\n🎓 Proyecto académico de prevención; no reemplaza a la Policía ni a tu banco.",
  };
}

function help(): BotReply {
  return menu(
    "ℹ️ *Cómo usarme*\n" +
      "• *Verificar:* reenvíame el mensaje, el link o una captura.\n" +
      "• *Simulacro:* escribe SIMULACRO y practica en 30 segundos.\n" +
      "• *Ya caí:* te digo qué hacer y a quién llamar (línea 165).\n" +
      "• Escribe MENÚ cuando quieras volver.",
  );
}

/* ---------- Verificación ---------- */

const HEADER: Record<Analysis["verdict"], string> = {
  peligroso: "🔴 *PELIGROSO*",
  sospechoso: "🟡 *SOSPECHOSO*",
  sin_senales: "🟢 *SIN SEÑALES EVIDENTES*",
};

/** Un consejo corto para aprender a reconocer la señal más importante la próxima vez. */
const TIPS: Partial<Record<Signal["id"], string>> = {
  pide_codigo: "Los códigos que te llegan por SMS son como la llave de tu cuenta: no se comparten con nadie, ni siquiera con «el banco».",
  imitacion: "Lee la dirección completa antes de abrirla: un guion o una letra cambiada (dian-col, bancolonbia) es la trampa.",
  gov_sin_govco: "Toda página del Gobierno de Colombia termina en .gov.co. Si no termina así, no es del Gobierno.",
  entidad_link_no_oficial: "Entra siempre escribiendo tú la dirección oficial o desde la app, nunca desde el link del mensaje.",
  lista_negra: "Este sitio ya fue reportado. Si te llegó, avísale a tu frente de seguridad para que nadie más caiga.",
  reputacion: "Google ya marcó este sitio como peligroso. No lo abras ni desde otro celular.",
  link_acortado: "Los links acortados (bit.ly y similares) esconden el destino real. Pide la dirección completa.",
  remitente_no_oficial: "Las entidades escriben desde su propio dominio, no desde Gmail ni Hotmail.",
  solicitud: "Ninguna entidad te pide claves, códigos o pagos por un link en un mensaje.",
  urgencia: "La prisa es la herramienta del estafador. Si te apuran, detente y confirma por otro canal.",
  comprobante: "El único comprobante que vale es el saldo en TU app. Revisa antes de entregar.",
  gancho: "Si suena demasiado bueno o urgente para ser verdad, casi siempre es una trampa.",
  dominio_raro: "Las páginas oficiales tienen direcciones cortas y limpias: sin guiones de más, números raros ni terminaciones como .xyz o .online.",
};

export function formatAnalysis(a: Analysis): string {
  const lines = [HEADER[a.verdict]];
  const visible = a.signals.filter((s) => s.id !== "comprobante" || a.signals.length === 1);
  if (visible.length) {
    lines.push(
      visible.length === 1 ? "Encontré 1 señal:" : `Encontré ${visible.length} señales:`,
      ...visible.map((s) => `• ${s.detail}`),
    );
  }
  if (a.verdict === "sin_senales" && a.officialDomains.length) {
    lines.push(`✔️ El link va a un sitio oficial: ${a.officialDomains.join(", ")}.`);
  }
  if (a.aiExplanation) lines.push("", `🤖 ${a.aiExplanation}`);
  lines.push("");
  if (a.isReceipt) {
    lines.push(
      "💵 Antes de entregar el pedido, abre *tu* app (Nequi, Daviplata o banco) y confirma que el dinero llegó. Los pantallazos se falsifican fácil.",
    );
  }
  if (a.verdict === "peligroso") {
    lines.push(
      "👉 *Qué hacer:* no abras el link, no pagues y no respondas. Si quieres confirmar, llama a la entidad a un número que busques tú, no al del mensaje.",
    );
  } else if (a.verdict === "sospechoso") {
    lines.push(
      "👉 *Qué hacer:* no actúes todavía. Confirma por otro canal: llama a la entidad o a la persona a un número que ya tengas.",
    );
  } else {
    lines.push(
      "👉 Que no vea señales no garantiza que sea seguro. Si te piden dinero o datos, confirma por otro canal.",
    );
  }
  const tip = a.signals.map((s) => TIPS[s.id]).find(Boolean);
  if (tip) lines.push("", `💡 *Aprende:* ${tip}`);
  return lines.join("\n");
}

/** WhatsApp admite solo 3 botones; en web y Telegram se agrega la valoración de la respuesta. */
function withFeedback(buttons: BotButton[], ctx: BotContext): BotButton[] {
  return ctx.channel === "whatsapp" ? buttons : [...buttons, B.util, B.noUtil];
}

async function verify(
  text: string,
  state: BotState,
  ctx: BotContext,
  fromImage: boolean,
): Promise<{ replies: BotReply[]; state: BotState }> {
  const useAi = aiEnabled();
  const started = Date.now();
  const a = await analyzeMessage(text, ctx.config, {
    expandLinks: true,
    safeBrowsing: true,
    ai: useAi,
  });
  if (a.offTopic) {
    return {
      replies: [
        menu(
          "🤔 Eso no parece un mensaje que te haya llegado. Solo puedo revisar mensajes, links o capturas sospechosas: pégame el mensaje tal cual lo recibiste.",
        ),
      ],
      state: { ...state, step: "idle" },
    };
  }
  await ctx.log({
    type: "verificacion",
    verdict: a.verdict,
    data: {
      signals: a.signals.map((s) => s.id),
      score: a.score,
      links: a.officialDomains.length + a.suspiciousDomains.length,
      image: fromImage,
      ai: Boolean(a.aiExplanation),
      ms: Date.now() - started,
    },
  });
  const replies: BotReply[] = [
    { text: (fromImage ? "📷 Leí tu captura.\n\n" : "") + formatAnalysis(a) },
  ];
  // Se guarda solo en la conversación (no en la base) hasta que la persona decida reportarlo.
  const lastReport = {
    text: anonymize(text).slice(0, 1500),
    verdict: a.verdict,
    signals: a.signals.map((s) => s.id),
    domains: a.suspiciousDomains.slice(0, 5),
  };
  if (a.verdict === "sin_senales") {
    replies.push({
      text: "¿Algo más? Si igual te parece raro, puedes reportarlo.",
      buttons: withFeedback([B.otraVerif, B.reportar, B.menu], ctx),
    });
    return { replies, state: { ...state, step: "idle", alert: undefined, lastReport, canRate: true } };
  }
  replies.push({
    text: "¿Ya hiciste clic, pagaste o diste datos?\n🚩 Si quieres, reporta el mensaje para alertar a otros comerciantes.",
    buttons: withFeedback([TRIAGE_YES, TRIAGE_NO, B.reportar], ctx),
  });
  return {
    replies,
    state: {
      ...state,
      step: "triage_ask",
      alert: { entities: a.entities.slice(0, 2), domains: a.suspiciousDomains.slice(0, 2) },
      lastReport,
      canRate: true,
    },
  };
}

/* ---------- Triage ---------- */

const TRIAGE_YES = { id: "triage_si", title: "Sí, ya actué" };
const TRIAGE_NO = { id: "triage_no", title: "No, todavía no" };

export const TRIAGE_CASES: Record<TriageCase, { title: string; steps: string[] }> = {
  pago: {
    title: "Pagué o transferí",
    steps: [
      "Llama YA a tu banco o billetera para bloquear y pedir la reversión.",
      "Guarda la conversación y el comprobante. No los borres: son pruebas.",
      "Denuncia en la línea 165.",
    ],
  },
  datos: {
    title: "Di claves o datos",
    steps: [
      "Cambia tus claves desde la app oficial, no desde el link.",
      "Llama a tu banco para bloquear la cuenta o la tarjeta.",
      "Denuncia en la línea 165 o en el CAI Virtual.",
    ],
  },
  extorsion: {
    title: "Me amenazan",
    steps: [
      "No pagues ni negocies.",
      "Llama a la línea 165: es gratis y atiende 24 horas.",
      "Si hay peligro inmediato, llama al 123.",
    ],
  },
  clic: {
    title: "Solo abrí el link",
    steps: [
      "No escribas datos en esa página y ciérrala.",
      "Si descargaste algo, desinstálalo y revisa el celular con un antivirus.",
      "Si alcanzaste a escribir claves, cámbialas ya.",
    ],
  },
};

function triageList(): BotReply {
  return {
    text: "Tranquilo, actuemos rápido. ¿Qué pasó?",
    list: {
      button: "Elegir",
      rows: (Object.keys(TRIAGE_CASES) as TriageCase[]).map((id) => ({
        id: `case_${id}`,
        title: TRIAGE_CASES[id].title,
      })),
    },
  };
}

function alertReply(state: BotState): BotReply {
  const ent = state.alert?.entities.length
    ? ` que se hace pasar por ${state.alert.entities.join(" y ")}`
    : "";
  const dom = state.alert?.domains.length ? ` con links a ${state.alert.domains.join(", ")}` : "";
  const wa = WA_NUMBER ? ` (wa.me/${WA_NUMBER})` : TG_BOT ? ` (t.me/${TG_BOT})` : "";
  return {
    text:
      "🚨 *Avísale a tu frente de seguridad.* Copia y reenvía esto:\n\n" +
      `⚠️ ALERTA VECINAL: está circulando un mensaje falso${ent}${dom}. ` +
      "No abras links ni envíes dinero o datos. " +
      `Si te llega uno raro, verifícalo con Verifica Santa Fe${wa}. Denuncias: línea 165.`,
    buttons: [B.menu],
  };
}

function caseReply(c: TriageCase, ctx: BotContext): BotReply {
  const info = TRIAGE_CASES[c];
  const contacts = ctx.config.contacts
    .filter((x) => x.cases.includes(c) && (x.phone || x.url || x.description))
    .sort((a, b) => a.sort - b.sort);
  const lines = [
    `🆘 *${info.title}*`,
    ...info.steps.map((s, i) => `${i + 1}. ${s}`),
    ...(contacts.length ? ["", "📞 *A quién acudir:*"] : []),
    ...contacts.map(
      (x) =>
        `• *${x.name}*${x.phone ? `: ${x.phone}` : ""}${x.url ? ` — ${x.url}` : ""}\n  ${x.description}`,
    ),
  ];
  return { text: lines.join("\n") };
}

/* ---------- Simulacros ---------- */

function pickSimulacro(sims: Simulacro[], recent: string[]): Simulacro | undefined {
  const active = sims.filter((s) => s.active);
  const fresh = active.filter((s) => !recent.includes(s.id));
  const pool = fresh.length ? fresh : active;
  return pool[Math.floor(Math.random() * pool.length)];
}

function simulacroReply(sim: Simulacro): BotReply {
  return {
    text:
      "🎯 *Simulacro* (30 segundos)\nTe llegó este mensaje:\n\n" +
      `_De: ${sim.sender}_\n“${sim.message}”\n\n¿Es fraude o es real?`,
    buttons: [
      { id: "sim_fraude", title: "🚩 Es fraude" },
      { id: "sim_real", title: "✅ Es real" },
    ],
  };
}

/* ---------- Entrada principal ---------- */

export async function handleMessage(
  input: BotInput,
  prev: BotState,
  ctx: BotContext,
): Promise<{ replies: BotReply[]; state: BotState }> {
  const prefix: BotReply[] = [];
  const state: BotState = { ...prev };
  if (!state.welcomed) {
    prefix.push(welcome());
    state.welcomed = true;
    await ctx.log({ type: "inicio" });
  }
  const done = (r: { replies: BotReply[]; state: BotState }) => ({
    replies: [...prefix, ...r.replies],
    state: r.state,
  });

  // Traducimos respuestas escritas a botones según el paso actual.
  let buttonId: string | undefined;
  let text = "";
  if (input.kind === "button") buttonId = input.id;
  if (input.kind === "text") {
    text = input.text.trim();
    // Sin signos y con las faltas corregidas ("grasias", "que es el phisibg").
    const n = correctTypos(
      normalize(text).replace(/[^a-z0-9ñ ]/g, "").replace(/\s+/g, " ").trim(),
      vocabFor(ctx.config),
    );
    if (state.step === "simulacro") {
      if (["fraude", "es fraude", "1"].includes(n)) buttonId = "sim_fraude";
      if (["real", "es real", "2"].includes(n)) buttonId = "sim_real";
    }
    if (state.step === "triage_ask") {
      if (["si", "sí", "ya", "si ya", "1"].includes(n)) buttonId = "triage_si";
      if (["no", "todavia no", "2"].includes(n)) buttonId = "triage_no";
    }
    if (!buttonId) {
      if (GREETINGS.has(n)) buttonId = "menu";
      else if (n === "simulacro" || n === "simulacros") buttonId = "menu_simulacro";
      else if (["denunciar", "ya cai", "cai", "me estafaron", "me robaron"].includes(n))
        buttonId = "menu_triage";
      else if (n === "ayuda") buttonId = "ayuda";
      else if (/^(muchas )?gracias|^(ok|listo|vale|dale) gracias|^mil gracias/.test(n)) buttonId = "gracias";
      else if (/^(y )?(ahora )?que (hago|debo hacer|hago ahora)$/.test(n)) {
        buttonId = state.alert ? "triage_si" : "ayuda";
      } else if (/^que es (el |un )?(phishing|smishing|vishing|eso|fraude|estafa)$/.test(n)) buttonId = "que_es";
      else if (/^(como|donde) (denuncio|puedo denunciar|denunciar)|^quiero denunciar/.test(n)) buttonId = "denuncia";
      else if (n === "verificar") buttonId = "menu_verificar";
      else if (/^me sirvio|^(si )?(me )?ayudo$/.test(n)) buttonId = "util_si";
      else if (/^no (te |le )?entendi|^no me sirvio/.test(n)) buttonId = "util_no";
      else if (/^reportar( mensaje| este mensaje)?$|^reportarlo$/.test(n)) buttonId = "reportar";
    }
  }

  if (buttonId) {
    switch (buttonId) {
      case "menu":
        return done({ replies: [menu()], state: { ...state, step: "idle" } });
      case "ayuda":
        return done({ replies: [help()], state: { ...state, step: "idle" } });
      case "reportar": {
        if (!state.lastReport) {
          return done({
            replies: [menu("Primero envíame el mensaje sospechoso; después podrás reportarlo con 🚩.")],
            state,
          });
        }
        await ctx.log({
          type: "reporte",
          verdict: state.lastReport.verdict,
          data: {
            texto: anonymize(state.lastReport.text).slice(0, 1500),
            dominios: state.lastReport.domains,
            senales: state.lastReport.signals,
            estado: "nuevo",
          },
        });
        const thanks =
          "🚩 *¡Gracias por reportarlo!* Lo guardamos sin tus datos personales. El equipo lo revisará y, si es fraude, el bot alertará a otros comerciantes.";
        const next: BotState = { ...state, lastReport: undefined };
        return done({
          replies: [
            state.step === "triage_ask"
              ? { text: `${thanks}\n\n¿Ya hiciste clic, pagaste o diste datos?`, buttons: [TRIAGE_YES, TRIAGE_NO] }
              : menu(thanks),
          ],
          state: next,
        });
      }
      case "util_si":
      case "util_no": {
        const util = buttonId === "util_si";
        if (!state.canRate) {
          return done({ replies: [menu("🙏 ¡Gracias! Envíame otro mensaje cuando quieras revisarlo.")], state });
        }
        state.canRate = false;
        await ctx.log({ type: "feedback", data: { util } });
        const text = util
          ? "🙏 ¡Gracias! Nos ayuda a mejorar."
          : "🙏 Gracias por decirnos. En resumen: si un mensaje te apura, te pide datos o trae un link raro, no actúes y confirma por otro medio. Puedes escribir AYUDA cuando quieras.";
        return done({
          replies: [
            state.step === "triage_ask"
              ? { text: `${text}\n\n¿Ya hiciste clic, pagaste o diste datos?`, buttons: [TRIAGE_YES, TRIAGE_NO, B.reportar] }
              : menu(text),
          ],
          state,
        });
      }
      case "gracias":
        return done({
          replies: [
            menu("🙌 ¡Con gusto! Si te llega otro mensaje raro, mándamelo antes de responder o pagar."),
          ],
          state: { ...state, step: "idle" },
        });
      case "que_es":
        return done({
          replies: [
            menu(
              "📚 *Phishing* es cuando alguien se hace pasar por una entidad (banco, DIAN, Nequi, un familiar) para robarte dinero o datos.\n" +
                "• Por SMS se llama *smishing* y por llamada *vishing*.\n" +
                "• Siempre usan una de estas trampas: un link falso, prisa, un premio, o pedirte un código o una clave.\n" +
                "Cuando dudes, mándame el mensaje y lo reviso.",
            ),
          ],
          state: { ...state, step: "idle" },
        });
      case "denuncia":
        return done({
          replies: [
            menu(
              "📣 *Cómo denunciar*\n" +
                "• Llama gratis a la *línea 165* de la Policía (24 horas).\n" +
                "• En línea: *CAI Virtual* (caivirtual.policia.gov.co).\n" +
                "• Si hay peligro inmediato: *123*.\n" +
                "Guarda los mensajes, números y comprobantes: son tus pruebas.",
            ),
          ],
          state: { ...state, step: "idle" },
        });
      case "menu_verificar":
        return done({
          replies: [
            {
              text: "🔍 Reenvíame el mensaje sospechoso, pega el link o mándame una captura de pantalla.",
            },
          ],
          state: { ...state, step: "idle" },
        });
      case "menu_simulacro": {
        const recent = state.lastSims ?? [];
        const sim = pickSimulacro(ctx.config.simulacros, recent);
        if (!sim) {
          return done({ replies: [menu("Todavía no hay simulacros cargados.")], state });
        }
        return done({
          replies: [simulacroReply(sim)],
          state: {
            ...state,
            step: "simulacro",
            simId: sim.id,
            lastSims: [sim.id, ...recent].slice(0, 3),
          },
        });
      }
      case "sim_fraude":
      case "sim_real": {
        const sim = ctx.config.simulacros.find((s) => s.id === state.simId);
        if (!sim || state.step !== "simulacro") {
          return done({ replies: [menu("Ese simulacro ya terminó.")], state });
        }
        const correct = (buttonId === "sim_fraude") === sim.is_phishing;
        await ctx.log({ type: "simulacro", data: { sim_id: sim.id, correct } });
        return done({
          replies: [
            {
              text:
                `${correct ? "✅ *¡Correcto!*" : "❌ *Esta vez no.*"} Era *${sim.is_phishing ? "fraude" : "real"}*.\n\n` +
                `🔑 *Señal clave:* ${sim.key_signal}\n${sim.explanation}`,
              buttons: [B.otroSim, B.menu],
            },
          ],
          state: { ...state, step: "idle", simId: undefined },
        });
      }
      case "menu_triage":
      case "triage_si":
        return done({ replies: [triageList()], state: { ...state, step: "idle" } });
      case "triage_no": {
        await ctx.log({ type: "alerta" });
        return done({
          replies: [
            {
              text: "👏 ¡Bien hecho! Como no actuaste, no hay pérdida. Borra el mensaje y bloquea al remitente.",
            },
            alertReply(state),
          ],
          state: { ...state, step: "idle" },
        });
      }
      default:
        if (buttonId.startsWith("case_")) {
          const c = buttonId.slice(5) as TriageCase;
          if (c in TRIAGE_CASES) {
            await ctx.log({ type: "triage", data: { case: c } });
            await ctx.log({ type: "alerta" });
            return done({
              replies: [caseReply(c, ctx), alertReply(state)],
              state: { ...state, step: "idle" },
            });
          }
        }
        return done({ replies: [menu()], state });
    }
  }

  if (input.kind === "image") {
    const read = await ocrImage(input.image);
    const full = [input.caption ?? "", read].join("\n").trim();
    if (!full) {
      return done({
        replies: [
          menu(
            "😕 No pude leer texto en la imagen. Prueba con una captura más clara o copia y pega el mensaje.",
          ),
        ],
        state,
      });
    }
    return done(await verify(full, state, ctx, true));
  }

  if (input.kind === "unsupported") {
    return done({
      replies: [
        menu("Por ahora solo puedo revisar texto, links y capturas de pantalla (no audios ni videos)."),
      ],
      state,
    });
  }

  if (normalize(text).replace(/[^a-z0-9]/g, "").length < 4) {
    return done({ replies: [menu("No te entendí. ¿Qué quieres hacer?")], state });
  }
  return done(await verify(text, state, ctx, false));
}
