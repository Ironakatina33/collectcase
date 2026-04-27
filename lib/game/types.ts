export type Element = "fire" | "water" | "plant" | "thunder" | "shadow" | "light";
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface Creature {
  id: string;
  name: string;
  element: Element;
  rarity: Rarity;
  hp: number;
  atk: number;
  def: number;
  spd: number;
  emoji: string;       // visual placeholder glyph
  palette: [string, string]; // gradient hexes
  flavor: string;
  ability: { name: string; power: number; description: string };
}

export interface CaseDef {
  id: string;
  name: string;
  description: string;
  priceCoins: number;
  emoji: string;
  palette: [string, string];
  rarityWeights: Record<Rarity, number>;
  pool?: Element[]; // restrict to specific elements; undefined = all
}

export const RARITY_ORDER: Rarity[] = ["common", "rare", "epic", "legendary", "mythic"];

export const RARITY_LABELS: Record<Rarity, string> = {
  common: "Commun",
  rare: "Rare",
  epic: "Épique",
  legendary: "Légendaire",
  mythic: "Mythique"
};

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#f59e0b",
  mythic: "#ec4899"
};

export const ELEMENT_LABELS: Record<Element, string> = {
  fire: "Feu",
  water: "Eau",
  plant: "Plante",
  thunder: "Foudre",
  shadow: "Ombre",
  light: "Lumière"
};

export const ELEMENT_EMOJI: Record<Element, string> = {
  fire: "🔥",
  water: "💧",
  plant: "🌿",
  thunder: "⚡",
  shadow: "🌑",
  light: "✨"
};

// Base sell price by rarity
export const SELL_PRICE: Record<Rarity, number> = {
  common: 25,
  rare: 90,
  epic: 280,
  legendary: 900,
  mythic: 3000
};

// Type effectiveness multipliers (attacker -> defender)
export const TYPE_CHART: Record<Element, Partial<Record<Element, number>>> = {
  fire:    { plant: 1.5, water: 0.6, fire: 0.8, thunder: 1.0, shadow: 1.0, light: 1.0 },
  water:   { fire: 1.5, plant: 0.6, thunder: 0.8, water: 0.8, shadow: 1.0, light: 1.0 },
  plant:   { water: 1.5, fire: 0.6, thunder: 1.5, plant: 0.8, shadow: 1.0, light: 1.0 },
  thunder: { water: 1.5, plant: 0.6, fire: 1.0, thunder: 0.8, shadow: 1.0, light: 1.0 },
  shadow:  { light: 1.5, shadow: 0.5, fire: 1.0, water: 1.0, plant: 1.0, thunder: 1.0 },
  light:   { shadow: 1.5, light: 0.5, fire: 1.0, water: 1.0, plant: 1.0, thunder: 1.0 }
};
