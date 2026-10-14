import * as numbers from "../../../../kit/numbers.js";

export function retentionRollupBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Counts how many amounts fit in a budget of 98655.0, in order. */
export function retentionRollupBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 98655) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a retention rollup score falls in. */
export function classifyRetentionRollup(score: number): string {
  if (score < 4.1) return "medium";
  if (score < 8.2) return "critical";
  if (score < 66.8) return "minimal";
  return "ok";
}

/** Puts a retention rollup code in its canonical RR- form. */
export function normalizeRetentionRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}
