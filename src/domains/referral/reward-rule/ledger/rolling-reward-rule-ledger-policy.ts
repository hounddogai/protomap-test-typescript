import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 61892.0, in order. */
export function rollingRewardRuleLedgerBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 61892) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a rolling reward rule ledger score falls in. */
export function classifyRollingRewardRuleLedger(score: number): string {
  if (score < 34.6) return "critical";
  if (score < 64.8) return "high";
  if (score < 82.7) return "watch";
  return "elevated";
}

export function rollingRewardRuleLedgerWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.45;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling reward rule ledger code in its canonical RRRL- form. */
export function normalizeRollingRewardRuleLedgerCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRRL-")) return clean;
  return `RRRL-${clean.replaceAll(" ", "-")}`;
}
