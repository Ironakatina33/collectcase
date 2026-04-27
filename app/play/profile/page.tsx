import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatureCard } from "@/components/game/creature-card";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import { RARITY_LABELS } from "@/lib/game/types";
import type { Rarity } from "@/lib/game/types";
import { formatDate, formatNumber } from "@/lib/utils";
import { Trophy, Coins, Sparkles, Layers, Swords, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: cards }, { data: battles }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("user_creatures").select("creature_id, rarity, level, shiny").eq("user_id", user.id),
    supabase.from("battles").select("winner, created_at, mode").eq("p1_id", user.id).order("created_at", { ascending: false }).limit(20)
  ]);

  if (!profile) return null;

  // Best creature: highest level, then rarity weight
  const RARITY_VAL: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
  const best = (cards ?? []).slice().sort((a, b) => b.level * 10 + RARITY_VAL[b.rarity] - (a.level * 10 + RARITY_VAL[a.rarity]))[0];
  const bestBase = best ? CREATURES_BY_ID[best.creature_id] : null;

  // Rarity counts
  const counts: Record<Rarity, number> = { common: 0, rare: 0, epic: 0, legendary: 0, mythic: 0 };
  for (const c of cards ?? []) counts[c.rarity as Rarity]++;
  const total = (cards ?? []).length;
  const unique = new Set((cards ?? []).map((c) => c.creature_id)).size;

  const totalBattles = (battles ?? []).length;
  const recentWins = (battles ?? []).filter((b) => b.winner === "p1").length;

  return (
    <main className="container py-6 lg:py-10 space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold gradient-text">{profile.username}</h1>
          <div className="text-sm text-muted-foreground inline-flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" /> Membre depuis {formatDate(profile.created_at)}
          </div>
        </div>
        <Badge variant="default">Niveau {profile.level}</Badge>
      </header>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-300" /> Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Stat icon={Coins} label="Pièces" value={formatNumber(Number(profile.coins))} c="text-amber-300" />
            <Stat icon={Sparkles} label="Gemmes" value={String(profile.gems)} c="text-cyan-300" />
            <Stat icon={Layers} label="Cartes" value={String(total)} c="text-fuchsia-300" />
            <Stat icon={Trophy} label="Espèces uniques" value={`${unique}/42`} c="text-emerald-300" />
            <Stat icon={Swords} label="Combats" value={`${profile.wins} V · ${profile.losses} D · ${profile.draws} N`} c="text-rose-300" />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Répartition par rareté</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {(Object.keys(counts) as Rarity[]).map((r) => {
              const pct = total === 0 ? 0 : (counts[r] / total) * 100;
              return (
                <div key={r}>
                  <div className="flex justify-between text-xs">
                    <span>{RARITY_LABELS[r]}</span>
                    <span className="text-muted-foreground">{counts[r]} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div className={rarityBg(r)} style={{ width: `${Math.max(2, pct)}%`, height: "100%" }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {bestBase && best && (
          <Card>
            <CardHeader>
              <CardTitle>Champion actuel</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <CreatureCard creature={bestBase} level={best.level} shiny={best.shiny} size="md" />
              <div className="text-sm">
                <div className="font-display text-xl font-bold">{bestBase.name}</div>
                <div className="text-muted-foreground">{RARITY_LABELS[best.rarity as Rarity]} · Niv. {best.level}</div>
                <div className="mt-1 text-xs text-muted-foreground italic">{bestBase.flavor}</div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>20 derniers combats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {totalBattles === 0 ? (
                <p className="text-muted-foreground">Aucun combat encore.</p>
              ) : (
                <>
                  <p className="mb-2">{recentWins} victoire(s) sur {totalBattles}.</p>
                  <div className="flex gap-1">
                    {(battles ?? []).map((b, i) => (
                      <div
                        key={i}
                        className={`h-6 w-6 rounded ${
                          b.winner === "p1" ? "bg-emerald-500" :
                          b.winner === "draw" ? "bg-amber-500" : "bg-rose-500"
                        }`}
                        title={`${b.mode.toUpperCase()} · ${formatDate(b.created_at)}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Stat({ icon: Icon, label, value, c }: { icon: React.ElementType; label: string; value: string; c: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`inline-flex items-center gap-2 ${c}`}>
        <Icon className="h-4 w-4" /> {label}
      </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function rarityBg(r: Rarity) {
  return ({
    common: "bg-zinc-400",
    rare: "bg-blue-400",
    epic: "bg-purple-400",
    legendary: "bg-amber-400",
    mythic: "bg-pink-400"
  } as const)[r];
}
