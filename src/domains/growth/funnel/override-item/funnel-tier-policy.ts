import * as numbers from "../../../../kit/numbers.js";

/** Puts a funnel tier code in its canonical FT- form. */
export function normalizeFunnelTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FT-")) return clean;
  return `FT-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 68026.0, in order. */
export function funnelTierBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68026) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.29;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
