
import React from 'react';
import { AppStatus, ClickPosition } from '../types';

interface HUDOverlayProps {
  status: AppStatus;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  isAnalyzing: boolean;
  clickPos: ClickPosition | null;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({ status, onClick, isAnalyzing, clickPos }) => {
  return (
    <div 
      className="absolute inset-0 z-10 cursor-crosshair overflow-hidden pointer-events-auto"
      onClick={onClick}
    >
      {/* Corner Brackets */}
      <div className="absolute top-6 left-6 w-12 h-12 border-t border-l border-white/20"></div>
      <div className="absolute top-6 right-6 w-12 h-12 border-t border-r border-white/20"></div>
      <div className="absolute bottom-6 left-6 w-12 h-12 border-b border-l border-white/20"></div>
      <div className="absolute bottom-6 right-6 w-12 h-12 border-b border-r border-white/20"></div>

      {/* Scanning Line */}
      {status === AppStatus.SCANNING && (
        <div className="w-full h-[2px] bg-white/20 absolute top-0 left-0 z-20 animation-scan shadow-[0_0_15px_rgba(255,255,255,0.4)]" />
      )}

      {/* Target Marker at Click Position */}
      {clickPos && (
        <div 
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
          style={{ left: `${clickPos.x}%`, top: `${clickPos.y}%` }}
        >
          <div className="relative flex items-center justify-center">
            {/* Outer Ring */}
            <div className={`w-20 h-20 border border-white/30 rounded-full transition-transform duration-500 ${isAnalyzing ? 'scale-75 animate-pulse' : 'scale-100'}`}></div>
            {/* Inner Reticle */}
            <div className="absolute w-10 h-[1px] bg-white/60"></div>
            <div className="absolute h-10 w-[1px] bg-white/60"></div>
            {/* Corner Markers */}
            <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
            <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
            
            {isAnalyzing && (
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className="text-[9px] font-bold text-white tracking-[0.3em] mono uppercase animate-pulse">ANALYZING_TARGET</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Sight (Inactive state) */}
      {!clickPos && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20">
          <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
      )}

      {/* Telemetry Readouts */}
      <div className="absolute top-8 left-8 flex flex-col gap-1 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-white animate-ping' : 'bg-white/30'}`}></div>
          <span className="text-[10px] font-bold tracking-[0.3em] text-white/90 uppercase mono">
            {isAnalyzing ? 'UPLINK_ACTIVE' : 'READY_TO_SCAN'}
          </span>
        </div>
        <div className="text-[8px] text-white/20 mono tracking-widest">SIGNAL_STRENGTH: 98%</div>
      </div>

      <div className="absolute top-8 right-8 text-right pointer-events-none">
        <div className="text-[10px] font-bold text-white/50 mono tracking-widest uppercase mb-1">
          {new Date().toLocaleTimeString([], { hour12: false })}
        </div>
        <div className="text-[8px] text-white/20 mono tracking-[0.2em]">LAT: 38.8977 // LNG: -77.0365</div>
      </div>

      {/* Bottom Instructions */}
      {status === AppStatus.SCANNING && !isAnalyzing && !clickPos && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-12">
          <div className="bg-white/5 backdrop-blur-md px-6 py-4 border border-white/10 rounded-sm inline-block">
            <p className="text-[10px] font-bold text-white/60 tracking-[0.5em] uppercase mono animate-pulse">Touch physical object to initiate query</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default HUDOverlay;
