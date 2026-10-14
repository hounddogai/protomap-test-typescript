import * as numbers from "../../../../kit/numbers.js";

/** Puts a regional reputation entry code in its canonical RRE- form. */
export function normalizeRegionalReputationEntryCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("RRE-")) return clean;
  return `RRE-${clean.replaceAll(" ", "-")}`;
}

export function regionalReputationEntryWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 1.98;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function regionalReputationEntryBucket(value: number): string {
  const lower = numbers.roundTo(value - 50, 100);
  return `${lower}-${lower + 100}`;
}

export function regionalReputationEntrySpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 3600) return 0;
  return Math.trunc(span / 3600);
}
