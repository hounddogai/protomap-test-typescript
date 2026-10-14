import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 23499.0, in order. */
export function reputationRuleBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 23499) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Puts a reputation rule code in its canonical RR- form. */
export function normalizeReputationRuleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RR-")) return clean;
  return `RR-${clean.replaceAll(" ", "-")}`;
}

export function reputationRuleBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a reputation rule score falls in. */
export function classifyReputationRule(score: number): string {
  if (score < 18.7) return "low";
  if (score < 40.8) return "critical";
  if (score < 62.7) return "medium";
  return "watch";
}
