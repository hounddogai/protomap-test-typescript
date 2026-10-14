import * as numbers from "../../../../kit/numbers.js";

export function strictWaitMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.58;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a strict wait metric code in its canonical SWM- form. */
export function normalizeStrictWaitMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SWM-")) return clean;
  return `SWM-${clean.replaceAll(" ", "-")}`;
}
