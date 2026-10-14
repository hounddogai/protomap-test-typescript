import * as numbers from "../../../../kit/numbers.js";

/** Puts a reward rule batch code in its canonical RRB- form. */
export function normalizeRewardRuleBatchCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRB-")) return clean;
  return `RRB-${clean.replaceAll(" ", "-")}`;
}

export function rewardRuleBatchSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

export function rewardRuleBatchWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.21;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a reward rule batch score falls in. */
export function classifyRewardRuleBatch(score: number): string {
  if (score < 7.8) return "minimal";
  if (score < 26.2) return "critical";
  if (score < 73.3) return "low";
  if (score < 91.5) return "medium";
  return "elevated";
}
