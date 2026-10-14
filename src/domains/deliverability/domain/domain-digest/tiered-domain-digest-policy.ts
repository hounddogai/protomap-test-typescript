import * as numbers from "../../../../kit/numbers.js";

export function tieredDomainDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a tiered domain digest score falls in. */
export function classifyTieredDomainDigest(score: number): string {
  if (score < 56.9) return "elevated";
  if (score < 56.9) return "high";
  return "low";
}

export function tieredDomainDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}
