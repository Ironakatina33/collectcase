"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  lastDaily: string | null;
  streak?: number;
}

const REWARD_COINS = 250;
const REWARD_GEMS = 1;

export function DailyRewardCard({ lastDaily }: Props) {
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const lastTs = lastDaily ? new Date(lastDaily).getTime() : 0;
  const cooldownMs = 24 * 3600 * 1000;
  const remaining = Math.max(0, lastTs + cooldownMs - now);
  const ready = remaining === 0;

  const claim = () => {
    startTransition(async () => {
      const r = await fetch("/api/daily", { method: "POST" });
      const j = await r.json();
      if (!r.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success(`+${j.coins} pièces · +${j.gems} gemmes !`);
      window.location.reload();
    });
  };

  return (
    <Card className="overflow-hidden relative glass-panel border-amber-300/20">
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/15 via-transparent to-fuchsia-500/10 pointer-events-none" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-amber-300" /> Récompense quotidienne
        </CardTitle>
        <p className="text-xs text-muted-foreground">Connecte-toi chaque jour pour booster ta progression.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 inline-flex items-center gap-1.5 text-amber-200 font-bold">
            <Coins className="h-4 w-4" /> +{REWARD_COINS}
          </div>
          <div className="rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 inline-flex items-center gap-1.5 text-cyan-200 font-bold">
            <Sparkles className="h-4 w-4" /> +{REWARD_GEMS}
          </div>
        </div>
        {ready ? (
          <Button variant="gold" className="w-full" onClick={claim} disabled={pending}>
            {pending ? "Réclamation…" : "Réclamer maintenant"}
          </Button>
        ) : (
          <Button variant="outline" className="w-full" disabled>
            Disponible dans {formatRemaining(remaining)}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function formatRemaining(ms: number) {
  const s = Math.ceil(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}
