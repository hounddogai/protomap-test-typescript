import * as numbers from "../../../../kit/numbers.js";

/** Puts a default macro snapshot code in its canonical DMS- form. */
export function normalizeDefaultMacroSnapshotCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DMS-")) return clean;
  return `DMS-${clean.replaceAll(" ", "-")}`;
}

export function defaultMacroSnapshotWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.61;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
