"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Swords, Trophy, Heart, Zap, Coins, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatureCard } from "@/components/game/creature-card";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import type { BattleEvent, BattleResult } from "@/lib/game/combat";
import type { Creature, Rarity } from "@/lib/game/types";
import { cn, sleep } from "@/lib/utils";
import { levelStats } from "@/lib/game/combat";

interface UC {
  id: string;
  creature_id: string;
  rarity: string;
  level: number;
  shiny: boolean;
  locked: boolean;
}

interface Opponent {
  id: string;
  username: string;
  level: number;
  wins: number;
  total_creatures: number;
}

type Mode = "pve" | "pvp";
type Difficulty = "easy" | "normal" | "hard" | "elite";

const DIFFICULTIES: { id: Difficulty; label: string; sub: string }[] = [
  { id: "easy", label: "Facile", sub: "Niv. 1-5 · 30 pièces" },
  { id: "normal", label: "Normal", sub: "Niv. 6-15 · 75 pièces" },
  { id: "hard", label: "Difficile", sub: "Niv. 16-30 · 180 pièces" },
  { id: "elite", label: "Élite", sub: "Niv. 30-50 · 420 pièces" }
];

export function CombatClient({ cards, opponents }: { cards: UC[]; opponents: Opponent[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("pve");
  const [picked, setPicked] = useState<string | null>(cards[0]?.id ?? null);
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [oppId, setOppId] = useState<string | null>(opponents[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [battle, setBattle] = useState<{
    result: BattleResult;
    foe: { base: Creature; level: number };
    rewards: { coins: number; xp: number; creatureXp?: number };
  } | null>(null);

  const myCard = cards.find((c) => c.id === picked) ?? null;

  function startBattle() {
    if (!myCard) {
      toast.error("Choisis une créature");
      return;
    }
    startTransition(async () => {
      const url = mode === "pve" ? "/api/battle/pve" : "/api/battle/pvp";
      const body =
        mode === "pve"
          ? { userCreatureId: myCard.id, difficulty }
          : { userCreatureId: myCard.id, opponentId: oppId };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      setBattle(j);
    });
  }

  function closeBattle() {
    setBattle(null);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Arène</h1>
        <p className="text-sm text-muted-foreground">Combats stratégiques pour XP, pièces et gloire.</p>
      </header>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border border-white/10 p-1 bg-white/[0.02]">
        <ModeBtn active={mode === "pve"} onClick={() => setMode("pve")}>PvE</ModeBtn>
        <ModeBtn active={mode === "pvp"} onClick={() => setMode("pvp")}>PvP</ModeBtn>
      </div>

      {cards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <Swords className="h-10 w-10 mx-auto text-fuchsia-300" />
            <p className="text-sm text-muted-foreground">Tu n'as pas de créature disponible. Ouvre un coffre d'abord.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Picker */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Ta créature</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {cards.map((c) => {
                  const base = CREATURES_BY_ID[c.creature_id];
                  if (!base) return null;
                  return (
                    <CreatureCard
                      key={c.id}
                      creature={base}
                      level={c.level}
                      shiny={c.shiny}
                      selected={picked === c.id}
                      onClick={() => setPicked(c.id)}
                      size="md"
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{mode === "pve" ? "Adversaire" : "Joueur cible"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mode === "pve" ? (
                <div className="space-y-2">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={cn(
                        "w-full text-left rounded-lg p-3 border transition-all",
                        difficulty === d.id
                          ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                          : "border-white/10 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="font-semibold">{d.label}</div>
                      <div className="text-xs text-muted-foreground">{d.sub}</div>
                    </button>
                  ))}
                </div>
              ) : opponents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun joueur disponible.</p>
              ) : (
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {opponents.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setOppId(o.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg px-3 py-2 border transition-all text-sm",
                        oppId === o.id
                          ? "border-fuchsia-400/50 bg-fuchsia-500/10"
                          : "border-white/10 hover:bg-white/[0.04]"
                      )}
                    >
                      <div>
                        <div className="font-semibold">{o.username}</div>
                        <div className="text-xs text-muted-foreground">Niv. {o.level} · {o.total_creatures} cartes</div>
                      </div>
                      <Badge variant="success">{o.wins} V</Badge>
                    </button>
                  ))}
                </div>
              )}

              <Button
                size="lg"
                variant="gold"
                className="w-full"
                onClick={startBattle}
                disabled={pending || !myCard || (mode === "pvp" && !oppId)}
              >
                {pending ? "Combat en cours…" : "Lancer le combat"}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <AnimatePresence>
        {battle && myCard && (
          <BattleModal battle={battle} myCard={myCard} onClose={closeBattle} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ModeBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
        active ? "bg-fuchsia-500/20 text-foreground border border-fuchsia-400/40" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function BattleModal({
  battle,
  myCard,
  onClose
}: {
  battle: { result: BattleResult; foe: { base: Creature; level: number }; rewards: { coins: number; xp: number; creatureXp?: number } };
  myCard: UC;
  onClose: () => void;
}) {
  const [eventIdx, setEventIdx] = useState(0);
  const [done, setDone] = useState(false);

  const me = CREATURES_BY_ID[myCard.creature_id]!;
  const foe = battle.foe.base;
  const myStats = levelStats(me, myCard.level);
  const foeStats = levelStats(foe, battle.foe.level);

  const events = battle.result.events;
  const currentEvent = events[Math.max(0, Math.min(events.length - 1, eventIdx - 1))];

  // HP at current step
  const myHp = computeHp(events, myStats.hp, "p1", eventIdx);
  const foeHp = computeHp(events, foeStats.hp, "p2", eventIdx);

  useEffect(() => {
    if (eventIdx > events.length) return;
    const t = setTimeout(() => {
      if (eventIdx < events.length) setEventIdx((i) => i + 1);
      else setDone(true);
    }, eventIdx === 0 ? 600 : 800);
    return () => clearTimeout(t);
  }, [eventIdx, events.length]);

  const winner = battle.result.winner;
  const won = winner === "p1";
  const draw = winner === "draw";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative max-w-4xl w-full rounded-2xl border border-white/10 bg-card/85 backdrop-blur p-6 lg:p-8"
      >
        <div className="flex items-center justify-between mb-6">
          <Badge variant="default"><Swords className="h-3 w-3 mr-1" /> Combat</Badge>
          <div className="text-xs text-muted-foreground">Tour {Math.max(1, currentEvent?.turn ?? 1)} / {battle.result.turns}</div>
        </div>

        <div className="grid grid-cols-3 items-center gap-4 mb-6">
          <BattleSide creature={me} level={myCard.level} hpMax={myStats.hp} hp={myHp} side="left" />
          <div className="text-center">
            <Swords className="h-8 w-8 mx-auto text-fuchsia-300 animate-pulse-glow" />
            <div className="text-xs text-muted-foreground mt-1">VS</div>
          </div>
          <BattleSide creature={foe} level={battle.foe.level} hpMax={foeStats.hp} hp={foeHp} side="right" />
        </div>

        {/* Battle log */}
        <Card className="bg-black/30">
          <CardContent className="p-4 max-h-40 overflow-y-auto text-sm space-y-1 font-mono">
            {events.slice(0, eventIdx).map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  e.actor === "p1" ? "text-emerald-300" : "text-rose-300"
                )}
              >
                <ChevronRight className="inline h-3.5 w-3.5" /> {e.message}
              </motion.div>
            ))}
            {!done && eventIdx < events.length && (
              <div className="text-muted-foreground animate-pulse">…</div>
            )}
          </CardContent>
        </Card>

        {/* Result */}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center space-y-3"
          >
            <h3 className={cn("font-display text-3xl font-bold",
              won ? "gradient-text" : draw ? "text-amber-300" : "text-rose-300"
            )}>
              {won ? "🏆 Victoire !" : draw ? "🤝 Match nul" : "💀 Défaite"}
            </h3>
            <div className="flex justify-center gap-3">
              <Reward icon={Coins} v={`+${battle.rewards.coins}`} c="text-amber-300" />
              <Reward icon={Sparkles} v={`+${battle.rewards.xp} XP`} c="text-fuchsia-300" />
              {battle.rewards.creatureXp ? (
                <Reward icon={Zap} v={`+${battle.rewards.creatureXp} carte`} c="text-cyan-300" />
              ) : null}
            </div>
            <Button onClick={onClose} variant="default">Continuer</Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

function BattleSide({
  creature,
  level,
  hp,
  hpMax,
  side
}: {
  creature: Creature;
  level: number;
  hp: number;
  hpMax: number;
  side: "left" | "right";
}) {
  const pct = (hp / hpMax) * 100;
  return (
    <div className={cn("flex flex-col items-center gap-2", side === "right" && "")}>
      <CreatureCard creature={creature} level={level} size="md" showStats={false} />
      <div className="w-full max-w-[180px] space-y-1">
        <div className="flex justify-between text-xs">
          <span className="font-semibold">{creature.name}</span>
          <span className="text-muted-foreground">{Math.max(0, hp)}/{hpMax}</span>
        </div>
        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className={cn(
              "h-full transition-colors",
              pct > 50 ? "bg-emerald-400" : pct > 25 ? "bg-amber-400" : "bg-rose-400"
            )}
            initial={{ width: "100%" }}
            animate={{ width: `${Math.max(0, pct)}%` }}
            transition={{ duration: 0.45 }}
          />
        </div>
      </div>
    </div>
  );
}

function Reward({ icon: Icon, v, c }: { icon: React.ElementType; v: string; c: string }) {
  return (
    <div className={cn("rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 inline-flex items-center gap-1.5 font-semibold", c)}>
      <Icon className="h-4 w-4" /> {v}
    </div>
  );
}

function computeHp(events: BattleEvent[], maxHp: number, side: "p1" | "p2", upToIdx: number): number {
  let hp = maxHp;
  for (let i = 0; i < Math.min(upToIdx, events.length); i++) {
    const e = events[i];
    if (e.actor !== side) {
      // attacker is the other side - this side received damage
      hp = e.defenderHpAfter;
    }
  }
  return hp;
}
