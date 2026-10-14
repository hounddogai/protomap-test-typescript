import * as numbers from "../../../../kit/numbers.js";

export function frequencyWindowSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

export function frequencyWindowWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.59;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a frequency window score falls in. */
export function classifyFrequencyWindow(score: number): string {
  if (score < 16.4) return "critical";
  if (score < 36.7) return "minimal";
  return "elevated";
}
