"use client";

import { cn } from "@/lib/utils";
import type { Creature, Rarity } from "@/lib/game/types";
import { ELEMENT_EMOJI, ELEMENT_LABELS, RARITY_LABELS } from "@/lib/game/types";
import { MonsterSprite } from "@/components/game/monster-sprite";

const RARITY_GLOW: Record<Rarity, string> = {
  common: "glow-common",
  rare: "glow-rare",
  epic: "glow-epic",
  legendary: "glow-legendary",
  mythic: "glow-mythic"
};

const RARITY_BORDER: Record<Rarity, string> = {
  common: "border-zinc-400/40",
  rare: "border-blue-400/60",
  epic: "border-purple-400/70",
  legendary: "border-amber-400/80",
  mythic: "border-pink-400/90"
};

const RARITY_TEXT: Record<Rarity, string> = {
  common: "text-zinc-300",
  rare: "text-blue-300",
  epic: "text-purple-300",
  legendary: "text-amber-300",
  mythic: "text-pink-300"
};

interface Props {
  creature: Creature;
  level?: number;
  shiny?: boolean;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  showStats?: boolean;
  count?: number;
}

export function CreatureCard({
  creature,
  level = 1,
  shiny = false,
  size = "md",
  selected,
  onClick,
  className,
  showStats = true,
  count
}: Props) {
  const sizes = {
    sm: { card: "w-32 h-44", title: "text-xs", chip: "text-[10px]", sprite: "sm" as const },
    md: { card: "w-44 h-60", title: "text-sm", chip: "text-xs", sprite: "md" as const },
    lg: { card: "w-56 h-80", title: "text-base", chip: "text-xs", sprite: "lg" as const }
  }[size];

  const isHolo = creature.rarity === "legendary" || creature.rarity === "mythic";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative shrink-0 rounded-2xl border-2 transition-all duration-250",
        "bg-gradient-to-b from-black/25 via-black/45 to-black/70",
        sizes.card,
        RARITY_BORDER[creature.rarity],
        RARITY_GLOW[creature.rarity],
        onClick && "cursor-pointer hover:-translate-y-1.5 hover:scale-[1.03]",
        selected && "ring-2 ring-fuchsia-400 ring-offset-2 ring-offset-background scale-[1.03]",
        "card-texture",
        className
      )}
      type="button"
    >
      {/* Element gradient backdrop */}
      <div
        className="absolute inset-0 rounded-[10px] opacity-70"
        style={{
          background: `radial-gradient(ellipse at top, ${creature.palette[1]}55, transparent 60%), linear-gradient(180deg, ${creature.palette[0]}33, transparent 70%)`
        }}
      />

      {/* Holographic shimmer for legendary/mythic */}
      {isHolo && (
        <div className="absolute inset-0 rounded-[10px] holo opacity-40 pointer-events-none" />
      )}

      {shiny && (
        <div className="absolute inset-0 rounded-[10px] pointer-events-none animate-pulse-glow"
          style={{ boxShadow: "inset 0 0 30px rgba(255,255,255,0.4)" }}
        />
      )}

      <div className="relative h-full flex flex-col p-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-1">
          <span
            className={cn("rounded-md px-1.5 py-0.5 font-semibold uppercase tracking-wide bg-black/40 backdrop-blur",
              sizes.chip, RARITY_TEXT[creature.rarity])}
          >
            {RARITY_LABELS[creature.rarity]}
          </span>
          <span className={cn("rounded-md px-1.5 py-0.5 bg-black/40 backdrop-blur", sizes.chip)}>
            {ELEMENT_EMOJI[creature.element]} {ELEMENT_LABELS[creature.element]}
          </span>
        </div>

        {/* Creature sprite */}
        <div className="flex-1 flex items-center justify-center">
          <MonsterSprite
            creature={creature}
            size={sizes.sprite}
            shiny={shiny}
            className="transition-transform duration-300 group-hover:scale-110"
          />
        </div>

        {/* Name + level */}
        <div className="text-center">
          <div className={cn("font-display font-bold leading-tight", sizes.title)}>{creature.name}</div>
          <div className="text-[10px] text-muted-foreground">Niv. {level}</div>
        </div>

        {/* Stats footer */}
        {showStats && size !== "sm" && (
          <div className="mt-1 grid grid-cols-4 gap-0.5 text-[10px] font-mono">
            <Stat label="PV" v={creature.hp} />
            <Stat label="ATK" v={creature.atk} />
            <Stat label="DEF" v={creature.def} />
            <Stat label="VIT" v={creature.spd} />
          </div>
        )}

        {/* Count chip (collection duplicates) */}
        {typeof count === "number" && count > 1 && (
          <div className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs font-bold rounded-full h-6 min-w-6 px-1.5 flex items-center justify-center shadow-lg">
            ×{count}
          </div>
        )}
      </div>
    </button>
  );
}

function Stat({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded bg-black/40 px-1 py-0.5 text-center">
      <div className="text-[8px] text-muted-foreground leading-none">{label}</div>
      <div className="font-bold leading-tight">{v}</div>
    </div>
  );
}
