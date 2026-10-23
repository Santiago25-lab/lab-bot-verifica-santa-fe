export type Verdict = "peligroso" | "sospechoso" | "sin_senales";

export type Channel = "whatsapp" | "web" | "aula";

export type TriageCase = "pago" | "datos" | "extorsion" | "clic";

export type SignalId =
  | "lista_negra"
  | "reputacion"
  | "imitacion"
  | "gov_sin_govco"
  | "entidad_link_no_oficial"
  | "link_acortado"
  | "ip"
  | "sin_https"
  | "remitente_no_oficial"
  | "solicitud"
  | "urgencia"
  | "comprobante"
  | "pide_codigo"
  | "gancho"
  | "ia";

export interface Signal {
  id: SignalId;
  /** Texto corto y simple para mostrar al usuario. */
  detail: string;
  weight: number;
}

export interface DomainEntry {
  id: string;
  domain: string;
  entity: string;
  list: "blanca" | "negra";
  priority: boolean;
}

export type KeywordCategory =
  | "urgencia"
  | "solicitud"
  | "comprobante"
  | "entidad_publica";

export interface KeywordEntry {
  id: string;
  phrase: string;
  category: KeywordCategory;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  url: string;
  description: string;
  cases: TriageCase[];
  sort: number;
}

export interface Simulacro {
  id: string;
  sender: string;
  message: string;
  is_phishing: boolean;
  key_signal: string;
  explanation: string;
  active: boolean;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  /** Mensaje de ejemplo que se muestra como burbuja de chat. */
  scenario?: string;
  options: string[];
  /** Solo en pruebas; las encuestas no tienen respuesta correcta. */
  correct_index?: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  slug: string;
  title: string;
  description: string;
  kind: "prueba" | "encuesta";
  published: boolean;
  sort: number;
  questions: QuizQuestion[];
}

export interface AppConfig {
  domains: DomainEntry[];
  keywords: KeywordEntry[];
  contacts: Contact[];
  simulacros: Simulacro[];
}

export interface Analysis {
  verdict: Verdict;
  score: number;
  signals: Signal[];
  /** Dominios oficiales (lista blanca) encontrados en el mensaje. */
  officialDomains: string[];
  /** Entidades que el mensaje menciona o imita. */
  entities: string[];
  /** Dominios no oficiales encontrados (para la alerta vecinal). */
  suspiciousDomains: string[];
  expanded: { from: string; to: string }[];
  isReceipt: boolean;
  aiExplanation?: string;
  hadText: boolean;
  /** La IA indicó que el texto no es un mensaje recibido (pregunta general, charla...). */
  offTopic?: boolean;
}

export type EventType =
  | "inicio"
  | "verificacion"
  | "simulacro"
  | "triage"
  | "alerta";

export interface EventRow {
  id?: string;
  anon_id: string;
  channel: Channel;
  type: EventType;
  verdict?: Verdict | null;
  data?: Record<string, unknown>;
  created_at?: string;
}

export interface AttemptRow {
  id?: string;
  anon_id: string;
  quiz_id: string;
  quiz_slug: string;
  kind: Quiz["kind"];
  score: number;
  total: number;
  answers: number[];
  created_at?: string;
}
