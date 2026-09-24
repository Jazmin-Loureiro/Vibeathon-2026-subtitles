import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("ADVERTENCIA: GEMINI_API_KEY no está configurada en .env.local");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    originalText: {
      type: Type.STRING,
      description: "Transcripción exacta del audio en su idioma original.",
    },
    translatedText: {
      type: Type.STRING,
      description: "Traducción fiel y fluida del audio al idioma destino.",
    },
    detectedLanguage: {
      type: Type.STRING,
      description:
        "Código o nombre del idioma detectado en el audio (ej: 'en', 'es').",
    },
  },
  required: ["originalText", "translatedText", "detectedLanguage"],
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob | null;
    const targetLang = (formData.get("targetLang") as string) || "es";
    const room = (formData.get("room") as string) || "Escenario Principal";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No se proporcionó ningún archivo de audio." },
        { status: 400 },
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = audioFile.type || "audio/webm";

    const systemInstruction = `
      Sos el motor de transcripción y subtitulado en tiempo real para la conferencia tecnológica Nerdearla.
      
      Reglas estrictas de calidad:
      1. Calidad técnica: Reconocé jerga de desarrollo, software, arquitectura y computación en la nube (ej: Docker, Kubernetes, CI/CD, Next.js, React, Tailwind, Microservicios, AWS, Google Cloud, APIs, Serverless, Devops, Python, .NET, Full Stack). No inventes traducciones literales para términos técnicos estándar de la industria.
      2. Si el audio original está en inglés y el idioma destino es español ('${targetLang}'), transcribí en inglés y traducí al español rioplatense o neutro claro para la audiencia técnica.
      3. Si el audio está en silencio o solo hay ruido de fondo/aplausos, devolvé cadenas vacías en originalText y translatedText.
      4. Sé conciso y directo, optimizado para ser leído como subtítulo en vivo en pantalla o streaming.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Audio,
                mimeType: mimeType.split(";")[0], // Quita codecs si los tiene, ej: audio/webm
              },
            },
            {
              text: `Transcribe este audio corto de la sala '${room}' y traducilo al idioma '${targetLang}'. Devuelve exclusivamente el esquema JSON solicitado.`,
            },
          ],
        },
      ],
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.2, // Baja temperatura para menor alucinación y máxima fidelidad
      },
    });

    const result = JSON.parse(response.text || "{}");

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    console.error("Error en /api/transcribe:", error);
    return NextResponse.json(
      { error: error?.message || "Error al procesar el audio con Gemini" },
      { status: 500 },
    );
  }
}
