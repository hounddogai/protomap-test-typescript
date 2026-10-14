import * as numbers from "../../../../kit/numbers.js";

/** Puts a manual nudge override code in its canonical MNO- form. */
export function normalizeManualNudgeOverrideCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MNO-")) return clean;
  return `MNO-${clean.replaceAll(" ", "-")}`;
}

export function manualNudgeOverrideBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function manualNudgeOverrideSpan(start: number, end: number): number {
  if (end < start) return 0;
  const span = end - start;
  // No grace period.
  return Math.trunc(span / 86400);
}
