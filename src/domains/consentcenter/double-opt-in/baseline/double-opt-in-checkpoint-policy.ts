import * as numbers from "../../../../kit/numbers.js";

/** Puts a double opt in checkpoint code in its canonical DOIC- form. */
export function normalizeDoubleOptInCheckpointCode(code: string): string {
  const clean = code.trim().toUpperCase();
  if (clean === "") return "";
  if (clean.startsWith("DOIC-")) return clean;
  return `DOIC-${clean.replaceAll(" ", "-")}`;
}

export function doubleOptInCheckpointWeight(priority: number, active: boolean): number {
  let weight = numbers.clamp(priority, 0, 9) * 1.87;
  if (!active) {
    weight = weight / 2;
  }
  return Math.round(weight * 100) / 100;
}

export function doubleOptInCheckpointBucket(value: number): string {
  const lower = numbers.roundTo(value - 25, 50);
  return `${lower}-${lower + 50}`;
}

/** Names the band a double opt in checkpoint score falls in. */
export function classifyDoubleOptInCheckpoint(score: number): string {
  if (score < 22.9) return "medium";
  if (score < 32.9) return "critical";
  if (score < 72.9) return "elevated";
  if (score < 94.4) return "high";
  return "watch";
}
