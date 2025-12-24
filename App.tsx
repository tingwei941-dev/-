
import React, { useState, Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { ChristmasTree } from './components/Tree';
import { UIOverlay } from './components/UIOverlay';
import { PostProcessing } from './components/PostProcessing';
import { processWish } from './services/geminiService';
import { WishResponse } from './types';
import { COLORS } from './constants';

// Falling Snow Component
const FallingSnow = ({ count = 1000 }) => {
  const points = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(count * 3);
    const velocities = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      temp[i * 3] = (Math.random() - 0.5) * 20; // x
      temp[i * 3 + 1] = Math.random() * 20;     // y
      temp[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
      velocities[i] = 0.02 + Math.random() * 0.06;
    }
    return { positions: temp, velocities };
  }, [count]);

  useFrame(() => {
    if (points.current) {
      const positionAttribute = points.current.geometry.getAttribute('position');
      for (let i = 0; i < count; i++) {
        let y = positionAttribute.getY(i);
        y -= particles.velocities[i];
        if (y < -5) y = 15; // Reset to top
        positionAttribute.setY(i, y);
        
        // Add subtle horizontal drift
        let x = positionAttribute.getX(i);
        x += Math.sin(Date.now() * 0.001 + i) * 0.008;
        positionAttribute.setX(i, x);
      }
      positionAttribute.needsUpdate = true;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#ffffff"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const GiftBox = ({ position, scale, color, ribbonColor = COLORS.SILVER_METALLIC }: { position: [number, number, number], scale: number, color: string, ribbonColor?: string }) => (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
    <mesh position={position} scale={scale} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.1} />
      {/* Ribbon Horizontal */}
      <mesh position={[0, 0, 0]} scale={[1.02, 0.08, 1.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={ribbonColor} metalness={1} />
      </mesh>
      {/* Ribbon Vertical */}
      <mesh position={[0, 0, 0]} scale={[0.08, 1.02, 1.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={ribbonColor} metalness={1} />
      </mesh>
    </mesh>
  </Float>
);

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [wishResponse, setWishResponse] = useState<WishResponse | null>(null);

  const handleWishSubmit = async (wish: string) => {
    setIsLoading(true);
    try {
      const response = await processWish(wish);
      setWishResponse(response);
    } catch (error) {
      console.error("Wish failed:", error);
      setWishResponse({
        sentiment: "Chilled",
        glowColor: "#00f2ff",
        message: "Your wish sparkles with arctic brilliance.",
        ornamentType: "crystal"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setWishResponse(null);
  };

  return (
    <div className="relative w-full h-screen bg-[#000810]">
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#000810']} />
        
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 3, 11]} fov={38} />
          
          <ambientLight intensity={0.15} />
          <spotLight 
            position={[15, 20, 15]} 
            angle={0.25} 
            penumbra={1} 
            intensity={5} 
            castShadow 
            color={COLORS.ARCTIC_BLUE}
          />
          <pointLight position={[0, 3.5, 0]} intensity={3} color={wishResponse?.glowColor || COLORS.ICE_GLOW} />
          
          <group position={[0, -2.5, 0]}>
            <ChristmasTree 
              glowColor={wishResponse?.glowColor || COLORS.ICE_GLOW} 
              isCelebrating={!!wishResponse}
            />
            
            {/* Signature Gifts at Base - Blue and Gold Theme */}
            <GiftBox position={[-2.2, 0.2, 1.8]} scale={0.45} color={COLORS.SAPPHIRE_DEEP} />
            <GiftBox position={[2.1, 0.35, 1.5]} scale={0.7} color={COLORS.GOLD_METALLIC} ribbonColor={COLORS.PLATINUM_BRIGHT} />
            <GiftBox position={[1.5, 0.25, 2.5]} scale={0.5} color={COLORS.SILVER_METALLIC} ribbonColor={COLORS.SAPPHIRE_LITE} />
            <GiftBox position={[-1.2, 0.2, 2.8]} scale={0.4} color={COLORS.GOLD_METALLIC} ribbonColor={COLORS.SAPPHIRE_DEEP} />
            <GiftBox position={[0, 0.25, 3.2]} scale={0.5} color={COLORS.SAPPHIRE_LITE} ribbonColor={COLORS.GOLD_METALLIC} />
            <GiftBox position={[-2.5, 0.3, -0.5]} scale={0.6} color={COLORS.GOLD_METALLIC} />

            {/* Crystalline Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
              <planeGeometry args={[100, 100]} />
              <meshStandardMaterial 
                color="#000810" 
                roughness={0.02} 
                metalness={0.95} 
              />
            </mesh>
            
            <ContactShadows opacity={0.7} scale={25} blur={2.5} far={10} color="#000" />
          </group>

          <FallingSnow count={1000} />

          <Environment preset="studio" />
          
          <OrbitControls 
            enablePan={false} 
            minPolarAngle={Math.PI / 4} 
            maxPolarAngle={Math.PI / 1.7}
            minDistance={7}
            maxDistance={18}
            autoRotate={!wishResponse}
            autoRotateSpeed={0.25}
          />

          <PostProcessing />
        </Suspense>
      </Canvas>

      <UIOverlay 
        onWishSubmit={handleWishSubmit} 
        isLoading={isLoading} 
        wishResponse={wishResponse}
        onReset={handleReset}
      />

      {isLoading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 animate-fade-in">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-6" />
            <p className="text-blue-400 font-serif italic tracking-[0.25em] text-xl animate-pulse uppercase">
              Channelling Sapphire Radiance
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
