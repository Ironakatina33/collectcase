import { createClient } from "@/lib/supabase/server";
import { TradeClient } from "./trade-client";

export const dynamic = "force-dynamic";

export default async function TradePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: trades }, { data: cards }, { data: profile }] = await Promise.all([
    supabase
      .from("trades")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("user_creatures")
      .select("id, creature_id, rarity, level, shiny, locked")
      .eq("user_id", user.id)
      .eq("locked", false)
      .order("level", { ascending: false }),
    supabase.from("profiles").select("coins, username").eq("id", user.id).single()
  ]);

  // Fetch counterparty creatures referenced in trades + usernames
  const allUcIds = Array.from(new Set((trades ?? []).flatMap((t) => [...(t.sender_offer ?? []), ...(t.receiver_offer ?? [])])));
  const allUserIds = Array.from(new Set((trades ?? []).flatMap((t) => [t.sender_id, t.receiver_id])));

  const { data: ucDetails } = allUcIds.length
    ? await supabase.from("user_creatures").select("id, creature_id, rarity, level, shiny").in("id", allUcIds)
    : { data: [] as { id: string; creature_id: string; rarity: string; level: number; shiny: boolean }[] };
  const { data: userDetails } = allUserIds.length
    ? await supabase.from("profiles").select("id, username").in("id", allUserIds)
    : { data: [] as { id: string; username: string }[] };

  const ucMap = new Map((ucDetails ?? []).map((u) => [u.id, u]));
  const userMap = new Map((userDetails ?? []).map((u) => [u.id, u.username]));

  return (
    <main className="container py-6 lg:py-10">
      <TradeClient
        meId={user.id}
        meCoins={Number(profile?.coins ?? 0)}
        myCards={cards ?? []}
        trades={trades ?? []}
        ucMap={Object.fromEntries(ucMap)}
        userMap={Object.fromEntries(userMap)}
      />
    </main>
  );
}
