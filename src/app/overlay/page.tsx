"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";

function OverlayContent() {
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "gran-sala";
  const [subtitles, setSubtitles] = useState<string>(
    "Esperando audio de la conferencia...",
  );

  // Escucha mensajes sincronizados o muestra estado
  useEffect(() => {
    const handleStorage = () => {
      const lastSub = localStorage.getItem(`latest-sub-${room}`);
      if (lastSub) setSubtitles(lastSub);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [room]);

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-end p-8">
      <div className="bg-slate-950/85 border border-emerald-500/40 backdrop-blur-md p-4 rounded-xl max-w-4xl mx-auto shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">
            Nerdearla Live • {room}
          </span>
        </div>
        <p className="text-2xl font-bold text-white tracking-wide drop-shadow-md">
          {subtitles}
        </p>
      </div>
    </div>
  );
}

export default function OverlayPage() {
  return (
    <Suspense fallback={<div className="bg-transparent" />}>
      <OverlayContent />
    </Suspense>
  );
}
