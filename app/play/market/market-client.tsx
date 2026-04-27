"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Coins, ShoppingCart, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatureCard } from "@/components/game/creature-card";
import { CREATURES_BY_ID } from "@/lib/game/creatures";
import { RARITY_LABELS, RARITY_ORDER, SELL_PRICE } from "@/lib/game/types";
import type { Rarity } from "@/lib/game/types";
import { cn, formatNumber } from "@/lib/utils";

interface Listing {
  id: string;
  seller_id: string;
  user_creature_id: string;
  creature_id: string;
  rarity: string;
  level: number;
  price: number;
  created_at: string;
  status?: string;
  seller_username?: string;
}
interface MyCard {
  id: string;
  creature_id: string;
  rarity: string;
  level: number;
  shiny: boolean;
  locked: boolean;
}

export function MarketClient({
  listings,
  myListings,
  myCards,
  coins
}: {
  listings: Listing[];
  myListings: Listing[];
  myCards: MyCard[];
  coins: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"buy" | "sell" | "mine">("buy");
  const [rarityFilter, setRarityFilter] = useState<Rarity | "all">("all");
  const [pending, startTransition] = useTransition();
  const [listDialog, setListDialog] = useState<MyCard | null>(null);
  const [price, setPrice] = useState("");

  const filtered = useMemo(() => {
    let base = listings;
    if (rarityFilter !== "all") base = base.filter((l) => l.rarity === rarityFilter);
    return base;
  }, [listings, rarityFilter]);

  function buy(listing: Listing) {
    if (coins < listing.price) {
      toast.error("Pièces insuffisantes");
      return;
    }
    startTransition(async () => {
      const res = await fetch("/api/market/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Carte achetée !");
      router.refresh();
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      const res = await fetch("/api/market/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: id })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Annonce retirée");
      router.refresh();
    });
  }

  function listForSale() {
    if (!listDialog) return;
    const p = Math.floor(Number(price));
    if (!Number.isFinite(p) || p <= 0) return toast.error("Prix invalide");
    startTransition(async () => {
      const res = await fetch("/api/market/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCreatureId: listDialog.id, price: p })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success("Carte mise en vente !");
      setListDialog(null);
      setPrice("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Marché</h1>
          <p className="text-sm text-muted-foreground">Achète et vends des créatures avec d'autres dresseurs.</p>
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-amber-200 inline-flex items-center gap-1.5">
          <Coins className="h-4 w-4" /> {formatNumber(coins)} pièces
        </div>
      </header>

      {/* Tabs */}
      <div className="inline-flex rounded-lg border border-white/10 p-1 bg-white/[0.02]">
        <TabBtn active={tab === "buy"} onClick={() => setTab("buy")}>Acheter</TabBtn>
        <TabBtn active={tab === "sell"} onClick={() => setTab("sell")}>Vendre</TabBtn>
        <TabBtn active={tab === "mine"} onClick={() => setTab("mine")}>Mes annonces ({myListings.length})</TabBtn>
      </div>

      {tab === "buy" && (
        <>
          <div className="flex flex-wrap gap-2">
            <FilterPill active={rarityFilter === "all"} onClick={() => setRarityFilter("all")}>Toutes</FilterPill>
            {RARITY_ORDER.map((r) => (
              <FilterPill key={r} active={rarityFilter === r} onClick={() => setRarityFilter(r)}>
                {RARITY_LABELS[r]}
              </FilterPill>
            ))}
          </div>
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-3" />
                Aucune annonce pour ce filtre.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {filtered.map((l) => {
                const c = CREATURES_BY_ID[l.creature_id];
                if (!c) return null;
                return (
                  <div key={l.id} className="space-y-2 text-center">
                    <CreatureCard creature={c} level={l.level} size="md" />
                    <div className="text-xs text-muted-foreground">par {l.seller_username}</div>
                    <Button
                      size="sm"
                      variant={coins >= l.price ? "gold" : "outline"}
                      disabled={pending || coins < l.price}
                      onClick={() => buy(l)}
                      className="w-full"
                    >
                      <Coins className="h-3.5 w-3.5" /> {formatNumber(l.price)}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "sell" && (
        <>
          {myCards.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                <Tag className="h-10 w-10 mx-auto mb-3" />
                Tu n'as aucune carte disponible à vendre.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {myCards.map((c) => {
                const base = CREATURES_BY_ID[c.creature_id]!;
                return (
                  <div key={c.id} className="space-y-2 text-center">
                    <CreatureCard creature={base} level={c.level} shiny={c.shiny} size="md" />
                    <Button size="sm" variant="default" className="w-full" onClick={() => {
                      setListDialog(c);
                      setPrice(String(suggestPrice(c.rarity as Rarity, c.level)));
                    }}>
                      <Tag className="h-3.5 w-3.5" /> Mettre en vente
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "mine" && (
        <>
          {myListings.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Tu n'as aucune annonce active.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 justify-items-center">
              {myListings.map((l) => {
                const c = CREATURES_BY_ID[l.creature_id]!;
                return (
                  <div key={l.id} className="space-y-2 text-center">
                    <CreatureCard creature={c} level={l.level} size="md" />
                    <Badge variant="default"><Coins className="h-3 w-3 mr-1" /> {formatNumber(l.price)}</Badge>
                    <Button size="sm" variant="destructive" className="w-full" onClick={() => cancel(l.id)} disabled={pending}>
                      <Trash2 className="h-3.5 w-3.5" /> Retirer
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* List dialog */}
      <Dialog open={!!listDialog} onOpenChange={(o) => !o && setListDialog(null)}>
        <DialogContent onClose={() => setListDialog(null)}>
          <DialogHeader>
            <DialogTitle>Mettre en vente</DialogTitle>
          </DialogHeader>
          {listDialog && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CreatureCard creature={CREATURES_BY_ID[listDialog.creature_id]!} level={listDialog.level} shiny={listDialog.shiny} size="sm" />
                <div className="text-sm">
                  <p>Suggestion : <strong className="text-amber-300">{formatNumber(suggestPrice(listDialog.rarity as Rarity, listDialog.level))} pièces</strong></p>
                  <p className="text-muted-foreground">Vente broyage : {SELL_PRICE[listDialog.rarity as Rarity]} pièces</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Prix en pièces</label>
                <Input type="number" min={1} value={price} onChange={(e) => setPrice(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setListDialog(null)} disabled={pending}>Annuler</Button>
            <Button variant="gold" onClick={listForSale} disabled={pending}>
              {pending ? "…" : "Publier"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function suggestPrice(r: Rarity, level: number) {
  const base = SELL_PRICE[r] * 4; // marketplace listing 4× sell-to-system value
  const lvlMult = 1 + (level - 1) * 0.04;
  return Math.round(base * lvlMult);
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-md text-sm font-semibold transition-all",
        active ? "bg-fuchsia-500/20 text-foreground border border-fuchsia-400/40" : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function FilterPill({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs border transition-colors",
        active ? "bg-fuchsia-500/15 border-fuchsia-400/40 text-foreground" : "border-white/10 text-muted-foreground hover:bg-white/[0.04]"
      )}
    >
      {children}
    </button>
  );
}
