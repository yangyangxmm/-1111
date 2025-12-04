
import * as THREE from 'three';
import { ShapeType } from '../types';

export const generateParticles = (shape: ShapeType, count: number): Float32Array => {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, z = 0;
    const idx = i * 3;
    const ratio = i / count;

    switch (shape) {
      case ShapeType.TREE:
        // Cone Spiral - Fuller base
        const angle = ratio * Math.PI * 50; 
        const radius = (1 - ratio) * 9; 
        const height = (ratio - 0.5) * 16; 
        
        x = Math.cos(angle) * radius;
        y = height;
        z = Math.sin(angle) * radius;
        
        // Add noise
        x += (Math.random() - 0.5) * 2.0;
        y += (Math.random() - 0.5) * 1.5;
        z += (Math.random() - 0.5) * 2.0;
        break;

      case ShapeType.SPHERE:
        // Saturn Sphere - Volume
        const r = 7 * Math.cbrt(Math.random()); // Uniform volume
        const u = Math.random();
        const v = Math.random();
        const thetaS = 2 * Math.PI * u;
        const phiS = Math.acos(2 * v - 1);
        x = r * Math.sin(phiS) * Math.cos(thetaS);
        y = r * Math.sin(phiS) * Math.sin(thetaS);
        z = r * Math.cos(phiS);
        break;

      default:
        // Scattered (Galaxy backup)
        x = (Math.random() - 0.5) * 40;
        y = (Math.random() - 0.5) * 40;
        z = (Math.random() - 0.5) * 40;
        break;
    }

    positions[idx] = x;
    positions[idx + 1] = y;
    positions[idx + 2] = z;
  }

  return positions;
};

export const generateParticleSizes = (count: number): Float32Array => {
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
        sizes[i] = 0.5 + Math.random(); 
    }
    return sizes;
}

export const generateOrnaments = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const ratio = i / count;
        const angle = ratio * Math.PI * 25 + (Math.random() * 0.5); 
        const radius = (1 - ratio) * 8.0 + 0.2; 
        const height = (ratio - 0.5) * 15; 
        positions[idx] = Math.cos(angle) * radius;
        positions[idx+1] = height;
        positions[idx+2] = Math.sin(angle) * radius;
    }
    return positions;
}

export const generateGifts = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const idx = i * 3;
        const ratio = Math.random() * 0.6; 
        const angle = Math.random() * Math.PI * 2;
        const radius = (1 - ratio) * 9.0; 
        const height = (ratio - 0.5) * 16;
        positions[idx] = Math.cos(angle) * radius;
        positions[idx+1] = height;
        positions[idx+2] = Math.sin(angle) * radius;
    }
    return positions;
}

export const generateGiftTypes = (count: number): number[] => {
    const types = [];
    for(let i=0; i<count; i++) {
        types.push(i % 2); 
    }
    return types;
}

export const generateRandomCloud = (count: number, spread: number = 25): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i*3] = (Math.random() - 0.5) * spread;
        positions[i*3+1] = (Math.random() - 0.5) * spread;
        positions[i*3+2] = (Math.random() - 0.5) * spread;
    }
    return positions;
}

export const generateSaturnRing = (count: number, radius: number = 14): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r = radius + (Math.random() - 0.5) * 3; 
        positions[i*3] = Math.cos(angle) * r;
        positions[i*3+1] = (Math.random() - 0.5) * 0.5; // Very flat
        positions[i*3+2] = Math.sin(angle) * r;
    }
    return positions;
}

export const generateWallGrid = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    // Aspect ratio 1.5 roughly
    const cols = Math.ceil(Math.sqrt(count * 1.5)); 
    
    for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Centered grid spacing
        const x = (col - cols/2) * 2.8; 
        const y = (row - (count/cols)/2) * 3.5;
        const z = 0; 

        positions[i*3] = x + (Math.random() - 0.5) * 0.2; 
        positions[i*3+1] = y + (Math.random() - 0.5) * 0.2;
        positions[i*3+2] = z;
    }
    return positions;
}

export const generateHeartWall = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
         // Parametric heart curve distribution
         const angle = (i / count) * Math.PI * 2 * 10 + (Math.random()*0.5); 
         // Vary scale to fill the heart
         const scale = Math.sqrt(Math.random()) * 0.8 + 0.2;
         
         const x = 16 * Math.pow(Math.sin(angle), 3);
         const y = 13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2 * Math.cos(3*angle) - Math.cos(4*angle);
         
         const spread = 0.35; // Size factor
         
         positions[i*3] = x * scale * spread;
         positions[i*3+1] = (y * scale * spread) + 3; // Shift up 
         positions[i*3+2] = (Math.random()-0.5) * 2; // Depth
    }
    return positions;
}

// --- NEW GENERATORS ---

export const generateSphereSurface = (count: number, radius: number = 7): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        // Fibonacci Sphere (Uniform distribution on surface)
        const offset = 2 / count;
        const increment = Math.PI * (3 - Math.sqrt(5));
        
        const y = ((i * offset) - 1) + (offset / 2);
        const r = Math.sqrt(1 - Math.pow(y, 2));
        const phi = ((i + 1) % count) * increment;
        
        const x = Math.cos(phi) * r;
        const z = Math.sin(phi) * r;
        
        // Add minimal noise
        const n = 0.2;
        positions[i*3] = (x * radius) + (Math.random()-0.5)*n;
        positions[i*3+1] = (y * radius) + (Math.random()-0.5)*n;
        positions[i*3+2] = (z * radius) + (Math.random()-0.5)*n;
    }
    return positions;
}

export const generateHeartShape3D = (count: number, scale: number = 0.5): Float32Array => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
         let x, y, z;
         // Rejection sampling for 3D Heart Volume
         // (x^2 + 9/4y^2 + z^2 - 1)^3 - x^2z^3 - 9/80y^2z^3 < 0
         let safe = 0;
         do {
             x = (Math.random() * 3 - 1.5);
             y = (Math.random() * 3 - 1.5);
             z = (Math.random() * 3 - 1.5);
             
             const a = x*x + (9/4)*y*y + z*z - 1;
             if (a*a*a - x*x*z*z*z - (9/80)*y*y*z*z*z <= 0) break;
             safe++;
         } while(safe < 50);

         // Scale up
         const s = 7;
         positions[i*3] = x * s;
         positions[i*3+1] = y * s + 2; // Shift up slightly
         positions[i*3+2] = z * s;
    }
    return positions;
}

export const generateHorizontalRow = (count: number): Float32Array => {
    const positions = new Float32Array(count * 3);
    const spacing = 3.5; // Width of a photo + gap
    const totalWidth = count * spacing;
    
    for (let i = 0; i < count; i++) {
        positions[i*3] = (i * spacing); // X
        positions[i*3+1] = -7; // Y (Below the heart)
        positions[i*3+2] = 0; // Z
    }
    return positions;
}
