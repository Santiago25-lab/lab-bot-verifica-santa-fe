import { analyzeMessage } from "@/lib/engine/analyze";
import { aiEnabled } from "@/lib/engine/ai";
import { ocrImage } from "@/lib/engine/ocr";
import { normalize } from "@/lib/text";
import type {
  Analysis,
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

const B = {
  verificar: { id: "menu_verificar", title: "🔍 Verificar" },
  simulacro: { id: "menu_simulacro", title: "🎯 Simulacro" },
  cai: { id: "menu_triage", title: "🆘 Ya caí" },
  menu: { id: "menu", title: "📋 Menú" },
  otroSim: { id: "menu_simulacro", title: "🎯 Otro simulacro" },
  otraVerif: { id: "menu_verificar", title: "🔍 Verificar otro" },
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
      "🔒 No guardo tus mensajes ni tu número: los analizo y los descarto." +
      (SITE ? ` Aviso de privacidad: ${SITE}/privacidad` : ""),
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
  return lines.join("\n");
}

async function verify(
  text: string,
  state: BotState,
  ctx: BotContext,
  fromImage: boolean,
): Promise<{ replies: BotReply[]; state: BotState }> {
  const useAi = aiEnabled();
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
    },
  });
  const replies: BotReply[] = [
    { text: (fromImage ? "📷 Leí tu captura.\n\n" : "") + formatAnalysis(a) },
  ];
  if (a.verdict === "sin_senales") {
    replies.push({ text: "¿Algo más?", buttons: [B.otraVerif, B.simulacro, B.menu] });
    return { replies, state: { ...state, step: "idle", alert: undefined } };
  }
  replies.push({
    text: "¿Ya hiciste clic, pagaste o diste datos?",
    buttons: [
      { id: "triage_si", title: "Sí, ya actué" },
      { id: "triage_no", title: "No, todavía no" },
    ],
  });
  return {
    replies,
    state: {
      ...state,
      step: "triage_ask",
      alert: { entities: a.entities.slice(0, 2), domains: a.suspiciousDomains.slice(0, 2) },
    },
  };
}

/* ---------- Triage ---------- */

const CASES: Record<TriageCase, { title: string; steps: string[] }> = {
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
      rows: (Object.keys(CASES) as TriageCase[]).map((id) => ({
        id: `case_${id}`,
        title: CASES[id].title,
      })),
    },
  };
}

function alertReply(state: BotState): BotReply {
  const ent = state.alert?.entities.length
    ? ` que se hace pasar por ${state.alert.entities.join(" y ")}`
    : "";
  const dom = state.alert?.domains.length ? ` con links a ${state.alert.domains.join(", ")}` : "";
  const wa = WA_NUMBER ? ` (wa.me/${WA_NUMBER})` : "";
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
  const info = CASES[c];
  const contacts = ctx.config.contacts
    .filter((x) => x.cases.includes(c) && (x.phone || x.url || x.description))
    .sort((a, b) => a.sort - b.sort);
  const lines = [
    `🆘 *${info.title}*`,
    ...info.steps.map((s, i) => `${i + 1}. ${s}`),
    "",
    "📞 *A quién acudir:*",
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
    const n = normalize(text).replace(/[^a-z0-9 ]/g, "").trim();
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
      else if (n === "verificar") buttonId = "menu_verificar";
    }
  }

  if (buttonId) {
    switch (buttonId) {
      case "menu":
        return done({ replies: [menu()], state: { ...state, step: "idle" } });
      case "ayuda":
        return done({ replies: [help()], state: { ...state, step: "idle" } });
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
          if (c in CASES) {
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
