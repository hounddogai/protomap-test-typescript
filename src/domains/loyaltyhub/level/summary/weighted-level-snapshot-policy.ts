import * as numbers from "../../../../kit/numbers.js";

/** Puts a weighted level snapshot code in its canonical WLS- form. */
export function normalizeWeightedLevelSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WLS-")) return clean;
  return `WLS-${clean.replaceAll(" ", "-")}`;
}

export function weightedLevelSnapshotBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

export function weightedLevelSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function weightedLevelSnapshotSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 3600);
}
