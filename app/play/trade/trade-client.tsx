"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, Send, Search, Coins, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreatureCard } from "@/components/game/creature-card";
import { createClient } from "@/lib/supabase/client";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import { cn, formatNumber, formatDate } from "@/lib/utils";

interface UC {
  id: string;
  creature_id: string;
  rarity: string;
  level: number;
  shiny: boolean;
  locked: boolean;
}
interface Trade {
  id: string;
  sender_id: string;
  receiver_id: string;
  sender_offer: string[];
  receiver_offer: string[];
  sender_coins: number;
  receiver_coins: number;
  status: string;
  created_at: string;
}

export function TradeClient({
  meId,
  meCoins,
  myCards,
  trades,
  ucMap,
  userMap
}: {
  meId: string;
  meCoins: number;
  myCards: UC[];
  trades: Trade[];
  ucMap: Record<string, { creature_id: string; level: number; rarity: string; shiny: boolean }>;
  userMap: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<"new" | "incoming" | "sent">("new");
  const [searchUser, setSearchUser] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; username: string; level: number }[]>([]);
  const [target, setTarget] = useState<{ id: string; username: string } | null>(null);
  const [targetCards, setTargetCards] = useState<UC[]>([]);
  const [myOffer, setMyOffer] = useState<Set<string>>(new Set());
  const [theirOffer, setTheirOffer] = useState<Set<string>>(new Set());
  const [myCoinsOffer, setMyCoinsOffer] = useState("0");
  const [theirCoinsOffer, setTheirCoinsOffer] = useState("0");

  // Search players
  useEffect(() => {
    if (!searchUser || searchUser.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("leaderboard")
      .select("id, username, level")
      .ilike("username", `%${searchUser}%`)
      .neq("id", meId)
      .limit(10)
      .then(({ data }) => {
        if (!cancelled) setSearchResults(data ?? []);
      });
    return () => { cancelled = true; };
  }, [searchUser, meId]);

  // Load target's cards
  useEffect(() => {
    if (!target) return;
    const supabase = createClient();
    supabase
      .from("user_creatures")
      .select("id, creature_id, rarity, level, shiny, locked")
      .eq("user_id", target.id)
      .eq("locked", false)
      .order("level", { ascending: false })
      .then(({ data }) => setTargetCards(data ?? []));
  }, [target]);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const n = new Set(set);
    n.has(id) ? n.delete(id) : n.add(id);
    setter(n);
  }

  function reset() {
    setTarget(null);
    setMyOffer(new Set());
    setTheirOffer(new Set());
    setMyCoinsOffer("0");
    setTheirCoinsOffer("0");
    setTargetCards([]);
    setSearchUser("");
    setSearchResults([]);
  }

  function send() {
    if (!target) return;
    startTransition(async () => {
      const res = await fetch("/api/trade/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receiverId: target.id,
          senderOffer: Array.from(myOffer),
          receiverOffer: Array.from(theirOffer),
          senderCoins: Number(myCoinsOffer) || 0,
          receiverCoins: Number(theirCoinsOffer) || 0
        })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Échange envoyé !");
      reset();
      setTab("sent");
      router.refresh();
    });
  }

  function respond(id: string, action: "accept" | "decline" | "cancel") {
    startTransition(async () => {
      const res = await fetch("/api/trade/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId: id, action })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success(
        action === "accept" ? "Échange réalisé !" :
        action === "decline" ? "Échange refusé" : "Échange annulé"
      );
      router.refresh();
    });
  }

  const incoming = trades.filter((t) => t.receiver_id === meId && t.status === "pending");
  const sent = trades.filter((t) => t.sender_id === meId);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Échanges</h1>
        <p className="text-sm text-muted-foreground">Propose des trades cartes + pièces.</p>
      </header>

      <div className="inline-flex rounded-lg border border-white/10 p-1 bg-white/[0.02]">
        <TabBtn active={tab === "new"} onClick={() => setTab("new")}>Nouvel échange</TabBtn>
        <TabBtn active={tab === "incoming"} onClick={() => setTab("incoming")}>
          Reçus {incoming.length > 0 && <Badge variant="warning" className="ml-1">{incoming.length}</Badge>}
        </TabBtn>
        <TabBtn active={tab === "sent"} onClick={() => setTab("sent")}>Envoyés ({sent.length})</TabBtn>
      </div>

      {tab === "new" && (
        <>
          {/* Search target */}
          {!target ? (
            <Card>
              <CardHeader>
                <CardTitle>Trouver un dresseur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pseudo (min 2 lettres)…"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="space-y-1">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => setTarget({ id: u.id, username: u.username })}
                        className="w-full text-left rounded-lg px-3 py-2 border border-white/10 hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="font-semibold">{u.username}</div>
                        <div className="text-xs text-muted-foreground">Niv. {u.level}</div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="text-sm text-muted-foreground">Échange avec</div>
                  <div className="font-display text-xl font-bold">{target.username}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={reset}>Annuler</Button>
                  <Button variant="gold" size="sm" onClick={send} disabled={pending}>
                    <Send className="h-4 w-4" /> {pending ? "Envoi…" : "Envoyer la proposition"}
                  </Button>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tu offres</CardTitle>
                    <p className="text-xs text-muted-foreground">Sélectionne tes cartes & pièces</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="number"
                      min={0}
                      max={meCoins}
                      value={myCoinsOffer}
                      onChange={(e) => setMyCoinsOffer(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-[11px] text-muted-foreground">Solde dispo : {formatNumber(meCoins)}</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                      {myCards.map((c) => {
                        const base = CREATURES_BY_ID[c.creature_id]!;
                        return (
                          <CreatureCard
                            key={c.id}
                            creature={base}
                            level={c.level}
                            shiny={c.shiny}
                            size="sm"
                            selected={myOffer.has(c.id)}
                            onClick={() => toggle(myOffer, setMyOffer, c.id)}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{target.username} offre</CardTitle>
                    <p className="text-xs text-muted-foreground">Sélectionne ce que tu veux d'eux</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Input
                      type="number"
                      min={0}
                      value={theirCoinsOffer}
                      onChange={(e) => setTheirCoinsOffer(e.target.value)}
                      placeholder="0"
                    />
                    <p className="text-[11px] text-muted-foreground">Pièces demandées</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-72 overflow-y-auto pr-1">
                      {targetCards.length === 0 ? (
                        <p className="col-span-full text-sm text-muted-foreground">Aucune carte disponible.</p>
                      ) : targetCards.map((c) => {
                        const base = CREATURES_BY_ID[c.creature_id]!;
                        return (
                          <CreatureCard
                            key={c.id}
                            creature={base}
                            level={c.level}
                            shiny={c.shiny}
                            size="sm"
                            selected={theirOffer.has(c.id)}
                            onClick={() => toggle(theirOffer, setTheirOffer, c.id)}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "incoming" && (
        <TradesList
          trades={trades.filter((t) => t.receiver_id === meId)}
          ucMap={ucMap}
          userMap={userMap}
          meId={meId}
          onRespond={respond}
          pending={pending}
        />
      )}
      {tab === "sent" && (
        <TradesList
          trades={trades.filter((t) => t.sender_id === meId)}
          ucMap={ucMap}
          userMap={userMap}
          meId={meId}
          onRespond={respond}
          pending={pending}
        />
      )}
    </div>
  );
}

function TradesList({
  trades,
  ucMap,
  userMap,
  meId,
  onRespond,
  pending
}: {
  trades: Trade[];
  ucMap: Record<string, { creature_id: string; level: number; rarity: string; shiny: boolean }>;
  userMap: Record<string, string>;
  meId: string;
  onRespond: (id: string, action: "accept" | "decline" | "cancel") => void;
  pending: boolean;
}) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          <ArrowLeftRight className="h-10 w-10 mx-auto mb-3" />
          Aucun échange.
        </CardContent>
      </Card>
    );
  }
  return (
    <div className="space-y-3">
      {trades.map((t) => {
        const iAmReceiver = t.receiver_id === meId;
        const otherId = iAmReceiver ? t.sender_id : t.receiver_id;
        const otherName = userMap[otherId] ?? "?";
        const myOffer = iAmReceiver ? t.receiver_offer : t.sender_offer;
        const theirOffer = iAmReceiver ? t.sender_offer : t.receiver_offer;
        const myCoins = iAmReceiver ? t.receiver_coins : t.sender_coins;
        const theirCoins = iAmReceiver ? t.sender_coins : t.receiver_coins;
        return (
          <Card key={t.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">{iAmReceiver ? "De" : "À"}:</span>{" "}
                  <strong>{otherName}</strong>
                  <span className="text-muted-foreground"> · {formatDate(t.created_at)}</span>
                </div>
                <Badge variant={
                  t.status === "pending" ? "warning" :
                  t.status === "accepted" ? "success" :
                  "secondary"
                }>{t.status}</Badge>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <OfferSide
                  title={iAmReceiver ? `Tu donnes` : `Tu donnes`}
                  cards={myOffer}
                  ucMap={ucMap}
                  coins={myCoins}
                />
                <OfferSide
                  title={iAmReceiver ? `${otherName} donne` : `${otherName} donne`}
                  cards={theirOffer}
                  ucMap={ucMap}
                  coins={theirCoins}
                />
              </div>

              {t.status === "pending" && (
                <div className="flex gap-2 justify-end">
                  {iAmReceiver ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => onRespond(t.id, "decline")} disabled={pending}>
                        <X className="h-4 w-4" /> Refuser
                      </Button>
                      <Button size="sm" variant="gold" onClick={() => onRespond(t.id, "accept")} disabled={pending}>
                        <Check className="h-4 w-4" /> Accepter
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => onRespond(t.id, "cancel")} disabled={pending}>
                      Annuler
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function OfferSide({
  title,
  cards,
  ucMap,
  coins
}: {
  title: string;
  cards: string[];
  ucMap: Record<string, { creature_id: string; level: number; rarity: string; shiny: boolean }>;
  coins: number;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-black/30 p-3">
      <div className="text-xs text-muted-foreground mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {cards.map((id) => {
          const uc = ucMap[id];
          if (!uc) return <div key={id} className="text-xs text-muted-foreground">[carte indispo]</div>;
          const base = CREATURES_BY_ID[uc.creature_id];
          if (!base) return null;
          return (
            <CreatureCard key={id} creature={base} level={uc.level} shiny={uc.shiny} size="sm" showStats={false} />
          );
        })}
        {coins > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-200 inline-flex items-center gap-1 text-xs h-fit">
            <Coins className="h-3 w-3" /> {formatNumber(coins)}
          </div>
        )}
        {cards.length === 0 && coins === 0 && <div className="text-xs text-muted-foreground italic">Rien</div>}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-md text-sm font-semibold transition-all inline-flex items-center",
        active ? "bg-fuchsia-500/20 text-foreground border border-fuchsia-400/40" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}
