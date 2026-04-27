import { createClient } from "@/lib/supabase/server";
import { MarketClient } from "./market-client";

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: listings }, { data: myListings }, { data: cards }, { data: profile }] = await Promise.all([
    supabase
      .from("market_listings")
      .select("id, seller_id, user_creature_id, creature_id, rarity, level, price, created_at")
      .eq("status", "open")
      .neq("seller_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("market_listings")
      .select("id, seller_id, user_creature_id, creature_id, rarity, level, price, created_at, status")
      .eq("seller_id", user.id)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
    supabase
      .from("user_creatures")
      .select("id, creature_id, rarity, level, shiny, locked")
      .eq("user_id", user.id)
      .eq("locked", false)
      .order("level", { ascending: false }),
    supabase.from("profiles").select("coins").eq("id", user.id).single()
  ]);

  // Fetch seller usernames
  const sellerIds = Array.from(new Set((listings ?? []).map((l) => l.seller_id)));
  const { data: sellers } = sellerIds.length
    ? await supabase.from("profiles").select("id, username").in("id", sellerIds)
    : { data: [] as { id: string; username: string }[] };
  const usernameById = new Map((sellers ?? []).map((s) => [s.id, s.username]));

  return (
    <main className="container py-6 lg:py-10">
      <MarketClient
        listings={(listings ?? []).map((l) => ({ ...l, seller_username: usernameById.get(l.seller_id) ?? "?" }))}
        myListings={myListings ?? []}
        myCards={cards ?? []}
        coins={Number(profile?.coins ?? 0)}
      />
    </main>
  );
}
