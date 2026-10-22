import { headers } from "next/headers";
import { webAnonId } from "@/lib/anonId";
import { handleMessage, type BotInput, type BotState } from "@/lib/bot/conversation";
import { getConfig, getStore } from "@/lib/data/store";
import { rateLimited } from "@/lib/rateLimit";

export const maxDuration = 60;

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

interface Body {
  input?: { kind?: string; text?: string; id?: string; image?: string; caption?: string };
  state?: BotState;
}

/** Bot web: mismo motor que WhatsApp. El estado de la conversación lo guarda el navegador. */
export async function POST(request: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(`chat:${ip}`, 30)) {
    return Response.json({ error: "Demasiadas solicitudes, espera un minuto." }, { status: 429 });
  }
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: "Solicitud inválida" }, { status: 400 });
  }
  const raw = body.input ?? {};
  let input: BotInput;
  if (raw.kind === "button" && typeof raw.id === "string") {
    input = { kind: "button", id: raw.id.slice(0, 40) };
  } else if (raw.kind === "image" && typeof raw.image === "string") {
    const b64 = raw.image.replace(/^data:image\/[a-z+]+;base64,/, "");
    const image = Buffer.from(b64, "base64");
    if (image.length === 0 || image.length > MAX_IMAGE_BYTES) {
      return Response.json({ error: "La imagen es muy grande (máx. 4 MB)." }, { status: 413 });
    }
    input = { kind: "image", image, caption: raw.caption?.slice(0, 2000) };
  } else if (typeof raw.text === "string" && raw.text.trim()) {
    input = { kind: "text", text: raw.text.slice(0, 4000) };
  } else {
    return Response.json({ error: "Mensaje vacío" }, { status: 400 });
  }

  const anonId = await webAnonId();
  const store = getStore();
  const config = await getConfig();
  const state: BotState = typeof body.state === "object" && body.state ? body.state : {};
  const result = await handleMessage(input, state, {
    channel: "web",
    config,
    log: (e) => store.logEvent({ ...e, anon_id: anonId, channel: "web" }),
  });
  return Response.json({ ...result, anonId });
}
