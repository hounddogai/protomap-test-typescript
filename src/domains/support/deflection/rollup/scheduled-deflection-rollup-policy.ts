import * as numbers from "../../../../kit/numbers.js";

/** Puts a scheduled deflection rollup code in its canonical SDR- form. */
export function normalizeScheduledDeflectionRollupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDR-")) return clean;
  return `SDR-${clean.replaceAll(" ", "-")}`;
}

export function scheduledDeflectionRollupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 2.82;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
