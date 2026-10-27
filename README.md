# Verifica Santa Fe

Bot anti-phishing para comerciantes de la localidad de Santa Fe (Bogotá). Es el componente
digital del proyecto **Escuela Móvil Anti-Phishing + Bot Verifica Santa Fe**.

Un mismo motor de análisis atiende:

| Parte | Ruta | Qué hace |
| --- | --- | --- |
| Bot de WhatsApp | `/api/whatsapp` | Recibe mensajes, links y capturas reenviados y responde con semáforo, simulacros y triage |
| Bot de Telegram | `/api/telegram` | El mismo bot en Telegram (botones, capturas y comandos /verificar, /simulacro, /ayuda) |
| Inicio | `/` | Tres acciones grandes (revisar, practicar, ya caí), ejemplos con un toque y el semáforo explicado |
| Bot web | `/verificar` | El mismo bot dentro de la página (`/verificar?m=texto` lo envía solo) |
| Ayuda urgente | `/ayuda` | Botones para llamar al 165 y al 123, pasos por caso y alerta vecinal para copiar |
| Simulador de casos | `/simulador` | Mensajes ficticios para revisar con el kit de 5 puntos (remitente, URL, urgencia, adjunto, ortografía); links trampa sin funcionar y cierre explicativo |
| Modo taller | `/taller` | Código por participante (T1-P01), consentimiento, lista de observación imprimible (`/taller/observacion`) y consentimiento (`/taller/consentimiento`) |
| Kit para la caja | `/kit` | Sticker imprimible con los 5 puntos y QR |
| Aula virtual | `/aula` | Pruebas de entrada y salida, prácticas y encuesta, sin registro |
| Afiche con QR | `/afiche` | Afiche imprimible para la Escuela Móvil |
| Panel del equipo | `/admin` | Listas, palabras clave, contactos, simulacros, aula e indicadores |
| Aviso de privacidad | `/privacidad` | Ley 1581 de 2012 |

## Cómo decide el bot

1. **Reglas** (siempre): lista negra, dominios que imitan a una entidad de la lista blanca
   (`dian-col.com` vs `dian.gov.co`, `bancolonbia.com`), entidades públicas sin `.gov.co`,
   links acortados (se siguen las redirecciones sin abrir la página), remitentes no
   oficiales, pedidos de claves o pagos, urgencia artificial y comprobantes de pago.
   Puntaje: **≥ 4 = 🔴 Peligroso**, **2–3 = 🟡 Sospechoso**, **0–1 = 🟢 Sin señales evidentes**.
2. **Google Safe Browsing** (opcional): si Google reporta el link, es peligroso.
3. **IA de apoyo (Gemini, opcional)**: recibe el texto **anonimizado**, redacta una explicación
   sencilla y puede **subir** el nivel de 🟢 a 🟡. Nunca lo baja ni decide sola.
4. **Capturas de pantalla**: se leen con OCR (Tesseract, español incluido en el proyecto).

Además: la regla `pide_codigo` marca 🔴 cualquier pedido de un código, clave o PIN; se detectan
ganchos típicos (premios, "cambié de número", empleos y préstamos falsos, QR nuevos); cada
veredicto trae un consejo 💡 para aprender la señal; y el bot entiende "gracias", "¿qué hago?",
"¿qué es phishing?" y "cómo denuncio".

**Direcciones desconocidas:** además de comparar con los links oficiales y las páginas falsas, se
revisan rasgos que un sitio oficial casi nunca tiene: letras disfrazadas (xn--), terminaciones
baratas (.xyz, .online…), muchos guiones, números mezclados con el nombre, palabras para dar
confianza ("seguro", "pago", "verifica") y direcciones demasiado largas.

**Faltas de ortografía:** antes de aplicar las reglas, `src/lib/typos.ts` corrige "a oído" cada
palabra hacia un vocabulario de palabras importantes (v/b, s/z/c, ll/y, h muda, c/k/qu, g/j) y
tolera letras de más o de menos y teclas vecinas. Así "conpartenos el codijo", "grasias" o
"phisibg" se entienden, sin tocar links ni números y sin cambiar palabras comunes
("encargo" no se vuelve "embargo").

