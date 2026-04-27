"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Filter, Search, X, Trash2, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreatureCard } from "@/components/game/creature-card";
import { CREATURES, CREATURES_BY_ID } from "@/lib/game/creatures";
import { ELEMENT_LABELS, RARITY_LABELS, RARITY_ORDER, SELL_PRICE } from "@/lib/game/types";
import type { Element, Rarity } from "@/lib/game/types";
import { cn, formatNumber } from "@/lib/utils";

interface UserCard {
  id: string;
  creature_id: string;
  rarity: string;
  level: number;
  shiny: boolean;
  locked: boolean;
  obtained_at: string;
}

const ELEMENTS: Element[] = ["fire", "water", "plant", "thunder", "shadow", "light"];

export function CollectionClient({ cards }: { cards: UserCard[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [elem, setElem] = useState<Element | "all">("all");
  const [rarity, setRarity] = useState<Rarity | "all">("all");
  const [groupByCreature, setGroupByCreature] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return cards.filter((c) => {
      const base = CREATURES_BY_ID[c.creature_id];
      if (!base) return false;
      if (elem !== "all" && base.element !== elem) return false;
      if (rarity !== "all" && c.rarity !== rarity) return false;
      if (search && !base.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cards, search, elem, rarity]);

  const grouped = useMemo(() => {
    if (!groupByCreature) return null;
    const map = new Map<string, { rep: UserCard; cards: UserCard[] }>();
    for (const c of filtered) {
      const key = c.creature_id;
      const ent = map.get(key);
      if (ent) {
        ent.cards.push(c);
        if (c.level > ent.rep.level || (c.shiny && !ent.rep.shiny)) ent.rep = c;
      } else {
        map.set(key, { rep: c, cards: [c] });
      }
    }
    return Array.from(map.values()).sort((a, b) => {
      const ra = RARITY_ORDER.indexOf(a.rep.rarity as Rarity);
      const rb = RARITY_ORDER.indexOf(b.rep.rarity as Rarity);
      return rb - ra;
    });
  }, [filtered, groupByCreature]);

  const totalValue = useMemo(() => {
    let v = 0;
    for (const id of selected) {
      const c = cards.find((cc) => cc.id === id);
      if (c) v += SELL_PRICE[c.rarity as Rarity] ?? 0;
    }
    return v;
  }, [selected, cards]);

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  function selectByRarity(r: Rarity) {
    setSelected(new Set(cards.filter((c) => c.rarity === r && !c.locked).map((c) => c.id)));
  }

  async function sellSelected() {
    if (selected.size === 0) return;
    startTransition(async () => {
      const res = await fetch("/api/creatures/sell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected) })
      });
      const j = await res.json();
      if (!res.ok) {
        toast.error(j.error ?? "Erreur");
        return;
      }
      toast.success(`+${formatNumber(j.total)} pièces obtenues (${j.count} cartes)`);
      setSelected(new Set());
      setConfirm(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Mythadex</h1>
          <p className="text-sm text-muted-foreground">
            {cards.length} cartes · {new Set(cards.map((c) => c.creature_id)).size}/42 espèces
          </p>
        </div>
      </header>

      {/* Filters bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une créature…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant={groupByCreature ? "default" : "outline"}
              size="sm"
              onClick={() => setGroupByCreature((g) => !g)}
            >
              {groupByCreature ? "Vue groupée" : "Toutes les cartes"}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <FilterPill active={elem === "all"} onClick={() => setElem("all")}>Tous éléments</FilterPill>
            {ELEMENTS.map((e) => (
              <FilterPill key={e} active={elem === e} onClick={() => setElem(e)}>
                {ELEMENT_LABELS[e]}
              </FilterPill>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <FilterPill active={rarity === "all"} onClick={() => setRarity("all")}>Toutes raretés</FilterPill>
            {RARITY_ORDER.map((r) => (
              <FilterPill key={r} active={rarity === r} onClick={() => setRarity(r)}>
                {RARITY_LABELS[r]}
              </FilterPill>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 backdrop-blur p-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <strong>{selected.size}</strong> carte(s) sélectionnée(s) · valeur :{" "}
            <span className="text-amber-300 font-bold">+{formatNumber(totalValue)} <Coins className="inline h-3.5 w-3.5" /></span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              <X className="h-4 w-4 mr-1" /> Désélectionner
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setConfirm(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Vendre en masse
            </Button>
          </div>
        </div>
      )}

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">Sélection rapide :</span>
        {RARITY_ORDER.slice(0, 3).map((r) => (
          <button
            key={r}
            onClick={() => selectByRarity(r)}
            className="text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
          >
            tous les {RARITY_LABELS[r].toLowerCase()}s
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Filter className="h-10 w-10 mx-auto mb-3" />
          Aucune carte ne correspond à ces filtres.
        </div>
      ) : groupByCreature && grouped ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
          {grouped.map(({ rep, cards: dupes }) => {
            const base = CREATURES_BY_ID[rep.creature_id]!;
            return (
              <CreatureCard
                key={rep.creature_id}
                creature={base}
                level={rep.level}
                shiny={rep.shiny}
                count={dupes.length}
                size="md"
              />
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 justify-items-center">
          {filtered.map((c) => {
            const base = CREATURES_BY_ID[c.creature_id]!;
            const isSelected = selected.has(c.id);
            return (
              <div key={c.id} className="relative">
                <CreatureCard
                  creature={base}
                  level={c.level}
                  shiny={c.shiny}
                  selected={isSelected}
                  onClick={() => !c.locked && toggle(c.id)}
                  size="md"
                  className={c.locked ? "opacity-60" : ""}
                />
                {c.locked && (
                  <div className="absolute -top-2 -left-2 text-xs bg-amber-500 text-black font-bold rounded px-1.5 py-0.5">
                    Listé
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Show creatures still missing */}
      <Card>
        <CardContent className="p-5">
          <h2 className="font-display text-xl font-bold mb-1">À débloquer</h2>
          <p className="text-sm text-muted-foreground mb-4">Espèces qu'il te reste à capturer.</p>
          <div className="flex flex-wrap gap-2">
            {CREATURES.filter((c) => !cards.some((uc) => uc.creature_id === c.id)).map((c) => (
              <div key={c.id} className="rounded-lg border border-white/5 bg-black/30 p-2 w-24 text-center opacity-60 grayscale">
                <div className="text-3xl">❔</div>
                <div className="text-[10px] text-muted-foreground truncate">{c.name}</div>
              </div>
            ))}
            {CREATURES.every((c) => cards.some((uc) => uc.creature_id === c.id)) && (
              <Badge variant="success">Mythadex complet ! ✨</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sell confirm */}
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent onClose={() => setConfirm(false)}>
          <DialogHeader>
            <DialogTitle>Vendre {selected.size} carte(s) ?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tu vas recevoir <strong className="text-amber-300">{formatNumber(totalValue)} pièces</strong>.
            L'opération est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(false)} disabled={pending}>Annuler</Button>
            <Button variant="destructive" onClick={sellSelected} disabled={pending}>
              {pending ? "Vente…" : "Confirmer la vente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs border transition-colors",
        active
          ? "bg-fuchsia-500/15 border-fuchsia-400/40 text-foreground"
          : "border-white/10 text-muted-foreground hover:bg-white/[0.04]"
      )}
    >
      {children}
    </button>
  );
}
