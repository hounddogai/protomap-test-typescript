import * as numbers from "../../../../kit/numbers.js";

/** Puts a lenient window metric code in its canonical LWM- form. */
export function normalizeLenientWindowMetricCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("LWM-")) return clean;
  return `LWM-${clean.replaceAll(" ", "-")}`;
}

export function lenientWindowMetricWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
