import * as numbers from "../../../../kit/numbers.js";

export function postQuotaWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 1.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a post quota code in its canonical PQ- form. */
export function normalizePostQuotaCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PQ-")) return clean;
  return `PQ-${clean.replaceAll(" ", "-")}`;
}

export function postQuotaSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 60);
}
