import * as numbers from "../../../../kit/numbers.js";

export function rollingTouchpointRequestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.02;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a rolling touchpoint request code in its canonical RTR- form. */
export function normalizeRollingTouchpointRequestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RTR-")) return clean;
  return `RTR-${clean.replaceAll(" ", "-")}`;
}
