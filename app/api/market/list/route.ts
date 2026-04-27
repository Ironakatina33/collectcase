import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ucId = body.userCreatureId as string;
  const price = Math.floor(Number(body.price));
  if (!ucId || !Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { data: uc } = await supabase
    .from("user_creatures")
    .select("id, user_id, creature_id, rarity, level, locked")
    .eq("id", ucId)
    .single();
  if (!uc || uc.user_id !== user.id) return NextResponse.json({ error: "Carte invalide" }, { status: 400 });

  // Lock the card and create listing
  const { error: lockErr } = await supabase
    .from("user_creatures")
    .update({ locked: true })
    .eq("id", ucId);
  if (lockErr) return NextResponse.json({ error: lockErr.message }, { status: 500 });

  const { error: insErr, data: listing } = await supabase
    .from("market_listings")
    .insert({
      seller_id: user.id,
      user_creature_id: ucId,
      creature_id: uc.creature_id,
      rarity: uc.rarity,
      level: uc.level,
      price
    })
    .select()
    .single();

  if (insErr) {
    await supabase.from("user_creatures").update({ locked: false }).eq("id", ucId);
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }
  return NextResponse.json({ listing });
}
