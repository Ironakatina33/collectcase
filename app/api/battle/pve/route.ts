import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CREATURES, CREATURES_BY_ID } from "@/lib/game/creatures";
import { buildBattler, simulateBattle } from "@/lib/game/combat";
import type { Rarity } from "@/lib/game/types";

const REWARD_BY_DIFFICULTY: Record<string, { minLevel: number; maxLevel: number; rewardCoins: number; rewardXp: number; rarities: Rarity[] }> = {
  easy:   { minLevel: 1,  maxLevel: 5,  rewardCoins: 30,  rewardXp: 8,  rarities: ["common", "rare"] },
  normal: { minLevel: 6,  maxLevel: 15, rewardCoins: 75,  rewardXp: 18, rarities: ["rare", "epic"] },
  hard:   { minLevel: 16, maxLevel: 30, rewardCoins: 180, rewardXp: 36, rarities: ["epic", "legendary"] },
  elite:  { minLevel: 30, maxLevel: 50, rewardCoins: 420, rewardXp: 70, rarities: ["legendary", "mythic"] }
};

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const userCreatureId = body.userCreatureId as string;
  const difficulty = (body.difficulty as keyof typeof REWARD_BY_DIFFICULTY) ?? "normal";
  const cfg = REWARD_BY_DIFFICULTY[difficulty];
  if (!cfg) return NextResponse.json({ error: "Difficulté invalide" }, { status: 400 });

  const { data: ucData } = await supabase
    .from("user_creatures")
    .select("id, creature_id, level, user_id")
    .eq("id", userCreatureId)
    .single();
  const uc = ucData as { id: string; creature_id: string; level: number; user_id: string } | null;
  if (!uc || uc.user_id !== user.id) return NextResponse.json({ error: "Créature invalide" }, { status: 400 });

  const myBase = CREATURES_BY_ID[uc.creature_id];
  if (!myBase) return NextResponse.json({ error: "Espèce inconnue" }, { status: 400 });

  // Pick a random foe with rarity matching difficulty
  const pool = CREATURES.filter((c) => cfg.rarities.includes(c.rarity));
  const foeBase = pool[Math.floor(Math.random() * pool.length)];
  const foeLevel = Math.max(1, Math.min(100,
    Math.floor(cfg.minLevel + Math.random() * (cfg.maxLevel - cfg.minLevel))
  ));

  const me = buildBattler(uc.id, myBase.id, uc.level);
  const foe = buildBattler("foe", foeBase.id, foeLevel);
  const result = simulateBattle(me, foe);

  // Rewards
  const won = result.winner === "p1";
  const draw = result.winner === "draw";
  const rewardCoins = won ? cfg.rewardCoins : draw ? Math.floor(cfg.rewardCoins / 3) : Math.floor(cfg.rewardCoins / 5);
  const rewardXp = won ? cfg.rewardXp : draw ? Math.floor(cfg.rewardXp / 3) : 2;

  // Apply XP & level for the participating creature, profile XP/coins
  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, xp, level, wins, losses, draws")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const newPlayerXp = profile.xp + rewardXp;
  let newPlayerLevel = profile.level;
  let xpAccum = newPlayerXp;
  while (xpAccum >= newPlayerLevel * 100) {
    xpAccum -= newPlayerLevel * 100;
    newPlayerLevel++;
  }

  await supabase.from("profiles").update({
    coins: Number(profile.coins) + rewardCoins,
    xp: xpAccum,
    level: newPlayerLevel,
    wins: profile.wins + (won ? 1 : 0),
    losses: profile.losses + (won || draw ? 0 : 1),
    draws: profile.draws + (draw ? 1 : 0)
  }).eq("id", user.id);

  // Bump creature XP / level
  const creatureXpGain = won ? 30 : draw ? 12 : 6;
  const newUcXp = (uc as { xp?: number; level?: number; level_only_default?: number }).xp ?? 0;
  // Re-read to get full row (level + xp)
  const { data: ucFull } = await supabase
    .from("user_creatures")
    .select("xp, level")
    .eq("id", uc.id)
    .single();
  let newCreatureXp = (ucFull?.xp ?? 0) + creatureXpGain;
  let newCreatureLevel = ucFull?.level ?? uc.level;
  while (newCreatureXp >= newCreatureLevel * 50 && newCreatureLevel < 100) {
    newCreatureXp -= newCreatureLevel * 50;
    newCreatureLevel++;
  }
  await supabase.from("user_creatures").update({
    xp: newCreatureXp,
    level: newCreatureLevel
  }).eq("id", uc.id);

  await supabase.from("battles").insert({
    p1_id: user.id,
    p1_creature: uc.id,
    p2_creature_id: foeBase.id,
    winner: result.winner,
    rewards_coins: rewardCoins,
    rewards_xp: rewardXp,
    log: {
      events: result.events.slice(-25), // last 25 events
      foe: { creatureId: foeBase.id, level: foeLevel },
      me: { creatureId: myBase.id, level: uc.level }
    },
    mode: "pve"
  });

  return NextResponse.json({
    result,
    foe: { base: foeBase, level: foeLevel },
    rewards: { coins: rewardCoins, xp: rewardXp, creatureXp: creatureXpGain }
  });
}
