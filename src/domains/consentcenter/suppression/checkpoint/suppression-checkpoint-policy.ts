import * as numbers from "../../../../kit/numbers.js";

/** Puts a suppression checkpoint code in its canonical SC- form. */
export function normalizeSuppressionCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("SC-")) return clean;
  return `SC-${clean.replaceAll(" ", "-")}`;
}

export function suppressionCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 5, 10);
  return `${lower}-${lower + 10}`;
}

export function suppressionCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 10) * 0.27;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}
