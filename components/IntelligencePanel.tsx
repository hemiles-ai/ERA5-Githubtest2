
import React, { useState, useEffect } from 'react';
import { RecognitionResult, ClickPosition } from '../types';

interface IntelligencePanelProps {
  result: RecognitionResult;
  aiImage: string | null;
  onClose: () => void;
  isGeneratingImage: boolean;
  clickPos: ClickPosition;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ 
  result, 
  aiImage, 
  onClose, 
  isGeneratingImage, 
  clickPos 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const displayImage = result.referenceImage || (aiImage === "QUOTA_EXCEEDED" ? null : aiImage);
  const quotaExceeded = aiImage === "QUOTA_EXCEEDED";

  // SMARTER POSITIONING LOGIC
  // Panel is roughly 400px wide. 
  // We want to translate it so it doesn't leave the screen.
  const panelWidth = 400;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const clickXPixels = (clickPos.x / 100) * viewportWidth;
  const clickYPixels = (clickPos.y / 100) * viewportHeight;

  // Horizontal check
  let translateX = '-50%';
  if (clickXPixels < panelWidth / 2 + 20) translateX = '0%';
  if (clickXPixels > viewportWidth - (panelWidth / 2 + 20)) translateX = '-100%';

  // Vertical check
  const isNearTop = clickPos.y < 50;
  const translateY = isNearTop ? '40px' : '-115%';
  const tetherHeight = isNearTop ? '40px' : '100px';
  const tetherBottom = isNearTop ? 'auto' : `${100 - clickPos.y}%`;
  const tetherTop = isNearTop ? `${clickPos.y}%` : 'auto';

  // Tilt for AR depth
  const tiltX = (clickPos.y - 50) * 0.15;
  const tiltY = (clickPos.x - 50) * -0.15;

  return (
    <div className="absolute inset-0 z-40 pointer-events-none overflow-hidden">
      {/* Background overlay (Optional: Click anywhere outside card to close) */}
      <div 
        className="absolute inset-0 bg-black/5 pointer-events-auto" 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
      />

      {/* AR Anchor Pin */}
      <div 
        className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
      >
        <div className="w-full h-full border border-white rounded-full animate-ping opacity-40"></div>
        <div className="absolute inset-0 m-auto w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white]"></div>
      </div>

      {/* Tether Line */}
      <div 
        className="absolute w-[1px] bg-gradient-to-t from-white/60 to-transparent origin-bottom animate-grow-y pointer-events-none"
        style={{ 
          left: `${clickPos.x}%`, 
          bottom: tetherBottom, 
          top: tetherTop,
          height: tetherHeight,
          transform: isNearTop ? 'rotate(180deg)' : 'none'
        }}
      ></div>

      {/* Main Intelligence Card */}
      <div 
        className="absolute pointer-events-auto flex flex-col transition-all duration-700 ease-out animate-ar-float"
        onClick={(e) => e.stopPropagation()} // Stop scan from triggering on card background
        style={{ 
          left: `${clickPos.x}%`, 
          top: `${clickPos.y}%`,
          transform: `translate(${translateX}, ${translateY}) perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          width: 'min(92vw, 400px)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/80 backdrop-blur-3xl border-t border-x border-white/30 rounded-t-sm">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-white animate-pulse"></div>
            <span className="text-[8px] font-black tracking-[0.5em] text-white/90 mono uppercase">Intel_Node::{result.name.substring(0,8)}</span>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="text-white/40 hover:text-white transition-all p-1 hover:scale-110 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Media Block */}
        <div className="relative aspect-video bg-black border-x border-white/20 overflow-hidden">
          {displayImage ? (
            <img 
              src={displayImage} 
              alt={result.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 grayscale contrast-[1.4] brightness-[0.9] ${imageLoaded ? 'opacity-90' : 'opacity-0'}`}
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
               {quotaExceeded ? (
                 <span className="text-[7px] text-red-500/40 mono uppercase tracking-[0.2em] text-center px-8">Visual_Gen_Quota_Exceeded</span>
               ) : (
                 <>
                   <div className="w-6 h-6 border-2 border-white/5 border-t-white/30 rounded-full animate-spin"></div>
                   <span className="text-[7px] text-white/20 mono uppercase tracking-[0.3em]">Processing_Visual_Feed...</span>
                 </>
               )}
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px]"></div>
        </div>

        {/* Data Cluster */}
        <div className="bg-black/95 backdrop-blur-3xl border border-white/20 p-6 rounded-b-sm shadow-2xl">
          <div className="mb-4 border-b border-white/10 pb-3">
            <span className="text-white/40 text-[7px] font-bold uppercase tracking-[0.5em] mono block mb-1">{result.category}</span>
            <h2 className="text-2xl font-black tracking-tight text-white uppercase leading-none">{result.name}</h2>
          </div>

          <div className="space-y-4">
            <div className="p-3 bg-white/[0.03] border-l-2 border-white/30">
              <p className="text-white/80 text-[10px] leading-relaxed mono font-light italic">
                {result.description}
              </p>
            </div>

            <div>
              <span className="text-[7px] text-white/20 font-bold uppercase tracking-[0.3em] block mb-1">Status_Registry</span>
              <p className="text-[10px] text-white/60 leading-relaxed mono">{result.funFact}</p>
            </div>

            {result.weatherFacts && (
              <div className="pt-3 border-t border-white/10">
                 <span className="text-[7px] text-white/30 font-bold uppercase tracking-[0.4em] block mb-1">Anomaly_Log</span>
                 <p className="text-[9px] text-white/40 mono leading-tight uppercase whitespace-pre-line">{result.weatherFacts}</p>
              </div>
            )}
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="mt-6 w-full py-3 bg-white text-black text-[9px] font-black uppercase tracking-[0.6em] active:scale-95 transition-all"
          >
            Collapse_Feed
          </button>
        </div>
      </div>

      <style>{`
        @keyframes ar-float {
          0% { opacity: 0; transform: translate(${translateX}, ${isNearTop ? '60px' : '-135%'}) scale(0.95); filter: blur(10px); }
          100% { opacity: 1; transform: translate(${translateX}, ${translateY}) perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(1); filter: blur(0); }
        }
        @keyframes grow-y {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        .animate-ar-float { animation: ar-float 0.5s cubic-bezier(0.2, 1, 0.3, 1) forwards; }
        .animate-grow-y { animation: grow-y 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default IntelligencePanel;
