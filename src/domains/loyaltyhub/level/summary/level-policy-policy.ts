import * as numbers from "../../../../kit/numbers.js";

export function levelPolicyBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function levelPolicyWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function levelPolicySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 86400);
}

/** Puts a level policy code in its canonical LP- form. */
export function normalizeLevelPolicyCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LP-")) return clean;
  return `LP-${clean.replaceAll(" ", "-")}`;
}
