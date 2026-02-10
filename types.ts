
export interface RecognitionResult {
  name: string;
  category: string;
  description: string;
  funFact: string;
  visualPrompt: string;
  confidence: number;
  referenceImage?: string;
  weatherFacts?: string;
}

export interface ClickPosition {
  x: number;
  y: number;
}

export enum AppStatus {
  INITIAL = 'INITIAL',
  CAMERA_REQUEST = 'CAMERA_REQUEST',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  VIEWING_RESULT = 'VIEWING_RESULT',
  ERROR = 'ERROR'
}
