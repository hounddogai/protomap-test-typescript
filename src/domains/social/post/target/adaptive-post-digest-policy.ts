import * as numbers from "../../../../kit/numbers.js";

/** Counts how many amounts fit in a budget of 18736.0, in order. */
export function adaptivePostDigestBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 18736) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

/** Names the band a adaptive post digest score falls in. */
export function classifyAdaptivePostDigest(score: number): string {
  if (score < 80) return "medium";
  if (score < 91.7) return "elevated";
  return "watch";
}

export function adaptivePostDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.73;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function adaptivePostDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
