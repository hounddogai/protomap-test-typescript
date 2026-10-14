import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual warmup estimate code in its canonical MWE- form. */
export function normalizeManualWarmupEstimateCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MWE-")) return clean;
  return `MWE-${clean.replaceAll(" ", "-")}`;
}

export function manualWarmupEstimateWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.06;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function manualWarmupEstimateBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}
