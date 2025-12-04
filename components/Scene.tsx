
import React, { useRef, useMemo, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Image, Environment, Float, Sparkles, MeshReflectorMaterial, Stars, Instances, Instance, Line, Text } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import * as THREE from 'three';
import { ShapeType, SceneProps, HandData, VisualMode } from '../types';
import { 
    generateParticles, generateParticleSizes, generateOrnaments, generateGifts, generateGiftTypes, 
    generateRandomCloud, generateSaturnRing, generateWallGrid, generateHeartWall,
    generateSphereSurface, generateHeartShape3D, generateHorizontalRow
} from '../utils/geometry';

// CONSTANTS
const PARTICLE_COUNT = 20000;
const ORNAMENT_COUNT = 200;
const GIFT_COUNT = 60;
const DUMMY = new THREE.Object3D();

// --- COMPONENTS ---

const LuckyStar: React.FC<{ visualMode: VisualMode }> = ({ visualMode }) => {
    const groupRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (!groupRef.current) return;
        groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
        
        // Hide star in Galaxy, but show inside/top of Tree/Saturn/Heart
        // Actually, user wants "Sphere/Heart composed of elements", star might be extraneous inside a ball.
        // Let's keep it visible only for Tree.
        const isTree = visualMode === VisualMode.TREE;
        const targetScale = isTree ? 1.2 : 0;
        
        groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    });

    return (
        <group ref={groupRef} position={[0, 8.8, 0]}>
            <pointLight intensity={5} color="#FFD700" distance={20} decay={2} />
            <mesh>
                <dodecahedronGeometry args={[0.6, 0]} />
                <meshStandardMaterial color="#FFD700" emissive="#FFAA00" emissiveIntensity={3} toneMapped={false} />
            </mesh>
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => {
                const angle = (i / 8) * Math.PI * 2;
                return (
                    <group key={i} rotation={[0, 0, angle]}>
                        <mesh position={[0, 1.2, 0]} scale={[0.3, 2, 0.3]}>
                            <coneGeometry args={[1, 1, 4]} />
                            <meshStandardMaterial color="#FFFFAA" emissive="#FFD700" emissiveIntensity={2} toneMapped={false} />
                        </mesh>
                    </group>
                )
            })}
        </group>
    )
}

