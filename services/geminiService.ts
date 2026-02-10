
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "../types";

// Helper functions for audio processing as per guidelines.
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const WHITE_HOUSE_IMAGE = "https://images.unsplash.com/photo-1501466044931-62695aada8e9?q=80&w=1200&auto=format&fit=crop";
const DATA_CENTER_IMAGE = "https://images.unsplash.com/photo-1558494949-ef010cbdcc51?q=80&w=1200&auto=format&fit=crop";
const STARLINK_IMAGE = "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?q=80&w=1200&auto=format&fit=crop";
const ITHACA_IMAGE = "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?q=80&w=1200&auto=format&fit=crop";

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

export class QuotaExceededError extends Error {
  constructor() {
    super("API_QUOTA_EXCEEDED");
    this.name = "QuotaExceededError";
  }
}

function handleApiError(error: any): never {
  const errorStr = JSON.stringify(error).toLowerCase();
  if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('resource_exhausted')) {
    throw new QuotaExceededError();
  }
  throw error;
}

export async function recognizeObject(
  base64Image: string,
  clickX?: number,
  clickY?: number
): Promise<RecognitionResult | null> {
  try {
    const apiKey = process.env.API_KEY || "";
    if (!apiKey) throw new Error("API_KEY_NOT_CONFIGURED");
    
    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
    TASK: Identify the target pin on this topographical map based on visual anchors and orientation.
    
    ORIENTATION CALIBRATION (CRITICAL): 
    The map orientation may be rotated. Do NOT use simple "Left/Right" screen positions. Instead, identify the following Topographical Anchors to determine the "North" of the map:
    
    ANCHOR A: The "Gorge/Lake" terrain (deep linear depressions, glacial lake features). This marks the ITHACA end of the map.
    ANCHOR B: The "Basin/Delta" terrain (wide flat plains, river-like system). This marks the WHITE HOUSE end of the map.
    
    IDENTITY KEY (Based on Anchors):
    1. THE WHITE HOUSE: Located at the "Basin/Delta" anchor.
    2. IAD13 DATA CENTER: Located in the industrial/developed cluster immediately adjacent to the Basin.
    3. POP STARLINK SYSTEM: Located on the high-elevation ridge-line between the Basin and the Gorges.
    4. ITHACA, NY: Located at the "Gorge/Lake" anchor.

    USER SELECTION: Target clicked at (${Math.round(clickX || 50)}%, ${Math.round(clickY || 50)}%).
    
    PROTOCOL: 
    1. Scan the whole image. 
    2. Locate Anchor A and Anchor B to fix the map's coordinate system. 
    3. Identify which of the 4 nodes is at the clicked location regardless of current rotation.
    `;

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
    
    // Applying verified metadata based on anchor resolution
    if (nameLower.includes('white house')) {
      result.name = 'The White House';
      result.referenceImage = WHITE_HOUSE_IMAGE;
      result.category = 'GOVERNMENT_HUB';
    } else if (nameLower.includes('iad13') || (nameLower.includes('data') && nameLower.includes('center'))) {
      result.name = 'IAD13 Data Center';
      result.referenceImage = DATA_CENTER_IMAGE;
      result.category = 'CRITICAL_INFRASTRUCTURE';
      result.weatherFacts = `Blizzard of 2016 ("Jonas"): 36 inches of snow recorded.\nExtreme Heat 2024: 104°F recorded.`;
    } else if (nameLower.includes('starlink') || nameLower.includes('pop')) {
      result.name = 'PoP Starlink System';
      result.referenceImage = STARLINK_IMAGE;
      result.category = 'NEURAL_COMM_RELAY';
      result.weatherFacts = `Atmospheric Ionization: 12% increase during solar flares.\nUplink Stability: 99.998% during rain fade events.`;
    } else if (nameLower.includes('ithaca') || nameLower.includes('ny')) {
      result.name = 'Ithaca, NY';
      result.referenceImage = ITHACA_IMAGE;
      result.category = 'RESEARCH_NODE';
      result.weatherFacts = `Annual Precipitation: 37 inches.\nGeological Note: 150+ waterfalls within a 10-mile radius.`;
    }

    return result;
  } catch (error) {
    return handleApiError(error);
  }
}

export async function speakMessage(text: string): Promise<void> {
  try {
    const apiKey = process.env.API_KEY;
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
      const audioBuffer = await decodeAudioData(
        decodeBase64(base64Audio),
        audioContext,
        24000,
        1
      );

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.warn("TTS_ERROR:", error);
  }
}

export async function generateAIVisual(prompt: string): Promise<string | null> {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return null;
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A grayscale noir architectural photo of: ${prompt}. Cinematic lighting, high contrast.` }]
      },
      config: { imageConfig: { aspectRatio: "1:1" } }
    });

    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return imagePart ? `data:image/png;base64,${imagePart.inlineData.data}` : null;
  } catch (error) {
    try {
      return handleApiError(error);
    } catch (e) {
      if (e instanceof QuotaExceededError) return "QUOTA_EXCEEDED";
      throw e;
    }
  }
}
