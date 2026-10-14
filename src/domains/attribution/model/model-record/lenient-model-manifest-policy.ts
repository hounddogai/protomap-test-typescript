import * as numbers from "../../../../kit/numbers.js";

export function lenientModelManifestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}

export function lenientModelManifestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.83;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a lenient model manifest score falls in. */
export function classifyLenientModelManifest(score: number): string {
  if (score < 5.7) return "high";
  if (score < 92.8) return "medium";
  return "elevated";
}