// Memoized to prevent re-render unless visualMode changes
const Particles = React.memo(({ shape, color, handData, visualMode }: SceneProps) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Pre-calculate positions for all modes
  const treePositions = useMemo(() => generateParticles(ShapeType.TREE, PARTICLE_COUNT), []);
  const saturnPositions = useMemo(() => generateParticles(ShapeType.SPHERE, PARTICLE_COUNT), []); // Saturn is Sphere
  const galaxyPositions = useMemo(() => generateRandomCloud(PARTICLE_COUNT, 60), []); 
  const heartPositions = useMemo(() => generateHeartShape3D(PARTICLE_COUNT), []); // Use 3D Heart volume for particles

  const sizes = useMemo(() => generateParticleSizes(PARTICLE_COUNT), []);
  const currentPositions = useRef(new Float32Array(PARTICLE_COUNT * 3));
  
  useMemo(() => {
    currentPositions.current.set(treePositions);
  }, []);

  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const rotationY = useRef(0);
  
  const baseColor = useMemo(() => new THREE.Color(), []);
  
  useFrame((state, delta) => {
    if (!meshRef.current || !groupRef.current) return;

    // Rotation logic
    if (visualMode === VisualMode.TREE || visualMode === VisualMode.SATURN || visualMode === VisualMode.HEART) {
        if (handData.present && handData.gesture !== 'NONE') {
            const targetRot = (handData.x - 0.5) * Math.PI * 2; 
            rotationY.current = THREE.MathUtils.lerp(rotationY.current, targetRot, 0.05);
        } else {
            rotationY.current += 0.05 * delta;
        }
        groupRef.current.rotation.y = rotationY.current;
    } else {
        groupRef.current.rotation.y += 0.01 * delta;
    }

    baseColor.set(color);
    if (color === '#0F4225') baseColor.setHex(0x1a6b3c); 

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ix = i * 3;
        
        // Determine target position based on mode
        let tx, ty, tz;
        if (visualMode === VisualMode.TREE) {
             tx = treePositions[ix]; ty = treePositions[ix+1]; tz = treePositions[ix+2];
        } else if (visualMode === VisualMode.SATURN) {
             tx = saturnPositions[ix]; ty = saturnPositions[ix+1]; tz = saturnPositions[ix+2];
        } else if (visualMode === VisualMode.HEART) {
             tx = heartPositions[ix]; ty = heartPositions[ix+1]; tz = heartPositions[ix+2];
        } else {
             // Galaxy
             tx = galaxyPositions[ix]; ty = galaxyPositions[ix+1]; tz = galaxyPositions[ix+2];
        }

        const speed = 0.04; 
        currentPositions.current[ix] = THREE.MathUtils.lerp(currentPositions.current[ix], tx, speed);
        currentPositions.current[ix+1] = THREE.MathUtils.lerp(currentPositions.current[ix+1], ty, speed);
        currentPositions.current[ix+2] = THREE.MathUtils.lerp(currentPositions.current[ix+2], tz, speed);

        DUMMY.position.set(currentPositions.current[ix], currentPositions.current[ix+1], currentPositions.current[ix+2]);
        DUMMY.lookAt(camera.position); 
        
        let s = (Math.sin(state.clock.elapsedTime * 2 + i) * 0.2 + 0.8); 
        if (visualMode === VisualMode.GALAXY) s *= 0.6; // Smaller stars in galaxy
        s *= sizes[i];

        DUMMY.scale.set(s, s, s);
        DUMMY.updateMatrix();
        meshRef.current.setMatrixAt(i, DUMMY.matrix);
        
        // Color variation
        let mixedColor = baseColor.clone();
        if (visualMode === VisualMode.GALAXY) {
             mixedColor.lerp(new THREE.Color('#4400AA'), Math.random() * 0.8);
        } else if (visualMode === VisualMode.SATURN) {
             mixedColor.lerp(new THREE.Color('#FF8800'), Math.random() * 0.3);
        } else if (visualMode === VisualMode.HEART) {
             mixedColor.lerp(new THREE.Color('#FF0055'), Math.random() * 0.8); 
        }
        
        meshRef.current.setColorAt(i, mixedColor); 
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const particleTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255,255,255,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      context.fillStyle = gradient;
      context.fillRect(0, 0, 32, 32);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group ref={groupRef}>
        <instancedMesh ref={meshRef} args={[undefined, undefined, PARTICLE_COUNT]}>
          <planeGeometry args={[0.15, 0.15]} /> 
          <meshBasicMaterial 
            map={particleTexture} 
            transparent 
            opacity={0.8} 
            depthWrite={false} 
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </instancedMesh>
    </group>
  );
});

const DetailedGifts: React.FC<{
    positions: Float32Array,
    types: number[],
    visualMode: VisualMode,
    scatterPositions: Float32Array,
    spherePositions: Float32Array,
    heartPositions: Float32Array
}> = ({ positions, types, visualMode, scatterPositions, spherePositions, heartPositions }) => {
    const group0Indices = useMemo(() => types.map((t, i) => t === 0 ? i : -1).filter(i => i !== -1), [types]);
    const group1Indices = useMemo(() => types.map((t, i) => t === 1 ? i : -1).filter(i => i !== -1), [types]);

    return (
        <group>
            <Instances range={group0Indices.length}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#FFCC00" metalness={0.8} roughness={0.2} />
                {group0Indices.map((idx, i) => (
                    <GiftInstance 
                        key={i} index={idx} 
                        positions={positions} scatterPositions={scatterPositions} spherePositions={spherePositions} heartPositions={heartPositions}
                        visualMode={visualMode} ribbonColor="#D42426" 
                    />
                ))}
            </Instances>
            <Instances range={group1Indices.length}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color="#005500" metalness={0.8} roughness={0.2} />
                {group1Indices.map((idx, i) => (
                    <GiftInstance 
                        key={i} index={idx} 
                        positions={positions} scatterPositions={scatterPositions} spherePositions={spherePositions} heartPositions={heartPositions}
                        visualMode={visualMode} ribbonColor="#FFD700" 
                    />
                ))}
            </Instances>
        </group>
    )
}

