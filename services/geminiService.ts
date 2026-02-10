
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RecognitionResult } from "../types";

/**
 * REQ: API key must be obtained exclusively from process.env.API_KEY.
 * We use a safe accessor to prevent "process is not defined" crashes in pure browser environments.
 */
const getSafeApiKey = (): string => {
  try {
    // @ts-ignore - process might not be defined in all environments
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {
    console.warn("API_KEY_ACCESS_DELAYED");
  }
  return '';
};

// Stable architectural imagery
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
    const key = getSafeApiKey();
    if (!key) throw new Error("MISSING_ENVIRONMENT_KEY");
    
    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `Strictly identify the object located at the user click point (${Math.round(clickX || 50)}%, ${Math.round(clickY || 50)}%). 
    
    SPECIAL OVERRIDES: 
    1. If the target is a SILVER/METAL/STEEL push pin, IDENTIFY AS:
       - name: 'White House'
       - category: 'Government Landmark'
       - description: 'Washington D.C'
       - funFact: "Coldest Inauguration (1985): President Ronald Reagan's second inauguration recorded a noon temperature of 7F and a low of -4, forcing the ceremony indoors."
       - visualPrompt: 'The White House facade, high contrast monochrome architectural drawing'

    2. If the target is a CLEAR/TRANSPARENT/GLASS push pin, IDENTIFY AS:
       - name: 'IAD13 Data Center'
       - category: 'Infrastructure Node'
       - description: 'Ashburn Virginia'
       - funFact: "The IAD13 Data center is a Microsoft Data center that houses the Azure Data chip racks, currently being leased out by Open AI."
       - visualPrompt: 'Futuristic server clusters in a dark high-tech facility, monochrome'

    3. Otherwise, identify the object naturally.`;

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
      result.weatherFacts = `Blizzard of 2016 ("Jonas"): Heavy snowfall recorded for the area, burying Ashburn under 36 inches.\n\nExtreme Heat 2024: Temperatures soared to 104°F.`;
    }

    return result;
  } catch (error) {
    console.error("Recognition failure:", error);
    return null;
  }
}

export async function speakMessage(text: string): Promise<void> {
  try {
    const key = getSafeApiKey();
    if (!key) return;
    const ai = new GoogleGenAI({ apiKey: key });

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
    const key = getSafeApiKey();
    if (!key) return null;
    const ai = new GoogleGenAI({ apiKey: key });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [{ text: `A grayscale, monochrome, artistic noir architectural photograph of: ${prompt}. High contrast, cinematic lighting.` }]
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
