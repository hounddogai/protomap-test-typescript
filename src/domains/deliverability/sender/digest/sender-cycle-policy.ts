import * as numbers from "../../../../kit/numbers.js";

/** Names the band a sender cycle score falls in. */
export function classifySenderCycle(score: number): string {
  if (score < 18.6) return "high";
  if (score < 91.3) return "minimal";
  if (score < 99.1) return "low";
  return "elevated";
}

export function senderCycleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.25;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function senderCycleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
