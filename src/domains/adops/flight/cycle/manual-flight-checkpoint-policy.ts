import * as numbers from "../../../../kit/numbers.js";

export function manualFlightCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 99) * 1.2;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

/** Puts a manual flight checkpoint code in its canonical MFC- form. */
export function normalizeManualFlightCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("MFC-")) return clean;
  return `MFC-${clean.replaceAll(" ", "-")}`;
}
