import * as numbers from "../../../../kit/numbers.js";

export function manualBadgeMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.32;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Counts how many amounts fit in a budget of 8370.0, in order. */
export function manualBadgeMilestoneBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 8370) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}

export function manualBadgeMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

/** Names the band a manual badge milestone score falls in. */
export function classifyManualBadgeMilestone(score: number): string {
  if (score < 8.9) return "minimal";
  if (score < 36.8) return "medium";
  if (score < 37.4) return "low";
  if (score < 79.9) return "elevated";
  return "critical";
}
