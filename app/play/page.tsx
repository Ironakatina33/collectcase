import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreatureCard } from "@/components/game/creature-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Box, Swords, ShoppingCart, Coins, ArrowLeftRight, Trophy, Gift, Sparkles } from "lucide-react";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import { CASES } from "@/lib/game/cases";
import { CaseBox } from "@/components/game/case-box";
import { DailyRewardCard } from "./_components/daily-reward";
import type { Rarity } from "@/lib/game/types";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: latestUC }, { count: collectionCount }, { data: ucForUnique }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("user_creatures")
      .select("id, creature_id, level, rarity, shiny, obtained_at")
      .eq("user_id", user.id)
      .order("obtained_at", { ascending: false })
      .limit(8),
    supabase.from("user_creatures").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_creatures").select("creature_id").eq("user_id", user.id)
  ]);

  const uniqueIds = new Set((ucForUnique ?? []).map((r) => r.creature_id));

  return (
    <main className="container py-6 lg:py-10 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">
            Salut, <span className="gradient-text">{profile?.username}</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Tu as <strong className="text-foreground">{collectionCount ?? 0}</strong> créature(s),
            dont <strong className="text-foreground">{uniqueIds.size}</strong> espèces uniques sur 42.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="success">
            <Trophy className="h-3 w-3 mr-1" /> {profile?.wins ?? 0} V · {profile?.losses ?? 0} D
          </Badge>
          <Badge variant="default">Niveau {profile?.level ?? 1}</Badge>
        </div>
      </header>

      {/* Stats grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Coins} label="Pièces" value={formatNumber(Number(profile?.coins ?? 0))} accent="text-amber-300" />
        <StatCard icon={Sparkles} label="Gemmes" value={String(profile?.gems ?? 0)} accent="text-cyan-300" />
        <StatCard icon={Box} label="Cartes" value={String(collectionCount ?? 0)} accent="text-fuchsia-300" />
        <StatCard icon={Trophy} label="Espèces" value={`${uniqueIds.size}/42`} accent="text-emerald-300" />
      </section>

      {/* Daily reward + quick actions */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DailyRewardCard lastDaily={profile?.last_daily ?? null} streak={0} />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Plonge directement dans le jeu.</CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <QuickAction href="/play/cases" icon={Box} title="Ouvrir un coffre" desc="Tente la chance pour des mythiques." />
            <QuickAction href="/play/combat" icon={Swords} title="Entrer dans l'arène" desc="Combats PvE & PvP avec récompenses." />
            <QuickAction href="/play/market" icon={ShoppingCart} title="Visiter le marché" desc="Achète & vends des créatures." />
            <QuickAction href="/play/trade" icon={ArrowLeftRight} title="Échanger" desc="Propose des trades à d'autres joueurs." />
          </CardContent>
        </Card>
      </section>

      {/* Recent obtained */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <div>
            <h2 className="font-display text-xl font-bold">Dernières obtenues</h2>
            <p className="text-sm text-muted-foreground">Tes 8 dernières captures.</p>
          </div>
          <Link href="/play/collection">
            <Button variant="outline" size="sm">Voir toute ma collection →</Button>
          </Link>
        </div>
        {latestUC && latestUC.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {latestUC.map((uc) => {
              const c = CREATURES_BY_ID[uc.creature_id];
              if (!c) return null;
              return (
                <CreatureCard
                  key={uc.id}
                  creature={c}
                  level={uc.level}
                  shiny={uc.shiny}
                  size="md"
                />
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center space-y-3">
              <Gift className="h-10 w-10 mx-auto text-fuchsia-300" />
              <p className="text-sm text-muted-foreground">
                Tu n'as pas encore de créature. Ouvre un coffre pour commencer !
              </p>
              <Link href="/play/cases">
                <Button variant="gold">Ouvrir mon premier coffre</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Featured cases */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-xl font-bold">Coffres en vedette</h2>
          <Link href="/play/cases">
            <Button variant="outline" size="sm">Tous les coffres →</Button>
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {CASES.map((c) => (
            <Link key={c.id} href={`/play/cases?case=${c.id}`} className="shrink-0 text-center space-y-1">
              <CaseBox case={c} size="md" />
              <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                <Coins className="h-3 w-3 text-amber-300" /> {formatNumber(c.priceCoins)}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg bg-white/[0.04] grid place-items-center ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-lg font-bold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickAction({ href, icon: Icon, title, desc }: { href: string; icon: React.ElementType; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-fuchsia-400/30 transition-all p-4 group"
    >
      <Icon className="h-6 w-6 text-fuchsia-300 mb-2 group-hover:scale-110 transition-transform" />
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
