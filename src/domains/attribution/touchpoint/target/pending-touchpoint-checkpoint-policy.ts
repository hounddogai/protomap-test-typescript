import * as numbers from "../../../../kit/numbers.js";

/** Puts a pending touchpoint checkpoint code in its canonical PTC- form. */
export function normalizePendingTouchpointCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PTC-")) return clean;
  return `PTC-${clean.replaceAll(" ", "-")}`;
}

export function pendingTouchpointCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 12.5, 25);
  return `${lower}-${lower + 25}`;
}
