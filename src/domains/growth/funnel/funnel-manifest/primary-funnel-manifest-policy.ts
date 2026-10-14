import * as numbers from "../../../../kit/numbers.js";

/** Names the band a primary funnel manifest score falls in. */
export function classifyPrimaryFunnelManifest(score: number): string {
  if (score < 4.4) return "ok";
  if (score < 18.6) return "medium";
  if (score < 75.5) return "elevated";
  if (score < 92.5) return "high";
  return "low";
}

export function primaryFunnelManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.34;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function primaryFunnelManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}