const GiftInstance: React.FC<any> = ({ index, positions, scatterPositions, spherePositions, heartPositions, visualMode, ribbonColor }) => {
    const ref = useRef<THREE.Group>(null);
    useFrame(() => {
        if (!ref.current) return;
        const ix = index * 3;
        
        let tx, ty, tz, scale;
        
        if (visualMode === VisualMode.TREE) {
            tx = positions[ix]; ty = positions[ix+1]; tz = positions[ix+2];
            scale = 0.6;
        } else if (visualMode === VisualMode.SATURN) {
            tx = spherePositions[ix]; ty = spherePositions[ix+1]; tz = spherePositions[ix+2];
            scale = 0.5; // Slightly smaller for dense ball
        } else if (visualMode === VisualMode.HEART) {
            tx = heartPositions[ix]; ty = heartPositions[ix+1]; tz = heartPositions[ix+2];
            scale = 0.5;
        } else {
            // Hide gifts in Galaxy
            tx = scatterPositions[ix]; ty = scatterPositions[ix+1]; tz = scatterPositions[ix+2];
            scale = 0; 
        }
        
        ref.current.position.lerp(new THREE.Vector3(tx, ty, tz), 0.05);
        ref.current.rotation.y += 0.01;
        ref.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    });

    return (
        <group ref={ref}>
            <Instance />
            <mesh scale={[1.02, 0.2, 1.02]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={ribbonColor} />
            </mesh>
            <mesh scale={[0.2, 1.02, 1.02]}>
                 <boxGeometry args={[1, 1, 1]} />
                 <meshStandardMaterial color={ribbonColor} />
            </mesh>
        </group>
    )
}

// Memoize Ornaments to prevent updates from unrelated prop changes
const Ornaments = React.memo(({ visualMode }: SceneProps) => {
  const baubleRef = useRef<THREE.InstancedMesh>(null);
  
  // -- POSITIONS --
  const baubleTreePos = useMemo(() => generateOrnaments(ORNAMENT_COUNT), []);
  const baubleScatterPos = useMemo(() => generateRandomCloud(ORNAMENT_COUNT, 20), []);
  const baubleSpherePos = useMemo(() => generateSphereSurface(ORNAMENT_COUNT, 7), []); // Radius 7 for ornaments
  const baubleHeartPos = useMemo(() => generateHeartShape3D(ORNAMENT_COUNT), []);
  
  const currentBaubles = useRef(new Float32Array(ORNAMENT_COUNT * 3));
  useMemo(() => { currentBaubles.current.set(baubleTreePos); }, []);

  const groupRef = useRef<THREE.Group>(null);
  const gold = useMemo(() => new THREE.Color('#FFD700'), []); 
  const santaRed = useMemo(() => new THREE.Color('#FF0000'), []); 

  // -- GIFTS --
  const giftTreePos = useMemo(() => generateGifts(GIFT_COUNT), []);
  const giftScatterPos = useMemo(() => generateRandomCloud(GIFT_COUNT, 20), []);
  const giftSpherePos = useMemo(() => generateSphereSurface(GIFT_COUNT, 7.5), []); // Slightly larger radius for gifts
  const giftHeartPos = useMemo(() => generateHeartShape3D(GIFT_COUNT), []);

  const giftTypes = useMemo(() => generateGiftTypes(GIFT_COUNT), []);

  useFrame((state, delta) => {
    if (!baubleRef.current || !groupRef.current) return;
    
    // Rotate same as particles
    if (visualMode === VisualMode.TREE || visualMode === VisualMode.SATURN || visualMode === VisualMode.HEART) {
         groupRef.current.rotation.y += 0.05 * delta;
    } else {
         groupRef.current.rotation.y += 0.01 * delta;
    }

    for (let i = 0; i < ORNAMENT_COUNT; i++) {
        const ix = i * 3;
        let tx, ty, tz, scale;
        
        if (visualMode === VisualMode.TREE) {
            tx = baubleTreePos[ix]; ty = baubleTreePos[ix+1]; tz = baubleTreePos[ix+2];
            scale = 0.45;
        } else if (visualMode === VisualMode.SATURN) {
            tx = baubleSpherePos[ix]; ty = baubleSpherePos[ix+1]; tz = baubleSpherePos[ix+2];
            scale = 0.45;
        } else if (visualMode === VisualMode.HEART) {
            tx = baubleHeartPos[ix]; ty = baubleHeartPos[ix+1]; tz = baubleHeartPos[ix+2];
            scale = 0.45;
        } else {
            // Hide ornaments in Galaxy
            tx = baubleScatterPos[ix]; ty = baubleScatterPos[ix+1]; tz = baubleScatterPos[ix+2];
            scale = 0; 
        }

        currentBaubles.current[ix] = THREE.MathUtils.lerp(currentBaubles.current[ix], tx, 0.05);
        currentBaubles.current[ix+1] = THREE.MathUtils.lerp(currentBaubles.current[ix+1], ty, 0.05);
        currentBaubles.current[ix+2] = THREE.MathUtils.lerp(currentBaubles.current[ix+2], tz, 0.05);

        DUMMY.position.set(currentBaubles.current[ix], currentBaubles.current[ix+1], currentBaubles.current[ix+2]);
        DUMMY.scale.setScalar(scale);
        DUMMY.updateMatrix();
        baubleRef.current.setMatrixAt(i, DUMMY.matrix);
        
        const colorIdx = i % 2;
        baubleRef.current.setColorAt(i, colorIdx === 0 ? gold : santaRed);
    }
    baubleRef.current.instanceMatrix.needsUpdate = true;
    if (baubleRef.current.instanceColor) baubleRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={groupRef}>
       <instancedMesh ref={baubleRef} args={[undefined, undefined, ORNAMENT_COUNT]} castShadow receiveShadow>
          <sphereGeometry args={[1, 16, 16]} />
          <meshPhysicalMaterial metalness={0.9} roughness={0.1} envMapIntensity={2} emissive="#550000" emissiveIntensity={0.2} />
       </instancedMesh>
       
       <DetailedGifts 
         positions={giftTreePos} 
         scatterPositions={giftScatterPos} 
         spherePositions={giftSpherePos}
         heartPositions={giftHeartPos}
         types={giftTypes} 
         visualMode={visualMode}
       />

       <LuckyStar visualMode={visualMode} />
    </group>
  );
});

// CRITICAL: Memoize PhotoCloud so it does not re-render every frame when handData changes!
const PhotoCloud = React.memo(({ photos, visualMode }: { photos: string[], visualMode: VisualMode }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // 1. Spiral for Tree
  const treeSpiralPos = useMemo(() => {
     if (!photos || !photos.length) return [];
     const pts = [];
     for(let i=0; i<photos.length; i++) {
        const t = i / Math.max(photos.length, 1);
        const spiralAngle = t * Math.PI * 12; // More turns
        const spiralRadius = (1 - t) * 7 + 4; 
        const spiralY = (t - 0.5) * 16;
        pts.push(new THREE.Vector3(Math.cos(spiralAngle) * spiralRadius, spiralY, Math.sin(spiralAngle) * spiralRadius));
     }
     return pts;
  }, [photos]);

  // 2. Horizontal Ring for Saturn
  const saturnRingPos = useMemo(() => generateSaturnRing(Math.max(photos?.length || 0, 1), 16), [photos]);
  
  // 3. Grid for Galaxy
  const galaxyGridPos = useMemo(() => generateWallGrid(Math.max(photos?.length || 0, 1)), [photos]);
  
  // 4. Horizontal Row for Heart Mode (Slideshow)
  const heartRowPos = useMemo(() => generateHorizontalRow(Math.max(photos?.length || 0, 1)), [photos]);

  useFrame((state, delta) => {
      if (!groupRef.current) return;
      
      // ROTATION LOGIC
      if (visualMode === VisualMode.TREE) {
          groupRef.current.rotation.y += 0.05 * delta;
          groupRef.current.position.set(0, 0, 0);
      } else if (visualMode === VisualMode.SATURN) {
          groupRef.current.rotation.y += 0.02 * delta; // Slow ring orbit
          groupRef.current.rotation.x = 0;
          groupRef.current.position.set(0, 0, 0);
      } else if (visualMode === VisualMode.GALAXY) {
          groupRef.current.rotation.set(0, 0, 0);
          const drift = Math.sin(state.clock.elapsedTime * 0.1) * 5;
          groupRef.current.position.x = drift;
      } else if (visualMode === VisualMode.HEART) {
          // HEART SLIDESHOW AUTO-SCROLL
          // Move photos to left continuously like a conveyor belt
          // Spacing is 3.5. Speed it up a bit.
          const totalWidth = (photos.length || 0) * 3.5;
          const speed = 2.0;
          // Loop position
          const x = (state.clock.elapsedTime * speed) % totalWidth;
          groupRef.current.position.set(-x + 5, 0, 0); // Offset to start
          groupRef.current.rotation.set(0, 0, 0);
      }
  });

  if (!photos || photos.length === 0) return null;

  return (
      <group ref={groupRef}>
        {/* Connection String for Tree Only */}
        {visualMode === VisualMode.TREE && treeSpiralPos.length > 0 && (
            <Line points={treeSpiralPos} color="#FFD700" lineWidth={2} transparent opacity={0.6} />
        )}

        {photos.map((url, i) => {
             const sIdx = i*3;
             // Safety checks
             const safeSaturn = saturnRingPos[sIdx] !== undefined ? [saturnRingPos[sIdx], saturnRingPos[sIdx+1], saturnRingPos[sIdx+2]] : [0,0,0];
             const safeGalaxy = galaxyGridPos[sIdx] !== undefined ? [galaxyGridPos[sIdx], galaxyGridPos[sIdx+1], galaxyGridPos[sIdx+2]] : [0,0,0];
             const safeHeart  = heartRowPos[sIdx] !== undefined  ? [heartRowPos[sIdx], heartRowPos[sIdx+1], heartRowPos[sIdx+2]] : [0,0,0];

             return (
                <ImageWrapper 
                    key={i} 
                    url={url} 
                    index={i}
                    visualMode={visualMode}
                    treePos={treeSpiralPos[i] || new THREE.Vector3(0,0,0)}
                    saturnPos={safeSaturn}
                    galaxyPos={safeGalaxy}
                    heartPos={safeHeart}
                />
            )
        })}
      </group>
  );
});

const ImageWrapper: React.FC<any> = ({ url, index, visualMode, treePos, saturnPos, galaxyPos, heartPos }) => {
    const meshRef = useRef<THREE.Group>(null);
    const dateStr = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() - index);
        return d.toISOString().split('T')[0].replace(/-/g, '.');
    }, [index]);

    const popOffset = useMemo(() => Math.random() * 100, []);
    const targetPos = useMemo(() => new THREE.Vector3(), []);

    useFrame((state) => {
        if (!meshRef.current) return;
        
        let scale = 1.0;

        if (visualMode === VisualMode.TREE) {
             targetPos.set(treePos.x, treePos.y, treePos.z);
             scale = 1.5;
        } else if (visualMode === VisualMode.SATURN) {
             targetPos.set(saturnPos[0], saturnPos[1], saturnPos[2]);
             scale = 1.2;
        } else if (visualMode === VisualMode.HEART) {
             // In Heart mode, photos are in a horizontal strip (calculated in geometry.ts as heartPos)
             // NOTE: heartPos passed here is actually the horizontalRowPos from PhotoCloud
             targetPos.set(heartPos[0], heartPos[1], heartPos[2]);
             scale = 1.8;
        } else {
             // Galaxy
             targetPos.set(galaxyPos[0], galaxyPos[1], galaxyPos[2]);
             scale = 1.8;
             const time = state.clock.elapsedTime + popOffset;
             if (Math.sin(time * 0.5) > 0.96) {
                 scale = 3.5;
                 targetPos.z += 2; 
             }
        }
        
        meshRef.current.position.lerp(targetPos, 0.08);
        
        const currentScale = meshRef.current.scale.x;
        const s = THREE.MathUtils.lerp(currentScale, scale, 0.1);
        meshRef.current.scale.set(s, s, s);
        
        meshRef.current.lookAt(0, 0, 50); 
    });

    return (
        <group ref={meshRef}>
            <mesh position={[0, -0.15, -0.01]}>
                <planeGeometry args={[1.1, 1.4]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.6} metalness={0} toneMapped={false} />
            </mesh>
            <Image url={url} transparent side={THREE.DoubleSide} toneMapped={false}>
                 <planeGeometry args={[1, 1]} />
            </Image>
            <Text position={[0, -0.7, 0.02]} fontSize={0.08} color="#222222" anchorX="center" anchorY="middle">
                {dateStr}
            </Text>
        </group>
    )
}

