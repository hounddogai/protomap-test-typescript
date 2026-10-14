import * as numbers from "../../../../kit/numbers.js";

/** Puts a tier audit code in its canonical TA- form. */
export function normalizeTierAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("TA-")) return clean;
  return `TA-${clean.replaceAll(" ", "-")}`;
}

export function tierAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function tierAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
