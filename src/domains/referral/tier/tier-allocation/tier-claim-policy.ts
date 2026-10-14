import * as numbers from "../../../../kit/numbers.js";

/** Puts a tier claim code in its canonical TC- form. */
export function normalizeTierClaimCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TC-")) return clean;
  return `TC-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a tier claim score falls in. */
export function classifyTierClaim(score: number): string {
  if (score < 14.3) return "high";
  if (score < 29.2) return "elevated";
  if (score < 55.4) return "low";
  if (score < 76.2) return "watch";
  return "critical";
}

export function tierClaimBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Counts how many amounts fit in a budget of 5545.0, in order. */
export function tierClaimBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 5545) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
