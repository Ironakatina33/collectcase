import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Swords, Layers, Coins } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface Row {
  id: string;
  username: string;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  coins: number;
  unique_creatures: number;
  total_creatures: number;
}

export default async function LeaderboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const meId = user?.id ?? null;

  const [byLevel, byWins, byCollection, byCoins] = await Promise.all([
    supabase.from("leaderboard").select("*").order("level", { ascending: false }).order("xp", { ascending: false }).limit(50),
    supabase.from("leaderboard").select("*").order("wins", { ascending: false }).limit(50),
    supabase.from("leaderboard").select("*").order("unique_creatures", { ascending: false }).order("total_creatures", { ascending: false }).limit(50),
    supabase.from("leaderboard").select("*").order("coins", { ascending: false }).limit(50)
  ]);

  return (
    <main className="container py-6 lg:py-10 space-y-5">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Classement</h1>
        <p className="text-sm text-muted-foreground">Les meilleurs dresseurs de Mythara.</p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        <Board title="Niveau" icon={Trophy} rows={byLevel.data ?? []} meId={meId} value={(r) => `Niv. ${r.level}`} sub={(r) => `${r.xp} XP`} />
        <Board title="Victoires PvP" icon={Swords} rows={byWins.data ?? []} meId={meId} value={(r) => `${r.wins} V`} sub={(r) => `${r.losses} D`} />
        <Board title="Mythadex" icon={Layers} rows={byCollection.data ?? []} meId={meId} value={(r) => `${r.unique_creatures}/42`} sub={(r) => `${r.total_creatures} cartes`} />
        <Board title="Fortune" icon={Coins} rows={byCoins.data ?? []} meId={meId} value={(r) => formatNumber(r.coins)} sub={(r) => "pièces"} />
      </div>
    </main>
  );
}

function Board({
  title,
  icon: Icon,
  rows,
  meId,
  value,
  sub
}: {
  title: string;
  icon: React.ElementType;
  rows: Row[];
  meId: string | null;
  value: (r: Row) => string;
  sub: (r: Row) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-fuchsia-300" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5 max-h-[480px] overflow-y-auto">
          {rows.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Aucune donnée.</div>
          ) : rows.map((r, i) => {
            const me = r.id === meId;
            return (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-2 ${me ? "bg-fuchsia-500/10" : ""}`}>
                <div className={`w-8 text-center font-bold ${i < 3 ? "text-amber-300" : "text-muted-foreground"}`}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{r.username}{me && <Badge variant="default" className="ml-2 text-[10px]">Toi</Badge>}</div>
                  <div className="text-xs text-muted-foreground">{sub(r)}</div>
                </div>
                <div className="font-mono text-sm">{value(r)}</div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
