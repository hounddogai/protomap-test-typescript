import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling approval estimate code in its canonical RAE- form. */
export function normalizeRollingApprovalEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RAE-")) return clean;
  return `RAE-${clean.replaceAll(" ", "-")}`;
}

export function rollingApprovalEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function rollingApprovalEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.84;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
