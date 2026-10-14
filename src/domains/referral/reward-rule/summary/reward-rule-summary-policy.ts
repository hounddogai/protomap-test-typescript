import * as numbers from "../../../../kit/numbers.js";

/** Names the band a reward rule summary score falls in. */
export function classifyRewardRuleSummary(score: number): string {
  if (score < 31.4) return "watch";
  if (score < 60.5) return "elevated";
  return "high";
}

export function rewardRuleSummarySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function rewardRuleSummaryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.95;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
