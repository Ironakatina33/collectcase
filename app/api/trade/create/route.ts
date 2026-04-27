import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const receiverId = body.receiverId as string;
  const senderOffer = (body.senderOffer as string[]) ?? [];
  const receiverOffer = (body.receiverOffer as string[]) ?? [];
  const senderCoins = Math.max(0, Math.floor(Number(body.senderCoins) || 0));
  const receiverCoins = Math.max(0, Math.floor(Number(body.receiverCoins) || 0));

  if (!receiverId || receiverId === user.id) return NextResponse.json({ error: "Destinataire invalide" }, { status: 400 });
  if (senderOffer.length === 0 && receiverOffer.length === 0 && senderCoins === 0 && receiverCoins === 0) {
    return NextResponse.json({ error: "Échange vide" }, { status: 400 });
  }

  // Validate sender offer ownership
  if (senderOffer.length > 0) {
    const { data: cards } = await supabase
      .from("user_creatures")
      .select("id, user_id, locked")
      .in("id", senderOffer);
    if (!cards || cards.length !== senderOffer.length) return NextResponse.json({ error: "Cartes invalides" }, { status: 400 });
    if (cards.some((c) => c.user_id !== user.id)) return NextResponse.json({ error: "Tu n'es pas propriétaire de toutes les cartes" }, { status: 400 });
    if (cards.some((c) => c.locked)) return NextResponse.json({ error: "Une carte est verrouillée" }, { status: 400 });
  }
  if (receiverOffer.length > 0) {
    const { data: cards } = await supabase
      .from("user_creatures")
      .select("id, user_id, locked")
      .in("id", receiverOffer);
    if (!cards || cards.length !== receiverOffer.length) return NextResponse.json({ error: "Cartes du destinataire invalides" }, { status: 400 });
    if (cards.some((c) => c.user_id !== receiverId)) return NextResponse.json({ error: "Le destinataire ne possède pas ces cartes" }, { status: 400 });
    if (cards.some((c) => c.locked)) return NextResponse.json({ error: "Une carte du destinataire est verrouillée" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trades")
    .insert({
      sender_id: user.id,
      receiver_id: receiverId,
      sender_offer: senderOffer,
      receiver_offer: receiverOffer,
      sender_coins: senderCoins,
      receiver_coins: receiverCoins
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ trade: data });
}
