import * as numbers from "../../../../kit/numbers.js";

/** Puts a rolling sla tier code in its canonical RST- form. */
export function normalizeRollingSlaTierCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RST-")) return clean;
  return `RST-${clean.replaceAll(" ", "-")}`;
}

export function rollingSlaTierWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 0.51;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
