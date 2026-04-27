import type { Creature, Element } from "./types";
import { TYPE_CHART } from "./types";
import { CREATURES_BY_ID } from "./creatures";

export interface CombatStats {
  hp: number;
  atk: number;
  def: number;
  spd: number;
}

export interface BattleCreature {
  id: string;          // user_creature id (or synthetic)
  creatureId: string;  // base species id
  level: number;
  currentHp: number;
  stats: CombatStats;  // levelled stats
  base: Creature;
}

/** Compute levelled stats. Level 1 = base. +6% per level. */
export function levelStats(c: Creature, level: number): CombatStats {
  const m = 1 + (level - 1) * 0.06;
  return {
    hp: Math.round(c.hp * m),
    atk: Math.round(c.atk * m),
    def: Math.round(c.def * m),
    spd: Math.round(c.spd * m)
  };
}

export function buildBattler(userCreatureId: string, creatureId: string, level: number): BattleCreature {
  const base = CREATURES_BY_ID[creatureId];
  if (!base) throw new Error(`Unknown creature ${creatureId}`);
  const stats = levelStats(base, level);
  return {
    id: userCreatureId,
    creatureId,
    level,
    currentHp: stats.hp,
    stats,
    base
  };
}

export function effectiveness(attacker: Element, defender: Element): number {
  return TYPE_CHART[attacker]?.[defender] ?? 1;
}

export interface BattleEvent {
  turn: number;
  actor: "p1" | "p2";
  attackerName: string;
  defenderName: string;
  ability: string;
  damage: number;
  critical: boolean;
  effectiveness: number;
  defenderHpAfter: number;
  message: string;
}

export interface BattleResult {
  events: BattleEvent[];
  winner: "p1" | "p2" | "draw";
  turns: number;
}

/**
 * Deterministic but seeded-flavored simulation. Both creatures attack
 * in speed order until one falls. Critical hit chance 8%. Damage formula:
 *   dmg = max(1, round((atk * power/45 - def/2) * effectiveness * crit * jitter))
 */
export function simulateBattle(p1: BattleCreature, p2: BattleCreature, seed = Date.now()): BattleResult {
  const events: BattleEvent[] = [];
  let s = seed >>> 0;
  const rand = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return (s & 0x7fffffff) / 0x7fffffff;
  };

  const a1 = { ...p1, currentHp: p1.stats.hp };
  const a2 = { ...p2, currentHp: p2.stats.hp };

  let turn = 1;
  const maxTurns = 60;

  while (a1.currentHp > 0 && a2.currentHp > 0 && turn <= maxTurns) {
    const order: ("p1" | "p2")[] =
      a1.stats.spd === a2.stats.spd
        ? rand() < 0.5 ? ["p1", "p2"] : ["p2", "p1"]
        : a1.stats.spd > a2.stats.spd
          ? ["p1", "p2"]
          : ["p2", "p1"];

    for (const who of order) {
      const atk = who === "p1" ? a1 : a2;
      const def = who === "p1" ? a2 : a1;
      if (atk.currentHp <= 0 || def.currentHp <= 0) continue;

      const power = atk.base.ability.power;
      const eff = effectiveness(atk.base.element, def.base.element);
      const crit = rand() < 0.08 ? 1.6 : 1;
      const jitter = 0.9 + rand() * 0.2;
      const raw = atk.stats.atk * (power / 45) - def.stats.def / 2;
      const damage = Math.max(1, Math.round(raw * eff * crit * jitter));
      def.currentHp = Math.max(0, def.currentHp - damage);

      const message =
        `${atk.base.name} utilise ${atk.base.ability.name} ! ` +
        (eff > 1 ? "C'est super efficace ! " : eff < 1 ? "Ce n'est pas très efficace... " : "") +
        (crit > 1 ? "Coup critique ! " : "") +
        `(${damage} dégâts)`;

      events.push({
        turn,
        actor: who,
        attackerName: atk.base.name,
        defenderName: def.base.name,
        ability: atk.base.ability.name,
        damage,
        critical: crit > 1,
        effectiveness: eff,
        defenderHpAfter: def.currentHp,
        message
      });

      if (def.currentHp <= 0) break;
    }

    turn++;
  }

  const winner: BattleResult["winner"] =
    a1.currentHp <= 0 && a2.currentHp <= 0
      ? "draw"
      : a1.currentHp <= 0
        ? "p2"
        : a2.currentHp <= 0
          ? "p1"
          : a1.currentHp >= a2.currentHp ? "p1" : "p2";

  return { events, winner, turns: turn - 1 };
}
