import * as numbers from "../../../../kit/numbers.js";

export function seasonalApprovalScheduleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal approval schedule code in its canonical SAS- form. */
export function normalizeSeasonalApprovalScheduleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SAS-")) return clean;
  return `SAS-${clean.replaceAll(" ", "-")}`;
}
