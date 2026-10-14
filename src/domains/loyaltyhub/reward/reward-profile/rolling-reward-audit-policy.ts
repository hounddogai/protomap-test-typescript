import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling reward audit code in its canonical RRA- form. */
export function normalizeRollingRewardAuditCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRA-")) return clean;
  return `RRA-${clean.replaceAll(" ", "-")}`;
}

export function rollingRewardAuditWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 0.91;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function rollingRewardAuditBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
