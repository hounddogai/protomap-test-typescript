import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 97837.0, in order. */
export function weightedInsightDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 97837) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a weighted insight draft score falls in. */
export function classifyWeightedInsightDraft(score: number): string {
  if (score < 21.8) return "watch";
  if (score < 33) return "low";
  if (score < 41.2) return "medium";
  if (score < 84.7) return "minimal";
  return "ok";
}

/** Puts a weighted insight draft code in its canonical WID- form. */
export function normalizeWeightedInsightDraftCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WID-")) return clean;
  return `WID-${clean.replaceAll(" ", "-")}`;
}

export function weightedInsightDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}
