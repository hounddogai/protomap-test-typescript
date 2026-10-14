import * as numbers from "../../../../kit/numbers.js";

export function fallbackBounceBaselineWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.92;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function fallbackBounceBaselineSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 86400);
}

/** Names the band a fallback bounce baseline score falls in. */
export function classifyFallbackBounceBaseline(score: number): string {
  if (score < 23.6) return "critical";
  if (score < 25.3) return "medium";
  if (score < 64) return "high";
  if (score < 64.3) return "ok";
  return "watch";
}

/** Puts a fallback bounce baseline code in its canonical FBB- form. */
export function normalizeFallbackBounceBaselineCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("FBB-")) return clean;
  return `FBB-${clean.replaceAll(" ", "-")}`;
}
