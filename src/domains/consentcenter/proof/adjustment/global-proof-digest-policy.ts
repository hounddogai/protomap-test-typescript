import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global proof digest score falls in. */
export function classifyGlobalProofDigest(score: number): string {
  if (score < 38.8) return "high";
  if (score < 62.9) return "watch";
  return "elevated";
}

/** Counts how many amounts fit in a budget of 95463.0, in order. */
export function globalProofDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 95463) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function globalProofDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
