import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted escalation schedule code in its canonical WES- form. */
export function normalizeWeightedEscalationScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WES-")) return clean;
  return `WES-${clean.replaceAll(" ", "-")}`;
}

export function weightedEscalationScheduleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 3600);
}

export function weightedEscalationScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 2.48;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
