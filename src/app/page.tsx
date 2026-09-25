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
  Layers,
  Globe,
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
  },
  { id: "auditorio", name: "Auditorio", track: "Arquitectura & Backend" },
  {
    id: "sala-abasto",
    name: "Sala Abasto",
    track: "DevOps, Cloud & Seguridad",
  },
  { id: "konex-vivo", name: "Konex en Vivo", track: "Workshops & Paneles" },
];

export default function Home() {
  const [activeRoom, setActiveRoom] = useState(ROOMS[0].id);
  const [targetLang, setTargetLang] = useState<"es" | "en">("es");
  const [displayMode, setDisplayMode] = useState<
    "translated" | "dual" | "original"
  >("translated");
  const [subtitles, setSubtitles] = useState<SubtitleItem[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setSubtitles((prev) => [
        ...prev,
        {
          ...newSub,
          id: Math.random().toString(36).substring(2, 9),
        },
      ]);
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
      const endMs = startMs + 3000;

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
    if (file) processAudioFile(file);
  };

  const currentRoomDetails = ROOMS.find((r) => r.id === activeRoom);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow-lg shadow-emerald-950">
            N
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-lg tracking-tight">
                NerdSub Live
              </h1>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Nerdearla 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sistema open source de subtitulado simultáneo con Gemini Flash
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToSRT}
            disabled={subtitles.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition-colors border border-slate-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Descargar .SRT ({subtitles.length})
          </button>

          <a
            href={`/overlay?room=${activeRoom}&lang=${targetLang}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 transition-colors border border-emerald-800/50"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Salida OBS Overlay
          </a>
        </div>
      </header>

      {/* Selector de salas en paralelo */}
      <div className="border-b border-slate-800/60 bg-slate-900/30 px-6 py-3 overflow-x-auto flex gap-2.5">
        {ROOMS.map((room) => {
          const isActive = room.id === activeRoom;
          return (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoom(room.id);
                setSubtitles([]);
              }}
              className={`flex flex-col text-left px-4 py-2 rounded-xl transition-all border shrink-0 cursor-pointer ${
                isActive
                  ? "bg-slate-800 border-emerald-500/50 text-white shadow-sm shadow-emerald-950/50"
                  : "bg-slate-900/40 border-slate-800/60 text-slate-400 hover:bg-slate-800/40"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`}
                />
                <span className="text-sm font-medium">{room.name}</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-0.5">
                {room.track}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Barra de Control */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-md cursor-pointer ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950 animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950"
              }`}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
              {isRecording
                ? "Detener Transmisión"
                : "Capturar Micrófono en Vivo"}
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
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-medium text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Cargar Charla (.mp3 / .wav)
            </button>
          </div>

          <div className="flex items-center gap-3">
            {/* Idioma destino */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setTargetLang("es")}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  targetLang === "es"
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                Hacia Español
              </button>
              <button
                onClick={() => setTargetLang("en")}
                className={`px-3 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  targetLang === "en"
                    ? "bg-slate-800 text-emerald-400"
                    : "text-slate-400"
                }`}
              >
                Hacia Inglés
              </button>
            </div>

            {/* Modo de visualización */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
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
                Dual
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

        {/* Panel Central de Subtítulos */}
        <section className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 flex flex-col min-h-[500px] max-h-[720px] relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/60 mb-4">
            <div className="flex items-center gap-2.5">
              <Radio className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-slate-100">
                {currentRoomDetails?.name}
              </span>
              <span className="text-xs text-slate-500">
                • {currentRoomDetails?.track}
              </span>
            </div>

            {isLoading && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Traduciendo con IA...</span>
              </div>
            )}
          </div>

          {/* Banner en vivo estilo YouTube */}
          {isRecording && (
            <div className="mb-4 p-4 rounded-xl bg-slate-950 border border-emerald-500/40 shadow-lg shadow-emerald-950/40 flex items-start gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 mt-1 shrink-0 animate-ping" />
              <div className="flex-1 font-sans">
                <span className="text-xs uppercase font-mono text-emerald-400 font-bold tracking-wider mr-2">
                  [ORADOR EN VIVO]:
                </span>
                <span className="text-base text-slate-100 font-medium">
                  {interimText || "Escuchando charla..."}
                </span>
              </div>
            </div>
          )}

          {/* Cascada de Subtítulos */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto space-y-3.5 pr-2"
          >
            {subtitles.length === 0 && !isRecording ? (
              <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 text-slate-500">
                <Volume2 className="w-12 h-12 mb-3 stroke-[1.2] text-slate-600" />
                <p className="text-base font-medium text-slate-400">
                  Esperando señal de audio en la sala...
                </p>
                <p className="text-xs mt-1.5 max-w-sm text-slate-500">
                  Activá el micrófono o cargá un extracto de charla técnica para
                  visualizar la transcripción en tiempo real con jerga técnica
                  preservada.
                </p>
              </div>
            ) : (
              subtitles.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 transition-all hover:border-slate-700"
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
                    <span>
                      IDIOMA ORIGEN: {item.detectedLanguage.toUpperCase()}
                    </span>
                    <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs">
              {error}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