**Límites de la IA:** solo analiza mensajes recibidos (a una pregunta general responde que no es un
mensaje), trata el texto como dato y nunca como orden, no recibe textos que intentan manipularla,
su explicación se limpia (sin links ni teléfonos, máx. 2 frases) y nunca puede bajar un veredicto.

**Antes y después:** el panel compara la prueba de entrada (`prueba-de-entrada`) con la de salida
(`prueba-de-salida`) de cada ID anónimo para medir la capacidad de reconocer señales.

Después de un 🔴 o 🟡 el bot pregunta si la persona ya actuó y la deriva (banco, línea 165,
CAI Virtual, 123) con una alerta lista para reenviar al frente de seguridad de la cuadra.

## Privacidad (Ley 1581)

- El texto, los links y las imágenes se analizan en memoria y se descartan.
- El número de WhatsApp se convierte en un ID anónimo irreversible (`WA-…`, HMAC-SHA256 con
  `ANON_ID_SECRET`); el usuario de Telegram, en `TG-…`. En la web el navegador recibe un ID aleatorio (`WEB-…`) en una cookie.
- La base de datos solo guarda IDs anónimos, el tipo de evento, el veredicto y las señales.

## Tecnología

Next.js 16 (React, TypeScript, Tailwind) · Supabase (PostgreSQL) · WhatsApp Cloud API ·
Gemini API · Google Safe Browsing · Tesseract.js · Vitest. Todo cabe en capas gratuitas.

---

## Probar en tu computador

Requisitos: Node.js 20 o superior.

```bash
npm install
cp .env.example .env.local   # opcional; pon al menos ADMIN_PASSWORD
npm run dev
```

Abre http://localhost:3000. Sin Supabase configurado, los datos se guardan **en memoria** y
se borran al reiniciar: sirve para probar, no para el piloto.

```bash
npm test          # pruebas del motor de análisis
npm run lint
npm run build
```

---

## Desplegar (paso a paso)

### 1. Base de datos en Supabase (gratis)

1. Crea un proyecto en https://supabase.com.
2. Ve a **SQL Editor → New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql)
   y dale **Run**.
3. En **Project Settings → API** copia la **Project URL** (`SUPABASE_URL`) y la llave
   **service_role** (`SUPABASE_SERVICE_ROLE_KEY`). Esta llave es secreta: solo va en Vercel.

La primera vez que la app arranque cargará sola la lista blanca, las palabras clave, los
contactos, los simulacros y las pruebas del aula.

### 2. Página en Vercel (gratis)

1. En https://vercel.com → **Add New → Project** → importa este repositorio.
2. En **Environment Variables** agrega las variables de `.env.example` (mínimo:
   `ADMIN_PASSWORD`, `ANON_ID_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`).
3. **Deploy**. Entra a `https://<tu-proyecto>.vercel.app/admin` con tu contraseña: los avisos
   de colores muestran qué falta configurar.

> `ANON_ID_SECRET`: genera un texto largo (por ejemplo con `openssl rand -hex 32`) y no lo
> cambies después de lanzar, o los IDs anónimos de WhatsApp cambiarán.

### 3. IA y reputación de links (opcional, gratis)

- **Gemini**: https://aistudio.google.com → *Get API key* → `GEMINI_API_KEY`.
- **Safe Browsing**: Google Cloud Console → habilita *Safe Browsing API* → crea una API key →
  `SAFE_BROWSING_API_KEY`.

Sin estas llaves el bot funciona igual, solo con reglas.

### 4. Telegram (gratis, sin verificación de negocio)

1. En Telegram, abre **@BotFather** → `/newbot` → nombre `Verifica Santa Fe` → usuario terminado
   en `bot` (ej. `VerificaSantaFeBot`). Te da un token.
2. En Vercel agrega `TELEGRAM_BOT_TOKEN` (el token) y `NEXT_PUBLIC_TELEGRAM_BOT` (el usuario sin
   "@") y vuelve a desplegar.
