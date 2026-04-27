import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SELL_PRICE } from "@/lib/game/types";
import type { Rarity } from "@/lib/game/types";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const ids = (body.ids as string[]) ?? [];
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Aucune carte sélectionnée" }, { status: 400 });
  }

  const { data: cards } = await supabase
    .from("user_creatures")
    .select("id, rarity, locked, user_id")
    .in("id", ids);
  if (!cards || cards.length === 0) return NextResponse.json({ error: "Cartes introuvables" }, { status: 404 });
  if (cards.some((c) => c.user_id !== user.id)) return NextResponse.json({ error: "Cartes invalides" }, { status: 403 });
  if (cards.some((c) => c.locked)) return NextResponse.json({ error: "Une carte verrouillée bloque la vente" }, { status: 400 });

  const total = cards.reduce((s, c) => s + (SELL_PRICE[c.rarity as Rarity] ?? 0), 0);

  const { error: delErr } = await supabase.from("user_creatures").delete().in("id", ids);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();
  await supabase
    .from("profiles")
    .update({ coins: Number(profile?.coins ?? 0) + total })
    .eq("id", user.id);

  await supabase.from("activity").insert({
    user_id: user.id,
    type: "sell_dust",
    payload: { count: cards.length, total }
  });

  return NextResponse.json({ count: cards.length, total });
}
