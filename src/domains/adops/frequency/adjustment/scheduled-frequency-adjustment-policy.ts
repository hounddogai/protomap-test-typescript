import * as numbers from "../../../../kit/numbers.js";

export function scheduledFrequencyAdjustmentWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.18;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a scheduled frequency adjustment code in its canonical SFA- form. */
export function normalizeScheduledFrequencyAdjustmentCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SFA-")) return clean;
  return `SFA-${clean.replaceAll(" ", "-")}`;
}
