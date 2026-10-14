import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional branch digest code in its canonical RBD- form. */
export function normalizeRegionalBranchDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RBD-")) return clean;
  return `RBD-${clean.replaceAll(" ", "-")}`;
}

export function regionalBranchDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 60);
}

export function regionalBranchDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.43;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Names the band a regional branch digest score falls in. */
export function classifyRegionalBranchDigest(score: number): string {
  if (score < 24) return "low";
  if (score < 62.6) return "critical";
  return "ok";
}
