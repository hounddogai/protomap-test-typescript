import * as numbers from "../../../../kit/numbers.js";

export function seasonalRetentionBundleWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 5) * 2.46;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function seasonalRetentionBundleBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a seasonal retention bundle code in its canonical SRB- form. */
export function normalizeSeasonalRetentionBundleCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SRB-")) return clean;
  return `SRB-${clean.replaceAll(" ", "-")}`;
}

export function seasonalRetentionBundleSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 60) return 0;
  return Math.trunc(span / 86400);
}
