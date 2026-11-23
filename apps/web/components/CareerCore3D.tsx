"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function ParticleSphere({ color = "#B34A0E" }: { color?: string }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate particle positions on a sphere
  const [positions] = useState(() => {
    const count = 750;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 2.0 + (Math.random() - 0.5) * 0.4;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  });

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.25;
      pointsRef.current.rotation.x += delta * 0.12;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={color}
        sizeAttenuation
        transparent
        opacity={0.85}
      />
    </points>
  );
}

function InnerWireSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y -= delta * 0.15;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.4, 16, 16]} />
      <meshBasicMaterial color="#E67E22" wireframe transparent opacity={0.35} />
    </mesh>
  );
}

export default function CareerCore3D({
  score = 94,
  label = "Career Intelligence Core",
}: {
  score?: number;
  label?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-56 rounded-2xl bg-gradient-to-br from-[#2D0E03] to-[#45190B] flex items-center justify-center text-[#FEF5E7]">
        <div className="text-center space-y-1">
          <div className="text-2xl font-bold font-mono text-amber-400">{score}%</div>
          <div className="text-xs text-[#FEF5E7]/70">{label}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-[#2D0E03] via-[#3D1407] to-[#1F0A02] border border-[#6E250A]/30 shadow-lg flex items-center justify-center">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
      >
        <ambientLight intensity={0.5} />
        <ParticleSphere color="#B34A0E" />
        <InnerWireSphere />
      </Canvas>

      <div className="relative z-10 text-center pointer-events-none space-y-0.5 bg-black/30 backdrop-blur-xs px-4 py-2 rounded-xl border border-white/10">
        <div className="text-xs uppercase font-mono tracking-widest text-[#FEF5E7]/70 font-semibold">
          {label}
        </div>
        <div className="font-display text-3xl font-bold text-amber-400 tracking-tight">
          {score}%
        </div>
        <div className="text-[10px] text-[#FEF5E7]/60 font-mono">
          1,379 Portals & 675 Verified Companies
        </div>
      </div>
    </div>
  );
}
