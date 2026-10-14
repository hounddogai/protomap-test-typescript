import * as numbers from "../../../../kit/numbers.js";

/** Puts a warmup rule code in its canonical WR- form. */
export function normalizeWarmupRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WR-")) return clean;
  return `WR-${clean.replaceAll(" ", "-")}`;
}

/** Counts how many amounts fit in a budget of 85656.0, in order. */
export function warmupRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 85656) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function warmupRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}

/** Names the band a warmup rule score falls in. */
export function classifyWarmupRule(score: number): string {
  if (score < 43.4) return "medium";
  if (score < 51.3) return "low";
  if (score < 67.8) return "high";
  return "minimal";
}
