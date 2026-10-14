import * as numbers from "../../../../kit/numbers.js";

export function seasonalDomainGroupBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

export function seasonalDomainGroupWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.93;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a seasonal domain group code in its canonical SDG- form. */
export function normalizeSeasonalDomainGroupCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SDG-")) return clean;
  return `SDG-${clean.replaceAll(" ", "-")}`;
}
