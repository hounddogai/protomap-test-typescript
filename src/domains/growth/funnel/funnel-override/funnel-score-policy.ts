import * as numbers from "../../../../kit/numbers.js";

/** Puts a funnel score code in its canonical FS- form. */
export function normalizeFunnelScoreCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FS-")) return clean;
  return `FS-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 55195.0, in order. */
export function funnelScoreBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 55195) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function funnelScoreWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 2.56;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
