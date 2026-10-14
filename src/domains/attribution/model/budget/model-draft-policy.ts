import * as numbers from "../../../../kit/numbers.js";

export function modelDraftBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

/** Names the band a model draft score falls in. */
export function classifyModelDraft(score: number): string {
  if (score < 29.8) return "elevated";
  if (score < 47) return "critical";
  if (score < 61.1) return "minimal";
  if (score < 92.6) return "watch";
  return "ok";
}

/** Counts how many amounts fit in a budget of 68681.0, in order. */
export function modelDraftBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 68681) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
