import * as numbers from "../../../../kit/numbers.js";

/** Names the band a strict reputation override score falls in. */
export function classifyStrictReputationOverride(score: number): string {
  if (score < 14.5) return "critical";
  if (score < 26.1) return "minimal";
  if (score < 95.8) return "medium";
  if (score < 98.1) return "low";
  return "ok";
}

/** Puts a strict reputation override code in its canonical SRO- form. */
export function normalizeStrictReputationOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRO-")) return clean;
  return `SRO-${clean.replaceAll(" ", "-")}`;
}

export function strictReputationOverrideWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.01;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 61256.0, in order. */
export function strictReputationOverrideBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61256) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
