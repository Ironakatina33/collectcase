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
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const xpToNext = Math.max(100, level * 100);
  const xpInLevel = xp % xpToNext;
  const xpPct = Math.min(100, (xpInLevel / xpToNext) * 100);

  return (
    <main className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-5 sm:p-7 aurora-strip">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />

        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_0.7fr] items-end">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="success">
                <Trophy className="h-3 w-3 mr-1" /> {profile?.wins ?? 0} V · {profile?.losses ?? 0} D
              </Badge>
              <Badge variant="default">Niveau {level}</Badge>
            </div>

            <div>
              <h1 className="font-display text-3xl md:text-5xl font-bold leading-tight">
                Prêt pour une nouvelle chasse, <span className="gradient-text">{profile?.username}</span> ?
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                Tu possèdes <strong className="text-foreground">{collectionCount ?? 0}</strong> créatures et
                <strong className="text-foreground"> {uniqueIds.size}</strong> espèces uniques. Continue d'ouvrir,
                combattre et échanger pour viser le top classement.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/play/cases">
                <Button size="lg" variant="gold">Ouvrir un coffre</Button>
              </Link>
              <Link href="/play/combat">
                <Button size="lg" variant="default">Entrer dans l'arène</Button>
              </Link>
            </div>
          </div>

          <Card className="glass border-white/15">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progression niveau</span>
                <span className="font-semibold">{xpInLevel} / {xpToNext} XP</span>
              </div>
              <div className="h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-violet-500" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 text-sm">
                <MiniStat label="Pièces" value={formatNumber(Number(profile?.coins ?? 0))} tone="text-amber-300" />
                <MiniStat label="Gemmes" value={String(profile?.gems ?? 0)} tone="text-cyan-300" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

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
        <Card className="lg:col-span-2 glass-panel">
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>Choisis ton prochain objectif de progression.</CardDescription>
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
        <Card className="glass-panel">
          <CardContent className="p-4">
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
              <div className="py-10 text-center space-y-3">
                <Gift className="h-10 w-10 mx-auto text-fuchsia-300" />
                <p className="text-sm text-muted-foreground">
                  Tu n'as pas encore de créature. Ouvre un coffre pour commencer !
                </p>
                <Link href="/play/cases">
                  <Button variant="gold">Ouvrir mon premier coffre</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Featured cases */}
      <section>
        <div className="flex items-end justify-between mb-3">
          <h2 className="font-display text-xl font-bold">Coffres en vedette</h2>
          <Link href="/play/cases">
            <Button variant="outline" size="sm">Tous les coffres →</Button>
          </Link>
        </div>
        <Card className="glass-panel">
          <CardContent className="p-4">
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
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`text-sm font-bold ${tone}`}>{value}</div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: React.ElementType; label: string; value: string; accent: string }) {
  return (
    <Card className="glass-panel hover:border-white/20 transition-colors">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-11 w-11 rounded-xl bg-white/[0.05] grid place-items-center ${accent}`}>
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
      className="rounded-2xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-fuchsia-400/35 transition-all p-4 group"
    >
      <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-200 group-hover:scale-105 transition-transform">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </Link>
  );
}
