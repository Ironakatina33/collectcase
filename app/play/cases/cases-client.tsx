"use client";

import { useMemo, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Coins, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CaseBox } from "@/components/game/case-box";
import { CreatureCard } from "@/components/game/creature-card";
import type { CaseDef, Rarity } from "@/lib/game/types";
import { RARITY_LABELS } from "@/lib/game/types";
import { CREATURES, CREATURES_BY_ID } from "@/lib/game/creatures";
import { cn, formatNumber, sleep } from "@/lib/utils";

interface Drop {
  id: string;
  creature_id: string;
  rarity: Rarity;
  level: number;
  shiny: boolean;
}

export function CasesClient({
  cases,
  initialCaseId,
  initialCoins
}: {
  cases: CaseDef[];
  initialCaseId: string;
  initialCoins: number;
}) {
  const [selectedId, setSelectedId] = useState(initialCaseId);
  const [coins, setCoins] = useState(initialCoins);
  const [pending, startTransition] = useTransition();
  const [reel, setReel] = useState<{ pool: typeof CREATURES; winnerIndex: number } | null>(null);
  const [reveal, setReveal] = useState<Drop[] | null>(null);

  const current = cases.find((c) => c.id === selectedId) ?? cases[0];

  const odds = useMemo(() => {
    const total = Object.values(current.rarityWeights).reduce((s, n) => s + n, 0);
    return (Object.entries(current.rarityWeights) as [Rarity, number][])
      .filter(([, w]) => w > 0)
      .map(([r, w]) => ({ rarity: r, pct: (w / total) * 100 }));
  }, [current]);

  async function open(count: 1 | 5) {
    const cost = current.priceCoins * count;
    if (coins < cost) {
      toast.error("Pièces insuffisantes");
      return;
    }

    startTransition(async () => {
      const res = await fetch("/api/cases/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId: current.id, count })
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Erreur");
        return;
      }
      setCoins(json.newBalance);

      const drops: Drop[] = json.drops;

      if (count === 1) {
        // Single open: spinning reel reveal
        const drop = drops[0];
        const pool = buildReelPool(drop.creature_id);
        setReel(pool);
        await sleep(3500); // reel animation duration
        setReel(null);
        setReveal([drop]);
      } else {
        // Multi: flash reveal directly
        setReveal(drops);
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Coffres</h1>
          <p className="text-sm text-muted-foreground">Choisis ton coffre, tente ta chance.</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200 inline-flex items-center gap-1.5">
          <Coins className="h-4 w-4" /> {formatNumber(coins)} pièces
        </div>
      </header>

      {/* Case selector */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {cases.map((c) => (
          <div key={c.id} className="shrink-0 text-center space-y-1">
            <CaseBox case={c} size="sm" selected={selectedId === c.id} onClick={() => setSelectedId(c.id)} />
            <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
              <Coins className="h-3 w-3 text-amber-300" /> {formatNumber(c.priceCoins)}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Detail */}
        <Card className="lg:col-span-2 overflow-hidden relative">
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at top, ${current.palette[1]}66, transparent 50%)`
            }}
          />
          <CardContent className="relative p-6 lg:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="shrink-0">
                <CaseBox case={current} size="lg" />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="font-display text-2xl font-bold">{current.name}</h2>
                  <p className="text-sm text-muted-foreground">{current.description}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    variant="gold"
                    onClick={() => open(1)}
                    disabled={pending || coins < current.priceCoins}
                  >
                    Ouvrir 1× <Coins className="h-4 w-4" /> {formatNumber(current.priceCoins)}
                  </Button>
                  <Button
                    size="lg"
                    variant="default"
                    onClick={() => open(5)}
                    disabled={pending || coins < current.priceCoins * 5}
                  >
                    Ouvrir 5× <Coins className="h-4 w-4" /> {formatNumber(current.priceCoins * 5)}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Odds */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-fuchsia-300" /> Chances de drop</h3>
            <div className="space-y-2">
              {odds.map(({ rarity, pct }) => (
                <div key={rarity} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={cn("font-semibold", rarityTextColor(rarity))}>{RARITY_LABELS[rarity]}</span>
                    <span className="text-muted-foreground">{pct.toFixed(pct < 1 ? 2 : 1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={cn("h-full", rarityBgColor(rarity))} style={{ width: `${Math.max(2, pct)}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground">
              <strong>Pity</strong> : un mythique garanti tous les 50 tirages d'un coffre qui peut en faire tomber.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reel modal */}
      <AnimatePresence>
        {reel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
          >
            <ReelAnimation pool={reel.pool} winnerIndex={reel.winnerIndex} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reveal modal */}
      <AnimatePresence>
        {reveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={() => setReveal(null)}
          >
            <RevealView drops={reveal} onClose={() => setReveal(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function buildReelPool(winnerId: string) {
  // Build a reel of ~40 cards with the winner placed near index ~36
  const items: typeof CREATURES = [];
  for (let i = 0; i < 40; i++) {
    items.push(CREATURES[Math.floor(Math.random() * CREATURES.length)]);
  }
  const winner = CREATURES_BY_ID[winnerId];
  if (winner) items[36] = winner;
  return { pool: items, winnerIndex: 36 };
}

function ReelAnimation({ pool, winnerIndex }: { pool: typeof CREATURES; winnerIndex: number }) {
  const cardWidth = 176 + 12; // w-44 + gap
  const targetX = -(winnerIndex * cardWidth) + (typeof window !== "undefined" ? window.innerWidth / 2 - cardWidth / 2 : 0);
  return (
    <div className="relative w-full max-w-6xl">
      <div className="text-center mb-4 font-display text-xl gradient-text">Ouverture en cours…</div>
      <div className="relative h-72 overflow-hidden border-y-2 border-fuchsia-400/50">
        {/* Center marker */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-fuchsia-400 to-transparent z-10 pointer-events-none" />
        <motion.div
          initial={{ x: 0 }}
          animate={{ x: targetX }}
          transition={{ duration: 3.4, ease: [0.18, 0.67, 0.05, 1] }}
          className="absolute top-4 flex gap-3"
        >
          {pool.map((c, i) => (
            <div key={i} className="shrink-0">
              <CreatureCard creature={c} size="md" showStats={false} />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function RevealView({ drops, onClose }: { drops: Drop[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="relative max-w-5xl w-full"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute -top-12 right-0 text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
      >
        Fermer <X className="h-4 w-4" />
      </button>
      <div className="rounded-2xl border border-white/10 bg-card/80 backdrop-blur p-6">
        <h2 className="font-display text-2xl text-center mb-1 gradient-text">
          {drops.length === 1 ? "Tu as obtenu…" : `Tu as obtenu ${drops.length} créatures !`}
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-6">
          Toutes ajoutées à ta collection.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {drops.map((d, i) => {
            const c = CREATURES_BY_ID[d.creature_id];
            if (!c) return null;
            return (
              <motion.div
                key={d.id}
                initial={{ y: 30, opacity: 0, rotateY: 90 }}
                animate={{ y: 0, opacity: 1, rotateY: 0 }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 200 }}
              >
                <CreatureCard creature={c} level={d.level} shiny={d.shiny} size="lg" />
              </motion.div>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Button variant="default" onClick={onClose}>Continuer</Button>
        </div>
      </div>
    </motion.div>
  );
}

function rarityTextColor(r: Rarity) {
  return ({
    common: "text-zinc-300",
    rare: "text-blue-300",
    epic: "text-purple-300",
    legendary: "text-amber-300",
    mythic: "text-pink-300"
  } as const)[r];
}
function rarityBgColor(r: Rarity) {
  return ({
    common: "bg-zinc-400",
    rare: "bg-blue-400",
    epic: "bg-purple-400",
    legendary: "bg-amber-400",
    mythic: "bg-pink-400"
  } as const)[r];
}
