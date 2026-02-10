
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "../types";

// Helper to safely get key from the shimmed process object
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || process.env.API_KEY || "";
  } catch (e) {
    return "";
  }
};

const WHITE_HOUSE_IMAGE = "https://images.unsplash.com/photo-1501466044931-62695aada8e9?q=80&w=1200&auto=format&fit=crop";
const DATA_CENTER_IMAGE = "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=1200&auto=format&fit=crop";

const RECOGNITION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Short common name of the object" },
    category: { type: Type.STRING, description: "General category" },
    description: { type: Type.STRING, description: "One-sentence informative description" },
    funFact: { type: Type.STRING, description: "Detailed facts" },
    visualPrompt: { type: Type.STRING, description: "Prompt for AI image generation" },
    confidence: { type: Type.NUMBER, description: "Confidence score" }
  },
  required: ["name", "category", "description", "funFact", "visualPrompt", "confidence"]
};

export async function recognizeObject(
  base64Image: string,
  clickX?: number,
  clickY?: number
): Promise<RecognitionResult | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("API_KEY_NOT_CONFIGURED");
    
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Strictly identify the object at (${Math.round(clickX || 50)}%, ${Math.round(clickY || 50)}%). 
    
    OVERRIDES: 
    1. If target is SILVER/METAL pin: White House (Washington D.C).
    2. If target is CLEAR/GLASS pin: IAD13 Data Center (Ashburn Virginia).`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: RECOGNITION_SCHEMA
      }
    });

    if (!response.text) return null;
    const result = JSON.parse(response.text) as RecognitionResult;
    
    const nameLower = (result.name || "").toLowerCase();
    if (nameLower.includes('white house')) {
      result.name = 'White House';
      result.referenceImage = WHITE_HOUSE_IMAGE;
    } else if (nameLower.includes('iad13') || nameLower.includes('data center')) {
      result.name = 'IAD13 Data Center';
      result.referenceImage = DATA_CENTER_IMAGE;
      result.weatherFacts = `Blizzard of 2016 ("Jonas"): 36 inches of snow.\nExtreme Heat 2024: 104°F recorded.`;
    }

    return result;
  } catch (error) {
    console.error("Recognition failure:", error);
    return null;
  }
}

export async function speakMessage(text: string): Promise<void> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.warn("TTS_ERROR:", error);
  }
}

export async function generateAIVisual(prompt: string): Promise<string | null> {
  try {
    const apiKey = getApiKey();
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A grayscale noir architectural photo of: ${prompt}.` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
  } catch (error) {
    console.error("VISUAL_GEN_ERROR:", error);
    return null;
  }
}
