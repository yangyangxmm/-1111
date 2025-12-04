
import React, { useEffect, useRef, useState } from 'react';
import { Hands } from '@mediapipe/hands';
import type { Results } from '@mediapipe/hands';
import { Camera } from '@mediapipe/camera_utils';
import { HandData } from '../types';

interface HandTrackerProps {
  onHandUpdate: (data: HandData) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onHandUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [fingertips, setFingertips] = useState<{x: number, y: number}[]>([]);

  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults((results: Results) => {
      setLoading(false);
      if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        
        const wrist = landmarks[0];
        const thumbTip = landmarks[4];
        const indexTip = landmarks[8];
        const middleTip = landmarks[12];
        const ringTip = landmarks[16];
        const pinkyTip = landmarks[20];

        // 1. Detect Pinch (Thumb to Index distance)
        const pinchDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
        
        // 2. Check Extension of other fingers (Distance from wrist)
        const midDist = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
        const ringDist = Math.hypot(ringTip.x - wrist.x, ringTip.y - wrist.y);
        const pinkyDist = Math.hypot(pinkyTip.x - wrist.x, pinkyTip.y - wrist.y);
        
        // Normalized thresholds (approximate)
        // If dist > 0.25, typically extended. If < 0.15, typically curled.
        const othersExtended = midDist > 0.2 && ringDist > 0.2 && pinkyDist > 0.2;
        
        // 3. Detect Open vs Closed (Average distance of tips to wrist)
        const tips = [indexTip, middleTip, ringTip, pinkyTip];
        let totalDistToWrist = 0;
        tips.forEach(tip => {
          totalDistToWrist += Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
        });
        const avgDist = totalDistToWrist / 4;

        let gesture: HandData['gesture'] = 'NONE';
        
        if (pinchDist < 0.08) {
             if (othersExtended) {
                 gesture = 'OK';
             } else {
                 gesture = 'PINCH';
             }
        } else if (avgDist < 0.18) {
          gesture = 'CLOSED'; // Fist
        } else if (avgDist > 0.25) {
          gesture = 'OPEN'; // Spread
        }

        // Store tips for visualization (Mirror X)
        setFingertips([
            { x: (1 - thumbTip.x) * 100, y: thumbTip.y * 100 },
            { x: (1 - indexTip.x) * 100, y: indexTip.y * 100 },
            { x: (1 - middleTip.x) * 100, y: middleTip.y * 100 },
            { x: (1 - ringTip.x) * 100, y: ringTip.y * 100 },
            { x: (1 - pinkyTip.x) * 100, y: pinkyTip.y * 100 },
        ]);

        onHandUpdate({
          present: true,
          gesture,
          x: 1 - indexTip.x, // Primary cursor is Index
          y: indexTip.y,
          pinchDistance: pinchDist,
          fingertips: [
            { x: 1 - thumbTip.x, y: thumbTip.y },
            { x: 1 - indexTip.x, y: indexTip.y },
            { x: 1 - middleTip.x, y: middleTip.y },
            { x: 1 - ringTip.x, y: ringTip.y },
            { x: 1 - pinkyTip.x, y: pinkyTip.y },
          ]
        });

      } else {
        setFingertips([]);
        onHandUpdate({
          present: false,
          gesture: 'NONE',
          x: 0.5,
          y: 0.5,
          pinchDistance: 1,
        });
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [onHandUpdate]);

  return (
    <div className="fixed top-4 right-4 w-32 h-24 bg-black/50 border border-amber-500/30 rounded-lg overflow-hidden z-[60] shadow-[0_0_10px_rgba(212,175,55,0.3)]">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-[8px] text-amber-200">
          Loading AI...
        </div>
      )}
      <div className="relative w-full h-full">
        <video
            ref={videoRef}
            className="w-full h-full object-cover opacity-60"
            playsInline
            muted
            style={{ transform: 'scaleX(-1)' }}
        />
        {/* 5 Fingertips Visualization (Green) - Increased Size & z-index */}
        {fingertips.map((pos, i) => (
            <div 
                key={i}
                className="absolute w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(0,255,0,1)] animate-pulse z-[70]"
                style={{ 
                    left: `${pos.x}%`, 
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)' 
                }}
            />
        ))}
      </div>
      <div className="absolute top-0 left-0 bg-black/60 px-1 text-[8px] text-white">
        Tracking 5 Points
      </div>
    </div>
  );
};

export default HandTracker;
