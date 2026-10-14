import * as numbers from "../../../../kit/numbers.js";

/** Puts a placement manifest code in its canonical PM- form. */
export function normalizePlacementManifestCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("PM-")) return clean;
  return `PM-${clean.replaceAll(" ", "-")}`;
}

export function placementManifestBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}
