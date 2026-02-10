
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppStatus, RecognitionResult, ClickPosition } from './types';
import { recognizeObject, generateAIVisual, speakMessage } from './services/geminiService';
import HUDOverlay from './components/HUDOverlay';
import IntelligencePanel from './components/IntelligencePanel';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.INITIAL);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [selectedObject, setSelectedObject] = useState<RecognitionResult | null>(null);
  const [aiImage, setAiImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clickPos, setClickPos] = useState<ClickPosition | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMessage("CRITICAL: Secure Context Required (HTTPS) for hardware uplink.");
        setStatus(AppStatus.ERROR);
        return;
      }

      setStatus(AppStatus.CAMERA_REQUEST);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 } 
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setStatus(AppStatus.SCANNING);
        };
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      let msg = "Hardware authorization failed.";
      if (err.name === 'NotAllowedError') msg = "Access Denied: Grant camera permissions.";
      else if (err.message) msg = err.message;
      
      setErrorMessage(msg);
      setStatus(AppStatus.ERROR);
    }
  };

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  }, []);

  const handleScanClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAnalyzing || status !== AppStatus.SCANNING) return;

    // Tactical Haptics
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setClickPos({ x, y });
    const base64Image = captureFrame();
    if (!base64Image) {
      setClickPos(null);
      return;
    }

    setIsAnalyzing(true);
    setAiImage(null);

    try {
      const result = await recognizeObject(base64Image, x, y);
      
      if (result) {
        if ('vibrate' in navigator) navigator.vibrate([30, 80, 30]);
        setSelectedObject(result);
        setStatus(AppStatus.VIEWING_RESULT);
        
        // Automatic Intel Briefing
        if (result.name === 'White House' || result.name === 'IAD13 Data Center') {
          speakMessage(`Target identified: ${result.name}. Initializing intelligence brief.`);
        }

        if (!result.referenceImage || result.name === 'IAD13 Data Center') {
          setIsGeneratingImage(true);
          const imageUrl = await generateAIVisual(result.visualPrompt);
          setAiImage(imageUrl);
          setIsGeneratingImage(false);
        }
      } else {
        setClickPos(null);
      }
    } catch (err) {
      console.error("Link failure:", err);
      setClickPos(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const closePanel = () => {
    setSelectedObject(null);
    setAiImage(null);
    setClickPos(null);
    setStatus(AppStatus.SCANNING);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col grayscale-custom select-none touch-none">
      <canvas ref={canvasRef} className="hidden" />

      <div className="relative flex-1 bg-black overflow-hidden">
        {status === AppStatus.INITIAL ? (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 text-center bg-[#050505]">
            <div className="mb-14 relative">
              <div className="w-28 h-28 border border-white/5 rounded-full flex items-center justify-center animate-[pulse_4s_infinite]">
                <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]"></div>
              </div>
              <div className="absolute inset-0 border-r-2 border-white/30 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-4 border-l border-white/10 rounded-full animate-spin-reverse-slow"></div>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-[0.7em] mb-6 text-white uppercase mono">Vision_AR</h1>
            <p className="text-white/20 max-w-xs text-[10px] leading-relaxed mb-16 uppercase tracking-[0.4em] mono">
              Neural Processing Substrate<br/>
              Standard Protocol V.1.5.2<br/>
              Awaiting Secure Uplink
            </p>
            
            <button 
              onClick={startCamera}
              className="px-16 py-6 border border-white/20 text-white text-[11px] font-bold rounded-sm hover:bg-white hover:text-black transition-all uppercase tracking-[0.5em] mono active:scale-95 bg-transparent"
            >
              Initialize Uplink
            </button>
          </div>
        ) : (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted
            className="absolute inset-0 w-full h-full object-cover grayscale brightness-[0.8] contrast-[1.1]"
          />
        )}

        {(status === AppStatus.SCANNING || status === AppStatus.VIEWING_RESULT || status === AppStatus.CAMERA_REQUEST) && (
          <HUDOverlay 
            status={status} 
            onClick={handleScanClick} 
            isAnalyzing={isAnalyzing}
            clickPos={clickPos}
          />
        )}

        {status === AppStatus.VIEWING_RESULT && selectedObject && (
          <IntelligencePanel 
            result={selectedObject}
            aiImage={aiImage}
            onClose={closePanel}
            isGeneratingImage={isGeneratingImage}
          />
        )}

        {status === AppStatus.ERROR && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-12 bg-black text-center">
            <div className="w-16 h-16 border border-red-900/40 flex items-center justify-center mb-8">
              <span className="text-red-600 font-bold text-2xl mono animate-pulse">!</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-6 mono tracking-[0.3em] uppercase">Hardware_Error</h2>
            <p className="text-white/30 mb-14 mono text-[10px] uppercase tracking-[0.2em] leading-loose max-w-sm">
              {errorMessage}
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-12 py-5 border border-white/10 text-white/50 font-bold mono uppercase text-[10px] tracking-[0.4em] hover:text-white hover:border-white transition-all active:scale-95"
            >
              Restart_Kernel
            </button>
          </div>
        )}
      </div>

      <footer className="h-12 bg-black border-t border-white/5 flex items-center justify-between px-8 z-20">
        <div className="flex items-center gap-5">
          <div className="flex gap-1.5">
            <div className={`w-0.5 h-3 bg-white/40 ${isAnalyzing ? 'animate-bounce' : ''}`}></div>
            <div className="w-0.5 h-3 bg-white/10"></div>
            <div className={`w-0.5 h-3 bg-white/40 ${isAnalyzing ? 'animate-bounce delay-75' : ''}`}></div>
          </div>
          <span className="text-[8px] font-bold uppercase tracking-[0.5em] text-white/30 mono">Uplink: Secure // Monitoring_Nodes</span>
        </div>
        <div className="text-[8px] font-bold uppercase tracking-[0.4em] text-white/10 mono hidden sm:block">No_Authorized_Intercepts</div>
      </footer>
      
      <style>{`
        .animate-spin-slow {
          animation: spin 12s linear infinite;
        }
        .animate-spin-reverse-slow {
          animation: spin-reverse 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  );
};

export default App;
