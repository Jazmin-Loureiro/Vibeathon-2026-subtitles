"use client";

import { useState, useEffect, useRef } from "react";
import { useAudioStreamer } from "@/hooks/useAudioStreamer";
import {
  Mic,
  MicOff,
  Upload,
  Download,
  ExternalLink,
  Volume2,
  Radio,
  Sparkles,
  Play,
  FileVideo,
  Activity,
  Layers,
  CheckCircle2,
  Zap,
} from "lucide-react";

interface SubtitleItem {
  id: string;
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  timestamp: number;
}

const ROOMS = [
  {
    id: "gran-sala",
    name: "Gran Sala",
    track: "Keynotes & Sesiones Principales",
    live: true,
  },
  {
    id: "auditorio",
    name: "Auditorio",
    track: "Arquitectura & Backend",
    live: true,
  },
  {
    id: "sala-abasto",
    name: "Sala Abasto",
    track: "Cloud, DevOps & Infra",
    live: false,
  },
  {
    id: "konex-vivo",
    name: "Konex en Vivo",
    track: "Workshops & Paneles",
    live: true,
  },
];

export default function Home() {
  const [activeRoom, setActiveRoom] = useState(ROOMS[0].id);
  const [targetLang, setTargetLang] = useState<"es" | "en">("es");
  const [displayMode, setDisplayMode] = useState<
    "translated" | "dual" | "original"
  >("translated");

  // Estado con persistencia individual por escenario
  const [roomSubtitles, setRoomSubtitles] = useState<
    Record<string, SubtitleItem[]>
  >({
    "gran-sala": [],
    auditorio: [],
    "sala-abasto": [],
    "konex-vivo": [],
  });

  const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "audio" | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Subtítulos activos según la sala seleccionada
  const subtitles = roomSubtitles[activeRoom] || [];

  const {
    isRecording,
    isLoading,
    error,
    interimText,
    startRecording,
    stopRecording,
    processAudioFile,
  } = useAudioStreamer({
    room: activeRoom,
    targetLang,
    onNewSubtitle: (newSub) => {
      const item: SubtitleItem = {
        ...newSub,
        id: Math.random().toString(36).substring(2, 9),
      };

      setRoomSubtitles((prev) => ({
        ...prev,
        [activeRoom]: [...(prev[activeRoom] || []), item],
      }));

      try {
        localStorage.setItem(`latest-sub-${activeRoom}`, newSub.translatedText);
      } catch (e) {}
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [subtitles, interimText]);

  const exportToSRT = () => {
    if (subtitles.length === 0) return;

    const formatTime = (ms: number) => {
      const d = new Date(ms);
      const hh = String(d.getUTCHours()).padStart(2, "0");
      const mm = String(d.getUTCMinutes()).padStart(2, "0");
      const ss = String(d.getUTCSeconds()).padStart(2, "0");
      const mmm = String(d.getUTCMilliseconds()).padStart(3, "0");
      return `${hh}:${mm}:${ss},${mmm}`;
    };

    const baseTime = subtitles[0].timestamp;
    let srtContent = "";

    subtitles.forEach((sub, index) => {
      const startMs = Math.max(0, sub.timestamp - baseTime);
      const endMs = startMs + 3200;

      const startTime = formatTime(startMs);
      const endTime = formatTime(endMs);

      const textToExport =
        displayMode === "original"
          ? sub.originalText
          : displayMode === "dual"
            ? `${sub.originalText}\n${sub.translatedText}`
            : sub.translatedText;

      srtContent += `${index + 1}\r\n`;
      srtContent += `${startTime} --> ${endTime}\r\n`;
      srtContent += `${textToExport}\r\n\r\n`;
    });

    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `subtitulos-${activeRoom}-${Date.now()}.srt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const isVideo = file.type.includes("video");
      setMediaType(isVideo ? "video" : "audio");
      const url = URL.createObjectURL(file);
      setMediaPreviewUrl(url);
      processAudioFile(file);
    }
  };

  const currentRoomDetails = ROOMS.find((r) => r.id === activeRoom);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Barra superior de Navegación y Acciones */}
      <header className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center font-black text-slate-950 shadow-md shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight text-white">
                VibeStream AI
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Nerdearla Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live Accessibility & Real-Time Technical Subtitles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportToSRT}
            disabled={subtitles.length === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 disabled:opacity-30 transition-all border border-slate-800 text-slate-200 cursor-pointer shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            Descargar .SRT ({subtitles.length})
          </button>

          <a
            href={`/overlay?room=${activeRoom}&lang=${targetLang}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Modo OBS Overlay
          </a>
        </div>
      </header>

      {/* Tabs de Selección de Salas */}
      <nav className="border-b border-slate-800/60 bg-slate-900/30 px-6 py-2.5 flex items-center justify-start gap-2 overflow-x-auto">
        <span className="text-[11px] font-mono uppercase text-slate-500 mr-2 flex items-center gap-1.5 shrink-0">
          <Layers className="w-3.5 h-3.5" /> Escenarios:
        </span>
        {ROOMS.map((room) => {
          const isActive = room.id === activeRoom;
          return (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
              }}
              className={`flex items-center gap-2.5 px-4 py-2 rounded-lg text-xs transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? "bg-slate-800/90 border-emerald-500/60 text-white shadow-sm font-semibold"
                  : "bg-slate-950/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
              />
              <span>{room.name}</span>
              <span className="text-[10px] text-slate-500 border-l border-slate-700/60 pl-2">
                {room.track.split("&")[0]}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Cuerpo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Consola de Control de Entrada y Formato */}
        <section className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-sm shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-lg cursor-pointer ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50 animate-pulse"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/50"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isRecording ? "DETENER MICRÓFONO" : "TRANSMITIR EN VIVO"}
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*,video/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all disabled:opacity-40 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-emerald-400" />
              Cargar Charla (.mp4 / .mp3)
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2">
                IDIOMA:
              </span>
              <button
                onClick={() => setTargetLang("es")}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  targetLang === "es"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Hacia Español
              </button>
              <button
                onClick={() => setTargetLang("en")}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  targetLang === "en"
                    ? "bg-slate-800 text-emerald-400 shadow-sm"
                    : "text-slate-400"
                }`}
              >
                Hacia Inglés
              </button>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/90 text-xs">
              <span className="text-[10px] text-slate-500 font-mono px-2">
                VISTA:
              </span>
              <button
                onClick={() => setDisplayMode("translated")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  displayMode === "translated"
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400"
                }`}
              >
                Traducción
              </button>
              <button
                onClick={() => setDisplayMode("dual")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  displayMode === "dual"
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400"
                }`}
              >
                Doble Idioma
              </button>
              <button
                onClick={() => setDisplayMode("original")}
                className={`px-3 py-1 rounded-lg cursor-pointer transition-colors ${
                  displayMode === "original"
                    ? "bg-slate-800 text-white font-medium"
                    : "text-slate-400"
                }`}
              >
                Original
              </button>
            </div>
          </div>
        </section>

        {/* Reproductor de Archivo Cargado (si existe) */}
        {mediaPreviewUrl && (
          <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-800 text-emerald-400">
                <FileVideo className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-200">
                  {fileName}
                </p>
                <p className="text-[11px] text-slate-400">
                  Archivo cargado en sesión local
                </p>
              </div>
            </div>
            {mediaType === "video" ? (
              <video
                ref={videoRef}
                src={mediaPreviewUrl}
                controls
                className="max-h-48 rounded-xl border border-slate-800 bg-black"
              />
            ) : (
              <audio
                src={mediaPreviewUrl}
                controls
                className="w-full max-w-sm"
              />
            )}
          </section>
        )}

        {/* Monitor Principal de Subtítulos */}
        <section className="flex-1 bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 flex flex-col min-h-[460px] max-h-[640px] relative overflow-hidden backdrop-blur-sm shadow-xl">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/60 mb-3.5">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-100">
                {currentRoomDetails?.name}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                • {currentRoomDetails?.track}
              </span>
            </div>

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Gemini procesando audio...</span>
              </div>
            )}
          </div>

          {/* Subtítulo dinámico en directo */}
          {isRecording && (
            <div className="mb-4 p-4 rounded-xl bg-slate-950/90 border border-emerald-500/40 shadow-lg shadow-emerald-950/50 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 animate-ping" />
              <div className="flex-1">
                <span className="text-xs uppercase font-mono text-emerald-400 font-bold mr-2 tracking-wide">
                  [ORADOR]:
                </span>
                <span className="text-base text-slate-100 font-medium">
                  {interimText || "Escuchando orador..."}
                </span>
              </div>
            </div>
          )}

          {/* Lista de Transcripciones */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3 pr-2"
          >
            {subtitles.length === 0 && !isRecording ? (
              <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Volume2 className="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
                <p className="text-base font-medium text-slate-400">
                  Canal de audio en espera
                </p>
                <p className="text-xs mt-1.5 max-w-sm text-slate-500">
                  Iniciá el micrófono o cargá un extracto de charla técnica para
                  generar transcripción y traducción en tiempo real adaptada a
                  jerga de ingeniería de software.
                </p>
              </div>
            ) : (
              subtitles.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-all"
                >
                  {displayMode === "dual" ? (
                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-400 font-mono tracking-wide">
                        {item.originalText}
                      </p>
                      <p className="text-lg text-emerald-300 font-medium leading-relaxed">
                        {item.translatedText}
                      </p>
                    </div>
                  ) : displayMode === "original" ? (
                    <p className="text-lg text-slate-100 leading-relaxed">
                      {item.originalText}
                    </p>
                  ) : (
                    <p className="text-xl text-emerald-300 font-medium leading-relaxed">
                      {item.translatedText}
                    </p>
                  )}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 font-mono border-t border-slate-900 pt-2">
                    <span>ORIGEN: {item.detectedLanguage.toUpperCase()}</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}
        </section>
      </main>

      {/* Footer Técnico de Conferencia */}
      <footer className="border-t border-slate-800/80 bg-slate-900/50 px-6 py-3 text-[11px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4 mt-auto">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-slate-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400" /> Latencia:
            &lt;1.8s
          </span>
          <span>•</span>
          <span>Modelo: Gemini 3.8 Flash + FastFallback</span>
          <span>•</span>
          <span>Arquitectura: Stateless Edge</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Vibeathon 2026 • Nerdearla Live Access</span>
        </div>
      </footer>
    </div>
  );
}
