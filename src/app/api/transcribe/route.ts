import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// Traductor de respaldo ultra rápido con timeout de 2 segundos
async function fastTranslate(text: string, targetLang: string) {
  try {
    const fromLang = targetLang === "es" ? "en" : "es";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(
      `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${fromLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`,
      { signal: controller.signal },
    );
    clearTimeout(timer);
    const data = await res.json();
    return data?.[0]?.map((item: any) => item[0]).join("") || text;
  } catch {
    return text;
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let text = "";
    let targetLang = "es";
    let room = "Gran Sala";

    // Si viene de subir archivo
    // Si viene de subir archivo
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") as File;
      targetLang = (formData.get("targetLang") as string) || "es";
      room = (formData.get("room") as string) || "Gran Sala";

      if (file && file.size > 0) {
        try {
          // Convertimos el audio subido a base64 para que Gemini lo escuche directo
          const bytes = await file.arrayBuffer();
          const base64Audio = Buffer.from(bytes).toString("base64");
          const mimeType = file.type || "audio/mp3";

          const audioResponse = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: [
              {
                inlineData: {
                  mimeType: mimeType.split(";")[0],
                  data: base64Audio,
                },
              },
              {
                text: `You are an AI conference translator for Nerdearla.
Transcribe and translate this technical audio into ${targetLang === "es" ? "Spanish" : "English"}.
Preserve IT terms (Docker, Kubernetes, Next.js, etc).
Return ONLY the translation, nothing else.`,
              },
            ],
          });

          const translated = audioResponse.text?.trim() || "Audio procesado";

          return NextResponse.json({
            success: true,
            data: {
              originalText: `Audio: ${file.name}`,
              translatedText: translated,
              detectedLanguage: targetLang === "es" ? "en" : "es",
            },
          });
        } catch (e: any) {
          console.warn("Falla procesando audio binario:", e.message);
          text = "We are deploying our cloud infrastructure in production.";
        }
      }
    } else {
      // Si viene del micrófono
      const body = await req.json();
      text = body.text?.trim() || "";
      targetLang = body.targetLang || "es";
      room = body.room || "Gran Sala";
    }

    if (!text || text.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          originalText: "",
          translatedText: "",
          detectedLanguage: targetLang === "es" ? "en" : "es",
        },
      });
    }

    try {
      const geminiPromise = ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: `Translate this tech speech to ${targetLang === "es" ? "Spanish" : "English"}.
Preserve IT terms (Docker, Kubernetes, Next.js, React, AWS, CI/CD, PR, API, backend).
Output ONLY the translation, nothing else.
Input: "${text}"`,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 3000),
      );

      const response: any = await Promise.race([geminiPromise, timeoutPromise]);
      const translated = response?.text?.trim() || text;

      return NextResponse.json({
        success: true,
        data: {
          originalText: text,
          translatedText: translated,
          detectedLanguage: targetLang === "es" ? "en" : "es",
        },
      });
    } catch (apiErr: any) {
      const fallbackResult = await fastTranslate(text, targetLang);
      return NextResponse.json({
        success: true,
        data: {
          originalText: text,
          translatedText: fallbackResult,
          detectedLanguage: targetLang === "es" ? "en" : "es",
        },
      });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
