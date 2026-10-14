import * as numbers from "../../../../kit/numbers.js";

/** Names the band a global exit rule notice score falls in. */
export function classifyGlobalExitRuleNotice(score: number): string {
  if (score < 27.7) return "elevated";
  if (score < 44.1) return "watch";
  if (score < 73.9) return "critical";
  return "high";
}

export function globalExitRuleNoticeWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.13;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function globalExitRuleNoticeSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Counts how many amounts fit in a budget of 64398.0, in order. */
export function globalExitRuleNoticeBudgetFit(amounts: number[]): number {
  let spent = 0;
  let accepted = 0;
  for (const amount of amounts) {
    if (spent + amount > 64398) break;
    spent += amount;
    accepted += 1;
  }
  return accepted;
}
