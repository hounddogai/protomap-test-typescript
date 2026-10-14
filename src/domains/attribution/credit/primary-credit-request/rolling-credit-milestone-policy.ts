import * as numbers from "../../../../kit/numbers.js";

export function rollingCreditMilestoneWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.08;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling credit milestone code in its canonical RCM- form. */
export function normalizeRollingCreditMilestoneCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RCM-")) return clean;
  return `RCM-${clean.replaceAll(" ", "-")}`;
}

export function rollingCreditMilestoneSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 60);
}
