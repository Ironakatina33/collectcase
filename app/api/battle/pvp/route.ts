import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import { buildBattler, simulateBattle } from "@/lib/game/combat";

const REWARD_COINS = 200;
const REWARD_XP = 35;

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const myUcId = body.userCreatureId as string;
  const oppId = body.opponentId as string;
  if (!myUcId || !oppId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  if (oppId === user.id) return NextResponse.json({ error: "Tu ne peux pas te défier toi-même" }, { status: 400 });

  // My creature
  const { data: my } = await supabase
    .from("user_creatures")
    .select("id, creature_id, level, user_id")
    .eq("id", myUcId)
    .single();
  if (!my || my.user_id !== user.id) return NextResponse.json({ error: "Créature invalide" }, { status: 400 });

  // Opponent's strongest creature (highest level, then rarity weight)
  const { data: oppCreatures } = await supabase
    .from("user_creatures")
    .select("id, creature_id, level, rarity")
    .eq("user_id", oppId)
    .order("level", { ascending: false })
    .limit(20);
  if (!oppCreatures || oppCreatures.length === 0) {
    return NextResponse.json({ error: "Cet adversaire n'a aucune créature" }, { status: 400 });
  }
  const RARITY_VAL: Record<string, number> = { common: 1, rare: 2, epic: 3, legendary: 4, mythic: 5 };
  oppCreatures.sort(
    (a, b) => b.level * 10 + (RARITY_VAL[b.rarity] ?? 0) - (a.level * 10 + (RARITY_VAL[a.rarity] ?? 0))
  );
  const opp = oppCreatures[0];

  const myBase = CREATURES_BY_ID[my.creature_id];
  const oppBase = CREATURES_BY_ID[opp.creature_id];
  if (!myBase || !oppBase) return NextResponse.json({ error: "Espèce inconnue" }, { status: 400 });

  const me = buildBattler(my.id, myBase.id, my.level);
  const foe = buildBattler(opp.id, oppBase.id, opp.level);
  const result = simulateBattle(me, foe);

  const won = result.winner === "p1";
  const draw = result.winner === "draw";
  const rewardCoins = won ? REWARD_COINS : draw ? Math.floor(REWARD_COINS / 3) : 30;
  const rewardXp = won ? REWARD_XP : draw ? Math.floor(REWARD_XP / 3) : 5;

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, xp, level, wins, losses, draws")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  let xpAccum = profile.xp + rewardXp;
  let newLevel = profile.level;
  while (xpAccum >= newLevel * 100) {
    xpAccum -= newLevel * 100;
    newLevel++;
  }

  await supabase.from("profiles").update({
    coins: Number(profile.coins) + rewardCoins,
    xp: xpAccum,
    level: newLevel,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (won || draw ? 0 : 1),
    draws: profile.draws + (draw ? 1 : 0)
  }).eq("id", user.id);

  await supabase.from("battles").insert({
    p1_id: user.id,
    p2_id: oppId,
    p1_creature: my.id,
    p2_creature_id: oppBase.id,
    winner: result.winner,
    rewards_coins: rewardCoins,
    rewards_xp: rewardXp,
    log: { events: result.events.slice(-25), me: { creatureId: myBase.id, level: my.level }, foe: { creatureId: oppBase.id, level: opp.level } },
    mode: "pvp"
  });

  return NextResponse.json({
    result,
    foe: { base: oppBase, level: opp.level },
    rewards: { coins: rewardCoins, xp: rewardXp }
  });
}
