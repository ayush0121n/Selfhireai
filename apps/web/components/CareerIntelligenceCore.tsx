"use client";

import React, { useEffect, useRef } from "react";

interface NodePoint {
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
  label?: string;
  glow: number;
}

export default function CareerIntelligenceCore() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angleY = 0.005;
    let angleX = 0.003;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 90;

    // Generate 3D spherical nodes representing live career connections
    const nodes: NodePoint[] = [];
    const colors = ["#B34A0E", "#E67E22", "#FAD7A0", "#6E250A"];
    const labels = ["Greenhouse", "Razorpay", "Postman", "Stripe", "Workday", "Lever", "Supabase", "Ashby", "Linear"];

    const count = 38;
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(-1 + (2 * i) / count);
      const theta = Math.sqrt(count * Math.PI) * phi;
      nodes.push({
        x: radius * Math.cos(theta) * Math.sin(phi),
        y: radius * Math.sin(theta) * Math.sin(phi),
        z: radius * Math.cos(phi),
        radius: Math.random() * 2.5 + 2,
        color: colors[i % colors.length],
        label: i < labels.length ? labels[i] : undefined,
        glow: Math.random() * 0.5 + 0.5
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Rotate nodes around Y and X axis
      nodes.forEach((node) => {
        // Rotate Y
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = node.x * cosY - node.z * sinY;
        const z1 = node.z * cosY + node.x * sinY;

        // Rotate X
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y1 = node.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.y * sinX;

        node.x = x1;
        node.y = y1;
        node.z = z2;

        // 3D Perspective projection
        const fov = 240;
        const scale = fov / (fov + node.z);
        const projX = centerX + node.x * scale;
        const projY = centerY + node.y * scale;

        // Draw connecting lines to nearby nodes
        nodes.forEach((other) => {
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dz = node.z - other.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 55) {
            ctx.beginPath();
            ctx.moveTo(projX, projY);
            const otherScale = fov / (fov + other.z);
            ctx.lineTo(centerX + other.x * otherScale, centerY + other.y * otherScale);
            ctx.strokeStyle = "rgba(179, 74, 14, 0.12)";
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        });

        // Draw node circle with optical glow
        ctx.beginPath();
        ctx.arc(projX, projY, Math.max(1, node.radius * scale), 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.shadowColor = node.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw text label on key hub nodes
        if (node.label && node.z > 20) {
          ctx.font = "9px 'MaisonSalome', Georgia, serif";
          ctx.fillStyle = "rgba(45, 14, 3, 0.8)";
          ctx.fillText(node.label, projX + 6, projY + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center">
      <canvas
        ref={canvasRef}
        width={320}
        height={220}
        className="w-[320px] h-[220px]"
      />
      <div className="absolute bottom-1 right-2 text-[10px] font-semibold text-text-primary/50 tracking-wider uppercase">
        Live Market Neural Core
      </div>
    </div>
  );
}