const Scene: React.FC<SceneProps> = (props) => {
  const { size } = useThree();
  const isMobile = size.width < size.height;
  const sceneY = isMobile ? -3 : -2;
  const sceneScale = isMobile ? 0.55 : 0.8;

  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 24]} fov={45} />
      <OrbitControls enableZoom={true} enablePan={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 4} minDistance={10} maxDistance={40} />
      <Environment preset="city" /> 
      
      <ambientLight intensity={0.4} color="#002200" />
      <pointLight position={[0, 5, 0]} intensity={3.0} color="#FFaa00" distance={20} decay={2} />
      <spotLight position={[10, 20, 10]} angle={0.4} intensity={8} color="#FFF5CC" castShadow />
      <spotLight position={[-15, 0, -5]} angle={0.5} intensity={3} color="#FF0000" />

      <group scale={sceneScale} position={[0, sceneY, 0]}>
          <Particles {...props} />
          <Ornaments {...props} />
          <PhotoCloud photos={props.photos} visualMode={props.visualMode} />
          
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -9, 0]}>
            <planeGeometry args={[100, 100]} />
            <MeshReflectorMaterial
                blur={[300, 100]}
                resolution={1024}
                mixBlur={1}
                mixStrength={60}
                roughness={1}
                depthScale={1.2}
                minDepthThreshold={0.4}
                maxDepthThreshold={1.4}
                color="#050505"
                metalness={0.5}
                mirror={0.5}
            />
          </mesh>
      </group>

      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {props.visualMode === VisualMode.GALAXY && (
         <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <Sparkles count={500} scale={40} size={8} speed={0.4} opacity={0.6} color="#88AAFF" />
         </Float>
      )}

      <EffectComposer disableNormalPass>
        <Bloom luminanceThreshold={0.2} mipmapBlur intensity={2.0} radius={0.5} levels={9} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
        <Noise opacity={0.02} />
      </EffectComposer>
    </>
  );
};

export default Scene;
