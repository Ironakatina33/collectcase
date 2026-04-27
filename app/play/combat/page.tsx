import { createClient } from "@/lib/supabase/server";
import { CombatClient } from "./combat-client";

export const dynamic = "force-dynamic";

export default async function CombatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: cards }, { data: opponents }] = await Promise.all([
    supabase
      .from("user_creatures")
      .select("id, creature_id, rarity, level, shiny, locked")
      .eq("user_id", user.id)
      .eq("locked", false)
      .order("level", { ascending: false })
      .limit(60),
    supabase
      .from("leaderboard")
      .select("id, username, level, wins, total_creatures")
      .neq("id", user.id)
      .gt("total_creatures", 0)
      .order("level", { ascending: false })
      .limit(20)
  ]);

  return (
    <main className="container py-6 lg:py-10">
      <CombatClient cards={cards ?? []} opponents={opponents ?? []} />
    </main>
  );
}
