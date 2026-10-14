import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 49539.0, in order. */
export function redemptionSnapshotBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 49539) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a redemption snapshot code in its canonical RS- form. */
export function normalizeRedemptionSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RS-")) return clean;
  return `RS-${clean.replaceAll(" ", "-")}`;
}

/** Names the band a redemption snapshot score falls in. */
export function classifyRedemptionSnapshot(score: number): string {
  if (score < 12.2) return "critical";
  if (score < 71.6) return "medium";
  return "elevated";
}

export function redemptionSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
