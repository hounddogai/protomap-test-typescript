import * as numbers from "../../../../kit/numbers.js";

export function queueForecastSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}

/** Puts a queue forecast code in its canonical QF- form. */
export function normalizeQueueForecastCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("QF-")) return clean;
  return `QF-${clean.replaceAll(" ", "-")}`;
}

export function queueForecastWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.69;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
