import * as numbers from "../../../../kit/numbers.js";

export function regionalApprovalSlotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a regional approval slot code in its canonical RAS- form. */
export function normalizeRegionalApprovalSlotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAS-")) return clean;
  return `RAS-${clean.replaceAll(" ", "-")}`;
}

export function regionalApprovalSlotBucket(value: number): string {
  const lower = numbers.roundTo(value - 2.5, 5);
  return `${lower}-${lower + 5}`;
}
