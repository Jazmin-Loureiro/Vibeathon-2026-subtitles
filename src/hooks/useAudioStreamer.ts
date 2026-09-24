"use client";

import { useState, useRef, useCallback } from "react";

interface SubtitleResult {
  originalText: string;
  translatedText: string;
  detectedLanguage: string;
  timestamp: number;
}

interface UseAudioStreamerProps {
  room: string;
  targetLang: string;
  onNewSubtitle: (sub: SubtitleResult) => void;
}

export function useAudioStreamer({
  room,
  targetLang,
  onNewSubtitle,
}: UseAudioStreamerProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  // Enviar chunk de audio al endpoint de Gemini
  const processAudioChunk = async (audioBlob: Blob) => {
    // Si el chunk es insignificante (silencio muy corto), lo saltamos
    if (audioBlob.size < 2000) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("audio", audioBlob, "chunk.webm");
      formData.append("room", room);
      formData.append("targetLang", targetLang);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Error en servidor: ${res.statusText}`);
      }

      const responseData = await res.json();
      if (responseData.success && responseData.data) {
        const { originalText, translatedText, detectedLanguage } =
          responseData.data;

        // Solo emitir si hay texto real (Gemini omite ruido de fondo)
        if (originalText?.trim() || translatedText?.trim()) {
          onNewSubtitle({
            originalText: originalText || "",
            translatedText: translatedText || "",
            detectedLanguage: detectedLanguage || "en",
            timestamp: responseData.timestamp || Date.now(),
          });
        }
      }
    } catch (err: any) {
      console.error("Error al procesar chunk de audio:", err);
      setError(err?.message || "Error al conectar con el servicio de voz");
    } finally {
      setIsLoading(false);
    }
  };

  // Iniciar captura
  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm",
      });

      mediaRecorderRef.current = mediaRecorder;
      isRecordingRef.current = true;
      setIsRecording(true);

      // Chunks dinámicos cada 3 segundos para balancear contexto y latencia
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && isRecordingRef.current) {
          processAudioChunk(event.data);
        }
      };

      mediaRecorder.start(3000);
    } catch (err: any) {
      console.error("Error al acceder al micrófono:", err);
      setError("No se pudo acceder al micrófono. Verificá los permisos.");
      setIsRecording(false);
    }
  }, [room, targetLang]);

  // Detener captura
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  }, []);

  // Simulación: Inyectar un archivo de audio/charla grabada (clave para el jurado y la demo)
  const processAudioFile = async (file: File) => {
    setError(null);
    setIsLoading(true);
    try {
      await processAudioChunk(file);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isRecording,
    isLoading,
    error,
    startRecording,
    stopRecording,
    processAudioFile,
  };
}
