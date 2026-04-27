import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const listingId = body.listingId as string;
  if (!listingId) return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });

  const { error } = await supabase.rpc("buy_listing", { p_listing_id: listingId });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
