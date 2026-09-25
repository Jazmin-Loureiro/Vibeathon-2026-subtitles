# ⚡ VibeStream AI — Nerdearla 2026

[Español](#-español) | [English](#-english)

---

## 🇦🇷 Español

> Subtitulado y traducción simultánea en tiempo real con Gemini Flash, soporte multi-sala y salida OBS Overlay para conferencias de tecnología.

### 🎯 El Problema

En conferencias técnicas de ritmo acelerado como **Nerdearla**, los oradores utilizan vocabulario especializado (Kubernetes, microservicios, CI/CD, Docker, PRs, Next.js). Las herramientas de subtitulado tradicionales introducen alta latencia o traducen erróneamente la jerga técnica, dificultando el seguimiento para personas con dificultades auditivas o hablantes no nativos.

### 🚀 La Solución

**VibeStream AI** es una consola de accesibilidad en tiempo real que ofrece:

1. **Captura en Vivo y de Archivos:** Escucha el micrófono de los oradores o procesa archivos de conferencias grabadas (`.mp4` / `.mp3`).
2. **Preservación de Jerga Técnica:** Conectado a **Google Gemini Flash** con prompts diseñados para no alterar términos de ingeniería de software.
3. **Arquitectura Multi-Sala:** Soporte para escenarios simultáneos (_Gran Sala_, _Auditorio_, _Sala Abasto_, _Konex en Vivo_) con aislamiento de subtítulos e historial persistente independiente por sala.
4. **Modo OBS Overlay:** Ruta `/overlay` con fondo transparente lista para ser agregada como _Browser Source_ en OBS Studio o vMix.
5. **Exportación .SRT:** Generación y descarga inmediata de archivos de subtítulos estándar para subida directa a YouTube post-evento.

### 🛠️ Stack Tecnológico

- **Frontend & Backend:** Next.js 15 (App Router, Serverless Route Handlers)
- **Estilos e Iconografía:** Tailwind CSS & Lucide Icons
- **IA & NLP:** Google Gemini Flash (`@google/genai`) con FastFallback
- **Captura de Voz:** Web Speech API nativa + Ingesta binaria multiparte
- **Sincronización:** Event Bus reactivo con LocalStorage

### ⚡ Instalación y Uso Local

1. Clonar el repositorio:

```bash
git clone https://github.com/Jazmin-Loureiro/Vibeathon-2026-subtitles
cd Vibeathon-2026-subtitles
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar la clave de API en un archivo `.env.local`:

```bash
cp .env.example .env.local
```

Contenido de `.env.local`:

```env
GEMINI_API_KEY=tu_api_key_de_gemini
```

4. Iniciar el servidor de desarrollo:

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en Google Chrome.

### 📺 Integración con OBS Studio

Para superponer los subtítulos técnicos en una transmisión en vivo:

1. En OBS, agregar una nueva fuente **Navegador** (_Browser Source_).
2. URL: `http://localhost:3000/overlay?room=gran-sala&lang=es` (o tu dominio desplegado).
3. Configurar dimensiones: Ancho: `1920`, Alto: `1080` (o `300` para zócalo inferior).
4. Los subtítulos aparecerán en tiempo real con fondo transparente.

### 📈 Escalabilidad a Múltiples Sesiones (Multi-Track Architecture)

El MVP procesa actualmente 4 salas en simultáneo (_Gran Sala_, _Auditorio_, _Sala Abasto_, _Konex en Vivo_) con aislamiento de subtítulos e historial independiente por sala.

**Cómo escalar a 10, 20 o más escenarios en paralelo:**

1. **Desacoplamiento Stateless:** Cada escenario gestiona su flujo de transcripción y traducción de forma independiente en rutas API serverless de Next.js (`/api/transcribe`), sin cuellos de botella compartidos ni bloqueos de hilos.
2. **Escalado Horizontal de Ingesta:** Nuevos escenarios se declaran dinámicamente en la configuración (`ROOMS`) o mediante base de datos, asociando a cada uno una fuente de entrada dedicada (micrófono del atril, línea directa de consola de audio o captura de stream RTMP/HLS).
3. **Distribución vía WebSocket / Redis Pub-Sub:** Para conferencias masivas con miles de usuarios conectados, el bus local puede migrarse a una capa de caché distribuida (Redis / Cloud Pub/Sub) para emitir los subtítulos en tiempo real con latencia sub-segundo a miles de receptores y overlays de OBS concurrentes.

### 🎙️ Fuentes de Audio y Pruebas

- **Fuente Principal:** Captura en vivo vía micrófono del orador o consola de sala mediante Web Speech API nativa en Google Chrome.
- **Prueba Rápida:** Al iniciar el servidor, hacer clic en **"TRANSMITIR EN VIVO"** y hablar o reproducir cualquier charla técnica en inglés o español. El sistema generará la transcripción y traducción inmediata.

---

## 🇬🇧 English

> Real-time technical speech captions, dual-language translation powered by Gemini Flash, multi-stage isolation, and OBS Studio overlay integration for developer conferences.

### 🎯 The Challenge

Technical conferences move fast. Speakers continuously reference specialized engineering terms (Kubernetes, AWS, microservices, containerization, pull requests). Generic captioning tools either mangle these terms or add substantial lag, creating accessibility barriers for international audiences and deaf or hard-of-hearing attendees.

### 🚀 The Solution

**VibeStream AI** delivers an accessible live stream cockpit:

1. **Live & File Audio Ingestion:** Ingests live microphone feeds or processed conference session recordings (`.mp4` / `.mp3`).
2. **Technical Vocabulary Preservation:** Powered by **Google Gemini Flash**, prompt-tuned to maintain pristine software terminology.
3. **Multi-Track Stage Management:** Independent subtitle history and state per conference stage (_Gran Sala_, _Auditorio_, _Sala Abasto_, _Konex en Vivo_).
4. **Broadcast OBS Overlay:** Dedicated transparent `/overlay` route built to plug directly into OBS Studio or vMix as a Browser Source.
5. **Instant .SRT Export:** Generates standardized subtitle files with accurate timestamps for post-conference distribution.

### 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, Serverless Route Handlers)
- **Styling:** Tailwind CSS & Lucide Icons
- **AI Core:** Google Gemini Flash (`@google/genai`) + Low-Latency Fallback
- **Speech Capture:** Web Speech API & Multi-part FormData
- **Sync:** LocalStorage Event Bus for overlay mirroring

### ⚡ Quickstart

1. Clone repository:

```bash
git clone https://github.com/Jazmin-Loureiro/Vibeathon-2026-subtitles
cd Vibeathon-2026-subtitles
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables in `.env.local`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run local server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Google Chrome.

### 📺 OBS Studio Integration

To overlay live technical captions on your stream:

1. In OBS, add a new **Browser Source**.
2. URL: `http://localhost:3000/overlay?room=gran-sala&lang=es` (or your deployed URL).
3. Set dimensions: Width: `1920`, Height: `1080` (or `300` for a lower-third banner).
4. Captions will render smoothly with a transparent background in real-time.

### 📈 Multi-Track Scaling Architecture

The system currently handles 4 simultaneous conference stages (_Gran Sala_, _Auditorio_, _Sala Abasto_, _Konex en Vivo_) with independent subtitle histories and state isolation.

**How to scale to 10, 20+ parallel tracks:**

1. **Stateless Edge Processing:** Each stage routes speech independently via Next.js serverless route handlers (`/api/transcribe`), avoiding global execution locks and cross-track latency.
2. **Dynamic Stage Registration:** New stages can be added dynamically through configuration (`ROOMS`) or database entries, mapping each to its dedicated audio ingestion channel (stage microphone, mixer feed, or RTMP/HLS stream).
3. **Distributed Pub/Sub Layer:** For large-scale events with thousands of concurrent attendees, the local state bus can be paired with Redis Pub/Sub or WebSocket streaming to broadcast captions with sub-second latency across all screens and OBS overlays simultaneously.

### 🎙️ Audio Sources & Testing

- **Primary Source:** Real-time live audio ingestion via speaker microphone or audio feed through native Web Speech API in Google Chrome.
- **Quick Test:** Start the server, click **"TRANSMITIR EN VIVO"**, and speak or play any technical speech. The platform will immediately produce live transcriptions and technical translations.

---

## 📄 Licencia / License

Distribuido bajo la Licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.  
Distributed under the MIT License. See [LICENSE](LICENSE) for details.
