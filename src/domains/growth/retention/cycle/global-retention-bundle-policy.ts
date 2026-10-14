import * as numbers from "../../../../kit/numbers.js";

/** Puts a global retention bundle code in its canonical GRB- form. */
export function normalizeGlobalRetentionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("GRB-")) return clean;
  return `GRB-${clean.replaceAll(" ", "-")}`;
}

export function globalRetentionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

/** Names the band a global retention bundle score falls in. */
export function classifyGlobalRetentionBundle(score: number): string {
  if (score < 34.1) return "low";
  if (score < 78.5) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 79716.0, in order. */
export function globalRetentionBundleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 79716) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
