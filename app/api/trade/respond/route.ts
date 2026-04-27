import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const tradeId = body.tradeId as string;
  const action = body.action as "accept" | "decline" | "cancel";
  if (!tradeId || !["accept", "decline", "cancel"].includes(action)) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { data: t } = await supabase
    .from("trades")
    .select("id, sender_id, receiver_id, status")
    .eq("id", tradeId)
    .single();
  if (!t) return NextResponse.json({ error: "Échange introuvable" }, { status: 404 });
  if (t.status !== "pending") return NextResponse.json({ error: "Échange déjà clos" }, { status: 400 });

  if (action === "accept") {
    if (user.id !== t.receiver_id) return NextResponse.json({ error: "Seul le destinataire peut accepter" }, { status: 403 });
    const { error } = await supabase.rpc("execute_trade", { p_trade_id: tradeId });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (action === "decline") {
    if (user.id !== t.receiver_id) return NextResponse.json({ error: "Seul le destinataire peut refuser" }, { status: 403 });
    await supabase.from("trades").update({ status: "declined", closed_at: new Date().toISOString() }).eq("id", tradeId);
    return NextResponse.json({ ok: true });
  }

  // cancel
  if (user.id !== t.sender_id) return NextResponse.json({ error: "Seul l'expéditeur peut annuler" }, { status: 403 });
  await supabase.from("trades").update({ status: "cancelled", closed_at: new Date().toISOString() }).eq("id", tradeId);
  return NextResponse.json({ ok: true });
}
