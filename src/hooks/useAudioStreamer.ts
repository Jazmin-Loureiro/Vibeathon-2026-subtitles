"use client";

import { useState, useRef, useCallback, useEffect } from "react";

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
  const [interimText, setInterimText] = useState<string>("");

  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const targetLangRef = useRef(targetLang);
  const roomRef = useRef(room);
  const onNewSubtitleRef = useRef(onNewSubtitle);

  useEffect(() => {
    targetLangRef.current = targetLang;
  }, [targetLang]);

  useEffect(() => {
    roomRef.current = room;
  }, [room]);

  useEffect(() => {
    onNewSubtitleRef.current = onNewSubtitle;
  }, [onNewSubtitle]);

  const translateText = async (text: string) => {
    const cleanText = text.trim();
    if (!cleanText || cleanText.length < 2) return;

    try {
      setIsLoading(true);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleanText,
          targetLang: targetLangRef.current,
          room: roomRef.current,
        }),
      });

      const json = await res.json();
      if (json.success && json.data && json.data.translatedText) {
        onNewSubtitleRef.current({
          originalText: json.data.originalText || cleanText,
          translatedText: json.data.translatedText,
          detectedLanguage:
            json.data.detectedLanguage ||
            (targetLangRef.current === "es" ? "en" : "es"),
          timestamp: Date.now(),
        });
        // Recién cuando se agregó a la lista de abajo, limpiamos el banner en vivo
        setInterimText("");
      }
    } catch (err: any) {
      console.warn("Error en traducción:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // En useAudioStreamer.ts

  // Agregá esta ref arriba con las otras refs:
  const speechBufferRef = useRef<string>("");
  const flushTimerRef = useRef<any>(null);

  // Y reemplazá initRecognition por esto:
  const initRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Usa Google Chrome para habilitar la captura de micrófono.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = targetLangRef.current === "es" ? "en-US" : "es-AR";

    // Función interna para despachar el buffer acumulado
    const flushBuffer = () => {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
      const textToTranslate = speechBufferRef.current.trim();
      if (textToTranslate.length >= 3) {
        setInterimText(textToTranslate + " ⌛");
        translateText(textToTranslate);
        speechBufferRef.current = ""; // Vaciamos para la próxima frase
      }
    };

    recognition.onresult = (event: any) => {
      let interim = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const chunk = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          // Acumulamos las palabras en el buffer
          speechBufferRef.current += " " + chunk;
          speechBufferRef.current = speechBufferRef.current.trim();

          const words = speechBufferRef.current.split(/\s+/).filter(Boolean);

          // Si ya juntamos 6 o más palabras, mandamos la oración completa
          if (words.length >= 6) {
            flushBuffer();
          } else {
            // Si son pocas palabras, esperamos 1 segundo a ver si seguís hablando
            if (flushTimerRef.current) clearTimeout(flushTimerRef.current);
            flushTimerRef.current = setTimeout(flushBuffer, 1000);
          }
        } else {
          interim += chunk;
        }
      }

      // Mostramos en vivo lo que está en el buffer + lo que estás diciendo en el momento
      const liveView = (speechBufferRef.current + " " + interim).trim();
      if (liveView) {
        setInterimText(liveView);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error !== "no-speech") {
        console.warn("Aviso micrófono:", event.error);
      }
    };

    recognition.onend = () => {
      // Si se cortó el mic, antes de reiniciar mandamos lo que haya quedado en el tintero
      flushBuffer();

      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          setTimeout(() => {
            if (isRecordingRef.current) {
              const freshRec = initRecognition();
              if (freshRec) {
                recognitionRef.current = freshRec;
                freshRec.start();
              }
            }
          }, 150);
        }
      } else {
        setIsRecording(false);
      }
    };

    return recognition;
  }, []);

  const startRecording = useCallback(() => {
    setError(null);
    setInterimText("");
    isRecordingRef.current = true;
    setIsRecording(true);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rec = initRecognition();
    if (rec) {
      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err: any) {
        console.error("Error al iniciar mic:", err);
      }
    }
  }, [initRecognition]);

  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);
    setInterimText("");

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
  }, []);

  const processAudioFile = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("audio", file);
      formData.append("room", roomRef.current);
      formData.append("targetLang", targetLangRef.current);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success && json.data) {
        onNewSubtitleRef.current({
          originalText: json.data.originalText || file.name,
          translatedText: json.data.translatedText || "Traducción completada",
          detectedLanguage: json.data.detectedLanguage || "en",
          timestamp: Date.now(),
        });
      } else {
        setError(json.error || "No se pudo procesar el archivo.");
      }
    } catch (err: any) {
      setError("Error al procesar archivo: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      isRecordingRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  return {
    isRecording,
    isLoading,
    error,
    interimText,
    startRecording,
    stopRecording,
    processAudioFile,
  };
}
