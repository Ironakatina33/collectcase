"use client";

import { cn } from "@/lib/utils";
import type { CaseDef } from "@/lib/game/types";

interface Props {
  case: CaseDef;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CaseBox({ case: c, size = "md", selected, onClick, className }: Props) {
  const sizes = {
    sm: { box: "w-28 h-28", emoji: "text-4xl", title: "text-xs" },
    md: { box: "w-44 h-44", emoji: "text-6xl", title: "text-sm" },
    lg: { box: "w-64 h-64", emoji: "text-8xl", title: "text-base" }
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative rounded-2xl transition-all duration-300",
        "border-2 border-white/10 hover:border-white/30",
        "bg-gradient-to-b from-black/30 to-black/60 overflow-hidden",
        sizes.box,
        onClick && "cursor-pointer hover:-translate-y-1 hover:scale-[1.03]",
        selected && "ring-2 ring-fuchsia-400 scale-105 border-fuchsia-400/60",
        className
      )}
    >
      {/* Animated gradient background */}
      <div
        className="absolute inset-0 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at center, ${c.palette[1]}66, ${c.palette[0]}33 60%, transparent 80%)`
        }}
      />
      {/* Shimmer line */}
      <div className="absolute inset-0 card-shine pointer-events-none" />

      <div className="relative h-full flex flex-col items-center justify-center gap-2">
        <div className={cn(
          "drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)] transition-transform duration-500",
          "group-hover:scale-110 group-hover:rotate-6 animate-float",
          sizes.emoji
        )}>
          {c.emoji}
        </div>
        <div className={cn("font-display font-bold text-center px-2", sizes.title)}>
          {c.name}
        </div>
      </div>
    </button>
  );
}
