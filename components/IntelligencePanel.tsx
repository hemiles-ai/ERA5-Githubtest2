
import React, { useState } from 'react';
import { RecognitionResult } from '../types';

interface IntelligencePanelProps {
  result: RecognitionResult;
  aiImage: string | null;
  onClose: () => void;
  isGeneratingImage: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ result, aiImage, onClose, isGeneratingImage }) => {
  const [showWeather, setShowWeather] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const displayImage = result.referenceImage || aiImage;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center p-0 md:p-10">
      <div 
        className="absolute inset-0 bg-black/95 backdrop-blur-lg"
        onClick={onClose}
      />
      
      <div className="relative w-full h-full md:h-auto md:max-w-6xl md:max-h-[90vh] bg-[#050505] md:border md:border-white/10 md:rounded shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Visual Link Feed */}
        <div className="w-full md:w-1/2 bg-[#000] flex items-center justify-center relative h-[40vh] md:h-auto overflow-hidden">
          {/* Mobile Back Button */}
          <button 
            onClick={onClose}
            className="md:hidden absolute top-6 right-6 z-50 p-3 bg-black/40 border border-white/20 rounded-full"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Loading States */}
          {(isGeneratingImage && !result.referenceImage) || (displayImage && !imageLoaded) ? (
            <div className="flex flex-col items-center gap-4 z-10 text-center px-8">
              <div className="w-10 h-10 border border-white/10 border-t-white rounded-full animate-spin"></div>
              <p className="text-[9px] text-white/40 mono uppercase tracking-[0.4em] animate-pulse">Reconstructing Visual Buffer...</p>
            </div>
          ) : null}

          {/* Feed Content */}
          {displayImage && (
            <img 
              src={displayImage} 
              alt={result.name} 
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-1000 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              style={{ filter: 'grayscale(100%) contrast(110%) brightness(105%)' }}
            />
          )}

          {!displayImage && !isGeneratingImage && (
            <div className="flex flex-col items-center gap-4 text-center px-10">
              <div className="w-12 h-12 border border-white/5 flex items-center justify-center">
                <div className="w-2 h-2 bg-white/20 rounded-full animate-ping"></div>
              </div>
              <p className="text-white/20 mono text-[9px] uppercase tracking-[0.5em]">FEED_FAILURE: NO_REFERENCE</p>
            </div>
          )}
          
          <div className="absolute bottom-6 left-6 border border-white/20 px-4 py-2 rounded-sm text-[8px] font-bold uppercase tracking-[0.4em] mono text-white/60 bg-black/60 backdrop-blur-md">
            REMOTE_NODE::{result.name.substring(0, 4).toUpperCase()}
          </div>
        </div>

        {/* Intelligence Data Panel */}
        <div className="flex-1 md:w-1/2 p-8 md:p-14 flex flex-col gap-8 overflow-y-auto border-t md:border-t-0 md:border-l border-white/5 bg-[#080808]">
          <div className="hidden md:flex justify-end">
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded transition-colors group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/20 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-8">
            <header>
              <span className="text-white/20 text-[10px] font-bold uppercase tracking-[0.5em] mono block mb-2">
                {result.category}
              </span>
              <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-white uppercase">{result.name}</h2>
            </header>

            <section className="space-y-4">
              <h3 className="text-white/30 text-[9px] font-bold uppercase tracking-[0.5em] mono border-b border-white/5 pb-3">Primary Intelligence</h3>
              <p className="text-white text-xl md:text-2xl font-light tracking-tight leading-relaxed">
                {result.description}
              </p>
            </section>

            <section className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-sm">
              <h3 className="text-white/40 text-[9px] font-bold uppercase tracking-[0.5em] mono mb-4">Tactical Log</h3>
              <p className="text-white/80 leading-relaxed text-sm md:text-base whitespace-pre-line mono italic">
                {result.funFact}
              </p>
            </section>

            {result.weatherFacts && (
              <section className="space-y-4">
                <button 
                  onClick={() => setShowWeather(!showWeather)}
                  className="w-full py-5 border border-white/10 text-white/50 text-[9px] font-bold uppercase tracking-[0.4em] mono hover:bg-white hover:text-black transition-all flex justify-between px-8 items-center bg-white/[0.01] active:scale-[0.97]"
                >
                  <span>{showWeather ? 'CLOSE_EXTENDED_METRICS' : 'LOAD_CLIMATE_HISTORY'}</span>
                  <span className="text-xl">{showWeather ? '×' : '+'}</span>
                </button>
                
                {showWeather && (
                  <div className="bg-black/40 border border-white/5 p-6 rounded-sm space-y-6 animate-in fade-in slide-in-from-top-6 duration-700">
                    <p className="text-white/50 leading-relaxed text-[11px] md:text-xs whitespace-pre-line mono uppercase tracking-[0.2em]">
                      {result.weatherFacts}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <button 
            onClick={onClose}
            className="mt-12 w-full py-6 bg-white text-black font-bold rounded-sm hover:bg-neutral-200 transition-all uppercase tracking-[0.6em] text-[11px] mono active:scale-95"
          >
            DISCONNECT_NODE
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntelligencePanel;
