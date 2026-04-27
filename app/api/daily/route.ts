import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const REWARD_COINS = 250;
const REWARD_GEMS = 1;
const COOLDOWN_MS = 24 * 3600 * 1000;

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins, gems, last_daily")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  const now = Date.now();
  if (profile.last_daily && now - new Date(profile.last_daily).getTime() < COOLDOWN_MS) {
    return NextResponse.json({ error: "Pas encore disponible" }, { status: 429 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      coins: Number(profile.coins) + REWARD_COINS,
      gems: profile.gems + REWARD_GEMS,
      last_daily: new Date().toISOString()
    })
    .eq("id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("activity").insert({
    user_id: user.id,
    type: "daily_claim",
    payload: { coins: REWARD_COINS, gems: REWARD_GEMS }
  });

  return NextResponse.json({ coins: REWARD_COINS, gems: REWARD_GEMS });
}
