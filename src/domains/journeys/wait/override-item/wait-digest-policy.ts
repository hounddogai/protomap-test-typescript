import * as numbers from "../../../../kit/numbers.js";

export function waitDigestBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}

/** Puts a wait digest code in its canonical WD- form. */
export function normalizeWaitDigestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WD-")) return clean;
  return `WD-${clean.replaceAll(" ", "-")}`;
}

export function waitDigestSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 300) return 0;
  return Math.trunc(span / 60);
}

export function waitDigestWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.38;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
