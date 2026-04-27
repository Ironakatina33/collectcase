import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CASES_BY_ID, rollCase } from "@/lib/game/cases";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import type { Rarity } from "@/lib/game/types";

const PITY_THRESHOLD = 50; // every 50 pulls without mythic, force one

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const caseId = body.caseId as string;
  const count = Math.max(1, Math.min(10, Number(body.count) || 1));

  const def = CASES_BY_ID[caseId];
  if (!def) return NextResponse.json({ error: "Coffre inconnu" }, { status: 400 });

  // Load profile + funds
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, pity_mythic")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const totalCost = def.priceCoins * count;
  if (profile.coins < totalCost) {
    return NextResponse.json({ error: "Pièces insuffisantes" }, { status: 402 });
  }

  // Roll with pity logic
  const drops: { creatureId: string; rarity: Rarity }[] = [];
  let pity = profile.pity_mythic ?? 0;
  for (let i = 0; i < count; i++) {
    let drop = rollCase(caseId);
    pity++;
    if (drop.rarity === "mythic") pity = 0;
    else if (pity >= PITY_THRESHOLD && def.rarityWeights.mythic > 0) {
      // Force a mythic from same pool
      const mythics = Object.values(CREATURES_BY_ID).filter(
        (c) => c.rarity === "mythic" && (!def.pool || def.pool.includes(c.element))
      );
      const forced = mythics[Math.floor(Math.random() * mythics.length)];
      drop = { creatureId: forced.id, rarity: "mythic" };
      pity = 0;
    }
    drops.push(drop);
  }

  // Spend coins + update pity
  const { error: updErr } = await supabase
    .from("profiles")
    .update({ coins: profile.coins - totalCost, pity_mythic: pity })
    .eq("id", user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  // Insert user_creatures rows
  const rows = drops.map((d) => ({
    user_id: user.id,
    creature_id: d.creatureId,
    rarity: d.rarity,
    shiny: Math.random() < 0.01 // 1% shiny chance
  }));
  const { data: inserted, error: insErr } = await supabase
    .from("user_creatures")
    .insert(rows)
    .select("id, creature_id, rarity, level, shiny");
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // Activity log
  await supabase.from("activity").insert({
    user_id: user.id,
    type: "case_open",
    payload: { caseId, count, drops }
  });

  return NextResponse.json({
    drops: inserted,
    spent: totalCost,
    newBalance: profile.coins - totalCost,
    pity
  });
}
