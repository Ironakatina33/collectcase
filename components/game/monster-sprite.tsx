"use client";

import { cn } from "@/lib/utils";
import type { Creature } from "@/lib/game/types";

interface MonsterSpriteProps {
  creature: Creature;
  size?: "sm" | "md" | "lg";
  shiny?: boolean;
  className?: string;
}

const SIZE_PX = {
  sm: 72,
  md: 112,
  lg: 144
} as const;

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function seeded(seed: number, n: number, min: number, max: number) {
  const x = Math.sin(seed * 0.17 + n * 13.37) * 10000;
  const t = x - Math.floor(x);
  return min + (max - min) * t;
}

function spriteShape(seed: number, points: number) {
  const cx = 50;
  const cy = 52;
  const pts: string[] = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (Math.PI * 2 * i) / points;
    const radius = seeded(seed, i, 18, 31);
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius * seeded(seed, i + 50, 0.75, 1.25);
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

export function MonsterSprite({ creature, size = "md", shiny = false, className }: MonsterSpriteProps) {
  const px = SIZE_PX[size];
  const seed = hashSeed(`${creature.id}-${creature.rarity}-${creature.element}`);
  const points = 6 + (seed % 5);

  const eyeY = seeded(seed, 1, 44, 52);
  const eyeGap = seeded(seed, 2, 7, 12);
  const hornLeft = seeded(seed, 3, 18, 30);
  const hornRight = seeded(seed, 4, 70, 82);
  const hornTop = seeded(seed, 5, 10, 24);

  const bodyA = creature.palette[0];
  const bodyB = creature.palette[1];

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: px, height: px }}
    >
      <div
        className="absolute inset-0 rounded-full blur-xl opacity-55"
        style={{ background: `radial-gradient(circle, ${bodyB}88, transparent 70%)` }}
      />

      <svg viewBox="0 0 100 100" className="relative h-full w-full drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id={`body-${creature.id}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor={bodyA} />
            <stop offset="100%" stopColor={bodyB} />
          </linearGradient>
          <radialGradient id={`shine-${creature.id}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        <path d={`M${hornLeft},28 L27,${hornTop.toFixed(2)} L36,32 Z`} fill={bodyA} opacity="0.85" />
        <path d={`M${hornRight},28 L73,${(hornTop + 1.5).toFixed(2)} L63,32 Z`} fill={bodyB} opacity="0.85" />

        <polygon
          points={spriteShape(seed, points)}
          fill={`url(#body-${creature.id})`}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.2"
        />

        <ellipse cx="50" cy="56" rx="16" ry="11" fill="url(#shine-${creature.id})" opacity="0.7" />

        <ellipse cx={50 - eyeGap} cy={eyeY} rx="4.3" ry="5.2" fill="rgba(11,13,20,0.82)" />
        <ellipse cx={50 + eyeGap} cy={eyeY} rx="4.3" ry="5.2" fill="rgba(11,13,20,0.82)" />
        <circle cx={50 - eyeGap - 1} cy={eyeY - 1.2} r="1.2" fill="rgba(255,255,255,0.95)" />
        <circle cx={50 + eyeGap - 1} cy={eyeY - 1.2} r="1.2" fill="rgba(255,255,255,0.95)" />

        <path d="M42,63 Q50,69 58,63" stroke="rgba(15,17,24,0.7)" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>

      <span className="absolute bottom-0 right-0 text-lg drop-shadow-sm">{creature.emoji}</span>

      {shiny && (
        <>
          <span className="absolute -top-1 -left-1 text-xs animate-pulse">✦</span>
          <span className="absolute top-2 right-0 text-xs animate-pulse">✧</span>
          <span className="absolute -bottom-1 left-1 text-xs animate-pulse">✦</span>
        </>
      )}
    </div>
  );
}
