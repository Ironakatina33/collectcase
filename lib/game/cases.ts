import type { CaseDef, Element, Rarity } from "./types";
import { CREATURES } from "./creatures";
import { weightedRandom } from "../utils";

export const CASES: CaseDef[] = [
  {
    id: "starter",
    name: "Coffre du Novice",
    description: "Le coffret de bienvenue. Idéal pour démarrer ta collection.",
    priceCoins: 80,
    emoji: "📦",
    palette: ["#475569", "#94a3b8"],
    rarityWeights: { common: 70, rare: 25, epic: 4.5, legendary: 0.5, mythic: 0 }
  },
  {
    id: "wild",
    name: "Coffre Sauvage",
    description: "Cases standard avec une chance modérée d'épique.",
    priceCoins: 220,
    emoji: "🎁",
    palette: ["#0f766e", "#5eead4"],
    rarityWeights: { common: 50, rare: 35, epic: 12, legendary: 2.8, mythic: 0.2 }
  },
  {
    id: "elemental",
    name: "Coffre Élémentaire",
    description: "Concentré en raretés. Une vraie machine à épiques.",
    priceCoins: 600,
    emoji: "🧰",
    palette: ["#0369a1", "#7dd3fc"],
    rarityWeights: { common: 25, rare: 45, epic: 23, legendary: 6, mythic: 1 }
  },
  {
    id: "celestial",
    name: "Coffre Céleste",
    description: "Pour les chasseurs de légendaires. Risque mais grosse récompense.",
    priceCoins: 1500,
    emoji: "💎",
    palette: ["#7c3aed", "#f0abfc"],
    rarityWeights: { common: 0, rare: 35, epic: 45, legendary: 17, mythic: 3 }
  },
  {
    id: "mythic",
    name: "Coffre Mythique",
    description: "La quintessence de Mythara. Mythiques bien plus probables.",
    priceCoins: 4500,
    emoji: "🌌",
    palette: ["#be185d", "#fda4af"],
    rarityWeights: { common: 0, rare: 0, epic: 50, legendary: 38, mythic: 12 }
  }
];

export const CASES_BY_ID: Record<string, CaseDef> = Object.fromEntries(
  CASES.map((c) => [c.id, c])
);

export function rollCase(caseId: string): { creatureId: string; rarity: Rarity } {
  const def = CASES_BY_ID[caseId];
  if (!def) throw new Error(`Unknown case: ${caseId}`);

  const rarityEntries = (Object.entries(def.rarityWeights) as [Rarity, number][])
    .filter(([, w]) => w > 0)
    .map(([r, w]) => ({ r, weight: w }));
  const { r: rarity } = weightedRandom(rarityEntries);

  let pool = CREATURES.filter((c) => c.rarity === rarity);
  if (def.pool) {
    const restricted = pool.filter((c) => def.pool!.includes(c.element));
    if (restricted.length > 0) pool = restricted;
  }

  const creature = pool[Math.floor(Math.random() * pool.length)];
  return { creatureId: creature.id, rarity };
}

/** Roll N drops at once (for multi-open). */
export function rollCaseMulti(caseId: string, count: number) {
  return Array.from({ length: count }, () => rollCase(caseId));
}

// Pity system: every 50 mythic-tier rolls without mythic, force one.
// Implemented at server layer (see API).
