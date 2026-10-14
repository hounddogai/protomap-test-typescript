import * as numbers from "../../../../kit/numbers.js";

/** Puts a wait checkpoint code in its canonical WC- form. */
export function normalizeWaitCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("WC-")) return clean;
  return `WC-${clean.replaceAll(" ", "-")}`;
}

export function waitCheckpointSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  if (span < 900) return 0;
  return Math.trunc(span / 3600);
}

export function waitCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