3. Entra a `/admin` y toca **Conectar Telegram**. Listo: escríbele `/start` al bot.

La página de inicio y el afiche muestran el botón y el QR de Telegram automáticamente.
Si la base de datos se creó antes de agregar Telegram, vuelve a correr `supabase/schema.sql`
(es seguro: no borra datos) para que se guarden las métricas de este canal.

### 5. WhatsApp

**Fase 1 – número de prueba (ya puedes hacerla):**

1. https://developers.facebook.com → **Create App** → tipo *Business* → agrega el producto
   **WhatsApp**.
2. En **WhatsApp → API Setup** verás un número de prueba. Copia **Phone number ID**
   (`WHATSAPP_PHONE_NUMBER_ID`) y el token temporal (`WHATSAPP_TOKEN`). Agrega tu celular en
   la lista de destinatarios permitidos (hasta 5).
3. En **App settings → Basic** copia el **App secret** (`WHATSAPP_APP_SECRET`).
4. Inventa un texto para `WHATSAPP_VERIFY_TOKEN`. Pon todas estas variables en Vercel y
   vuelve a desplegar.
5. En **WhatsApp → Configuration → Webhook**:
   - Callback URL: `https://<tu-proyecto>.vercel.app/api/whatsapp`
   - Verify token: el mismo `WHATSAPP_VERIFY_TOKEN`
   - Dale **Verify and save** y suscríbete al campo **messages**.
6. Escribe "hola" al número de prueba desde tu celular.

**Fase 2 – conectar la SIM propia:**

1. Pon la SIM en un celular **sin instalar WhatsApp** en ese número.
2. En **WhatsApp → API Setup → Add phone number**, registra el número, verifica el código
   por SMS o llamada y espera la aprobación del nombre visible ("Verifica Santa Fe").
3. Cambia en Vercel `WHATSAPP_PHONE_NUMBER_ID` por el ID del número nuevo.
4. El token temporal dura 24 horas: crea un token permanente en **Business Settings → Users →
   System users → Generate token** (permisos `whatsapp_business_messaging` y
   `whatsapp_business_management`) y ponlo en `WHATSAPP_TOKEN`.
5. Pon el número en `NEXT_PUBLIC_WHATSAPP_NUMBER` (ej. `573001234567`) para que aparezca el
   botón de WhatsApp en la página, y vuelve a desplegar.

El código no cambia entre las dos fases.

---

## Panel de administración

`/admin` (contraseña `ADMIN_PASSWORD`):

- **Indicadores**: personas, verificaciones, resultado, canal, señales, triage, puntajes del
  aula y encuesta. Exporta CSV de eventos y respuestas.
- **Reportes**: mensajes que los usuarios reportaron con 🚩 (sin datos personales), dominios más
  reportados y paso a "Páginas falsas" con un clic.
- **Links oficiales** y **Páginas falsas**: listas separadas, con la caja "Probar un link" que
  muestra cómo clasifica el sistema cualquier dirección.
- **Palabras clave**: urgencia, pedidos de datos o pagos, comprobantes, entidades públicas.
- **Contactos**: a quién derivar según lo que pasó.
- **Simulacros**: mensajes que el bot envía cuando escriben SIMULACRO.
- **Aula virtual**: crear, editar y publicar pruebas y encuestas.

Los cambios aplican al bot de WhatsApp, al bot web y al aula en menos de 30 segundos.

## Estructura

```
src/
  app/                 páginas y rutas de la API
    api/whatsapp/      webhook de Meta
    api/chat/          bot web
    api/aula/          aula virtual
    api/admin/         panel (sesión, CRUD, indicadores, CSV)
  components/          chat, aula y panel
  lib/
    engine/            motor: extracción, dominios, reglas, OCR, IA, anonimizador
    bot/               conversación (igual para WhatsApp y web)
    data/              datos iniciales y almacenamiento (Supabase o memoria)
supabase/schema.sql    tablas de la base de datos
```
