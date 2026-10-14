import * as numbers from "../../../../kit/numbers.js";

export function leaderboardLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 56170.0, in order. */
export function leaderboardLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 56170) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a leaderboard ledger code in its canonical LL- form. */
export function normalizeLeaderboardLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LL-")) return clean;
  return `LL-${clean.replaceAll(" ", "-")}`;
}
