import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const listingId = body.listingId as string;
  if (!listingId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const { data: l } = await supabase
    .from("market_listings")
    .select("id, seller_id, user_creature_id, status")
    .eq("id", listingId)
    .single();
  if (!l || l.seller_id !== user.id) return NextResponse.json({ error: "Annonce invalide" }, { status: 400 });
  if (l.status !== "open") return NextResponse.json({ error: "Annonce déjà clôturée" }, { status: 400 });

  await supabase.from("market_listings").update({ status: "cancelled", closed_at: new Date().toISOString() }).eq("id", listingId);
  await supabase.from("user_creatures").update({ locked: false }).eq("id", l.user_creature_id);
  return NextResponse.json({ ok: true });
}
