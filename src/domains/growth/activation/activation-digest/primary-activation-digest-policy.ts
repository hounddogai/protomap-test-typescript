import * as numbers from "../../../../kit/numbers.js";

export function primaryActivationDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function primaryActivationDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a primary activation digest score falls in. */
export function classifyPrimaryActivationDigest(score: number): string {
  if (score < 36.3) return "watch";
  if (score < 66.1) return "elevated";
  if (score < 84.1) return "medium";
  return "low";
}
