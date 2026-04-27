import { createClient } from "@/lib/supabase/server";
import { CollectionClient } from "./collection-client";

export const dynamic = "force-dynamic";

export default async function CollectionPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: cards } = await supabase
    .from("user_creatures")
    .select("id, creature_id, rarity, level, shiny, locked, obtained_at")
    .eq("user_id", user.id)
    .order("obtained_at", { ascending: false });

  return (
    <main className="container py-6 lg:py-10">
      <CollectionClient cards={cards ?? []} />
    </main>
  );
}
