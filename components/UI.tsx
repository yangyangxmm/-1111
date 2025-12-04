import React, { useRef } from 'react';
import { ShapeType, HandData } from '../types';

interface UIProps {
  currentShape: ShapeType;
  setShape: (s: ShapeType) => void;
  currentColor: string;
  setColor: (c: string) => void;
  handData: HandData;
  onUploadPhotos: (e: React.ChangeEvent<HTMLInputElement>) => void;
  photoCount: number;
  isScattered: boolean;
  setIsScattered: (v: boolean) => void;
  onUploadMusic: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const UI: React.FC<UIProps> = ({ 
  currentShape, 
  setShape, 
  currentColor, 
  setColor, 
  handData,
  onUploadPhotos,
  photoCount,
  isScattered,
  onUploadMusic,
  isPlaying,
  onTogglePlay
}) => {
  
  const shapes = [
    { id: ShapeType.TREE, label: 'Tree', icon: '🎄' },
    { id: ShapeType.HEART, label: 'Heart', icon: '❤️' },
    { id: ShapeType.STAR, label: 'Star', icon: '⭐' },
  ];

  const colors = [
    { value: '#0F4225', label: 'Classic Pine', class: 'bg-[#0F4225]' }, // Deep Green
    { value: '#D42426', label: 'Santa Red', class: 'bg-[#D42426]' },     // Bright Red
    { value: '#FFD700', label: 'Gold', class: 'bg-[#FFD700]' },         // Gold
    { value: '#FFFFFF', label: 'Snow', class: 'bg-[#FFFFFF]' },          // White
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const musicInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
      
      {/* Header - Cinematic Title - Top Left */}
      <header className="absolute top-4 left-4 md:left-6 pointer-events-auto flex flex-col items-start z-40">
        <h1 className="text-3xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#FFD700] via-[#FBF5B7] to-[#AA8800] drop-shadow-[0_0_25px_rgba(212,175,55,0.6)] font-bold tracking-widest font-serif leading-tight">
          MERRY<br/>CHRISTMAS
        </h1>
        <p className="text-[#FBF5B7] text-[9px] md:text-xs mt-2 font-light tracking-[0.2em] uppercase opacity-80 border-t border-[#FBF5B7]/30 pt-1 inline-block">
          Interactive Holiday Experience
        </p>

        {/* Gesture Instructions / Mode Indicator - Moved HERE (Left, under title) */}
        <div className="mt-4 flex flex-col items-start gap-2">
            <div className={`px-4 py-2 rounded-lg border backdrop-blur-md transition-all duration-500 shadow-lg flex items-center gap-3
                ${isScattered 
                    ? 'bg-black/60 border-[#FFD700]/30 text-[#FFD700]' 
                    : 'bg-[#0F4225]/80 border-[#D42426]/50 text-[#FBF5B7]'
                }
            `}>
                <span className="text-xl">{isScattered ? '🖐️' : '✊'}</span>
                <div className="flex flex-col text-left">
                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest">
                        {isScattered ? 'Scattered Mode' : 'Tree Mode'}
                    </span>
                    <span className="text-[8px] opacity-70">
                        {isScattered ? 'Pinch to Slideshow' : 'Open Hand to Scatter'}
                    </span>
                </div>
            </div>
            
            {/* Gesture Feedback */}
            {handData.present && (
                <div className="text-[9px] text-[#FFD700] tracking-widest uppercase animate-pulse bg-black/40 px-2 rounded border border-[#FFD700]/20">
                    Detected: {handData.gesture === 'NONE' ? 'Hand Present' : handData.gesture}
                </div>
            )}
        </div>
      </header>

      {/* Right Sidebar Controls */}
      <div className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 pointer-events-auto flex flex-col gap-6 items-end z-40">
        
        {/* Shape */}
        <div className="flex flex-col gap-2 items-end">
            <span className="text-[8px] md:text-[10px] text-[#FFD700]/60 uppercase tracking-widest">Form</span>
            <div className="flex flex-col gap-2">
            {shapes.map((s) => (
                <button
                key={s.id}
                onClick={() => setShape(s.id)}
                className={`
                    w-9 h-9 md:w-11 md:h-11 rounded-full flex items-center justify-center text-lg transition-all duration-500 border border-[#FFD700]/20
                    ${currentShape === s.id 
                    ? 'bg-[#D42426] text-white shadow-[0_0_20px_rgba(212,36,38,0.6)] scale-110' 
                    : 'bg-black/40 text-[#FFD700]/40 hover:bg-black/60 hover:text-[#FFD700]'}
                `}
                >
                {s.icon}
                </button>
            ))}
            </div>
        </div>

        {/* Color */}
        <div className="flex flex-col gap-2 items-end">
            <span className="text-[8px] md:text-[10px] text-[#FFD700]/60 uppercase tracking-widest">Theme</span>
            <div className="flex flex-col gap-2">
            {colors.map((c) => (
                <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={`
                    w-5 h-5 md:w-6 md:h-6 rounded-full border transition-all duration-500 relative shadow-md
                    ${c.class}
                    ${currentColor === c.value 
                    ? 'border-[#FFD700] scale-125 shadow-[0_0_15px_rgba(255,215,0,0.8)] z-10 ring-2 ring-white/20' 
                    : 'border-white/10 opacity-60 hover:opacity-100 hover:scale-110'}
                `}
                />
            ))}
            </div>
        </div>

      </div>

      {/* Bottom Controls (Media) */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 pointer-events-auto flex items-center gap-3 md:gap-6 z-50 w-full justify-center px-4">
        
        {/* Music Player */}
        <div className="group relative">
           <input 
             type="file" 
             accept=".mp3,audio/*" 
             className="hidden" 
             ref={musicInputRef}
             onChange={onUploadMusic}
           />
           <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-[#FFD700]/20 hover:border-[#FFD700]/60 transition-colors shadow-lg">
               <button 
                onClick={() => musicInputRef.current?.click()}
                className="text-[#FFD700] hover:scale-110 transition-transform text-lg"
                title="Change Music"
               >
                   🎵
               </button>
               <div className="w-[1px] h-4 bg-[#FFD700]/20 mx-1"></div>
               <button 
                onClick={onTogglePlay}
                className="text-[#FBF5B7] text-[10px] md:text-xs font-bold uppercase tracking-wider hover:text-white min-w-[35px]"
               >
                   {isPlaying ? 'STOP' : 'PLAY'}
               </button>
           </div>
        </div>

        {/* Photo Upload */}
        <div className="group relative">
           <input 
             type="file" 
             multiple 
             accept="image/*" 
             className="hidden" 
             ref={fileInputRef}
             onChange={onUploadPhotos}
           />
           <button 
             onClick={() => fileInputRef.current?.click()}
             className="flex items-center gap-2 md:gap-3 bg-gradient-to-r from-[#D42426] to-[#800000] text-white px-4 py-2 md:px-6 md:py-3 rounded-full shadow-[0_0_25px_rgba(212,36,38,0.4)] hover:scale-105 transition-all duration-300 border border-white/10"
           >
             <span className="text-lg md:text-xl">📷</span>
             <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest whitespace-nowrap">Add Memory</span>
             {photoCount > 0 && (
                <span className="bg-white text-[#D42426] text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                    {photoCount}
                </span>
             )}
           </button>
        </div>

      </div>

    </div>
  );
};

export default UI;