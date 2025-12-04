
import React, { useState, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Scene from './components/Scene';
import UI from './components/UI';
import HandTracker from './components/HandTracker';
import { ShapeType, HandData, VisualMode } from './types';

const App: React.FC = () => {
  const [currentShape, setShape] = useState<ShapeType>(ShapeType.TREE);
  const [currentColor, setColor] = useState<string>('#0F4225'); // Deep Forest Green base
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Visual Mode State
  const [visualMode, setVisualMode] = useState<VisualMode>(VisualMode.TREE);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const [handData, setHandData] = useState<HandData>({
    present: false,
    gesture: 'NONE',
    x: 0.5,
    y: 0.5,
    pinchDistance: 1,
  });

  const handleHandUpdate = useCallback((data: HandData) => {
    // We update hand data constantly for smooth rotation in Scene
    setHandData(data);
    
    // Strict Gesture Mapping for Visual Modes
    if (data.present) {
        if (data.gesture === 'CLOSED') {
            // 1. 5 Fingers Closed (Fist) -> Saturn Mode (Sphere)
            setVisualMode(prev => prev !== VisualMode.SATURN ? VisualMode.SATURN : prev);
        } else if (data.gesture === 'OPEN') {
            // 2. 5 Fingers Open -> Tree Mode
            setVisualMode(prev => prev !== VisualMode.TREE ? VisualMode.TREE : prev);
        } else if (data.gesture === 'OK') {
             // 3. OK Gesture -> Heart Mode
             setVisualMode(prev => prev !== VisualMode.HEART ? VisualMode.HEART : prev);
        } else if (data.gesture === 'PINCH') {
            // 4. Pinch (Thumb+Index) -> Galaxy Mode (Drifting background)
            setVisualMode(prev => prev !== VisualMode.GALAXY ? VisualMode.GALAXY : prev);
        }
    }
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newPhotos = files.slice(0, 200).map(file => URL.createObjectURL(file as Blob));
      setPhotos(prev => [...prev, ...newPhotos].slice(0, 200));
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (audioRef.current) {
        audioRef.current.src = url;
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
            playPromise
                .then(() => setIsPlaying(true))
                .catch(err => {
                    console.warn("Auto-play interrupted or failed:", err);
                    setIsPlaying(false);
                });
        }
      }
    }
  }

  const togglePlayback = () => {
      const audio = audioRef.current;
      if(!audio) return;

      if (audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise
                  .then(() => setIsPlaying(true))
                  .catch(err => {
                      console.warn("Playback interrupted or failed:", err);
                      setIsPlaying(false);
                  });
          }
      } else {
          audio.pause();
          setIsPlaying(false);
      }
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      
      {/* Hidden Audio Player */}
      <audio ref={audioRef} loop />

      {/* 3D Scene Background */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#020503] to-[#000000]">
        <Canvas dpr={[1, 1.5]} gl={{ antialias: false, toneMappingExposure: 1.5 }} shadows>
          <Scene 
            shape={currentShape} 
            color={currentColor} 
            handData={handData} 
            photos={photos}
            visualMode={visualMode}
          />
        </Canvas>
      </div>

      {/* Overlay UI */}
      <div className="absolute inset-0 z-10">
        <UI 
          currentShape={currentShape}
          setShape={setShape}
          currentColor={currentColor}
          setColor={setColor}
          handData={handData}
          onUploadPhotos={handlePhotoUpload}
          photoCount={photos.length}
          isScattered={visualMode === VisualMode.GALAXY} // For UI state
          setIsScattered={() => {}}
          onUploadMusic={handleMusicUpload}
          isPlaying={isPlaying}
          onTogglePlay={togglePlayback}
        />
      </div>

      {/* Webcam Logic & Visualization */}
      <HandTracker onHandUpdate={handleHandUpdate} />
      
    </div>
  );
};

export default App;
